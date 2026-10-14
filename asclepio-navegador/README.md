# 🌐 Asclepio Browser — Navegador Autônomo com IA (Clonagem Polar Browser)

> **Asclepio Browser** é um navegador inteligente com agente de IA totalmente autônomo, construído através de engenharia reversa minuciosa da arquitetura do **Polar Browser**. Opera com Chromium Multi-Abas, design **Polar White**, aura visual luminosa nas bordas e motor de IA com fallback simultâneo multimodelo.

---

## 🌟 Principais Recursos

1. **Agente Autônomo com Modo Executivo Direto:**
   - Traduz intenções em linguagem natural diretamente em comandos Chromium de navegação, cliques e digitação.
   - Navegação universal para mais de 25 portais e web apps: YouTube, LinkedIn, Facebook, Excel Web (`excel.new`), Google Sheets, Gmail, Notion, Canva, etc.
   - Algoritmo de clique inteligente (`smartClick`) que localiza botões, links e campos interativos via síntese do DOM.

2. **Aura Viewport Luminosa (Feedback Visual Sem Piscar a Tela):**
   - Borda iluminada em azul ciano (`#01BAEF`) com animação pulsante suave que envolve o viewport enquanto o agente opera.
   - Badge flutuante centralizado exibindo o status da ação em tempo real sem causar flickering ou recarregamentos indesejados.

3. **Design Polar White Oficial:**
   - Paleta de cores oficial: Canvas Porcelana (`#F8F6F5`), Superfícies Pure White (`#FFFFFF`), Linhas de Borda (`#E8E8E6`), Texto Dark Slate (`#252423`) e Tipografia Manrope.
   - Botão de alternância **Sol / Lua** no menu lateral para trocar dinamicamente entre Polar White e Dark Mode, com persistência no `localStorage`.

4. **Roteamento Inteligente com Fallback Simultâneo:**
   - **Modelo Primário:** Google Gemini 2.5 Flash (ultra-rápido, cota ampla).
   - **Fallback 1:** OpenAI GPT-4o-mini (acionado instantaneamente se o Gemini esgotar tokens).
   - **Fallback 2:** OpenRouter (acesso a modelos Claude, Mistral, Llama).
   - **Fallback 3:** Motor Local Antigravity CLI (`agy`).

5. **Arsenal de 20 Ações de Navegação e Multimídia:**
   - Controle total do player de vídeo: `setVolume(0-100)`, `changeVolume(delta)`, `toggleMute()`, `toggleFullscreen()`, `setPlaybackSpeed()`, `seek()`, `skipAd()`.
   - Gerenciamento de abas e fluxo: `newTab()`, `closeActiveTab()`, `reload()`, `goBack()`, `goForward()`.
   - Síntese do DOM e extração contextual para raciocínio contínuo da IA.

6. **Command Palette (`Ctrl + K`):**
   - Barra estilo Spotlight para comandos rápidos, busca, navegação e comandos diretos para o agente.

---

## 🚀 Como Executar

### Pré-requisitos
- Node.js (v18+)
- npm

### Passo a Passo
1. No diretório do projeto, configure suas chaves de API:
   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas chaves (Google Gemini, OpenAI, etc.)
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Inicie o navegador:
   ```bash
   npm start
   ```

*No Windows, você também pode abrir com 1 clique usando o executável `Asclepio.exe`.*

---

## 📁 Estrutura de Arquivos

```
asclepio-navegador/
├── package.json          # Metadados e scripts de execução
├── main.js               # Host Electron (IPC seguro, ciclo de vida e janelas)
├── preload.js            # Ponte de isolamento (__asclepioHost)
├── index.html            # Shell visual do navegador com suporte a temas
├── asclepio.ico          # Ícone oficial de alta definição
├── launcher.cs           # Código-fonte do inicializador silencioso em C#
├── Asclepio.exe          # Executável compilado para inicialização nativa
├── DOCUMENTACAO_ARQUITETURA_POLAR_E_ASCLEPIO.md # Blueprint da engenharia reversa
└── src/
    ├── css/
    │   └── style.css     # Design tokens Polar White, Dark Mode e animação da Aura
    ├── fonts/
    │   ├── Manrope.ttf   # Tipografia oficial do Polar
    │   └── polar-logo.png # Logotipo do navegador
    └── js/
        ├── agent.js            # Núcleo do agente autônomo e analisador de intenções
        ├── ai-router.js        # Motor de roteamento multimodelo com fallback simultâneo
        ├── browser-controller.js # Controlador de Chromium, automação de DOM e mídia
        ├── browser.js          # Gerenciamento de abas, Omnibar e alternância de temas
        ├── agent-cursor.js     # Efeitos táteis de cursor e clique
        └── command-palette.js  # Menu de comando rápido (Ctrl+K)
```
