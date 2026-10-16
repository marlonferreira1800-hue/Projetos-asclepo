import { contextBridge, ipcRenderer } from 'electron';

export interface AgentStepLog {
  step: number;
  type: 'observe' | 'thought' | 'action' | 'result' | 'finish' | 'error';
  title: string;
  details?: string;
  data?: any;
  modelName?: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  description: string;
}

const api = {
  // Janela
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),

  // Agente Autônomo
  runGoal: (goal: string, config?: { nvidiaApiKey?: string; modelIndex?: number; maxSteps?: number }) =>
    ipcRenderer.invoke('agent:run-goal', goal, config),
  stopAgent: () => ipcRenderer.invoke('agent:stop'),
  getModels: () => ipcRenderer.invoke('agent:get-models') as Promise<{ models: AIModel[]; current: AIModel }>,
  setModelIndex: (index: number) => ipcRenderer.invoke('agent:set-model-index', index) as Promise<AIModel>,
  getApiKey: () => ipcRenderer.invoke('agent:get-key') as Promise<{ key: string }>,
  setApiKey: (key: string) => ipcRenderer.invoke('agent:set-key', key) as Promise<{ success: boolean; key: string }>,
  setCustomModel: (modelId: string, name?: string) =>
    ipcRenderer.invoke('agent:set-custom-model', modelId, name) as Promise<{ success: boolean; current: AIModel; models: AIModel[] }>,

  // Navegação
  navigate: (url: string) => ipcRenderer.invoke('browser:navigate', url),

  // Listeners de Eventos
  onAgentLog: (callback: (log: AgentStepLog) => void) => {
    const handler = (_: any, log: AgentStepLog) => callback(log);
    ipcRenderer.on('agent:log', handler);
    return () => ipcRenderer.removeListener('agent:log', handler);
  },
  onUrlChanged: (callback: (url: string) => void) => {
    const handler = (_: any, url: string) => callback(url);
    ipcRenderer.on('browser:url-changed', handler);
    return () => ipcRenderer.removeListener('browser:url-changed', handler);
  },
  onTitleChanged: (callback: (title: string) => void) => {
    const handler = (_: any, title: string) => callback(title);
    ipcRenderer.on('browser:title-changed', handler);
    return () => ipcRenderer.removeListener('browser:title-changed', handler);
  }
};

contextBridge.exposeInMainWorld('api', api);
