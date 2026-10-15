import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, saveConfig, updateApiKeys } from "../storage/config.js";
import {
  createSession,
  listSessions,
  getSession,
  getSessionMessages,
  saveMemory,
  searchMemory,
  getDatabase
} from "../storage/db.js";
import { runAsclepioLoop } from "../core/agent-loop.js";
import { tools, executeTool } from "../core/tool-registry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UI_DIR = path.resolve(__dirname, "../ui");

// Active abort controllers per session
const activeSessions = new Map();

export function startGateway({ port, host, onReady } = {}) {
  const config = loadConfig();
  const LISTEN_PORT = port || config.gateway?.port || 18888;
  const LISTEN_HOST = host || config.gateway?.host || "127.0.0.1";

  // Ensure DB initialized
  getDatabase();

  const server = http.createServer(async (req, res) => {
    // CORS Headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Asclepio-Token");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    // Helper to send JSON
    const sendJson = (statusCode, data) => {
      res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(data));
    };

    // Helper to parse JSON body
    const parseBody = () => {
      return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    // 1. API: Status
    if (pathname === "/api/status" && req.method === "GET") {
      return sendJson(200, {
        status: "online",
        name: "Asclepio Gateway",
        version: config.version,
        provider: config.agent.provider,
        model: config.agent.model,
        port: LISTEN_PORT,
        activeTasks: activeSessions.size,
        toolsCount: tools.length,
        uptime: process.uptime(),
        node: process.version
      });
    }

    // 2. API: Sessions
    if (pathname === "/api/sessions" && req.method === "GET") {
      const limit = parseInt(url.searchParams.get("limit") || "50", 10);
      const sessions = listSessions(limit);
      return sendJson(200, { sessions });
    }

    if (pathname === "/api/sessions" && req.method === "POST") {
      const body = await parseBody();
      const session = createSession(body.title || "Nova Sessão");
      return sendJson(201, { session });
    }

    if (pathname.startsWith("/api/sessions/") && req.method === "GET") {
      const sessionId = pathname.replace("/api/sessions/", "").trim();
      const session = getSession(sessionId);
      if (!session) {
        return sendJson(404, { error: "Sessão não encontrada." });
      }
      const messages = getSessionMessages(sessionId);
      return sendJson(200, { session, messages });
    }

    // 3. API: Chat (SSE Streaming Execution)
    if (pathname === "/api/chat" && req.method === "POST") {
      const body = await parseBody();
      const { prompt, sessionId: reqSessionId } = body;

      if (!prompt) {
        return sendJson(400, { error: "Prompt é obrigatório." });
      }

      let sessionId = reqSessionId;
      if (!sessionId) {
        const newSess = createSession(prompt.slice(0, 30));
        sessionId = newSess.id;
      }

      // Configure Server-Sent Events (SSE)
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });

      const abortController = new AbortController();
      activeSessions.set(sessionId, abortController);

      const emitSSE = async (event) => {
        if (res.writableEnded) return;
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      try {
        await runAsclepioLoop({
          prompt,
          sessionId,
          config: loadConfig(),
          signal: abortController.signal,
          emit: emitSSE
        });
      } catch (err) {
        await emitSSE({ type: "agent_error", error: err.message });
      } finally {
        activeSessions.delete(sessionId);
        res.end();
      }
      return;
    }

    // 4. API: Abort Session Run
    if (pathname === "/api/abort" && req.method === "POST") {
      const body = await parseBody();
      const { sessionId } = body;
      if (sessionId && activeSessions.has(sessionId)) {
        activeSessions.get(sessionId).abort();
        activeSessions.delete(sessionId);
        return sendJson(200, { success: true, message: "Sessão abortada com sucesso." });
      }
      return sendJson(404, { error: "Nenhuma execução ativa para esta sessão." });
    }

    // 5. API: Tools
    if (pathname === "/api/tools" && req.method === "GET") {
      return sendJson(200, {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }))
      });
    }

    // 6. API: Config (Get / Update)
    if (pathname === "/api/config" && req.method === "GET") {
      const cfg = loadConfig();
      // Mask api keys for safety
      const safeKeys = {};
      for (const [k, v] of Object.entries(cfg.apiKeys || {})) {
        safeKeys[k] = v ? `${v.slice(0, 4)}...${v.slice(-4)}` : "";
      }
      return sendJson(200, {
        ...cfg,
        apiKeys: safeKeys
      });
    }

    if (pathname === "/api/config" && req.method === "POST") {
      const body = await parseBody();
      if (body.apiKeys) {
        updateApiKeys(body.apiKeys);
      }
      if (body.agent) {
        const cur = loadConfig();
        saveConfig({ agent: { ...cur.agent, ...body.agent } });
      }
      return sendJson(200, { success: true, message: "Configuração atualizada com sucesso." });
    }

    // 7. API: Memory
    if (pathname === "/api/memory" && req.method === "GET") {
      const q = url.searchParams.get("q") || "";
      const memories = searchMemory(q);
      return sendJson(200, { memories });
    }

    if (pathname === "/api/memory" && req.method === "POST") {
      const body = await parseBody();
      if (!body.key || !body.content) {
        return sendJson(400, { error: "key e content são obrigatórios." });
      }
      const saved = saveMemory(body.key, body.content, body.category || "general");
      return sendJson(201, { success: true, memory: saved });
    }

    // 8. API: Direct Command Execution
    if (pathname === "/api/command" && req.method === "POST") {
      const body = await parseBody();
      if (!body.command) {
        return sendJson(400, { error: "command é obrigatório." });
      }
      const outcome = await executeTool("execute_command", { command: body.command });
      return sendJson(200, outcome);
    }

    // 9. Static UI Server
    if (pathname === "/" || pathname === "/ui" || pathname.startsWith("/ui/")) {
      const filePath = path.join(UI_DIR, "index.html");
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(fs.readFileSync(filePath, "utf-8"));
      }
    }

    // Fallback 404
    sendJson(404, { error: "Rota não encontrada no Asclepio Gateway." });
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`\n[Asclepio Gateway] ⚠️ A porta ${LISTEN_PORT} já está em uso por uma instância em execução.`);
      console.warn(`🌐 Acesse o Dashboard Web diretamente em: http://${LISTEN_HOST}:${LISTEN_PORT}`);
      console.warn(`💡 Para reiniciar uma instância antiga, use: asclepio restart\n`);
      if (onReady) onReady({ port: LISTEN_PORT, host: LISTEN_HOST, alreadyRunning: true });
    } else {
      console.error("[Asclepio Gateway Error]:", err.message);
    }
  });

  server.listen(LISTEN_PORT, LISTEN_HOST, () => {
    console.log(`\n======================================================`);
    console.log(`  ⚡ ASCLEPIO GATEWAY (OPENCLAW ARCHITECTURE) ATIVO`);
    console.log(`======================================================`);
    console.log(`  🌐 Dashboard Web: http://${LISTEN_HOST}:${LISTEN_PORT}`);
    console.log(`  🔗 REST & SSE API: http://${LISTEN_HOST}:${LISTEN_PORT}/api/status`);
    console.log(`  🤖 Provedor Padrão: ${config.agent.provider} (${config.agent.model})`);
    console.log(`  🛠️  Ferramentas Ativas: ${tools.length}`);
    console.log(`  📁 Workspace: ${config.agent.workspace}`);
    console.log(`======================================================\n`);

    if (onReady) onReady({ port: LISTEN_PORT, host: LISTEN_HOST, alreadyRunning: false });
  });

  return server;
}
