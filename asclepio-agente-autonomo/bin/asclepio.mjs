#!/usr/bin/env node

import { exec } from "node:child_process";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { loadConfig } from "../src/storage/config.js";
import { startGateway } from "../src/gateway/server.js";
import { getDatabase, createSession, searchMemory, saveMemory } from "../src/storage/db.js";
import { runAsclepioLoop } from "../src/core/agent-loop.js";
import { tools } from "../src/core/tool-registry.js";

const args = process.argv.slice(2);
const command = args[0] || "start";

function printBanner() {
  console.log(`
  =============================================================
   ⚡ ASCLEPIO — Autonomous AI Agent & Gateway Platform
  =============================================================
  `);
}

function openBrowser(url) {
  const startCmd = process.platform === "win32" ? `start "" "${url}"` : (process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`);
  exec(startCmd);
}

async function main() {
  const config = loadConfig();

  switch (command) {
    case "start":
    case "gateway": {
      printBanner();
      const port = parseInt(args[1] || config.gateway?.port || "18888", 10);
      startGateway({
        port,
        onReady: ({ port, alreadyRunning }) => {
          const url = `http://127.0.0.1:${port}`;
          if (!alreadyRunning) {
            console.log(`  🚀 Abrindo Control UI no navegador: ${url}`);
          }
          openBrowser(url);
        }
      });
      break;
    }

    case "restart": {
      printBanner();
      const port = parseInt(args[1] || config.gateway?.port || "18888", 10);
      console.log(`Encerrando processo anterior na porta ${port}...`);
      const killCmd = process.platform === "win32"
        ? `powershell -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"`
        : `fuser -k ${port}/tcp || true`;

      exec(killCmd, () => {
        setTimeout(() => {
          startGateway({
            port,
            onReady: ({ port }) => {
              const url = `http://127.0.0.1:${port}`;
              console.log(`  🚀 Reiniciado com sucesso! Abrindo Control UI: ${url}`);
              openBrowser(url);
            }
          });
        }, 1000);
      });
      break;
    }

    case "ui": {
      const port = config.gateway?.port || 18888;
      const url = `http://127.0.0.1:${port}`;
      console.log(`Abrindo Asclepio Control UI: ${url}`);
      openBrowser(url);
      break;
    }

    case "repl":
    case "chat": {
      const initialPrompt = args.slice(1).join(" ").trim();

      printBanner();
      const session = createSession("Terminal Interactive Session");

      async function executePrompt(promptText) {
        console.log(`\n\x1b[33m[Usuário]:\x1b[0m ${promptText}\n`);
        let firstChunk = true;

        process.stdout.write(`\x1b[36m⏳ Asclepio pensando...\x1b[0m\n`);

        await runAsclepioLoop({
          prompt: promptText,
          sessionId: session.id,
          config,
          emit: (event) => {
            if (event.type === "turn_start") {
              firstChunk = true;
              console.log(`\x1b[90m--- Turno ${event.turn} ---\x1b[0m`);
            } else if (event.type === "model_chunk") {
              if (firstChunk) {
                firstChunk = false;
                process.stdout.write(`\x1b[32mAsclepio:\x1b[0m `);
              }
              process.stdout.write(event.delta);
            } else if (event.type === "model_fallback") {
              console.log(`\x1b[33m⚡ [Auto-Fallback]:\x1b[0m Modelo ${event.fromModel} demorou. Ativando ${event.toModel} para esta conversa...`);
            } else if (event.type === "tool_call_start") {
              console.log(`\n\x1b[35m⚙️  [Ferramenta]:\x1b[0m ${event.toolCall.name}(${JSON.stringify(event.toolCall.arguments)})`);
            } else if (event.type === "tool_call_end") {
              const status = event.success ? "✅ Sucesso" : "❌ Falha";
              console.log(`\x1b[90m↳ ${status}\x1b[0m`);
            } else if (event.type === "agent_error") {
              console.error(`\n\x1b[31m❌ [Erro do Agente]:\x1b[0m ${event.error}`);
            }
          }
        });
        console.log("\n");
      }

      if (initialPrompt) {
        await executePrompt(initialPrompt);
      }

      // Enter interactive REPL so the user can continue typing in the terminal
      console.log("\x1b[32m💬 Modo Chat Interativo Ativo.\x1b[0m");
      console.log("Digite sua mensagem e pressione Enter (ou digite 'sair' para encerrar):\n");

      const rl = readline.createInterface({ input, output });
      try {
        while (true) {
          const line = await rl.question("\x1b[36masclepio > \x1b[0m");
          const trimmed = line.trim();
          if (!trimmed) continue;
          if (["sair", "exit", "quit", ":q"].includes(trimmed.toLowerCase())) {
            console.log("\nAté logo! Asclepio encerrado.\n");
            break;
          }
          await executePrompt(trimmed);
        }
      } finally {
        rl.close();
      }
      break;
    }

    case "status": {
      printBanner();
      console.log("Status do Sistema:");
      console.log(`• Plataforma: ${os.platform()} (${os.arch()})`);
      console.log(`• Node.js: ${process.version}`);
      console.log(`• Provedor Padrão: ${config.agent.provider}`);
      console.log(`• Modelo Ativo (Mais Forte): ${config.agent.model}`);
      console.log(`• Auto-Fallback Inteligente: ${config.agent.autoFallback !== false ? "✅ ATIVADO (Mais Forte -> Mais Fraco)" : "Desativado"}`);
      if (config.agent.fallbackHierarchy) {
        console.log(`• Cascata de Modelos:`);
        config.agent.fallbackHierarchy.forEach((t, i) => {
          console.log(`   ${i + 1}. [${t.provider}] ${t.model} (${t.name || ""})`);
        });
      }
      console.log(`• Ferramentas Nativas: ${tools.length}`);
      console.log(`• Porta do Gateway: ${config.gateway.port}`);
      console.log(`• Chave NVIDIA NIM Configurada: ${Boolean(config.apiKeys?.nvidia)}`);
      console.log(`• Chave Gemini Configurada: ${Boolean(config.apiKeys?.gemini)}`);
      console.log(`• Chave OpenAI Configurada: ${Boolean(config.apiKeys?.openai)}`);
      break;
    }

    case "doctor": {
      printBanner();
      console.log("🩺 Executando Diagnóstico de Integridade do Asclepio...\n");

      // 1. Node version check
      const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
      if (nodeMajor >= 20) {
        console.log(`✅ Node.js: v${process.versions.node} (Compatível)`);
      } else {
        console.log(`❌ Node.js: v${process.versions.node} (Requer Node >= 20)`);
      }

      // 2. SQLite check
      try {
        const db = getDatabase();
        console.log(`✅ SQLite Nativo (node:sqlite): Conectado e Operacional`);
      } catch (e) {
        console.log(`❌ SQLite: Falha ao carregar banco: ${e.message}`);
      }

      // 3. API Key check
      if (config.apiKeys?.nvidia || config.apiKeys?.gemini || config.apiKeys?.openai || config.apiKeys?.anthropic) {
        console.log(`✅ Chave de API: Encontrada para ${config.agent.provider} (NVIDIA NIM ativo: ${Boolean(config.apiKeys?.nvidia)})`);
      } else {
        console.log(`⚠️  Chave de API: Nenhuma chave encontrada em asclepio.config.json ou nas variáveis de ambiente.`);
      }

      // 4. Auto-Fallback check
      if (config.agent.autoFallback !== false && config.agent.fallbackHierarchy?.length > 0) {
        console.log(`✅ Auto-Fallback: Configurado com ${config.agent.fallbackHierarchy.length} tiers de resiliência`);
      }

      // 5. Tools check
      console.log(`✅ Ferramentas Registradas: ${tools.map(t => t.name).join(", ")}`);
      console.log("\n🎉 Diagnóstico concluído com sucesso!");
      break;
    }

    case "memory": {
      const sub = args[1] || "list";
      if (sub === "list" || sub === "search") {
        const q = args.slice(2).join(" ");
        const items = searchMemory(q);
        console.log(`Memória de Longo Prazo (${items.length} itens encontrados):`);
        items.forEach(i => console.log(`• [${i.category}] ${i.key}: ${i.content}`));
      } else if (sub === "add") {
        const key = args[2];
        const content = args.slice(3).join(" ");
        if (!key || !content) {
          console.error("Uso: asclepio memory add <chave> <conteúdo>");
          process.exit(1);
        }
        saveMemory(key, content);
        console.log(`Memória '${key}' gravada com sucesso.`);
      }
      break;
    }

    default:
    case "help": {
      printBanner();
      console.log(`Comandos Disponíveis:
  asclepio start [porta]        Inicia o Gateway e abre o Control UI no navegador
  asclepio chat "<mensagem>"    Executa uma tarefa autônoma diretamente no terminal
  asclepio status               Exibe status do sistema, modelo e ferramentas
  asclepio doctor               Realiza checagem completa de ambiente e conectividade
  asclepio ui                   Abre o dashboard web no navegador
  asclepio memory list          Lista itens salvos na memória persistente
  asclepio memory add <k> <v>   Salva uma nova informação na memória
      `);
      break;
    }
  }
}

main().catch(err => {
  console.error("\n❌ Erro Fatal no Asclepio:", err);
  process.exit(1);
});
