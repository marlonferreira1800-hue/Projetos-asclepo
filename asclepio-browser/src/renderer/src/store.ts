import { create } from 'zustand';
import type { TaskSession, EffortLevel, ChatMessage, WebTab } from './types.ts';

interface BrowserStore {
  // Sessões
  sessions: TaskSession[];
  activeSessionId: string;
  setActiveSession: (id: string) => void;
  createNewSession: () => void;
  closeSession: (id: string) => void;

  // Esforço
  effort: EffortLevel;
  setEffort: (effort: EffortLevel) => void;

  // Estado do Navegador Embutido Real
  isBrowserOpen: boolean;
  isSplitView: boolean;
  isSidebarOpen: boolean;
  tabs: WebTab[];
  activeTabId: string;

  // Cursor do Agente (Apenas visível durante ações)
  isAgentActing: boolean;
  cursorTooltip: string;
  cursorPos: { x: number; y: number };

  // Ações do Navegador
  openBrowser: (url?: string) => void;
  closeBrowser: () => void;
  toggleSplitView: () => void;
  toggleSidebar: () => void;
  
  createTab: (url?: string) => void;
  closeTab: (tabId: string) => void;
  switchTab: (tabId: string) => void;
  updateActiveTab: (url?: string, title?: string, isLoading?: boolean, isAudioPlaying?: boolean) => void;

  // Mensagens e Loop do Agente
  sendMessage: (text: string) => void;
  stopAgent: () => void;
  initAgentListeners: () => void;
}

const initialTabs: WebTab[] = [
  {
    id: 'tab-1',
    url: 'https://www.youtube.com',
    title: 'YouTube',
    isLoading: false
  }
];

const initialSessions: TaskSession[] = [
  {
    id: 'tubaroes',
    title: 'Play Jogado aos Tubarões on YouTube',
    statusDot: 'blue',
    browserUrl: 'https://www.youtube.com',
    browserTitle: 'YouTube',
    messages: [
      {
        id: '1',
        role: 'user',
        content: 'abra o youtube toque a musica jogado aos tubaroes'
      },
      {
        id: '2',
        role: 'assistant',
        content: 'Vou abrir o YouTube e buscar a música "Jogado aos Tubarões".\n\nAbri o YouTube e iniciei a busca. O navegador ao lado está conectado ao vivo e pronto para navegar.',
        thoughtTime: '1s',
        stepsCount: 2,
        actions: [
          { type: 'tab', label: 'Creating Tab', detail: 'https://www.youtube.com/results...' }
        ],
        youtubeConnectBanner: true
      }
    ]
  },
  {
    id: 'justin',
    title: 'Justin Bieber music and drinking...',
    statusDot: 'blue',
    browserUrl: 'https://www.youtube.com',
    browserTitle: 'YouTube',
    messages: []
  },
  {
    id: 'linkedin',
    title: 'LinkedIn login access',
    statusDot: 'orange',
    browserUrl: 'https://www.linkedin.com/login',
    browserTitle: 'LinkedIn: Entrar ou Cadastrar-se',
    messages: []
  }
];

