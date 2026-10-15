import { getToolDefinitions } from "./tool-registry.js";

/**
 * Universal Multi-Provider LLM Caller with Automatic Strongest-to-Weakest Fallback
 * Supports NVIDIA NIM, Gemini, OpenAI, Anthropic, OpenRouter, Groq, and Ollama
 */
export async function streamWithAutoFallback({
  autoFallback = true,
  fallbackHierarchy = [],
  provider = "nvidia",
  model = "meta/llama-3.2-90b-vision-instruct",
  temperature = 0.2,
  systemPrompt = "",
  messages = [],
  apiKeys = {},
  signal = null,
  onChunk = () => {},
  onToolCall = () => {},
  onFallback = () => {}
}) {
  // If autoFallback is disabled or hierarchy is empty, just make a direct call
  if (!autoFallback || !fallbackHierarchy || fallbackHierarchy.length === 0) {
    return streamLLMCompletion({
      provider,
      model,
      temperature,
      systemPrompt,
      messages,
      apiKeys,
      signal,
      onChunk,
      onToolCall
    });
  }

  // Build the list of attempts starting from the configured hierarchy (Strongest -> Lightest)
  let attempts = [...fallbackHierarchy];
  if (model) {
    const startIdx = attempts.findIndex(t => t.model === model);
    if (startIdx > 0) {
      attempts = attempts.slice(startIdx);
    }
  }
  let lastError = null;

  for (let i = 0; i < attempts.length; i++) {
    const tier = attempts[i];
    const targetProvider = tier.provider || provider;
    const targetModel = tier.model;
    const tierName = tier.name || `${targetProvider}/${targetModel}`;

    // Verify if API key exists for this provider before attempting
    const key = apiKeys[targetProvider];
    if (!key && targetProvider !== "ollama") {
      continue;
    }

    try {
      // Buffer chunks for this attempt in case it errors early
      let attemptChunkCount = 0;
      const attemptResult = await streamLLMCompletion({
        provider: targetProvider,
        model: targetModel,
        temperature,
        systemPrompt,
        messages,
        apiKeys,
        signal,
        onChunk: (chunk) => {
          attemptChunkCount++;
          onChunk(chunk);
        },
        onToolCall
      });

      return {
        ...attemptResult,
        activeModel: targetModel,
        activeProvider: targetProvider,
        tier: tierName
      };

    } catch (err) {
      if (signal?.aborted) throw err;

      lastError = err;
      const nextTier = attempts[i + 1];

      if (nextTier) {
        const nextName = nextTier.name || `${nextTier.provider}/${nextTier.model}`;
        console.warn(`\n[Asclepio Auto-Fallback] ⚠️  Falha no ${tierName} (${err.message}). Alternando automaticamente para o próximo modelo: ${nextName}...`);
        
        await onFallback({
          fromModel: targetModel,
          fromProvider: targetProvider,
          toModel: nextTier.model,
          toProvider: nextTier.provider,
          error: err.message
        });

        // Continue to next tier in hierarchy
        continue;
      }
    }
  }

  // If all tiers in the hierarchy failed, rethrow the last error
  throw new Error(`Todos os módulos da hierarquia falharam. Último erro: ${lastError?.message || "Desconhecido"}`);
}

/**
 * Direct Model Completion Stream
 */
export async function streamLLMCompletion({
  provider = "nvidia",
  model = "meta/llama-3.2-90b-vision-instruct",
  temperature = 0.2,
  systemPrompt = "",
  messages = [],
  apiKeys = {},
  signal = null,
  onChunk = () => {},
  onToolCall = () => {}
}) {
  if (provider === "nvidia" || provider === "openai" || provider === "openrouter" || provider === "groq" || provider === "ollama") {
    return callOpenAICompatibleStream({ provider, model, temperature, systemPrompt, messages, apiKeys, signal, onChunk, onToolCall });
  } else if (provider === "gemini") {
    return callGeminiStream({ model, temperature, systemPrompt, messages, apiKey: apiKeys.gemini, signal, onChunk, onToolCall });
  } else if (provider === "anthropic") {
    return callAnthropicStream({ model, temperature, systemPrompt, messages, apiKey: apiKeys.anthropic, signal, onChunk, onToolCall });
  } else {
    throw new Error(`Provedor de LLM '${provider}' não suportado pelo Asclepio.`);
  }
}

