# ⚡ Asclepio — Autonomous Multi-Channel AI Agent Gateway & Platform

> **Asclepio** (`A S C L E P I O`) é uma plataforma autônoma de agentes de Inteligência Artificial, projetada e construída a partir da engenharia reversa do ecossistema **OpenClaw** e potencializada para execução local-first, alta performance e controle total.

---

## 🏛️ A Engenharia Reversa do OpenClaw: O Que Aprendemos?

Ao dissecar a arquitetura do **OpenClaw**, identificamos os pilares fundamentais que fazem dele uma das arquiteturas de agentes mais robustas do mundo:

1. **O Padrão Gateway Local (Control Plane):**
   - Em vez de um script isolado que termina ao rodar, o **Gateway** atua como um servidor de controle local permanente (HTTP + SSE/WebSocket).
   - Todos os pontos de contato (CLI, Control UI Web, canais como Telegram/Discord) conectam-se ao Gateway pelo mesmo protocolo unificado.
2. **Loop de Agente ReAct com Auto-Cura (Self-Healing Loop):**
   - O fluxo `Prompt -> Thought -> Tool Execution -> Observation -> Correction` garante que, se um comando ou arquivo falhar, o traceback é reintroduzido no contexto e o agente ajusta sua estratégia sem travar.
3. **Persistência de Sessões e Estado com SQLite Nativo:**
   - Mensagens, turnos, histórico de chamadas de ferramentas e memórias de longo prazo são persistidos em banco de dados SQLite de alta velocidade (`node:sqlite`).
4. **Desacoplamento de Provedores de IA:**
   - O runtime abstrai as chamadas para Google Gemini (`generativelanguage`), OpenAI GPT-4o, Anthropic Claude, OpenRouter e Ollama local sob um mesmo contrato unificado de streaming e function calling.
5. **Painel de Controle em Tempo Real (Control UI):**
   - Uma interface gráfica moderna onde o operador acompanha o raciocínio em tempo real, vê cartões de ferramentas executadas com inputs/outputs e gerencia configurações.

---

## 🚀 Como Iniciar o Asclepio

### 1. Início Rápido (1 Clique no Windows)
Dê um duplo clique no arquivo:
```cmd
INICIAR_ASCLEPIO.bat
```
Ele iniciará o **Gateway na porta 18888** e abrirá o **Dashboard Web (Control UI)** automaticamente no seu navegador padrão (`http://127.0.0.1:18888`).

---

### 2. Pelo Terminal (CLI)

```bash
# Iniciar o Gateway e abrir a UI
node bin/asclepio.mjs start

# Executar uma tarefa autônoma diretamente no terminal
node bin/asclepio.mjs chat "Liste os arquivos da pasta e crie um resumo técnico"

# Diagnosticar o sistema e integridade das ferramentas
node bin/asclepio.mjs doctor

# Ver o status do Gateway e configurações
node bin/asclepio.mjs status

# Consultar memórias de longo prazo
node bin/asclepio.mjs memory list
```

---

## 🛠️ Arsenal de Ferramentas Nativas

O **Asclepio** já vem equipado de fábrica com as principais capacidades operacionais:

| Ferramenta | Descrição |
| :--- | :--- |
| `execute_command` | Executa comandos no terminal do sistema (PowerShell/Bash) com timeout e captura de stdout/stderr. |
| `read_file` | Lê arquivos no disco com suporte a slice de linhas. |
| `write_file` | Escreve ou sobrescreve arquivos, criando automaticamente pastas pai. |
| `edit_file` | Substituição cirúrgica de trechos de código em arquivos. |
| `list_directory` | Lista arquivos e diretórios detalhados no disco. |
| `repo_map` | Mapeamento inteligente de código e árvore limpa ignorando ruídos (node_modules, .git, caches). |
| `code_lint` | Validação estática de sintaxe instantânea (Node.js, Python py_compile, JSON) antes de executar. |
| `test_runner` | Auto-detecção e execução unificada de suítes de teste (npm test, pytest, dart test, cargo, go). |
| `git_checkpoint` | Salvaguarda atômica com checkpoints Git, diff unificado e rollback automático em caso de falha. |
| `web_search` | Pesquisa na web via DuckDuckGo. |
| `web_fetch` | Baixa páginas web e extrai texto limpo sem tags HTML. |
| `memory_save` | Salva fatos e aprendizados na memória SQLite de longo prazo. |
| `memory_search` | Recupera memórias salvas por busca textual ou categoria. |
| `system_info` | Retorna telemetria completa de hardware, memória RAM, CPUs e SO. |

---

## ⚙️ Configuração de Modelos e Chaves

As chaves de API podem ser configuradas de 4 formas simples:
1. **Via arquivo `.env` (Recomendado):**
   Copie `.env.example` para `.env` e preencha suas chaves:
   ```bash
   cp .env.example .env
   ```
