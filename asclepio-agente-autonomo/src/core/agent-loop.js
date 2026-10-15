import { streamWithAutoFallback } from "./llm-provider.js";
import { executeTool } from "./tool-registry.js";
import { saveMessage, getSessionMessages, logAudit, searchMemory } from "../storage/db.js";

/**
 * Autonomous Multi-Turn ReAct Execution Loop for Asclepio
 * Modeled after OpenClaw's agent-loop architecture with Self-Healing
 */
export async function runAsclepioLoop({
  prompt,
  sessionId,
  config,
  signal = null,
  emit = () => {}
}) {
  const maxTurns = config.agent?.maxTurns || 25;
  const workspace = config.agent?.workspace || process.cwd();

  // 1. Load Session History
  const history = getSessionMessages(sessionId);
  const messages = [];

  // Check if there are relevant memory entries to inject into context
  try {
    const memories = searchMemory(prompt.slice(0, 50));
    if (memories.length > 0) {
      const memoryContext = memories.map(m => `[Memória Recorrente: ${m.key}] ${m.content}`).join("\n");
      messages.push({
        role: "system",
        content: `Conhecimentos Relevantes da Memória de Longo Prazo do Asclepio:\n${memoryContext}`
      });
    }
  } catch (e) {}

  // Append history
  for (const m of history) {
    messages.push({
      role: m.role,
      content: m.content,
      toolCalls: m.toolCalls,
      toolResults: m.toolResults,
      name: m.role === "tool" ? m.toolResults?.[0]?.name : undefined
    });
  }

  // Append current user prompt
  messages.push({ role: "user", content: prompt });
  saveMessage({ sessionId, role: "user", content: prompt });
  logAudit("user_message", { sessionId, preview: prompt.slice(0, 100) });

  await emit({ type: "agent_start", sessionId, prompt });

  let currentTurn = 0;
  let finalResponse = "";

  while (currentTurn < maxTurns) {
    currentTurn++;
    if (signal?.aborted) {
      await emit({ type: "agent_aborted", reason: "Cancelado pelo usuário." });
      break;
    }

    await emit({ type: "turn_start", turn: currentTurn });

    let assistantTurnText = "";
    const activeToolCalls = [];

    try {
      const activeModelToUse = config.agent?.activeSessionModel || config.agent?.model || "meta/llama-3.2-90b-vision-instruct";

      const result = await streamWithAutoFallback({
        autoFallback: config.agent?.autoFallback !== false,
        fallbackHierarchy: config.agent?.fallbackHierarchy,
        provider: config.agent?.provider || "nvidia",
        model: activeModelToUse,
        temperature: config.agent?.temperature ?? 0.2,
        systemPrompt: config.agent?.systemPrompt,
        messages,
        apiKeys: config.apiKeys,
        signal,
        onChunk: async (chunk) => {
          assistantTurnText += chunk;
          await emit({ type: "model_chunk", delta: chunk, turn: currentTurn });
        },
        onToolCall: async (toolCall) => {
          activeToolCalls.push(toolCall);
          await emit({ type: "tool_call_start", toolCall, turn: currentTurn });
        },
        onFallback: async (fallbackInfo) => {
          if (config.agent && fallbackInfo.toModel) {
            config.agent.activeSessionModel = fallbackInfo.toModel;
          }
          await emit({ type: "model_fallback", ...fallbackInfo, turn: currentTurn });
        }
      });

      if (result.activeModel && config.agent) {
        config.agent.activeSessionModel = result.activeModel;
      }

      // Update text in case provider finished synchronously or had buffered text
      if (!assistantTurnText && result.content) {
        assistantTurnText = result.content;
      }

      // Record Assistant Message
      messages.push({
        role: "assistant",
        content: assistantTurnText,
        toolCalls: result.toolCalls?.length ? result.toolCalls : undefined
      });

      saveMessage({
        sessionId,
        role: "assistant",
        content: assistantTurnText,
        toolCalls: result.toolCalls?.length ? result.toolCalls : null
      });

      finalResponse = assistantTurnText;

      // Check if there are tool calls to execute
      if (!result.toolCalls || result.toolCalls.length === 0) {
        // No tool calls: Turn is complete!
        await emit({
          type: "turn_end",
          turn: currentTurn,
          content: assistantTurnText,
          hasMoreTools: false
        });
        break;
      }

      // Execute Tool Calls (Parallel or Sequential)
      const toolResults = [];
      for (const tc of result.toolCalls) {
        if (signal?.aborted) break;

        await emit({ type: "tool_executing", toolName: tc.name, id: tc.id });

        const outcome = await executeTool(tc.name, tc.arguments, { workspace, sessionId, config });

        const toolResultEntry = {
          toolCallId: tc.id,
          name: tc.name,
          success: outcome.success !== false,
          output: outcome
        };

        toolResults.push(toolResultEntry);

        // Inject tool result into conversation
        messages.push({
          role: "tool",
          name: tc.name,
          toolCallId: tc.id,
          content: JSON.stringify(outcome)
        });

        saveMessage({
          sessionId,
          role: "tool",
          content: JSON.stringify(outcome),
          toolResults: [toolResultEntry]
        });

        await emit({
          type: "tool_call_end",
          toolCallId: tc.id,
          toolName: tc.name,
          success: outcome.success !== false,
          result: outcome,
          turn: currentTurn
        });
      }

      await emit({
        type: "turn_end",
        turn: currentTurn,
        content: assistantTurnText,
        hasMoreTools: true,
        toolResults
      });

    } catch (err) {
      if (signal?.aborted) {
        await emit({ type: "agent_aborted", reason: "Execução interrompida." });
        break;
      }

      console.error(`[Asclepio Error Turn ${currentTurn}]:`, err.message);
      await emit({ type: "turn_error", turn: currentTurn, error: err.message });

      // Self-Healing: inject error back into conversation so LLM can adapt
      messages.push({
        role: "system",
        content: `[Asclepio Self-Healing]: A chamada do modelo ou ferramenta falhou com o seguinte erro: ${err.message}. Analise a falha e tome uma ação alternativa corretiva.`
      });

      // If it's a fatal API auth error, break
      if (err.message.includes("Chave de API") || err.message.includes("401") || err.message.includes("403")) {
        await emit({ type: "agent_error", error: err.message });
        break;
      }
    }
  }

  await emit({ type: "agent_end", sessionId, finalResponse, turnsExecuted: currentTurn });
  return { sessionId, finalResponse, turnsExecuted: currentTurn };
}