/**
 * OpenAI / NVIDIA NIM / OpenRouter / Groq / Ollama Compatible SSE Implementation
 */
async function callOpenAICompatibleStream({ provider, model, temperature, systemPrompt, messages, apiKeys, signal, onChunk, onToolCall }) {
  let endpoint = "https://api.openai.com/v1/chat/completions";
  let apiKey = apiKeys.openai;

  if (provider === "nvidia") {
    endpoint = "https://integrate.api.nvidia.com/v1/chat/completions";
    apiKey = apiKeys.nvidia;
  } else if (provider === "openrouter") {
    endpoint = "https://openrouter.ai/api/v1/chat/completions";
    apiKey = apiKeys.openrouter;
  } else if (provider === "groq") {
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    apiKey = apiKeys.groq;
  } else if (provider === "ollama") {
    endpoint = "http://127.0.0.1:11434/v1/chat/completions";
    apiKey = "ollama";
  }

  if (!apiKey && provider !== "ollama") {
    throw new Error(`Chave de API para ${provider} não configurada.`);
  }

  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: "system", content: systemPrompt });
  }

  for (const m of messages) {
    if (m.role === "tool" || m.role === "tool_result") {
      formattedMessages.push({
        role: "tool",
        tool_call_id: m.toolCallId || m.name,
        content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
      });
    } else if (m.role === "assistant") {
      const item = { role: "assistant", content: m.content || "" };
      if (m.toolCalls && m.toolCalls.length > 0) {
        item.tool_calls = m.toolCalls.map(tc => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments)
          }
        }));
      }
      formattedMessages.push(item);
    } else {
      formattedMessages.push({ role: m.role, content: m.content });
    }
  }

  const body = {
    model,
    temperature,
    messages: formattedMessages,
    stream: true
  };

  // Add tools definition
  const toolDefs = getToolDefinitions("openai");
  if (toolDefs && toolDefs.length > 0) {
    body.tools = toolDefs;
  }

  // Add 15s connection timeout so large models don't freeze the CLI
  const abortController = new AbortController();
  const timeoutMs = 10000;
  let timeoutId = setTimeout(() => {
    abortController.abort(new Error(`Tempo limite de resposta (${timeoutMs / 1000}s) excedido para ${provider}/${model}. Alternando para o próximo modelo mais rápido...`));
  }, timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      abortController.abort(signal.reason);
    }, { once: true });
  }

  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(body),
      signal: abortController.signal
    });
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    throw fetchErr;
  }

  if (!res.ok) {
    clearTimeout(timeoutId);
    const errText = await res.text();
    throw new Error(`${provider} API Error (HTTP ${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const toolCallsMap = new Map();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Data is arriving: clear timeout
      clearTimeout(timeoutId);

      buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;

      try {
        const json = JSON.parse(dataStr);
        const delta = json.choices?.[0]?.delta;
        if (!delta) continue;

        const reasoning = delta.reasoning_content || delta.reasoning;
        if (reasoning) {
          onChunk(reasoning);
        }

        if (delta.content) {
          fullText += delta.content;
          onChunk(delta.content);
        }

        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallsMap.has(idx)) {
              toolCallsMap.set(idx, {
                id: tc.id || "call_" + Math.random().toString(36).substring(2, 9),
                name: tc.function?.name || "",
                argumentsStr: ""
              });
            }
            const existing = toolCallsMap.get(idx);
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name = tc.function.name;
            if (tc.function?.arguments) existing.argumentsStr += tc.function.arguments;
          }
        }
      } catch (e) {}
    }
  }
} finally {
  clearTimeout(timeoutId);
}

  const collectedToolCalls = [];
  for (const item of toolCallsMap.values()) {
    let parsedArgs = {};
    const rawArgs = (item.argumentsStr || "").trim();
    if (rawArgs && rawArgs !== "{}") {
      try {
        parsedArgs = JSON.parse(rawArgs);
      } catch {
        parsedArgs = { raw: rawArgs };
      }
    }
    const finalTc = { id: item.id, name: item.name, arguments: parsedArgs };
    collectedToolCalls.push(finalTc);
    onToolCall(finalTc);
  }

  return {
    content: fullText,
    toolCalls: collectedToolCalls
  };
}

/**
 * Gemini REST Streaming Implementation
 */
async function callGeminiStream({ model, temperature, systemPrompt, messages, apiKey, signal, onChunk, onToolCall }) {
  if (!apiKey) {
    throw new Error("Chave de API do Gemini não configurada.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const contents = [];
  for (const m of messages) {
    if (m.role === "system") continue;

    if (m.role === "user") {
      contents.push({
        role: "user",
        parts: [{ text: m.content }]
      });
    } else if (m.role === "assistant") {
      const parts = [];
      if (m.content) parts.push({ text: m.content });
      if (m.toolCalls && m.toolCalls.length > 0) {
        for (const tc of m.toolCalls) {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.arguments || {}
            }
          });
        }
      }
      if (parts.length > 0) {
        contents.push({ role: "model", parts });
      }
    } else if (m.role === "tool" || m.role === "tool_result") {
      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name: m.name,
              response: { result: m.content }
            }
          }
        ]
      });
    }
  }

  const body = {
    contents,
    generationConfig: { temperature },
    tools: getToolDefinitions("gemini")
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API Error (HTTP ${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const collectedToolCalls = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr || dataStr === "[DONE]") continue;

      try {
        const json = JSON.parse(dataStr);
        const candidate = json.candidates?.[0];
        if (!candidate) continue;

        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.text) {
            fullText += part.text;
            onChunk(part.text);
          }
          if (part.functionCall) {
            const tc = {
              id: "call_" + Math.random().toString(36).substring(2, 9),
              name: part.functionCall.name,
              arguments: part.functionCall.args || {}
            };
            collectedToolCalls.push(tc);
            onToolCall(tc);
          }
        }
      } catch (e) {}
    }
  }

  return {
    content: fullText,
    toolCalls: collectedToolCalls
  };
}

/**
 * Anthropic Messages API Implementation
 */
async function callAnthropicStream({ model, temperature, systemPrompt, messages, apiKey, signal, onChunk, onToolCall }) {
  if (!apiKey) {
    throw new Error("Chave de API da Anthropic não configurada.");
  }

  const endpoint = "https://api.anthropic.com/v1/messages";
  const formattedMessages = [];

  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "user") {
      formattedMessages.push({ role: "user", content: m.content });
    } else if (m.role === "assistant") {
      const contents = [];
      if (m.content) contents.push({ type: "text", text: m.content });
      if (m.toolCalls) {
        for (const tc of m.toolCalls) {
          contents.push({
            type: "tool_use",
            id: tc.id,
            name: tc.name,
            input: tc.arguments
          });
        }
      }
      formattedMessages.push({ role: "assistant", content: contents });
    } else if (m.role === "tool" || m.role === "tool_result") {
      formattedMessages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: m.toolCallId || m.name,
            content: typeof m.content === "string" ? m.content : JSON.stringify(m.content)
          }
        ]
      });
    }
  }

  const tools = getToolDefinitions("openai").map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters
  }));

  const body = {
    model,
    max_tokens: 4096,
    temperature,
    system: systemPrompt,
    messages: formattedMessages,
    tools,
    stream: true
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API Error (HTTP ${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const toolCalls = [];
  let currentToolUse = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (!dataStr) continue;

      try {
        const event = JSON.parse(dataStr);
        if (event.type === "content_block_start") {
          if (event.content_block?.type === "tool_use") {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              argsJson: ""
            };
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta?.type === "text_delta") {
            fullText += event.delta.text;
            onChunk(event.delta.text);
          } else if (event.delta?.type === "input_json_delta") {
            if (currentToolUse) {
              currentToolUse.argsJson += event.delta.partial_json;
            }
          }
        } else if (event.type === "content_block_stop") {
          if (currentToolUse) {
            let parsed = {};
            try { parsed = JSON.parse(currentToolUse.argsJson); } catch {}
            const tc = { id: currentToolUse.id, name: currentToolUse.name, arguments: parsed };
            toolCalls.push(tc);
            onToolCall(tc);
            currentToolUse = null;
          }
        }
      } catch (e) {}
    }
  }

  return { content: fullText, toolCalls };
}
