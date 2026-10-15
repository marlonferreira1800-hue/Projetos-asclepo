import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { saveMemory, searchMemory } from "../storage/db.js";

export const tools = [
  {
    name: "execute_command",
    description: "Executa um comando no terminal do sistema (PowerShell no Windows / Bash no Linux/macOS) e retorna stdout e stderr.",
    parameters: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "O comando exato a ser executado."
        },
        timeoutMs: {
          type: "number",
          description: "Tempo máximo em milissegundos antes de abortar o comando. Padrão: 30000 (30s)."
        }
      },
      required: ["command"]
    },
    execute: async ({ command, timeoutMs = 30000 }, context) => {
      return new Promise((resolve) => {
        const shell = process.platform === "win32" ? "powershell.exe" : "/bin/bash";
        const cwd = context?.workspace || process.cwd();

        exec(command, { shell, cwd, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
          if (err) {
            resolve({
              success: false,
              exitCode: err.code || 1,
              stdout: stdout ? stdout.trim() : "",
              stderr: stderr ? stderr.trim() : "",
              error: err.message
            });
          } else {
            resolve({
              success: true,
              exitCode: 0,
              stdout: stdout ? stdout.trim() : "",
              stderr: stderr ? stderr.trim() : ""
            });
          }
        });
      });
    }
  },
  {
    name: "read_file",
    description: "Lê o conteúdo de um arquivo no disco com suporte a linhas iniciais e finais.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Caminho absoluto ou relativo do arquivo."
        },
        startLine: {
          type: "number",
          description: "Linha inicial (1-indexed, opcional)."
        },
        endLine: {
          type: "number",
          description: "Linha final (1-indexed, opcional)."
        }
      },
      required: ["path"]
    },
    execute: async ({ path: filePath, startLine, endLine }, context) => {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(context?.workspace || process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
          return { success: false, error: `Arquivo não encontrado: ${fullPath}` };
        }
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          return {
            success: false,
            error: `"${fullPath}" é um diretório, não um arquivo de texto. Use a ferramenta "list_directory" para listar seu conteúdo.`
          };
        }
        const content = fs.readFileSync(fullPath, "utf-8");
        const lines = content.split("\n");

        if (startLine !== undefined || endLine !== undefined) {
          const start = Math.max(1, startLine || 1) - 1;
          const end = Math.min(lines.length, endLine || lines.length);
          const sliced = lines.slice(start, end).map((l, i) => `${start + i + 1}: ${l}`).join("\n");
          return { success: true, totalLines: lines.length, content: sliced };
        }

        return { success: true, totalLines: lines.length, content };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "write_file",
    description: "Cria ou substitui completamente o conteúdo de um arquivo, criando pastas intermediárias se necessário.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Caminho do arquivo a ser gravado."
        },
        content: {
          type: "string",
          description: "Conteúdo a ser escrito no arquivo."
        }
      },
      required: ["path", "content"]
    },
    execute: async ({ path: filePath, content }, context) => {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(context?.workspace || process.cwd(), filePath);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, "utf-8");
        return { success: true, path: fullPath, bytesWritten: Buffer.byteLength(content, "utf-8") };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "edit_file",
    description: "Edita cirurgicamente um arquivo substituindo um trecho específico por outro.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Caminho do arquivo a ser modificado."
        },
        target: {
          type: "string",
          description: "O trecho exato de texto a ser substituído."
        },
        replacement: {
          type: "string",
          description: "O novo texto de substituição."
        }
      },
      required: ["path", "target", "replacement"]
    },
    execute: async ({ path: filePath, target, replacement }, context) => {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(context?.workspace || process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
          return { success: false, error: `Arquivo não encontrado: ${fullPath}` };
        }
        const content = fs.readFileSync(fullPath, "utf-8");
        if (!content.includes(target)) {
          return { success: false, error: "O trecho 'target' não foi encontrado no arquivo para substituição." };
        }
        const updated = content.replace(target, replacement);
        fs.writeFileSync(fullPath, updated, "utf-8");
        return { success: true, path: fullPath, message: "Arquivo atualizado com sucesso." };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "list_directory",
    description: "Lista arquivos e pastas em um diretório.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Caminho da pasta (padrão: diretório atual)."
        }
      }
    },
    execute: async ({ path: dirPath = "." }, context) => {
      try {
        const fullPath = path.isAbsolute(dirPath) ? dirPath : path.resolve(context?.workspace || process.cwd(), dirPath);
        if (!fs.existsSync(fullPath)) {
          return { success: false, error: `Diretório não existe: ${fullPath}` };
        }
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const items = entries.map(e => ({
          name: e.name,
          type: e.isDirectory() ? "directory" : (e.isFile() ? "file" : "other")
        }));
        return { success: true, path: fullPath, total: items.length, items };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "web_search",
    description: "Pesquisa na web por notícias, erros ou documentações externas. Chame APENAS se o usuário pedir explicitamente informações externas ou buscas na internet. NUNCA chame para saudações ou conversas casuais.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Termo de busca."
        }
      },
      required: ["query"]
    },
    execute: async ({ query }) => {
      try {
        const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        const html = await res.text();
        
        // Simple regex extraction of results
        const results = [];
        const regex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = regex.exec(html)) !== null && results.length < 5) {
          const rawUrl = match[1].replace(/&amp;/g, "&");
          // Extract actual url if duckduckgo redirect
          const uMatch = rawUrl.match(/uddg=([^&]+)/);
          const cleanUrl = uMatch ? decodeURIComponent(uMatch[1]) : rawUrl;
          const snippet = match[3].replace(/<[^>]+>/g, "").trim();
          results.push({ url: cleanUrl, snippet });
        }

        if (results.length === 0) {
          return { success: true, query, message: "Nenhum resultado direto encontrado ou proteção contra robôs ativada. Tente web_fetch com URL direta." };
        }
        return { success: true, query, results };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "web_fetch",
    description: "Faz o download do conteúdo de uma página web e retorna o texto limpo.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL da página web a ser consultada."
        }
      },
      required: ["url"]
    },
    execute: async ({ url }) => {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
          }
        });
        if (!res.ok) {
          return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
        }
        const text = await res.text();
        // Remove scripts, styles and strip HTML tags
        const cleaned = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 8000); // Limit to reasonable context size

        return { success: true, url, contentSnippet: cleaned };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "memory_save",
    description: "Salva uma informação ou aprendizado na memória persistente de longo prazo do Asclepio.",
    parameters: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "Chave identificadora ou título do conhecimento."
        },
        content: {
          type: "string",
          description: "Conteúdo a ser memorizado."
        },
        category: {
          type: "string",
          description: "Categoria (ex: 'projeto', 'preferencia', 'solucao_tecnica')."
        }
      },
      required: ["key", "content"]
    },
    execute: async ({ key, content, category = "general" }) => {
      try {
        const saved = saveMemory(key, content, category);
        return { success: true, message: `Memória '${key}' salva com sucesso.`, record: saved };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "memory_search",
    description: "Busca na memória persistente de longo prazo do Asclepio.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Termo de busca na memória."
        }
      }
    },
    execute: async ({ query = "" }) => {
      try {
        const items = searchMemory(query);
        return { success: true, count: items.length, items };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "system_info",
    description: "Obtém informações sobre o sistema operacional, hardware, processo e ambiente de execução.",
    parameters: {
      type: "object",
      properties: {}
    },
    execute: async () => {
      return {
        success: true,
        platform: process.platform,
        arch: os.arch(),
        release: os.release(),
        cpus: os.cpus().length,
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
        nodeVersion: process.version,
        uptimeSeconds: Math.round(os.uptime()),
        cwd: process.cwd()
      };
    }
  },
  {
    name: "repo_map",
    description: "Gera um mapa condensado e inteligente da estrutura do repositório/projeto (inspirado no Aider RepoMap). Ignora diretórios pesados (node_modules, .git, venv, dist, build, cache) e extrai assinaturas de classes, funções e símbolos principais.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Diretório raiz a ser mapeado. Padrão: diretório atual de trabalho."
        },
        maxDepth: {
          type: "number",
          description: "Profundidade máxima de diretórios a inspecionar. Padrão: 5."
        },
        extractSymbols: {
          type: "boolean",
          description: "Se true, analisa os arquivos de código para listar nomes de classes, funções e exports. Padrão: true."
        }
      }
    },
    execute: async ({ path: targetPath, maxDepth = 5, extractSymbols = true }, context) => {
      try {
        const root = targetPath
          ? (path.isAbsolute(targetPath) ? targetPath : path.resolve(context?.workspace || process.cwd(), targetPath))
          : (context?.workspace || process.cwd());

        if (!fs.existsSync(root)) {
          return { success: false, error: `Caminho inexistente: ${root}` };
        }

        const ignoreDirs = new Set([
          ".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build",
          ".next", "coverage", ".dart_tool", "bin", "obj", "target", ".cache",
          ".idea", ".vscode", "vendor", ".gradle"
        ]);

        const codeExts = new Set([
          ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".py", ".dart", ".go",
          ".rs", ".java", ".cs", ".cpp", ".c", ".h", ".json", ".yaml", ".yml", ".sql"
        ]);

        const filesSummary = [];
        let totalFiles = 0;

        function walk(currentDir, currentDepth) {
          if (currentDepth > maxDepth) return;
          let entries = [];
          try {
            entries = fs.readdirSync(currentDir, { withFileTypes: true });
          } catch {
            return;
          }

          for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);
            const relPath = path.relative(root, fullPath).replace(/\\/g, "/");

            if (entry.isDirectory()) {
              if (ignoreDirs.has(entry.name) || entry.name.startsWith(".")) continue;
              walk(fullPath, currentDepth + 1);
            } else if (entry.isFile()) {
              totalFiles++;
              const ext = path.extname(entry.name).toLowerCase();
              if (!codeExts.has(ext)) continue;

              let lineCount = 0;
              let symbols = [];

              if (extractSymbols && entry.size < 500 * 1024) {
                try {
                  const content = fs.readFileSync(fullPath, "utf-8");
                  const lines = content.split("\n");
                  lineCount = lines.length;

                  const symRegex = /^(?:export\s+(?:default\s+)?|async\s+)*(?:class\s+([A-Za-z0-9_$]+)|function\s+([A-Za-z0-9_$]+)|(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>|def\s+([A-Za-z0-9_]+))/gm;
                  let m;
                  while ((m = symRegex.exec(content)) !== null) {
                    const name = m[1] || m[2] || m[3] || m[4];
                    if (name && !symbols.includes(name)) {
                      symbols.push(name);
                      if (symbols.length >= 8) break;
                    }
                  }
                } catch {
                  // ignore
                }
              }

              filesSummary.push({
                file: relPath,
                sizeBytes: entry.size,
                lines: lineCount,
                symbols: symbols.length > 0 ? symbols : undefined
              });
            }
          }
        }

        walk(root, 1);

        return {
          success: true,
          root,
          totalFilesScanned: totalFiles,
          mappedCodeFiles: filesSummary.length,
          files: filesSummary
        };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "code_lint",
    description: "Executa verificação estática de sintaxe e integridade imediata em um arquivo de código antes ou depois de alterações (inspirado no Aider Linter). Valida JavaScript/Node (node --check), Python (py_compile), JSON (JSON.parse) e arquivos de configuração.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Caminho do arquivo a ser verificado sintaticamente."
        }
      },
      required: ["path"]
    },
    execute: async ({ path: filePath }, context) => {
      try {
        const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(context?.workspace || process.cwd(), filePath);
        if (!fs.existsSync(fullPath)) {
          return { success: false, error: `Arquivo não encontrado: ${fullPath}` };
        }

        const ext = path.extname(fullPath).toLowerCase();

        if (ext === ".json") {
          try {
            const raw = fs.readFileSync(fullPath, "utf-8");
            JSON.parse(raw);
            return { success: true, clean: true, language: "json", message: "Sintaxe JSON válida." };
          } catch (jsonErr) {
            return {
              success: false,
              clean: false,
              language: "json",
              error: `Erro de sintaxe JSON: ${jsonErr.message}`
            };
          }
        }

        let cmd = null;
        if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
          cmd = `node --check "${fullPath}"`;
        } else if (ext === ".py") {
          cmd = `python -m py_compile "${fullPath}"`;
        }

        if (!cmd) {
          return {
            success: true,
            clean: true,
            language: ext.slice(1) || "unknown",
            message: `Verificação básica concluída (sem linter nativo offline para extensão ${ext}).`
          };
        }

        return new Promise((resolve) => {
          exec(cmd, { cwd: context?.workspace || process.cwd() }, (err, stdout, stderr) => {
            if (err) {
              resolve({
                success: false,
                clean: false,
                file: fullPath,
                command: cmd,
                error: (stderr || stdout || err.message).trim()
              });
            } else {
              resolve({
                success: true,
                clean: true,
                file: fullPath,
                command: cmd,
                message: "Sintaxe verificada com sucesso sem erros."
              });
            }
          });
        });
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "test_runner",
    description: "Detecta e executa automaticamente a suíte de testes do projeto (Jest, Vitest, Pytest, Unittest, Dart Test, Go Test, Cargo, etc.) ou executa um comando de teste específico, retornando um resumo padronizado com contagem de aprovados, falhas e stack traces.",
    parameters: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Diretório do projeto onde os testes devem ser executados."
        },
        command: {
          type: "string",
          description: "Comando de teste customizado opcional. Se omitido, autodetecta pela stack do projeto."
        },
        timeoutMs: {
          type: "number",
          description: "Timeout em ms para a execução dos testes. Padrão: 60000 (60s)."
        }
      }
    },
    execute: async ({ path: projectPath, command: customCommand, timeoutMs = 60000 }, context) => {
      try {
        const root = projectPath
          ? (path.isAbsolute(projectPath) ? projectPath : path.resolve(context?.workspace || process.cwd(), projectPath))
          : (context?.workspace || process.cwd());

        let cmd = customCommand;
        let detectedFramework = "custom";

        if (!cmd) {
          const pkgPath = path.join(root, "package.json");
          const pyprojectPath = path.join(root, "pyproject.toml");
          const pytestIni = path.join(root, "pytest.ini");
          const pubspecPath = path.join(root, "pubspec.yaml");
          const cargoPath = path.join(root, "Cargo.toml");
          const goModPath = path.join(root, "go.mod");

          if (fs.existsSync(pkgPath)) {
            try {
              const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
              if (pkg.scripts && pkg.scripts.test) {
                cmd = "npm test";
                detectedFramework = "npm-test";
              }
            } catch {}
          }

          if (!cmd && (fs.existsSync(pytestIni) || fs.existsSync(pyprojectPath) || fs.existsSync(path.join(root, "tests")))) {
            cmd = "pytest";
            detectedFramework = "pytest";
          } else if (!cmd && fs.existsSync(pubspecPath)) {
            cmd = "dart test";
            detectedFramework = "dart-test";
          } else if (!cmd && fs.existsSync(cargoPath)) {
            cmd = "cargo test";
            detectedFramework = "cargo-test";
          } else if (!cmd && fs.existsSync(goModPath)) {
            cmd = "go test ./...";
            detectedFramework = "go-test";
          }
        }

        if (!cmd) {
          return {
            success: false,
            error: "Não foi possível detectar automaticamente a suíte de testes. Por favor informe o parâmetro 'command'."
          };
        }

        const shell = process.platform === "win32" ? "powershell.exe" : "/bin/bash";

        return new Promise((resolve) => {
          exec(cmd, { shell, cwd: root, timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            const out = (stdout || "").trim();
            const errOut = (stderr || "").trim();

            const isPassed = !err;
            resolve({
              success: isPassed,
              command: cmd,
              framework: detectedFramework,
              exitCode: err ? (err.code || 1) : 0,
              stdout: out,
              stderr: errOut,
              summary: isPassed ? "Todos os testes passaram com sucesso." : "Falha detectada durante a execução dos testes."
            });
          });
        });
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  },
  {
    name: "git_checkpoint",
    description: "Gerencia pontos de segurança (checkpoints), inspeção de diffs e reversão atômica (rollback) em repositórios Git (inspirado no SWE-agent & Aider dirty worktree protection). Permite criar checkpoint antes de tentar corrigir um bug e reverter cirurgicamente se a tentativa quebrar o código.",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["status", "diff", "checkpoint", "rollback"],
          description: "'status' para verificar arquivos alterados; 'diff' para ver o patch atual unificado; 'checkpoint' para salvar estado com stash temporário; 'rollback' para reverter modificações falhas e voltar ao estado limpo."
        },
        message: {
          type: "string",
          description: "Mensagem descritiva para o checkpoint ou motivo do rollback."
        }
      },
      required: ["action"]
    },
    execute: async ({ action, message = "auto-checkpoint" }, context) => {
      const cwd = context?.workspace || process.cwd();
      const runGit = (gitArgs) => {
        return new Promise((resolve) => {
          exec(`git ${gitArgs}`, { cwd }, (err, stdout, stderr) => {
            if (err) {
              resolve({ success: false, output: (stderr || stdout || err.message).trim(), error: err.message });
            } else {
              resolve({ success: true, output: (stdout || "").trim() });
            }
          });
        });
      };

      try {
        if (action === "status") {
          const res = await runGit("status --porcelain");
          return { success: true, modifiedFiles: res.output ? res.output.split("\n") : [] };
        } else if (action === "diff") {
          const res = await runGit("diff");
          return { success: true, diff: res.output || "Nenhuma alteração detectada." };
        } else if (action === "checkpoint") {
          const tag = `asclepio-chk-${Date.now()}`;
          const res = await runGit(`stash create "${message} (${tag})"`);
          return {
            success: true,
            checkpointId: tag,
            stashCommit: res.output || "nenhuma alteração pendente para stash",
            message: `Checkpoint criado com sucesso: ${message}`
          };
        } else if (action === "rollback") {
          const res = await runGit("checkout . && git clean -fd");
          return {
            success: res.success,
            message: "Reversão para o estado limpo do repositório executada com sucesso.",
            output: res.output
          };
        }
        return { success: false, error: `Ação desconhecida: ${action}` };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
];

export function getToolDefinitions(format = "gemini") {
  if (format === "gemini") {
    return [
      {
        functionDeclarations: tools.map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters
        }))
      }
    ];
  } else if (format === "openai") {
    return tools.map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
  }
  return tools;
}

export async function executeTool(name, args, context) {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    return {
      success: false,
      error: `Ferramenta '${name}' não encontrada no registro do Asclepio.`
    };
  }

  try {
    const result = await tool.execute(args, context);
    return result;
  } catch (err) {
    return {
      success: false,
      error: `Erro ao executar ${name}: ${err.message}`
    };
  }
}
