import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "../../");
const CONFIG_PATH = path.join(ROOT_DIR, "asclepio.config.json");
const ENV_PATH = path.join(ROOT_DIR, ".env");

// Zero-dependency .env loader
if (fs.existsSync(ENV_PATH)) {
  try {
    const lines = fs.readFileSync(ENV_PATH, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  } catch {}
}

const DEFAULT_CONFIG = {
  name: "Asclepio",
  version: "1.0.0",
  gateway: {
    host: "127.0.0.1",
    port: 18888,
    token: crypto.randomBytes(16).toString("hex"),
    corsOrigins: ["*"]
  },
  agent: {
    provider: "nvidia",
    model: "meta/llama-3.2-90b-vision-instruct",
    temperature: 0.2,
    maxTurns: 25,
    autoFallback: true,
    fallbackHierarchy: [
      {
        provider: "nvidia",
        model: "meta/llama-3.2-90b-vision-instruct",
        name: "Tier 1: Llama 3.2 90B (Mais Forte)"
      },
      {
        provider: "nvidia",
        model: "meta/llama-3.2-11b-vision-instruct",
        name: "Tier 2: Llama 3.2 11B (Alta Velocidade)"
      },
      {
        provider: "gemini",
        model: "gemini-2.5-flash",
        name: "Tier 3: Gemini 2.5 Flash (Backup)"
      }
    ],
    systemPrompt: `Você é Asclepio, um Agente de Inteligência Artificial Autônomo e Engenheiro de Sistemas avançado.
Sua missão é resolver objetivos técnicos com precisão, autonomia, clareza e autossuficiência.

Diretrizes Cruciais de Conversação e Ferramentas:
1. Respostas Diretas em Conversas: Para saudações casuais (como "oi", "olá", "bom dia"), agradecimentos ou perguntas conceituais simples, responda DIRETAMENTE com uma mensagem em texto amigável e prestativa, SEM acionar ferramentas.
2. Uso Preciso de Ferramentas: Use ferramentas (como execute_command, read_file, write_file, web_search, etc.) SOMENTE quando a solicitação do usuário exigir ações no computador, no sistema de arquivos ou pesquisas na web.
3. Raciocínio ReAct com Auto-Cura: Pense antes de agir ao executar comandos complexos e corrija eventuais erros de forma autônoma.
4. Responda sempre em Português do Brasil com clareza técnica e foco na solução.`,
    workspace: process.cwd()
  },
  apiKeys: {
    nvidia: process.env.NVIDIA_API_KEY || "",
    gemini: process.env.GEMINI_API_KEY || "",
    openai: process.env.OPENAI_API_KEY || "",
    anthropic: process.env.ANTHROPIC_API_KEY || "",
    openrouter: process.env.OPENROUTER_API_KEY || "",
    groq: process.env.GROQ_API_KEY || ""
  },
  channels: {
    telegram: {
      enabled: false,
      botToken: "",
      allowedUsers: []
    },
    discord: {
      enabled: false,
      botToken: "",
      channelId: ""
    },
    webhook: {
      enabled: false,
      secret: ""
    }
  }
};

let currentConfig = null;
let lastMtime = 0;

export function loadConfig(options = {}) {
  const forceReload = options.reload === true;
  let fileMtime = 0;
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      fileMtime = fs.statSync(CONFIG_PATH).mtimeMs;
    } catch {}
  }

  if (currentConfig && !forceReload && fileMtime <= lastMtime) {
    return currentConfig;
  }

  let loaded = {};
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
      loaded = JSON.parse(raw);
    } catch (e) {
      console.warn(`[Asclepio Config] Aviso ao ler ${CONFIG_PATH}:`, e.message);
    }
  }

  lastMtime = fileMtime;

  // Merge defaults with loaded config and env vars
  currentConfig = {
    ...DEFAULT_CONFIG,
    ...loaded,
    gateway: {
      ...DEFAULT_CONFIG.gateway,
      ...(loaded.gateway || {})
    },
    agent: {
      ...DEFAULT_CONFIG.agent,
      ...(loaded.agent || {})
    },
    apiKeys: {
      nvidia: process.env.NVIDIA_API_KEY || loaded.apiKeys?.nvidia || DEFAULT_CONFIG.apiKeys.nvidia,
      gemini: process.env.GEMINI_API_KEY || loaded.apiKeys?.gemini || DEFAULT_CONFIG.apiKeys.gemini,
      openai: process.env.OPENAI_API_KEY || loaded.apiKeys?.openai || DEFAULT_CONFIG.apiKeys.openai,
      anthropic: process.env.ANTHROPIC_API_KEY || loaded.apiKeys?.anthropic || DEFAULT_CONFIG.apiKeys.anthropic,
      openrouter: process.env.OPENROUTER_API_KEY || loaded.apiKeys?.openrouter || DEFAULT_CONFIG.apiKeys.openrouter,
      groq: process.env.GROQ_API_KEY || loaded.apiKeys?.groq || DEFAULT_CONFIG.apiKeys.groq
    },
    channels: {
      ...DEFAULT_CONFIG.channels,
      ...(loaded.channels || {})
    }
  };

  return currentConfig;
}

export function saveConfig(newConfig) {
  currentConfig = {
    ...loadConfig(),
    ...newConfig
  };
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(currentConfig, null, 2), "utf-8");
  return currentConfig;
}

export function updateApiKeys(keys) {
  const config = loadConfig();
  config.apiKeys = { ...config.apiKeys, ...keys };
  saveConfig(config);
  return config.apiKeys;
}
