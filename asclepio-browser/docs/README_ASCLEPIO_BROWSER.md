# 🚀 Asclepio Browser Engine (Padrão Polar Browser & Manus AI)
### *Arquitetura Autônoma em 3 Colunas (Split-Canvas) com Controle Físico de Navegador*

---

## 🎯 O que é o Asclepio Browser Engine?

O **Asclepio Browser Engine** é um sistema completo de navegação web autônoma construído por **engenharia reversa do Polar Browser e da Manus AI**. Ele substitui scrapers e bots frágeis por um ecossistema com **emulação física de hardware, sincronização de estado com Virtual DOM e prova visual de ações por thumbnails**.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡]  [• Asclepio Autonomous Agent ×]  [+]                                      [AS] [─] [□] [✕]      │
├──────────────────────┬────────────────────────────────────────────┬────────────────────────────────────┤
│ 🔍 ◫                 │ [Share]                                [◫] │ [▶ Live Session                 ×] │
│ [+ New task]         ├────────────────────────────────────────────┼────────────────────────────────────┤
│                      │                                            │ [<] [>] [↻] [🔒 https://...       ]│
│  Workflows          │   [User: abra o youtube toque a musica... ]│                                    │
│ ⊞ Templates          │                                            │                                    │
│ ⚙ Customize          │   > 2 steps                                │          CANVAS WEBVIEW            │
│                      │   Thought for 1s                           │           DO CHROMIUM              │
│ PROJECTS             │   [Navigating https://...] [🖼️ Thumbnail]  │                                    │
│ No projects          │   Vou abrir o YouTube e buscar a música... │        (STREAM EM TEMPO REAL)      │
│                      │                                            │                                    │
│ RECENTS              │   [Playing Video]          [🖼️ Thumbnail]  │                                    │
│ • Live Agent (Ativo) │   Tocando The Lazy Song no YouTube         │         ↖ [Tocando Vídeo]          │
│ • Hacker News AI     │                                            │           (Ghost Cursor Tooltip)   │
│ • YouTube Tubarões   ├────────────────────────────────────────────┤                                    │
│                      │ ┌────────────────────────────────────────┐ │                                    │
│ GET STARTED          │ │ Descreva a tarefa do navegador...      │ │                                    │
│ ✔ Zero Ghost Clicks  │ │ [+] [Medium ▾]           [🎙️] [↑ Send] │ │                                    │
│ ✔ Virtual DOM Sync   │ └────────────────────────────────────────┘ │                                    │
└──────────────────────┴────────────────────────────────────────────┴────────────────────────────────────┘
  COLUNA 1: SIDEBAR      COLUNA 2: AGENT CONVERSATION CANVAS          COLUNA 3: EMBEDDED REAL BROWSER
    (Navegação & Recents)      (Pensamento, Ações e Prompt)             (Webview + Tooltip de Ação)
```

---

## 🧠 Os 4 Pilares Implementados no Motor

1. **Snapshot Híbrido A11y (W3C Accessible Tree):**
   - Extrai nós interativos sem poluição de classes CSS ofuscadas geradas por Tailwind ou Emotion.
2. **Protocolo Anti-Ghost Click em 4 Fases:**
   - `scroll_into_view_if_needed` $\to$ `Layout Settling` (aguarda repouso físico $\le 1\text{px}$) $\to$ `Hover Pre-Flight` $\to$ `Clique com Hit-Test`.
3. **Sincronização Atômica de Virtual DOM (React / Vue):**
   - Usa `nativeInputValueSetter.call(input, value)` e despacha eventos `input` e `change` com borbulhamento para nunca mais perder dados em inputs controlados.
4. **Action Cards com Miniaturas Visuais (Action Proof Thumbnails):**
   - O backend recorta automaticamente a área da tela onde o agente interagiu e anexa uma miniatura base64 ao card de ação no chat.

---

## ⚡ Como Rodar o Sistema

Basta executar o script de inicialização de 1 clique:

```powershell
python start_asclepio.py
```

O script irá:
1. Subir o servidor FastAPI + WebSockets em `http://127.0.0.1:8000`.
2. Inicializar o motor Chromium do Playwright em background.
3. Abrir automaticamente a interface Split-Canvas no seu navegador padrão.

---

## 📁 Estrutura dos Arquivos em `Arquitetura asclepio/`

| Arquivo | Descrição |
| :--- | :--- |
| `asclepio_engine.py` | Backend assíncrono em FastAPI + WebSockets com CDP, A11y e captura de frames. |
| `asclepio_browser_app.html` | Frontend reativo Split-Canvas (Tailwind + WebSockets + Ghost Cursor). |
| `start_asclepio.py` | Launcher de 1 clique para iniciar o sistema e abrir no browser. |
| `Guia_Construcao_Navegador_IA_Polar.md` | Dossiê arquitetural detalhado com diagramas e padrões Electron + CDP. |
| `explore_polar.py` / `live_test_polar.py` | Scripts de testes ao vivo no Polar Browser instalado no sistema. |
