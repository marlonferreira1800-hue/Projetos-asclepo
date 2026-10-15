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

4. **Roteamento Inteligente com Fallback Simultâneo (<1s de Latência):**
   - **Modelo Primário Ativo:** OpenAI GPT-4o Mini (estabilidade máxima, tempo de resposta inferior a 1 segundo para comandos de navegação).
   - **Fallback 1:** OpenRouter GPT-4o Mini (roteamento distribuído multi-provedor).
   - **Fallback 2:** Google Gemini 2.5 Flash (contexto estendido de 1M tokens).
   - **Fallback 3:** Motor Local Antigravity CLI (`agy`) offline.

5. **Comandos de Voz com Whisper IA & Síntese Falada (TTS):**
   - **Transcrição de Alta Precisão:** Reconhecimento de voz em tempo real através do OpenAI Whisper (`whisper-1`) em português brasileiro, com fallback para Gemini Multimodal.
   - **Resposta Falada:** O agente responde falado com voz natural em português sempre que um comando for emitido por áudio.
   - **Digitação Visual no Prompt:** O comando reconhecido aparece instantaneamente no input antes da execução.

6. **Arsenal de 20 Ações de Navegação e Multimídia:**
   - **YouTube Auto-Play & Desmute Inteligente:** Busca direta, clique automático no primeiro resultado com até 15 tentativas dinâmicas, desmute forçado (`muted = false`), ajuste de volume e auto-pular anúncios (`skipAd`).
   - **Auto-Dismiss de Consentimento:** Fecha e aceita automaticamente janelas de cookies do Google/YouTube ao carregar páginas.
   - **Adblocker Nativo Otimizado:** Bloqueio de anúncios em rede (`NetworkFilters`) preservando compatibilidade com o TrustedScript CSP do YouTube.
   - **Controle Total:** `setVolume(0-100)`, `changeVolume(delta)`, `toggleMute()`, `toggleFullscreen()`, `setPlaybackSpeed()`, `seek()`, `skipAd()`.
   - **Gerenciamento de Abas:** `newTab()`, `closeActiveTab()`, `reload()`, `goBack()`, `goForward()`.
   - **Síntese do DOM:** Extração contextual da página para raciocínio contínuo da IA.

7. **Command Palette (`Ctrl + K`):**
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
