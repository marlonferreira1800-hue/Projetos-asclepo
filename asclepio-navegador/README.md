# 🚀 Asclepio Browser

Navegador de IA com Arquitetura de 3 Colunas (*Split-Canvas*) inspirada no **Polar Browser**, desenvolvido com **Electron**, **React**, **TypeScript**, **Tailwind CSS** e controle via **Chrome DevTools Protocol (CDP)**.

---

## 🏛️ Arquitetura das 3 Colunas

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡]  [• Play Jogado aos Tubarões... ×]  [⚙ Settings]  [+]              [N1] [─] [□] [✕] │
├──────────────────────┬──────────────────────────────────┬──────────────────────────────┤
│ 🔍 ◫                 │ [Share]                      [◫] │ [▶ Bruno Mars... 🔊 ×]   [+] │
│ [+ New task]         ├──────────────────────────────────┼──────────────────────────────┤
│                      │                                  │ [<] [>] [↻] [🔒 youtube...]  │
│  Workflows          │   User: toque the lazy           │                              │
│ ⊞ Templates          │                                  │      CANVAS DO NAVEGADOR     │
│ ⚙ Customize          │   Bruno Mars, "The Lazy Song".   │      (Webview Chromium)      │
│                      │   [Navigating https://...]       │                              │
│ RECENTS              │   [Aguardando resultados 🎬]     │   🐵 🕶️ 🍌                   │
│ • Tubarões (Ativo)   │   [Tocando The Lazy Song ●]      │   Bruno Mars - The Lazy Song │
│ • Justin Bieber      │                                  │                              │
│ • LinkedIn Login     │ ┌──────────────────────────────┐ │       ↖ [Tocando Música]     │
│                      │ │ Send a follow up...          │ │         (Cursor Tooltip)     │
│ GET STARTED          │ │ [+] [Medium ▾]     [🎙️] [↑] │ │                              │
│ ✔ Run first task     │ └──────────────────────────────┘ │                              │
└──────────────────────┴──────────────────────────────────┴──────────────────────────────┘
```

---

## 📦 Como Instalar e Executar

1. **Instale as dependências:**
   ```bash
   cd asclepio-browser
   npm install
   ```

2. **Inicie em modo de desenvolvimento (Hot Reload):**
   ```bash
   npm run dev
   ```

3. **Gere o executável de produção:**
   ```bash
   npm run build
   ```

---

## 🧩 Estrutura do Código

- `src/main/index.ts`: Processo principal do Electron, porta remota 9222 do Chromium, ponte CDP e despacho de cliques físicos.
- `src/preload/index.ts`: Context bridge seguro expondo as APIs do navegador para a UI React.
- `src/renderer/src/`:
  - `components/AppHeader.tsx`: Abas de tarefa, avatar e controles da janela.
  - `components/Sidebar.tsx`: Coluna 1 — New task, workflows, recents e checklist.
  - `components/AgentCanvas.tsx`: Coluna 2 — Histórico de conversa, pensamentos da IA e cards de ação.
  - `components/BrowserPane.tsx`: Coluna 3 — Webview Chromium e cursor fantasma com tooltip dinâmico.
  - `components/EffortPopover.tsx`: Popover do slider de esforço (Low, Medium, High, Max).
  - `store.ts`: Store global reativa com Zustand.