2. **Pela Control UI:** Clique em **⚙️ Configurações** no topo direito do dashboard web e informe sua chave (NVIDIA NIM, Gemini, OpenAI, etc.).
3. **Por Variáveis de Ambiente:**
   ```powershell
   $env:NVIDIA_API_KEY="nvapi-..."
   $env:GEMINI_API_KEY="AIzaSy..."
   ```
4. **No arquivo `asclepio.config.json`:**
   ```json
   {
     "agent": {
       "provider": "nvidia",
       "model": "meta/llama-3.2-90b-vision-instruct"
     }
   }
   ```

---

## 🧪 Bateria de Testes Automatizada (100% PASS)

O **Asclepio v2.0** possui suíte abrangente de testes validando banco de dados, tools, APIs e regressões:

```bash
node test-suite.mjs
```

```
🧪 INICIANDO BATERIA DE TESTES DO LABORATÓRIO (ASCLEPIO)
✅ PASS: DB: createSession e getSession
✅ PASS: DB: saveMessage e getSessionMessages
✅ PASS: DB: saveMemory e searchMemory
✅ PASS: Tool: execute_command (sucesso)
✅ PASS: Tool: execute_command (erro de sintaxe ou comando inexistente)
✅ PASS: Tool: write_file e read_file
✅ PASS: Tool: edit_file
✅ PASS: Tool: list_directory
✅ PASS: Tool: system_info
✅ PASS: Tool: repo_map (varredura inteligente sem ruído)
✅ PASS: Tool: code_lint (sintaxe limpa vs sintaxe quebrada)
✅ PASS: Tool: test_runner (execução padronizada de testes)
✅ PASS: Tool: git_checkpoint (status e diff seguro)
✅ PASS: Regressão BUG-005: read_file em diretório sugere list_directory
✅ PASS: Regressão BUG-004: loadConfig respeita reload e detecção de mtime
✅ PASS: Gateway: REST API Endpoints
TOTAL DE TESTES: 16 | PASSOU: 16 | FALHOU: 0 (100% PASS)
```

---

## 📁 Estrutura do Projeto

```
asclepio/
├── bin/
│   └── asclepio.mjs          # Executável CLI principal
├── src/
│   ├── core/
│   │   ├── agent-loop.js     # Loop ReAct com auto-cura e streaming
│   │   ├── llm-provider.js   # Multi-provedor (NVIDIA NIM, Gemini, OpenAI, Claude, Ollama)
│   │   └── tool-registry.js  # Arsenal de 14 ferramentas nativas
│   ├── gateway/
│   │   └── server.js         # Servidor HTTP + SSE Gateway na porta 18888
│   ├── storage/
│   │   ├── config.js         # Gestão de configurações e chaves (.env zero-dependency)
│   │   └── db.js             # Banco SQLite nativo (node:sqlite)
│   └── ui/
│       └── index.html        # Dashboard Web responsivo com tema Dark Glass
├── skills/
│   ├── lab-agentes-testadores/ # Laboratório de Testes SWE-agent / Aider / MetaGPT
│   │   ├── SKILL.md          # Especificação e arquitetura de 3 barreiras
│   │   └── references/       # Prompts do Scanner, Reproductor, Resolver, Verifier
│   └── tradutor-editorial-livros/ # Skill oficial de tradução editorial
│       ├── SKILL.md          # Especificação e diretrizes da skill
│       ├── agente_tradutor.py # Motor multi-modelo com chunking e checkpoint
│       ├── traduzir_com_antigravity.py # Motor nativo com workers paralelos
│       └── TRADUZIR_COM_ANTIGRAVITY.bat
├── data/
│   └── asclepio.db           # Banco de dados persistente de sessões e memórias
├── test-suite.mjs            # Bateria oficial de testes de integração e regressão
├── INICIAR_ASCLEPIO.bat      # Inicializador de 1 clique
├── TESTAR_ASCLEPIO.bat       # Testador e diagnóstico de 1 clique
├── .env.example              # Modelo de variáveis de ambiente
└── package.json
```

---

## 📚 Skills Integradas de Fábrica

1. **`lab-agentes-testadores v2.0`**:
   - Inspirado nas melhores arquiteturas de ponta (**Aider, SWE-agent e MetaGPT**).
   - Protocolo das **3 Barreiras**: Linter de Sintaxe (`code_lint`), Script de Reprodução Determinístico (`repro_<id>`) e Anti-Regressão Global.
   - Salvaguarda com rollback atômico Git (`git_checkpoint`).

2. **`tradutor-editorial-livros`**:
   - Traduz livros inteiros (.epub, .pdf, .md) mantendo 100% da diagramação, formatação, sumário navegável (TOC) e imagens.
   - Motor assíncrono com workers paralelos e checkpoints contínuos sem perda de progresso.

---

⚡ **Desenvolvido com carinho para Marlon Ferreira.**
