# 🏛️ Projetos Asclepio | Marlon Ferreira

Repositório central do ecossistema **Asclepio**, integrando **inteligência artificial corporativa**, **telemetria financeira em tempo real** e **monitoramento global de informações**.

---

## 🧭 Mapa Rápido dos Projetos

| Projeto | Diretório | Acesso Web | Modo CLI / Terminal | Descrição & Motor |
| :--- | :--- | :--- | :--- | :--- |
| **1. ⚡ Asclepio Notícias** | [`asclepio-noticias/`](./asclepio-noticias/) | `http://localhost:5050` | `python news.py` | Radar global de notícias em tempo real, bilíngue (PT/EN), Busca 360° e tradução automática livre. |
| **2. 🪙 Calculadora de Tokens Gemini** | [`calculadora-tokens-gemini/`](./calculadora-tokens-gemini/) | `http://localhost:8765` | `python scripts/live_bar.py` | Telemetria em tempo real de tokens consumidos, custos oficiais Google AI e barra visual no terminal. |
| **3. 📰 Redação Virtual Decifrando Dados** | [`redacao-virtual/`](./redacao-virtual/) | `http://localhost:8080` | `python server.py 8080` | Painel RPG 2D Canvas de agentes autônomos com IA **NVIDIA 550B**, scraper web ao vivo e compilação de PDF para o LinkedIn. |

---

## ⚡ Inicialização Rápida (1 Clique)

Na raiz do repositório, você encontra scripts prontos para rodar no Windows:

- **[`HUB_ASCLEPIO.bat`](./HUB_ASCLEPIO.bat)** — **Menu Central Interativo:** escolha qual projeto abrir (1, 2, 3 ou todos juntos).
- **[`1_iniciar_noticias.bat`](./1_iniciar_noticias.bat)** — Abre diretamente o **Asclepio Notícias** (`:5050`).
- **[`2_iniciar_calculadora.bat`](./2_iniciar_calculadora.bat)** — Abre a **Calculadora de Tokens Gemini** (`:8765`).
- **[`3_iniciar_redacao.bat`](./3_iniciar_redacao.bat)** — Abre a **Redação Virtual Decifrando Dados** (`:8080`).

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

## 📦 Instalação & Dependências

Clone o repositório e instale todos os pacotes necessários:

```bash
git clone https://github.com/marlonferreira1800-hue/Projetos-asclepo.git
cd Projetos-asclepo
pip install -r requirements.txt
```

---

## 🛠️ Stack Tecnológica Consolidada
- **Backends:** Python 3 (Flask, aiohttp assíncrono, WebSockets full-duplex)
- **Frontends:** HTML5 Canvas 2D (60 FPS pixel-art RPG), Tailwind CSS, Lucide Icons, Glassmorphism
- **Inteligência Artificial:** NVIDIA NIM API (Nemotron 550B), Google Gemini API
- **Engenharia de Dados:** BeautifulSoup4, Feedparser (RSS), Google News 360°, JSONL Parser
- **Terminal UI:** Rich CLI, ANSI Escape Codes, scripts batch com suporte a UTF-8
- **Diagramação Editorial:** Microsoft Edge Headless (PDF de alta resolução)
