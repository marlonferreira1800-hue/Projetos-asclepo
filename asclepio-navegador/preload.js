const { contextBridge, ipcRenderer } = require('electron');

// ─── ASCLEPIO HOST BRIDGE ─────────────────────────────────────────────────────
// Espelha a API window.__polarHost do Polar: postMessage / onMessage / getState
// O Polar usa window.__polarHost.postMessage({type, payload})
// O Asclepio usa window.__asclepioHost com interface idêntica
contextBridge.exposeInMainWorld('__asclepioHost', {
  // Envia mensagem ao processo principal
  postMessage: (message) => {
    ipcRenderer.send('asclepio:bridge-message', message);
  },
  // Recebe mensagens do processo principal
  onMessage: (callback) => {
    ipcRenderer.on('asclepio:bridge-reply', (_event, data) => callback(data));
  },
  // Estado da aplicação (versão, status da IA, plataforma)
  getState: () => ipcRenderer.invoke('host:getState'),
  // Abre link no navegador padrão do sistema
  openExternal: (url) => ipcRenderer.send('host:openExternalUrl', url),
  // Listener para nova aba solicitada por popup de janela
  onNewTabRequested: (callback) => {
    ipcRenderer.on('asclepio:new-tab', (_event, url) => callback(url));
  },
  // ── Motor de IA com Fallback Simultâneo (Gemini 2.5 Flash, OpenAI, OpenRouter, Antigravity) ──
  askAi: (data) => ipcRenderer.invoke('asclepio:ask-antigravity', data),
  askAntigravity: (data) => ipcRenderer.invoke('asclepio:ask-antigravity', data),
  getAiModelInfo: () => ipcRenderer.invoke('asclepio:get-ai-model-info'),

  // ── Inovações dos 4 Gigantes (Browser-Use SoM, Stagehand, Open-Interpreter Vision) ──
  captureActiveView: () => ipcRenderer.invoke('asclepio:capture-active-view'),
  locateVisualCoordinates: (data) => ipcRenderer.invoke('asclepio:locate-visual-coordinates', data),
  chooseElementAction: (data) => ipcRenderer.invoke('asclepio:choose-element-action', data),
  extractData: (data) => ipcRenderer.invoke('asclepio:extract-data', data),
  observeActions: (data) => ipcRenderer.invoke('asclepio:observe-actions', data)
});