export const useBrowserStore = create<BrowserStore>((set, get) => ({
  sessions: initialSessions,
  activeSessionId: 'tubaroes',
  effort: 'Medium',

  isBrowserOpen: true,
  isSplitView: true,
  isSidebarOpen: true,
  tabs: initialTabs,
  activeTabId: 'tab-1',

  isAgentActing: false,
  cursorTooltip: '',
  cursorPos: { x: 0, y: 0 },

  setActiveSession: (id) => {
    const { sessions, activeSessionId, tabs, activeTabId } = get();
    // 1. Salva as abas atuais na sessão saindo
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          tabs: [...tabs],
          activeTabId: activeTabId,
          browserUrl: tabs.find((t) => t.id === activeTabId)?.url || s.browserUrl,
          browserTitle: tabs.find((t) => t.id === activeTabId)?.title || s.browserTitle
        };
      }
      return s;
    });

    const targetSession = updatedSessions.find((s) => s.id === id);
    if (targetSession) {
      // 2. Restaura as abas da sessão destino ou cria a aba inicial
      const targetTabs = (targetSession.tabs && targetSession.tabs.length > 0)
        ? targetSession.tabs
        : [
            {
              id: `tab-${id}-${Date.now()}`,
              url: targetSession.browserUrl || 'https://www.google.com',
              title: targetSession.browserTitle || 'New Tab',
              isLoading: false
            }
          ];
      const targetActiveTabId = targetSession.activeTabId && targetTabs.some(t => t.id === targetSession.activeTabId)
        ? targetSession.activeTabId
        : targetTabs[0].id;

      set({
        sessions: updatedSessions,
        activeSessionId: id,
        tabs: targetTabs,
        activeTabId: targetActiveTabId,
        isBrowserOpen: true
      });
    }
  },

  createNewSession: () => {
    const { sessions, activeSessionId, tabs, activeTabId } = get();
    // Salva as abas da sessão anterior
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, tabs: [...tabs], activeTabId };
      }
      return s;
    });

    const newId = `session-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTabId = `tab-${Date.now()}`;
    const initialTab: WebTab = {
      id: newTabId,
      url: 'https://www.google.com',
      title: 'Google',
      isLoading: false
    };

    const newSession: TaskSession = {
      id: newId,
      title: 'New task',
      messages: [],
      browserUrl: 'https://www.google.com',
      browserTitle: 'Google',
      tabs: [initialTab],
      activeTabId: newTabId
    };

    set({
      sessions: [newSession, ...updatedSessions],
      activeSessionId: newId,
      tabs: [initialTab],
      activeTabId: newTabId,
      isBrowserOpen: false
    });
  },

  closeSession: (id) => {
    const { sessions, activeSessionId } = get();
    const remaining = sessions.filter((s) => s.id !== id);

    if (remaining.length === 0) {
      // Se fechou a última, recria uma sessão limpa
      const fallbackId = `session-${Date.now()}`;
      const fallbackTabId = `tab-${Date.now()}`;
      const fallbackTab: WebTab = {
        id: fallbackTabId,
        url: 'https://www.google.com',
        title: 'Google',
        isLoading: false
      };
      const fallbackSession: TaskSession = {
        id: fallbackId,
        title: 'New task',
        messages: [],
        browserUrl: 'https://www.google.com',
        browserTitle: 'Google',
        tabs: [fallbackTab],
        activeTabId: fallbackTabId
      };
      set({
        sessions: [fallbackSession],
        activeSessionId: fallbackId,
        tabs: [fallbackTab],
        activeTabId: fallbackTabId,
        isBrowserOpen: false
      });
    } else {
      if (activeSessionId === id) {
        // Ativa a próxima sessão disponível e restaura suas abas
        const nextSession = remaining[0];
        const nextTabs = (nextSession.tabs && nextSession.tabs.length > 0)
          ? nextSession.tabs
          : [
              {
                id: `tab-${nextSession.id}`,
                url: nextSession.browserUrl || 'https://www.google.com',
                title: nextSession.browserTitle || 'New Tab',
                isLoading: false
              }
            ];
        set({
          sessions: remaining,
          activeSessionId: nextSession.id,
          tabs: nextTabs,
          activeTabId: nextSession.activeTabId || nextTabs[0].id
        });
      } else {
        set({ sessions: remaining });
      }
    }
  },

  setEffort: (effort) => set({ effort }),

  openBrowser: (url) => {
    set((state) => {
      const currentTabs = [...state.tabs];
      if (currentTabs.length === 0) {
        const newTab: WebTab = {
          id: `tab-${Date.now()}`,
          url: url || 'https://www.google.com',
          title: 'Nova Aba',
          isLoading: false
        };
        return { isBrowserOpen: true, tabs: [newTab], activeTabId: newTab.id };
      }
      return { isBrowserOpen: true };
    });
  },

  closeBrowser: () => set({ isBrowserOpen: false }),
  toggleSplitView: () => set((state) => ({ isSplitView: !state.isSplitView })),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  createTab: (url) => {
    const newTab: WebTab = {
      id: `tab-${Date.now()}`,
      url: url || 'https://www.google.com',
      title: 'Nova Aba',
      isLoading: false
    };
    set((state) => ({
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
      isBrowserOpen: true
    }));
  },

  closeTab: (tabId) => {
    const { tabs, activeTabId } = get();
    const remaining = tabs.filter((t) => t.id !== tabId);
    if (remaining.length === 0) {
      set({ tabs: [], isBrowserOpen: false });
    } else {
      set({
        tabs: remaining,
        activeTabId: activeTabId === tabId ? remaining[0].id : activeTabId
      });
    }
  },

  switchTab: (tabId) => set({ activeTabId: tabId }),

  updateActiveTab: (url, title, isLoading, isAudioPlaying) => {
    const { tabs, activeTabId } = get();
    set({
      tabs: tabs.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              url: url !== undefined ? url : t.url,
              title: title !== undefined ? title : t.title,
              isLoading: isLoading !== undefined ? isLoading : t.isLoading,
              isAudioPlaying: isAudioPlaying !== undefined ? isAudioPlaying : t.isAudioPlaying
            }
          : t
      )
    });
  },

  initAgentListeners: () => {
    if (typeof window === 'undefined' || !window.api) return;
    if ((window as any).__asclepio_agent_listeners_bound) return;
    (window as any).__asclepio_agent_listeners_bound = true;

    // Sincroniza URL e Título com eventos do Chromium
    window.api.onUrlChanged((url) => {
      get().updateActiveTab(url);
    });

    window.api.onTitleChanged((title) => {
      get().updateActiveTab(get().tabs.find(t => t.id === get().activeTabId)?.url || '', title);
    });

    // Ouve os logs emitidos pelo AgentOrchestrator
    window.api.onAgentLog((log) => {
      const { activeSessionId, sessions } = get();
      
      if (log.type === 'action') {
        const isNavigation = log.title && log.title.toLowerCase().includes('navegando');
        if (isNavigation) {
          set({
            isAgentActing: true,
            cursorTooltip: log.title,
            cursorPos: { x: window.innerWidth * 0.72, y: 70 }
          });
          setTimeout(() => {
            if (get().isAgentActing && get().cursorTooltip.toLowerCase().includes('navegando')) {
              set({ isAgentActing: false, cursorTooltip: '' });
            }
          }, 1200);
        } else {
          const coords = log.data?.center || { x: window.innerWidth * 0.72, y: 300 };
          set({
            isAgentActing: true,
            cursorTooltip: log.title || 'Executando ação',
            cursorPos: coords
          });

          setTimeout(() => {
            if (get().isAgentActing) {
              set({ isAgentActing: false, cursorTooltip: '' });
            }
          }, 1800);
        }
      } else if (log.type === 'finish' || log.type === 'error' || log.type === 'observe') {
        set({ isAgentActing: false, cursorTooltip: '' });
      }

      // Adiciona o log visual na lista de mensagens da sessão
      set({
        sessions: sessions.map((s) => {
          if (s.id !== activeSessionId) return s;
          const lastMsg = s.messages[s.messages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            const updatedActions = [...(lastMsg.actions || [])];
            if (log.type === 'action') {
              updatedActions.push({
                type: 'action',
                label: log.title,
                detail: log.details
              });
            } else if (log.type === 'error') {
              updatedActions.push({
                type: 'error',
                label: `Erro: ${log.title}`,
                detail: log.details
              });
            } else if (log.type === 'finish') {
              updatedActions.push({
                type: 'status',
                label: log.title || 'Concluído',
                detail: log.details
              });
            }

            let newContent = lastMsg.content;
            if (log.type === 'finish' && log.details) {
              newContent = log.details;
            } else if (log.type === 'error') {
              newContent = `⚠️ ${log.title}${log.details ? `\n${log.details}` : ''}`;
            } else if (log.type === 'action') {
              newContent = `Executando: ${log.title}...`;
            }

            return {
              ...s,
              messages: [
                ...s.messages.slice(0, -1),
                {
                  ...lastMsg,
                  content: newContent,
                  actions: updatedActions,
                  stepsCount: log.step > 0 ? log.step : lastMsg.stepsCount,
                  thoughtTime: log.type === 'thought' ? `${Math.max(1, (log.step || 1) * 1.2).toFixed(0)}s` : lastMsg.thoughtTime,
                  thoughtTrace: log.type === 'thought' ? (log.details || lastMsg.thoughtTrace) : lastMsg.thoughtTrace
                }
              ]
            };
          }
          return s;
        })
      });
    });
  },

  sendMessage: (text) => {
    if (!text.trim()) return;
    const { activeSessionId, sessions, openBrowser } = get();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text
    };

    const assistantMsgPlaceholder: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: 'Iniciando raciocínio com o modelo de IA...',
      thoughtTime: '1s',
      actions: []
    };

    set({
      sessions: sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, messages: [...s.messages, userMsg, assistantMsgPlaceholder] }
          : s
      )
    });

    // Garante que o navegador está aberto para a ação
    openBrowser();

    // Dispara o orquestrador autônomo se a API Electron estiver ativa
    if (typeof window !== 'undefined' && window.api?.runGoal) {
      const effortSteps: Record<EffortLevel, number> = {
        Low: 5,
        Medium: 15,
        High: 25,
        Max: 40
      };
      const maxSteps = effortSteps[get().effort] || 15;
      window.api.runGoal(text, { maxSteps });
    } else {
      // Fallback local se estiver fora do Electron
      setTimeout(() => {
        set({
          sessions: get().sessions.map((s) => {
            if (s.id !== activeSessionId) return s;
            return {
              ...s,
              messages: [
                ...s.messages.slice(0, -1),
                {
                  id: (Date.now() + 1).toString(),
                  role: 'assistant',
                  content: `Comando recebido: "${text}". O navegador real está pronto para navegação.`,
                  thoughtTime: '1s',
                  actions: [{ type: 'status', label: 'Concluído', icon: '✓' }]
                }
              ]
            };
          })
        });
      }, 1000);
    }
  },

  stopAgent: () => {
    if (typeof window !== 'undefined' && window.api?.stopAgent) {
      window.api.stopAgent();
    }
    set({ isAgentActing: false, cursorTooltip: '' });
  }
}));
