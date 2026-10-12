# 🏛️ Projetos Asclepio | Marlon Ferreira

Repositório central de ferramentas e projetos do ecossistema **Asclepio**, integrando inteligência artificial, telemetria em tempo real e monitoramento global de informações.

---

## 📂 Projetos Incluídos

### 1. ⚡ [Asclepio Notícias](./) (Web & Terminal)
Um agregador e buscador de notícias em tempo real, bilíngue (**Português e Inglês**), com suporte a **Busca Mundial 360° com Tradução Automática**, cobertura do Brasil e do mundo todo, sem necessidade de chaves de API pagas.

* **🌐 Versão Web no Navegador:**
  - Execute `python app.py` ou dê 2 cliques em `Iniciar_Asclepio_Noticias.bat`.
  - Acesse em `http://localhost:5050`.
  - Dashboard dark mode com cards glassmorphism, busca mundial 360°, categorias rápidas e auto-refresh ao vivo.
* **💻 Versão Terminal (CLI):**
  - Execute `python news.py` ou dê 2 cliques em `noticias.bat`.
  - Suporta busca direta (`python news.py --mundial "termo"`), filtros rápidos e monitor contínuo de breaking news.

---

### 2. 🪙 [Calculadora de Tokens Gemini Pro](./calculadora-tokens-gemini/) (Web & CLI)
Sistema de telemetria e rastreamento de consumo de tokens em tempo real para sessões do Antigravity e Gemini CLI, com equivalência de custos oficiais da Google AI Developers.

* **🌐 Studio Web:**
  - Execute `python calculadora-tokens-gemini/app.py` ou acesse `iniciar.bat`.
  - Acesse em `http://127.0.0.1:8765/`.
  - Gráficos turno-a-turno de Input, Cache e Output, uso de memória de contexto e estimativa financeira.
* **🟢 Barra de Contexto Ao Vivo no Terminal:**
  - Execute `python calculadora-tokens-gemini/scripts/live_bar.py`.
  - Exibe barra animada com porcentagem de contexto ativo, memória em uso e cache hit.
* **📊 Tabela OpenCode CLI:**
  - Execute `python calculadora-tokens-gemini/scripts/opencode_stats.py`.

---

### 3. 📰 [Redação Virtual Decifrando Dados 2D](./redacao-virtual/) (Web RPG & Estúdio de IA)
Painel interativo estilo RPG 16-bit / pixel art top-down que simula e executa a produção real da newsletter oficial **Decifrando Dados** (por **Marlon Ferreira**) no padrão milimétrico **The BRIEF** (*"Smart people are cooler"*).

* **🧠 Motor de IA Superpotente:**
  - Conectado à supercomputação da **NVIDIA NIM** com o modelo **Nemotron-3 Ultra (550 Bilhões de parâmetros)** e fallback para **Gemma 4 31B** ou **Gemini Pro**.
* **🌐 Mineração Factual ao Vivo:**
  - O Agente Curador integra-se ao **Asclepio Notícias** (`fetcher.py`) para puxar manchetes e possui scraper web (`BeautifulSoup`) para ler URLs e notícias reais da internet.
* **♨️ O Forno (Compilação Automática):**
  - Compila automaticamente o PDF editorial de alta resolução via Microsoft Edge headless em `C:\Users\marlo\Downloads\dados25`.
  - Gera HTML responsivo e injeta o artigo formatado diretamente na Área de Transferência do Windows (`Ctrl + V` pronto para o LinkedIn).
* **🌐 Como Executar:**
  - Execute `python redacao-virtual/server.py 8080` ou dê 2 cliques em `redacao-virtual/iniciar_redacao.bat`.
  - Acesse em `http://localhost:8080`.

---

## 📦 Instalação Geral

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/marlonferreira1800-hue/Projetos-asclepo.git
cd Projetos-asclepo
pip install -r requirements.txt
```

---

## 🛠️ Tecnologias
- **Linguagem:** Python 3 (Flask, aiohttp, WebSockets assíncronos)
- **Frontend & Gráficos:** HTML5 Canvas 2D (60 FPS pixel-art), Tailwind CSS, Lucide Icons
- **Inteligência Artificial:** NVIDIA NIM API (Nemotron-3 Ultra 550B), Google Gemini API
- **Web Scraping & Feeds:** BeautifulSoup4, Feedparser (RSS), Google News 360°
- **Terminal UI:** Rich, ANSI escape sequences
- **Diagramação:** Microsoft Edge Headless (impressão PDF de alta fidelidade)
