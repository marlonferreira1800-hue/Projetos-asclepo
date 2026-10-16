export type EffortLevel = 'Low' | 'Medium' | 'High' | 'Max';

export interface ActionCard {
  type: 'tab' | 'nav' | 'action' | 'status' | 'click' | 'type' | 'scroll';
  label: string;
  detail?: string;
  icon?: string;
  screenshot?: string;
  durationMs?: number;
  status?: 'pending' | 'success' | 'failed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thoughtTime?: string;
  thoughtTrace?: string;
  stepsCount?: number;
  actions?: ActionCard[];
  youtubeConnectBanner?: boolean;
}

export interface WebTab {
  id: string;
  url: string;
  title: string;
  isLoading: boolean;
  isAudioPlaying?: boolean;
}

export interface TaskSession {
  id: string;
  title: string;
  statusDot?: 'blue' | 'orange' | 'green' | 'none';
  messages: ChatMessage[];
  browserUrl: string;
  browserTitle: string;
  tabs?: WebTab[];
  activeTabId?: string;
}

// Declaração do elemento nativo <webview> do Chromium no Electron
declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}
