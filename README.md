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

## 📦 Instalação Geral

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/marlonferreira1800-hue/Projetos-asclepo.git
cd Projetos-asclepo
pip install -r requirements.txt
```

---

## 🛠️ Tecnologias
- **Linguagem:** Python 3
- **Frameworks Web:** Flask, Tailwind CSS, Lucide Icons
- **Terminal UI:** Rich, ANSI escape sequences
- **Engenharia de Dados:** RSS feeds, JSONL parser, Google Translate API livre
