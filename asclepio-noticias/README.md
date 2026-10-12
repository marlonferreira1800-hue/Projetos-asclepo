# ⚡ Asclepio Notícias (Radar Global Web & Terminal)

Motor de coleta e inteligência de notícias em tempo real, bilíngue (**Português e Inglês**), com suporte a **Busca Mundial 360° com Tradução Automática**, cobertura do Brasil e do mundo todo, sem necessidade de chaves de API pagas.

---

## 🚀 Como Executar

### 1. Versão Web no Navegador (Porta 5050)
- Execute `python app.py` ou dê 2 cliques em `Iniciar_Asclepio_Noticias.bat`.
- Acesse no navegador: **`http://localhost:5050`**
- **Recursos:**
  - Dashboard dark mode com cards glassmorphism.
  - Categorias rápidas (Brasil, Mundo, Economia, Tecnologia & IA).
  - Busca Mundial 360° com tradução em tempo real.
  - Auto-refresh de breaking news.

### 2. Versão Terminal (CLI)
- Execute `python news.py` ou dê 2 cliques em `noticias.bat`.
- **Comandos úteis no terminal:**
  ```bash
  # Ver últimas notícias gerais
  python news.py

  # Ver notícias de tecnologia
  python news.py --categoria tecnologia

  # Fazer busca mundial com tradução
  python news.py --mundial "artificial intelligence"
  ```

---

## 🛠️ Arquitetura Técnica
- `app.py` — Servidor Flask da interface web (`http://localhost:5050`).
- `fetcher.py` — Motor RSS, busca bilíngue e tradução automática (Google Translate livre).
- `monitor.py` — Monitor contínuo de breaking news para terminal.
- `news.py` — Interface CLI interativa com formatação colorida via `Rich`.
- `ui.py` — Componentes visuais para terminal.
- `templates/index.html` — Frontend moderno responsivo dark mode.
