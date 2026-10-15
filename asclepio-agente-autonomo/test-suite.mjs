import assert from "node:assert";
import path from "node:path";
import fs from "node:fs";
import { executeTool, tools, getToolDefinitions } from "./src/core/tool-registry.js";
import { createSession, getSession, listSessions, saveMessage, getSessionMessages, saveMemory, searchMemory } from "./src/storage/db.js";
import { loadConfig, saveConfig, updateApiKeys } from "./src/storage/config.js";
import { startGateway } from "./src/gateway/server.js";

const results = [];

async function test(name, fn) {
  try {
    await fn();
    results.push({ name, status: "PASS" });
    console.log(`✅ PASS: ${name}`);
  } catch (err) {
    results.push({ name, status: "FAIL", error: err.message, stack: err.stack });
    console.error(`❌ FAIL: ${name} -> ${err.message}`);
  }
}

async function runAll() {
  console.log("\n🧪 INICIANDO BATERIA DE TESTES DO LABORATÓRIO (ASCLEPIO)\n");

  // 1. Database tests
  await test("DB: createSession e getSession", async () => {
    const s = createSession("Sessão Teste 1");
    assert(s.id, "ID da sessão deve existir");
    assert.strictEqual(s.title, "Sessão Teste 1");
    const retrieved = getSession(s.id);
    assert.strictEqual(retrieved.id, s.id);
  });

  await test("DB: saveMessage e getSessionMessages", async () => {
    const s = createSession("Sessão Teste Mensagens");
    saveMessage({ sessionId: s.id, role: "user", content: "Olá" });
    saveMessage({
      sessionId: s.id,
      role: "assistant",
      content: "Olá! Como posso ajudar?",
      toolCalls: [{ id: "c1", name: "test", arguments: {} }]
    });
    saveMessage({
      sessionId: s.id,
      role: "tool",
      content: '{"success":true}',
      toolResults: [{ toolCallId: "c1", name: "test", success: true }]
    });

    const msgs = getSessionMessages(s.id);
    assert.strictEqual(msgs.length, 3);
    assert.strictEqual(msgs[0].role, "user");
    assert.strictEqual(msgs[1].role, "assistant");
    assert.strictEqual(msgs[1].toolCalls[0].name, "test");
    assert.strictEqual(msgs[2].role, "tool");
  });

  await test("DB: saveMemory e searchMemory", async () => {
    saveMemory("teste_lab_key_1", "Valor de teste importante", "lab");
    const found = searchMemory("teste_lab_key_1");
    assert(found.length >= 1, "Deveria encontrar a memória salva");
    assert.strictEqual(found[0].key, "teste_lab_key_1");

    // Upsert
    saveMemory("teste_lab_key_1", "Valor atualizado", "lab");
    const updated = searchMemory("teste_lab_key_1");
    assert.strictEqual(updated[0].content, "Valor atualizado");
  });

  // 2. Tools tests
  await test("Tool: execute_command (sucesso)", async () => {
    const r = await executeTool("execute_command", { command: "node -e 'console.log(42)'" });
    assert(r.success, "Comando deveria ter sucesso");
    assert.strictEqual(r.exitCode, 0);
    assert.strictEqual(r.stdout.trim(), "42");
  });

  await test("Tool: execute_command (erro de sintaxe ou comando inexistente)", async () => {
    const r = await executeTool("execute_command", { command: "non_existent_command_12345" });
    assert.strictEqual(r.success, false, "Comando inexistente deve retornar success=false");
  });

  await test("Tool: write_file e read_file", async () => {
    const testFile = path.resolve("./data/test_tmp.txt");
    const writeRes = await executeTool("write_file", { path: testFile, content: "linha 1\nlinha 2\nlinha 3" });
    assert(writeRes.success);

    const readRes = await executeTool("read_file", { path: testFile, startLine: 2, endLine: 3 });
    assert(readRes.success);
    assert(readRes.content.includes("linha 2"));

    // Cleanup
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  await test("Tool: edit_file", async () => {
    const testFile = path.resolve("./data/test_edit.txt");
    await executeTool("write_file", { path: testFile, content: "foo bar baz" });
    const editRes = await executeTool("edit_file", { path: testFile, target: "bar", replacement: "qux" });
    assert(editRes.success);

    const read = await executeTool("read_file", { path: testFile });
    assert.strictEqual(read.content, "foo qux baz");

    // Cleanup
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  });

  await test("Tool: list_directory", async () => {
    const r = await executeTool("list_directory", { path: "." });
    assert(r.success);
    assert(r.items.length > 0);
  });

  await test("Tool: system_info", async () => {
    const r = await executeTool("system_info", {});
    assert(r.success);
    assert(r.platform);
    assert(r.totalMemoryMB > 0);
  });

  // 2.2 SWE Engineering Tools (Inspiradas em Aider, SWE-agent, MetaGPT)
  await test("Tool: repo_map (varredura inteligente sem ruído)", async () => {
    const r = await executeTool("repo_map", { maxDepth: 2, extractSymbols: true });
    assert(r.success, "repo_map deve ter sucesso");
    assert(r.mappedCodeFiles >= 1, "Deve mapear arquivos de código");
    assert(Array.isArray(r.files));
  });

  await test("Tool: code_lint (sintaxe limpa vs sintaxe quebrada)", async () => {
    const rGood = await executeTool("code_lint", { path: "./src/core/tool-registry.js" });
    assert(rGood.success && rGood.clean, "tool-registry.js deve ter sintaxe limpa");

    const badFile = path.resolve("./data/test_broken_syntax.js");
    await executeTool("write_file", { path: badFile, content: "function broken( { return 1;" });
    const rBad = await executeTool("code_lint", { path: badFile });
    assert.strictEqual(rBad.clean, false, "Deve detectar sintaxe quebrada");
    if (fs.existsSync(badFile)) fs.unlinkSync(badFile);
  });

  await test("Tool: test_runner (execução padronizada de testes)", async () => {
    const r = await executeTool("test_runner", { command: "node -e 'process.exit(0)'" });
    assert(r.success, "Comando com exit 0 deve ser sucesso");
    assert.strictEqual(r.exitCode, 0);

    const rFail = await executeTool("test_runner", { command: "node -e 'process.exit(2)'" });
    assert.strictEqual(rFail.success, false, "Exit code > 0 deve registrar falha");
    assert(rFail.exitCode > 0, "Exit code deve ser maior que zero");
  });

  await test("Tool: git_checkpoint (status e diff seguro)", async () => {
    const r = await executeTool("git_checkpoint", { action: "status" });
    assert(r.success, "git status deve executar sem erro");
    assert(Array.isArray(r.modifiedFiles));
  });

  // 2.1 Regression Tests (Lab Bugs)
  await test("Regressão BUG-005: read_file em diretório sugere list_directory", async () => {
    const r = await executeTool("read_file", { path: "./src" });
    assert.strictEqual(r.success, false);
    assert(r.error.includes("list_directory"), "Erro deve orientar o uso da ferramenta correta");
  });

  await test("Regressão BUG-004: loadConfig respeita reload e detecção de mtime", async () => {
    const cfg1 = loadConfig();
    assert(cfg1.name === "Asclepio");
    const cfg2 = loadConfig({ reload: true });
    assert.strictEqual(cfg2.name, "Asclepio");
  });

  // 3. Gateway Server HTTP & REST API Tests
  await test("Gateway: REST API Endpoints", async () => {
    const server = startGateway({
      port: 18899,
      onReady: async ({ port }) => {
        try {
          const base = `http://127.0.0.1:${port}`;

          // Status
          const rStatus = await fetch(`${base}/api/status`);
          assert.strictEqual(rStatus.status, 200);
          const dStatus = await rStatus.json();
          assert.strictEqual(dStatus.name, "Asclepio Gateway");

          // Tools
          const rTools = await fetch(`${base}/api/tools`);
          assert.strictEqual(rTools.status, 200);
          const dTools = await rTools.json();
          assert(dTools.tools.length >= 10);

          // Config
          const rCfg = await fetch(`${base}/api/config`);
          assert.strictEqual(rCfg.status, 200);

          // Create session
          const rSess = await fetch(`${base}/api/sessions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: "Sessão API Teste" })
          });
          assert.strictEqual(rSess.status, 201);
          const dSess = await rSess.json();
          assert(dSess.session.id);

          // Direct command
          const rCmd = await fetch(`${base}/api/command`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: "node -e 'console.log(99)'" })
          });
          assert.strictEqual(rCmd.status, 200);
          const dCmd = await rCmd.json();
          assert.strictEqual(dCmd.stdout.trim(), "99");

          // Close server
          server.close();
        } catch (e) {
          server.close();
          throw e;
        }
      }
    });
  });

  // Summary
  console.log("\n========================================================");
  console.log(`TOTAL DE TESTES: ${results.length}`);
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  console.log(`PASSOU: ${passed} | FALHOU: ${failed}`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll().catch(err => {
  console.error("Erro fatal nos testes:", err);
  process.exit(1);
});
