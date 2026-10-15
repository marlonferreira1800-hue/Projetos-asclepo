# 🏛️ Projetos Asclepio | Marlon Ferreira

Repositório central do ecossistema **Asclepio**, integrando **inteligência artificial corporativa**, **telemetria financeira em tempo real**, **monitoramento global de informações** e **navegação autônoma na web**.

---

## 🧭 Mapa Rápido dos Projetos

| Projeto | Diretório | Acesso | Modo CLI / Terminal | Descrição & Motor |
| :--- | :--- | :--- | :--- | :--- |
| **1. ⚡ Asclepio Notícias** | [`asclepio-noticias/`](./asclepio-noticias/) | `http://localhost:5050` | `python news.py` | Radar global de notícias em tempo real, bilíngue (PT/EN), Busca 360° e tradução automática livre. |
| **2. 🪙 Calculadora de Tokens Gemini** | [`calculadora-tokens-gemini/`](./calculadora-tokens-gemini/) | `http://localhost:8765` | `python scripts/live_bar.py` | Telemetria em tempo real de tokens consumidos, custos oficiais Google AI e barra visual no terminal. |
| **3. 📰 Redação Virtual Decifrando Dados** | [`redacao-virtual/`](./redacao-virtual/) | `http://localhost:8080` | `python server.py 8080` | Painel RPG 2D Canvas de agentes autônomos com IA **NVIDIA 550B**, scraper web ao vivo e compilação de PDF para o LinkedIn. |
| **4. 🌐 Asclepio Navegador Autônomo** | [`asclepio-navegador/`](./asclepio-navegador/) | Desktop App (Electron) | `npm start` | Navegador inteligente com agente autônomo, engenharia reversa do Polar Browser, aura azul e fallback multimodelo. |
| **5. ⚡ Asclepio Agente Autônomo & Gateway** | [`asclepio-agente-autonomo/`](./asclepio-agente-autonomo/) | `http://localhost:18888` | `node bin/asclepio.mjs chat` | Agente de IA ReAct autônomo com auto-cura, engenharia reversa do OpenClaw, 10 ferramentas nativas e NVIDIA NIM. |

---

## ⚡ Inicialização Rápida (1 Clique)

Na raiz do repositório, você encontra scripts prontos para rodar no Windows:

- **[`HUB_ASCLEPIO.bat`](./HUB_ASCLEPIO.bat)** — **Menu Central Interativo:** escolha qual projeto abrir (1 a 5 ou todos juntos).
- **[`1_iniciar_noticias.bat`](./1_iniciar_noticias.bat)** — Abre diretamente o **Asclepio Notícias** (`:5050`).
- **[`2_iniciar_calculadora.bat`](./2_iniciar_calculadora.bat)** — Abre a **Calculadora de Tokens Gemini** (`:8765`).
- **[`3_iniciar_redacao.bat`](./3_iniciar_redacao.bat)** — Abre a **Redação Virtual Decifrando Dados** (`:8080`).
- **[`4_iniciar_navegador.bat`](./4_iniciar_navegador.bat)** — Abre o **Asclepio Navegador Autônomo** (Electron Desktop).
- **[`5_iniciar_agente_autonomo.bat`](./5_iniciar_agente_autonomo.bat)** — Abre o **Asclepio Agente Autônomo & Gateway** (`:18888`).

---

## 📂 Detalhamento dos Projetos

### 1. ⚡ [Asclepio Notícias](./asclepio-noticias/)
* **🌐 Web:** Execute `1_iniciar_noticias.bat` ou acesse `http://localhost:5050`.
* **💻 Terminal:** Execute `noticias.bat` ou `python asclepio-noticias/news.py`.
* **Recursos:**
  - RSS feeds categorizados (Brasil, Mundo, Economia, Tecnologia & IA).
  - Busca Mundial 360° com tradução em tempo real.
  - Integração nativa como provedor de dados para a Redação Virtual.

---

### 2. 🪙 [Calculadora de Tokens Gemini Pro](./calculadora-tokens-gemini/)
* **🌐 Web Studio:** Execute `2_iniciar_calculadora.bat` ou acesse `http://localhost:8765`.
* **💻 Barra ao Vivo no Terminal:** `python calculadora-tokens-gemini/scripts/live_bar.py`.
* **Recursos:**
  - Monitoramento contínuo de tokens de Input, Output e Contexto de Cache.
  - Equivalência financeira em dólares e reais (tabela oficial Google AI).
  - Tabela OpenCode CLI e rastreador automático.

---

