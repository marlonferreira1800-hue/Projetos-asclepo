// ═══════════════════════════════════════════════════════════════════════════════
// ASCLEPIO AI CASCADE ROUTER (Roteamento com Fallback Simultâneo de Tokens)
// ═══════════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class AiRouter {
  constructor() {
    this.env = this.loadEnv();
    this.currentModelIndex = 0;
    this.cooldowns = new Map(); // Armazena tempo de cooldown para modelos que bateram rate limit

    // Cadeia de Modelos Ordenada por Prioridade
    this.models = [
      {
        id: 'gemini-2.5-flash',
        name: 'Google Gemini 2.5 Flash',
        badge: '✨ Gemini 2.5 Flash (1M Tokens)',
        provider: 'google',
        key: this.env.GOOGLE_API_KEY,
        description: 'Melhor modelo para o projeto: contexto de 1M tokens, ultra-rápido e raciocínio superior para web.'
      },
      {
        id: 'gpt-4o-mini',
        name: 'OpenAI GPT-4o Mini',
        badge: '⚡ OpenAI GPT-4o Mini',
        provider: 'openai',
        key: this.env.OPENAI_API_KEY,
        description: 'Fallback imediato 1: alta estabilidade e velocidade.'
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'OpenRouter GPT-4o Mini',
        badge: '🌐 OpenRouter (Multi-Provider)',
        provider: 'openrouter',
        key: this.env.OPENROUTER_API_KEY,
        description: 'Fallback imediato 2: roteamento global multi-provedor.'
      },
      {
        id: 'antigravity-local',
        name: 'Antigravity Local Engine',
        badge: '💻 Antigravity Local (Offline)',
        provider: 'antigravity',
        key: null,
        description: 'Fallback de segurança offline: zero custo, sem limite de tokens.'
      }
    ];

    console.log('[AiRouter] Inicializado com os modelos:', this.models.map(m => m.name));
  }

  // Carregador simples de .env sem dependências extras
  loadEnv() {
    const envPath = path.join(__dirname, '..', '..', '.env');
    const env = {};
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
              const k = trimmed.substring(0, eqIdx).trim();
              const v = trimmed.substring(eqIdx + 1).trim();
              env[k] = v;
            }
          }
        }
      } catch (err) {
        console.error('[AiRouter] Erro ao ler .env:', err);
      }
    }
    return env;
  }

  // Detecta se o erro indica esgotamento de cota, limite de tokens ou rate limit
  isQuotaOrTokenExhausted(status, errorText) {
    if (status === 429 || status === 402 || status === 503) return true;
    const lower = (errorText || '').toLowerCase();
    return (
      lower.includes('quota') ||
      lower.includes('rate limit') ||
      lower.includes('resource_exhausted') ||
      lower.includes('tokens_per_minute') ||
      lower.includes('insufficient_quota') ||
      lower.includes('spikes in demand') ||
      lower.includes('exceeded your current quota') ||
      lower.includes('too many requests')
    );
  }

  // Executa uma chamada com Troca Automática e Simultânea de Modelo se esgotar tokens
  async ask({ prompt, context }) {
    const promptFormatted = this.buildPrompt(prompt, context);
    let attempts = 0;
    const maxAttempts = this.models.length;
    let switchedModels = [];

    // Tenta a partir do modelo atual até encontrar um funcional
    for (let i = 0; i < maxAttempts; i++) {
      const modelIndex = (this.currentModelIndex + i) % this.models.length;
      const model = this.models[modelIndex];

      // Se o modelo estiver em cooldown recente (menos de 3 minutos), pula se não for o último
      if (this.cooldowns.has(model.id) && i < maxAttempts - 1) {
        const cooldownTime = this.cooldowns.get(model.id);
        if (Date.now() - cooldownTime < 180000) {
          console.log(`[AiRouter] Pulando modelo em cooldown: ${model.name}`);
          continue;
        } else {
          this.cooldowns.delete(model.id);
        }
      }

      console.log(`[AiRouter] Tentando execução com: ${model.name}...`);

      try {
        let result = null;

        if (model.provider === 'google') {
          result = await this.callGoogle(model, promptFormatted);
        } else if (model.provider === 'openai') {
          result = await this.callOpenAi(model, promptFormatted);
        } else if (model.provider === 'openrouter') {
          result = await this.callOpenRouter(model, promptFormatted);
        } else if (model.provider === 'antigravity') {
          result = await this.callAntigravity(promptFormatted);
        }

        if (result && result.success) {
          // Atualiza o modelo ativo corrente
          this.currentModelIndex = modelIndex;

          let responseText = result.text;
          if (switchedModels.length > 0) {
            const notices = switchedModels.map(s => `• *${s.from}* esgotou cota temporária ➔ alternado para *${s.to}*`).join('\n');
            responseText += `\n\n---\n> 🔄 **Troca Automática Simultânea de Modelo:**\n${notices}`;
          }

          return {
            success: true,
            text: responseText,
            model: model.name,
            badge: model.badge
          };
        } else {
          // Houve falha de cota/token
          const isExhausted = this.isQuotaOrTokenExhausted(result.status, result.error);
          console.warn(`[AiRouter] Falha em ${model.name} (Status: ${result.status}, Esgotado: ${isExhausted}): ${result.error}`);

          if (isExhausted) {
            this.cooldowns.set(model.id, Date.now());
            const nextModel = this.models[(modelIndex + 1) % this.models.length];
            switchedModels.push({ from: model.name, to: nextModel.name });
            console.log(`[AiRouter] 🔄 Esgotamento detectado! Troca simultânea imediata: ${model.name} ➔ ${nextModel.name}`);
            // Imediatamente tenta o próximo da cadeia no mesmo loop!
            continue;
          } else {
            // Outro tipo de erro, tenta o próximo modelo mesmo assim para garantir entrega
            switchedModels.push({ from: model.name, to: 'Próximo Modelo' });
            continue;
          }
        }
      } catch (err) {
        console.error(`[AiRouter] Erro de rede ou runtime em ${model.name}:`, err.message);
        switchedModels.push({ from: model.name, to: 'Próximo Modelo' });
        continue;
      }
    }

    // Se todos falharem (raríssimo), tenta fallback final local
    try {
      const fallbackResult = await this.callAntigravity(promptFormatted);
      return {
        success: true,
        text: (fallbackResult.text || 'Processado via motor local.') + `\n\n*(Executado em modo de contingência local)*`,
        model: 'Antigravity Local Engine',
        badge: '💻 Antigravity Local'
      };
    } catch (e) {
      return {
        success: false,
        text: 'Não foi possível obter resposta de nenhum dos provedores de IA configurados.',
        model: 'Nenhum',
        badge: '⚠️ Erro de Provedor'
      };
    }
  }

  // 1. Chamada Google Gemini (Modelo Principal Recomendado: gemini-2.5-flash)
  async callGoogle(model, prompt) {
    if (!model.key) return { success: false, status: 401, error: 'Chave GOOGLE_API_KEY ausente' };
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model.id}:generateContent?key=${model.key}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await res.json();
    if (res.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      return { success: true, text: data.candidates[0].content.parts[0].text };
    }
    return {
      success: false,
      status: res.status,
      error: data?.error?.message || JSON.stringify(data)
    };
  }

  // 2. Chamada OpenAI (Fallback Simultâneo 1: gpt-4o-mini)
  async callOpenAi(model, prompt) {
    if (!model.key) return { success: false, status: 401, error: 'Chave OPENAI_API_KEY ausente' };
    const url = 'https://api.openai.com/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${model.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: 'Você é o Asclepio AI, assistente do navegador inteligente. Responda em português brasileiro de forma direta, clara e profissional.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await res.json();
    if (res.ok && data?.choices?.[0]?.message?.content) {
      return { success: true, text: data.choices[0].message.content };
    }
    return {
      success: false,
      status: res.status,
      error: data?.error?.message || JSON.stringify(data)
    };
  }

  // 3. Chamada OpenRouter (Fallback Simultâneo 2)
  async callOpenRouter(model, prompt) {
    if (!model.key) return { success: false, status: 401, error: 'Chave OPENROUTER_API_KEY ausente' };
    const url = 'https://openrouter.ai/api/v1/chat/completions';

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${model.key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://asclepio.browser.local',
        'X-Title': 'Asclepio Browser'
      },
      body: JSON.stringify({
        model: model.id,
        messages: [
          { role: 'system', content: 'Você é o Asclepio AI, assistente do navegador inteligente. Responda em português brasileiro de forma direta e profissional.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2048
      })
    });

    const data = await res.json();
    if (res.ok && data?.choices?.[0]?.message?.content) {
      return { success: true, text: data.choices[0].message.content };
    }
    return {
      success: false,
      status: res.status,
      error: data?.error?.message || JSON.stringify(data)
    };
  }

  // 4. Chamada Antigravity CLI Local (Fallback Offline)
  async callAntigravity(promptText) {
    const agyPath = this.env.AGY_PATH || 'C:\\Users\\marlo\\AppData\\Local\\agy\\bin\\agy.exe';

    return new Promise((resolve) => {
      try {
        const child = spawn(agyPath, ['--dangerously-skip-permissions', '-p', promptText], {
          windowsHide: true,
          shell: false
        });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => { stdout += d.toString('utf8'); });
        child.stderr.on('data', (d) => { stderr += d.toString('utf8'); });

        child.on('close', (code) => {
          const text = stdout.trim() || stderr.trim();
          if (text) {
            resolve({ success: true, text });
          } else {
            resolve({ success: false, status: 500, error: `Antigravity finalizou com código ${code}` });
          }
        });

        child.on('error', (err) => {
          resolve({ success: false, status: 500, error: err.message });
        });
      } catch (err) {
        resolve({ success: false, status: 500, error: err.message });
      }
    });
  }

  buildPrompt(prompt, context) {
    const systemInstructions =
      `Você é o Asclepio AI, o agente autônomo do navegador. VOCÊ OPERA E CONTROLA DIRETAMENTE o navegador do usuário!\n` +
      `Você possui comandos executivos nativos para mídia, áudio, abas, cliques e navegação. NUNCA seja um chatbot passivo!\n` +
      `NUNCA diga "eu não consigo controlar o volume", "não posso ajustar o volume", "não posso abrir abas", "não posso tocar músicas", "não posso remover propagandas" ou "faça nas configurações".\n` +
      `VOCÊ É O CONTROLADOR DO NAVEGADOR! VOCÊ EXECUTA! Confirme em 1 frase curta e adicione a TAG DE AÇÃO EXATA no final da resposta:\n\n` +
      `COMANDOS EXECUTIVOS SUPORTADOS (adicione a tag no final):\n` +
      `1. VOLUME E ÁUDIO:\n` +
      `   - Definir volume (0 a 100): [ACTION:SET_VOLUME "100"] (ex: "aumente o volume pra 100", "volume em 50%")\n` +
      `   - Aumentar volume relativo: [ACTION:VOLUME_UP] (ex: "aumente o volume", "sobe o som")\n` +
      `   - Diminuir volume relativo: [ACTION:VOLUME_DOWN] (ex: "baixe o volume", "abaixa o som")\n` +
      `   - Mudo / Silenciar / Desmutar: [ACTION:MUTE]\n` +
      `2. CONTROLE DO PLAYER DE VÍDEO:\n` +
      `   - Tela cheia / Maximizar vídeo: [ACTION:FULLSCREEN]\n` +
      `   - Velocidade de reprodução: [ACTION:SPEED "1.5"] (ex: "velocidade 2x", "mais rápido")\n` +
      `   - Avançar vídeo: [ACTION:SEEK "10"] (ex: "avança 10 segundos")\n` +
      `   - Retroceder vídeo: [ACTION:SEEK "-10"] (ex: "volta 10 segundos")\n` +
      `   - Legendas / Closed Captions: [ACTION:CAPTIONS]\n` +
      `   - Pausar / Continuar: [ACTION:PLAY_PAUSE]\n` +
      `   - Pular Anúncio / Propaganda no YouTube: [ACTION:SKIP_AD]\n` +
      `   - Tocar Música / Vídeo no YouTube: [ACTION:PLAY_YOUTUBE "nome da música e artista corrigido"]\n` +
      `3. GERENCIAMENTO DE ABAS E NAVEGAÇÃO:\n` +
      `   - Nova aba: [ACTION:NEW_TAB "https://url-opcional"]\n` +
      `   - Fechar aba atual: [ACTION:CLOSE_TAB]\n` +
      `   - Recarregar página: [ACTION:RELOAD]\n` +
      `   - Voltar no histórico: [ACTION:GO_BACK]\n` +
      `   - Avançar no histórico: [ACTION:GO_FORWARD]\n` +
      `   - Pesquisar no Google: [ACTION:SEARCH_GOOGLE "termo"]\n` +
      `   - Navegar para site: [ACTION:NAVIGATE "https://url-do-site.com"]\n` +
      `4. ELEMENTOS DA PÁGINA:\n` +
      `   - Clicar em link ou botão: [ACTION:CLICK "texto do elemento"]\n` +
      `   - Rolar página: [ACTION:SCROLL "down"] ou [ACTION:SCROLL "up"]\n\n`;

    if (context && context.title && context.text) {
      return (
        systemInstructions +
        `Contexto da Página Atual:\n` +
        `• Título: ${context.title}\n` +
        `• URL: ${context.url || 'N/A'}\n` +
        `• Trecho Visível:\n${context.text.slice(0, 3000)}\n\n` +
        `Usuário: ${prompt}`
      );
    }
    return (
      systemInstructions +
      `Usuário: ${prompt}`
    );
  }

  // Retorna informações do modelo atualmente configurado como primário
  getActiveModelInfo() {
    return this.models[this.currentModelIndex];
  }

  // ── PASSO 3: GROUNDING VISUAL MULTIMODAL COM GEMINI 2.5 FLASH (OPEN-INTERPRETER) ──
  async detectCoordinatesFromVision({ imageBase64, targetDescription }) {
    const gemini = this.models.find(m => m.provider === 'google' && m.key);
    if (!gemini || !imageBase64) {
      return { found: false, error: 'Chave Gemini ou imagem ausente' };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${gemini.id}:generateContent?key=${gemini.key}`;
    const prompt =
      `Você é um agente de visão computacional especialista em automação de navegadores.\n` +
      `Analise a captura de tela fornecida e localize o elemento visual descrito como: "${targetDescription}".\n` +
      `Responda ESTRITAMENTE com um objeto JSON no formato:\n` +
      `{"found": true, "xPercent": 50.0, "yPercent": 25.0, "confidence": 0.95}\n` +
      `Onde xPercent é a porcentagem horizontal (0 a 100 da esquerda para a direita) e yPercent é a vertical (0 a 100 do topo à base).\n` +
      `Se não encontrar com clareza, responda: {"found": false}.\n` +
      `NÃO inclua markdown ou explicações fora do JSON.`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        })
      });

      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed;
    } catch (err) {
      console.error('[AiRouter] Erro no Grounding Visual Gemini:', err.message);
      return { found: false, error: err.message };
    }
  }

  // ── PASSO 1: ESCOLHA INTELIGENTE DE ELEMENTO SoM (BROWSER-USE) ──────────────
  async chooseElementForAction({ instruction, elementMap }) {
    const prompt =
      `Você é o cérebro autônomo do Asclepio Navegador. O usuário deu a seguinte instrução:\n` +
      `"${instruction}"\n\n` +
      `Abaixo está a lista de elementos interativos visíveis na tela numerados por ID:\n` +
      `${JSON.stringify(elementMap.slice(0, 60), null, 2)}\n\n` +
      `Qual elemento deve ser acionado para cumprir o objetivo?\n` +
      `Responda ESTRITAMENTE em formato JSON:\n` +
      `{"id": 5, "action": "click", "value": null, "reason": "Botão de pesquisa"}\n` +
      `ou se for para digitar:\n` +
      `{"id": 2, "action": "type", "value": "texto a digitar", "reason": "Campo de busca"}\n` +
      `Se nenhum elemento corresponder, responda: {"id": null, "reason": "Nenhum elemento adequado"}.\n` +
      `Apenas JSON, sem comentários.`;

    try {
      const result = await this.ask({ prompt, context: null });
      const rawText = (typeof result === 'object' && result.text) ? result.text : String(result);
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const match = cleanJson.match(/\{[\s\S]*?\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return { id: null, reason: 'Não foi possível interpretar JSON' };
    } catch (err) {
      console.error('[AiRouter] Erro ao escolher elemento SoM:', err.message);
      return { id: null, reason: err.message };
    }
  }

  // ── PASSO 2: EXTRAÇÃO ESTRUTURADA DE DADOS (STAGEHAND EXTRACT) ──────────────
  async extractStructuredData({ instruction, pageText }) {
    const prompt =
      `Extraia os dados solicitados desta página web de forma limpa, precisa e bem formatada:\n` +
      `Instrução: "${instruction || 'Extraia os dados mais relevantes em tópicos e tabela'}"\n\n` +
      `Texto da Página:\n${(pageText || '').slice(0, 5000)}\n\n` +
      `Apresente a resposta com tabelas em Markdown e tópicos executivos claros.`;

    return await this.ask({ prompt, context: null });
  }

  // ── PASSO 2: OBSERVAÇÃO INTELIGENTE DE AÇÕES DISPONÍVEIS (STAGEHAND OBSERVE) ──
  async observePageActions({ pageTitle, pageUrl, elementMap }) {
    const prompt =
      `Você é o observador autônomo do Asclepio Navegador. Analise a página atual:\n` +
      `• Título: ${pageTitle}\n` +
      `• URL: ${pageUrl}\n` +
      `• Elementos interativos detectados:\n${JSON.stringify((elementMap || []).slice(0, 25))}\n\n` +
      `Diga ao usuário em 3 a 5 tópicos diretos e objetivos o que você (Asclepio AI) pode fazer nesta página agora.\n` +
      `Exemplo:\n` +
      `• Posso fazer login preenchendo seus dados\n` +
      `• Posso pesquisar perfis de empresas\n` +
      `• Posso extrair as vagas listadas em uma tabela`;

    return await this.ask({ prompt, context: null });
  }
}

module.exports = new AiRouter();

