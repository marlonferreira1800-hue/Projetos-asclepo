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
| **6. 📚 Tradutor Editorial de Livros & Acervo** | [`tradutor-editorial-livros/`](./tradutor-editorial-livros/) e [`livros_traduzidos/`](./livros_traduzidos/) | CLI / Terminal | `python traduzir_com_antigravity.py` | Motor editorial com IA nativa da assinatura Gemini (Antigravity), preservação de 100% de imagens, formatação e sumário (TOC) em livros de 300+ páginas. |

---

## ⚡ Inicialização Rápida (1 Clique)

Na raiz do repositório, você encontra scripts prontos para rodar no Windows:

- **[`HUB_ASCLEPIO.bat`](./HUB_ASCLEPIO.bat)** — **Menu Central Interativo:** escolha qual projeto abrir (1 a 6 ou todos juntos).
- **[`1_iniciar_noticias.bat`](./1_iniciar_noticias.bat)** — Abre diretamente o **Asclepio Notícias** (`:5050`).
- **[`2_iniciar_calculadora.bat`](./2_iniciar_calculadora.bat)** — Abre a **Calculadora de Tokens Gemini** (`:8765`).
- **[`3_iniciar_redacao.bat`](./3_iniciar_redacao.bat)** — Abre a **Redação Virtual Decifrando Dados** (`:8080`).
- **[`4_iniciar_navegador.bat`](./4_iniciar_navegador.bat)** — Abre o **Asclepio Navegador Autônomo** (Electron Desktop).
- **[`5_iniciar_agente_autonomo.bat`](./5_iniciar_agente_autonomo.bat)** — Abre o **Asclepio Agente Autônomo & Gateway** (`:18888`).
- **[`6_iniciar_tradutor.bat`](./6_iniciar_tradutor.bat)** — Abre o **Tradutor Editorial de Livros & Acervo de E-books**.

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

### 4. 🌐 [Asclepio Browser / Navegador Autônomo](./asclepio-browser/) (ou [asclepio-navegador](./asclepio-navegador/))
* **🖥️ Desktop App:** Execute `4_iniciar_navegador.bat`, `abrir_asclepio.bat` ou rode `npm run dev` / `npm start`.
* **Recursos:**
  - **Arquitetura Split-Canvas Moderna:** React 18 + Vite + TypeScript + Tailwind CSS inspirada no Polar Browser / Manus Studio com 3 colunas independentes (Sidebar, Agent Canvas e Browser Webview).
  - **Pool de IA da NVIDIA Integrate (Multi-Modelo):** Suporte nativo e seleção manual no painel `Settings` com ultra-baixa latência (~1s): `meta/llama-3.2-11b-vision-instruct`, `google/gemma-4-31b-it`, `deepseek-ai/deepseek-r1`, `qwen/qwen2.5-72b` e entrada para qualquer modelo customizado.
  - **Gerenciamento Manual de Chaves de API:** Painel visual com campo aberto para inserir, ocultar/exibir e salvar qualquer chave da NVIDIA (`nvapi-...`) em tempo real.
  - **Automação Web via Chrome DevTools Protocol (CDP):** Controle de acessibilidade semântica, cliques físicos por coordenadas reais, rolagem e digitação com eventos de teclado completos.
  - **Roteamento Inteligente e Auto-Play YouTube/Google:** Reconhece buscas complexas com tolerância a digitação, pula direto para resultados e reproduz vídeos automaticamente.
  - **Cursor Fantasma com Feedback Visual:** Tooltips dinâmicos e sincronização de áudio em tempo real (`media-started-playing`).

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

### 6. 📚 [Tradutor Editorial de Livros & Acervo de E-books](./tradutor-editorial-livros/)
* **💻 Execução em 1 Clique:** Execute `6_iniciar_tradutor.bat` ou entre na pasta e rode `TRADUZIR_COM_ANTIGRAVITY.bat`.
* **📁 Acervo de Obras Traduzidas:** Diretório [`livros_traduzidos/`](./livros_traduzidos/).
* **Recursos:**
  - **Motor de Assinatura Gemini (Antigravity CLI):** Utiliza diretamente o executável `agy.exe` local da sua assinatura, permitindo traduzir livros inteiros de 300+ páginas com **zero custo adicional de API** e sem travar em limites de cota gratuita (429).
  - **Preservação Estrutural de 100% do DOM:** Mantém todas as imagens médicas, esquemas, tabelas e estilos CSS dos arquivos `.epub`.
  - **Tradução Automática de Sumário (TOC):** Converte a árvore de navegação formal (NCX e Nav) para Português do Brasil (Capa, Folha de Rosto, Capítulos 1 a 13, Agradecimentos, Notas, etc.).
  - **Loop Concorrente com Checkpoint Atômico:** Executa com múltiplos *workers* paralelos e grava cada bloco traduzido instantaneamente no disco, com recuperação automática em caso de interrupção.
  - **📕 Obra Destaque 100% Concluída:** *Deep Medicine: How Artificial Intelligence Can Make Healthcare Human Again* (Eric Topol, MD) em `.epub` (~14.45 MB) pronto para Kindle, Apple Books e celulares.
  - **Memória Técnica Oficial:** Consulte o [Relatório Técnico de Execução de Deep Medicine](./livros_traduzidos/RELATORIO_TECNICO_DEEP_MEDICINE.md).

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
