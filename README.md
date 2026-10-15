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
| `web_search` | Pesquisa na web via DuckDuckGo. |
| `web_fetch` | Baixa páginas web e extrai texto limpo sem tags HTML. |
| `memory_save` | Salva fatos e aprendizados na memória SQLite de longo prazo. |
| `memory_search` | Recupera memórias salvas por busca textual ou categoria. |
| `system_info` | Retorna telemetria completa de hardware, memória RAM, CPUs e SO. |

---

## ⚙️ Configuração de Modelos e Chaves

As chaves de API podem ser configuradas de 3 formas:
1. **Pela Control UI:** Clique em **⚙️ Configurações** no topo direito do dashboard web e informe sua chave (Gemini, OpenAI, etc.).
2. **Por Variáveis de Ambiente:**
   ```powershell
   $env:GEMINI_API_KEY="sua_chave_aqui"
   $env:OPENAI_API_KEY="sua_chave_aqui"
   ```
3. **No arquivo `asclepio.config.json`:**
   ```json
   {
     "agent": {
       "provider": "gemini",
       "model": "gemini-2.5-flash"
     },
     "apiKeys": {
       "gemini": "AIzaSy..."
     }
   }
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
│   │   ├── llm-provider.js   # Multi-provedor (Gemini, OpenAI, Claude, Ollama)
│   │   └── tool-registry.js  # Arsenal de 10 ferramentas nativas
│   ├── gateway/
│   │   └── server.js         # Servidor HTTP + SSE Gateway na porta 18888
│   ├── storage/
│   │   ├── config.js         # Gestão de configurações e chaves
│   │   └── db.js             # Banco SQLite nativo (node:sqlite)
│   └── ui/
│       └── index.html        # Dashboard Web responsivo com tema Dark Glass
├── data/
│   └── asclepio.db           # Banco de dados persistente de sessões e memórias
├── INICIAR_ASCLEPIO.bat      # Inicializador de 1 clique
├── TESTAR_ASCLEPIO.bat       # Testador e diagnóstico de 1 clique
└── package.json
```

---

⚡ **Desenvolvido com carinho para Marlon Ferreira.**