### 3. 📰 [Redação Virtual Decifrando Dados 2D](./redacao-virtual/)
* **🌐 Web Studio:** Execute `3_iniciar_redacao.bat` ou acesse `http://localhost:8080`.
* **Recursos:**
  - **Motor Neuronal 550B:** Conectado à supercomputação da **NVIDIA NIM** (`nvidia/nemotron-3-ultra-550b-a55b`) com fallback para **Gemma 4 31B** ou **Gemini Pro**.
  - **Mineração Factual ao Vivo:** O Agente Curador acessa a internet (`BeautifulSoup`) e o `fetcher.py` do Asclepio Notícias para embasar a matéria em fatos reais.
  - **O Forno (Compilação Automática):** Compila PDF diagramado via Microsoft Edge headless em `C:\Users\marlo\Downloads\dados25` e copia o texto do artigo do LinkedIn para o Clipboard (`Ctrl + V`).

---

### 4. 🌐 [Asclepio Navegador Autônomo](./asclepio-navegador/)
* **🖥️ Desktop App:** Execute `4_iniciar_navegador.bat` ou acesse a pasta e rode `npm start`.
* **Recursos:**
  - **Clonagem Arquitetural do Polar Browser:** Navegação baseada em Chromium (`webviewTag`) com isolamento seguro IPC via `preload.js`.
  - **Modo Executivo Direto:** O agente não apenas conversa, mas navega, pesquisa, clica e digita em tempo real.
  - **Aura Viewport Luminosa:** Moldura azul/ciano suave nas margens da tela indicando operação do agente sem piscar a página.
  - **Estética Polar White Padrão:** Design em porcelana `#F8F6F5` e branco puro com alternador instantâneo para Dark Mode.
  - **Roteamento com Fallback Simultâneo:** Alternância sem atrito entre Google Gemini 2.5 Flash, OpenAI GPT-4o-mini, OpenRouter e Antigravity CLI.
  - **Navegação Universal:** Suporte a mais de 25 portais e serviços (YouTube, LinkedIn, Facebook, Excel Web, Google Sheets, Gmail, etc.).

---

### 5. ⚡ [Asclepio Agente Autônomo & Gateway Platform](./asclepio-agente-autonomo/)
* **🌐 Web Control UI:** Execute `5_iniciar_agente_autonomo.bat` ou acesse `http://localhost:18888`.
* **💻 Modo Chat no Terminal:** `node asclepio-agente-autonomo/bin/asclepio.mjs chat` ou execute `asclepio-agente-autonomo/CHAT_TERMINAL_ASCLEPIO.bat`.
* **Recursos:**
  - **Engenharia Reversa do OpenClaw:** Arquitetura autônoma com Gateway RPC full-duplex, painel Dark Glass moderno e streaming de Server-Sent Events (SSE).
  - **Loop ReAct com Auto-Cura:** Agente autônomo com reflexão em múltiplos turnos que executa comandos, diagnostica tracebacks e corrige erros por conta própria.
  - **Cascata Inteligente NVIDIA NIM (Sticky Fallback):** Começa automaticamente pelo modelo mais forte (`meta/llama-3.2-90b-vision-instruct`) e alterna sem interrupção para o ultrarrápido (`meta/llama-3.2-11b-vision-instruct`) ou `gemini-2.5-flash`.
  - **10 Ferramentas Nativas:** `execute_command`, `read_file`, `write_file`, `edit_file`, `list_directory`, `web_search`, `web_fetch`, `memory_save`, `memory_search`, `system_info`.
  - **Banco de Dados SQLite Nativo:** Histórico de sessões, mensagens e memória semântica indexada localmente via `node:sqlite`.

---

## 📦 Instalação & Dependências

Clone o repositório e instale todos os pacotes necessários:

```bash
git clone https://github.com/marlonferreira1800-hue/Projetos-asclepo.git
cd Projetos-asclepo

# 1. Dependências Python (Notícias, Calculadora, Redação)
pip install -r requirements.txt

# 2. Dependências do Navegador (Node.js / Electron)
cd asclepio-navegador
npm install
cd ..
```

---

## 🛠️ Stack Tecnológica Consolidada
- **Backends:** Python 3 (Flask, aiohttp assíncrono, WebSockets full-duplex) & Node.js / Electron
- **Frontends:** HTML5 Canvas 2D (60 FPS pixel-art RPG), Tailwind CSS, Lucide Icons, Glassmorphism & Polar White Design System
- **Inteligência Artificial:** NVIDIA NIM API (Nemotron 550B), Google Gemini 2.5 Flash, OpenAI GPT-4o-mini, OpenRouter & Antigravity
- **Engenharia de Dados & Automação:** DOM Synthesizer, BeautifulSoup4, Feedparser (RSS), Google News 360°, JSONL Parser
- **Terminal UI & Desktop:** Rich CLI, ANSI Escape Codes, scripts batch com suporte a UTF-8 e launcher nativo em C#
- **Diagramação Editorial:** Microsoft Edge Headless (PDF de alta resolução)
