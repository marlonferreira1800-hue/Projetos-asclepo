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

export interface IElectronAPI {
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  runGoal: (goal: string, config?: { nvidiaApiKey?: string; modelIndex?: number; maxSteps?: number }) => Promise<{ status: string }>;
  stopAgent: () => Promise<{ status: string }>;
  getModels: () => Promise<{ models: AIModel[]; current: AIModel }>;
  setModelIndex: (index: number) => Promise<AIModel>;
  getApiKey: () => Promise<{ key: string }>;
  setApiKey: (key: string) => Promise<{ success: boolean; key: string }>;
  setCustomModel: (modelId: string, name?: string) => Promise<{ success: boolean; current: AIModel; models: AIModel[] }>;
  navigate: (url: string) => Promise<{ success: boolean; error?: string }>;
  onAgentLog: (callback: (log: AgentStepLog) => void) => () => void;
  onUrlChanged: (callback: (url: string) => void) => () => void;
  onTitleChanged: (callback: (title: string) => void) => () => void;
}

declare global {
  interface Window {
    api: IElectronAPI;
  }
}
