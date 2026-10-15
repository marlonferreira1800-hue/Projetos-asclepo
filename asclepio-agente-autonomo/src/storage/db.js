import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "asclepio.db");

let dbInstance = null;

export function getDatabase() {
  if (dbInstance) return dbInstance;

  dbInstance = new DatabaseSync(DB_PATH);

  // Initialize schema
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT,
      tool_calls TEXT,
      tool_results TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS memory (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      importance INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      event TEXT NOT NULL,
      details TEXT,
      timestamp INTEGER NOT NULL
    );
  `);

  return dbInstance;
}

export function createSession(title = "Nova Sessão") {
  const db = getDatabase();
  const id = "sess_" + crypto.randomBytes(8).toString("hex");
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, title, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, title, now, now, JSON.stringify({}));

  return { id, title, created_at: now, updated_at: now };
}

export function listSessions(limit = 50) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, title, created_at, updated_at
    FROM sessions
    ORDER BY updated_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getSession(id) {
  const db = getDatabase();
  const stmt = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
  return stmt.get(id);
}

export function saveMessage({ sessionId, role, content = "", toolCalls = null, toolResults = null }) {
  const db = getDatabase();
  const id = "msg_" + crypto.randomBytes(8).toString("hex");
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO messages (id, session_id, role, content, tool_calls, tool_results, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    sessionId,
    role,
    content || "",
    toolCalls ? JSON.stringify(toolCalls) : null,
    toolResults ? JSON.stringify(toolResults) : null,
    now
  );

  // Update session updated_at
  const updateSession = db.prepare(`UPDATE sessions SET updated_at = ? WHERE id = ?`);
  updateSession.run(now, sessionId);

  return { id, sessionId, role, content, toolCalls, toolResults, timestamp: now };
}

export function getSessionMessages(sessionId) {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT id, session_id, role, content, tool_calls, tool_results, timestamp
    FROM messages
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `);
  const rows = stmt.all(sessionId);
  return rows.map(r => ({
    id: r.id,
    sessionId: r.session_id,
    role: r.role,
    content: r.content,
    toolCalls: r.tool_calls ? JSON.parse(r.tool_calls) : null,
    toolResults: r.tool_results ? JSON.parse(r.tool_results) : null,
    timestamp: r.timestamp
  }));
}

export function saveMemory(key, content, category = "general", importance = 1) {
  const db = getDatabase();
  const id = "mem_" + crypto.randomBytes(8).toString("hex");
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO memory (id, key, content, category, importance, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      content = excluded.content,
      category = excluded.category,
      importance = excluded.importance,
      created_at = excluded.created_at
  `);
  stmt.run(id, key, content, category, importance, now);

  return { id, key, content, category, importance, created_at: now };
}

export function searchMemory(query = "") {
  const db = getDatabase();
  if (!query) {
    const stmt = db.prepare(`SELECT * FROM memory ORDER BY importance DESC, created_at DESC LIMIT 20`);
    return stmt.all();
  }

  const stmt = db.prepare(`
    SELECT * FROM memory
    WHERE key LIKE ? OR content LIKE ? OR category LIKE ?
    ORDER BY importance DESC, created_at DESC
    LIMIT 20
  `);
  const pattern = `%${query}%`;
  return stmt.all(pattern, pattern, pattern);
}

export function logAudit(event, details = {}) {
  const db = getDatabase();
  const id = "log_" + crypto.randomBytes(8).toString("hex");
  const now = Date.now();

  const stmt = db.prepare(`
    INSERT INTO audit_logs (id, event, details, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, event, JSON.stringify(details), now);
}
