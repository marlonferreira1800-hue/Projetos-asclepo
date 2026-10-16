import React, { useRef, useState, useEffect } from 'react';
import { useBrowserStore } from '../store';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Lock,
  Plus,
  Maximize2,
  X,
  Volume2
} from 'lucide-react';

export const BrowserPane: React.FC = () => {
  const {
    isBrowserOpen,
    isSplitView,
    tabs,
    activeTabId,
    createTab,
    closeTab,
    switchTab,
    updateActiveTab,
    closeBrowser,
    toggleSplitView,
    isAgentActing,
    cursorTooltip,
    cursorPos
  } = useBrowserStore();

  const webviewRef = useRef<any>(null);
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const [urlInput, setUrlInput] = useState(activeTab?.url || 'https://www.google.com');

  const prevTabIdRef = useRef(activeTabId);

  useEffect(() => {
    if (activeTab) {
      setUrlInput(activeTab.url);
      // Recarrega o webview SOMENTE quando o usuário alternar para outra aba diferente
      if (prevTabIdRef.current !== activeTabId) {
        prevTabIdRef.current = activeTabId;
        if (webviewRef.current && typeof webviewRef.current.loadURL === 'function') {
          try {
            const currentWebviewUrl = typeof webviewRef.current.getURL === 'function' ? webviewRef.current.getURL() : '';
            if (currentWebviewUrl !== activeTab.url && activeTab.url && activeTab.url !== 'about:blank') {
              webviewRef.current.loadURL(activeTab.url);
            }
          } catch {
            // Ignore if webview is still initializing
          }
        }
      }
    }
  }, [activeTabId, activeTab?.url]);

  // Se o navegador estiver fechado/removido, não renderiza nada
  if (!isBrowserOpen || !activeTab) return null;

  // Lida com navegação manual digitada pelo usuário na barra de endereços
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = urlInput.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = `https://${finalUrl}`;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }
    setUrlInput(finalUrl);
    updateActiveTab(finalUrl, 'Carregando...');
    if (webviewRef.current) {
      webviewRef.current.loadURL(finalUrl);
    }
  };

  const handleGoBack = () => {
    if (webviewRef.current?.canGoBack()) {
      webviewRef.current.goBack();
    }
  };

  const handleGoForward = () => {
    if (webviewRef.current?.canGoForward()) {
      webviewRef.current.goForward();
    }
  };

  const handleReload = () => {
    if (webviewRef.current) {
      webviewRef.current.reload();
    }
  };

  // Eventos do Chromium WebView Real
  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const onDidNavigate = (e: any) => {
      setUrlInput(e.url);
      updateActiveTab(e.url, webview.getTitle() || e.url, false);
    };

    const onTitleUpdated = (e: any) => {
      updateActiveTab(webview.getURL(), e.title, false);
    };

    const onStartLoading = () => {
      updateActiveTab(webview.getURL(), undefined, true);
    };

    const onStopLoading = () => {
      updateActiveTab(webview.getURL(), undefined, false);
    };

    const onMediaStarted = () => {
      updateActiveTab(undefined, undefined, undefined, true);
    };

    const onMediaPaused = () => {
      updateActiveTab(undefined, undefined, undefined, false);
    };

    webview.addEventListener('did-navigate', onDidNavigate);
    webview.addEventListener('page-title-updated', onTitleUpdated);
    webview.addEventListener('did-start-loading', onStartLoading);
    webview.addEventListener('did-stop-loading', onStopLoading);
    webview.addEventListener('media-started-playing', onMediaStarted);
    webview.addEventListener('media-paused', onMediaPaused);

    return () => {
      webview.removeEventListener('did-navigate', onDidNavigate);
      webview.removeEventListener('page-title-updated', onTitleUpdated);
      webview.removeEventListener('did-start-loading', onStartLoading);
      webview.removeEventListener('did-stop-loading', onStopLoading);
      webview.removeEventListener('media-started-playing', onMediaStarted);
      webview.removeEventListener('media-paused', onMediaPaused);
    };
  }, [activeTabId]);

  const containerClasses = isSplitView
    ? 'flex-1 flex flex-col bg-white overflow-hidden relative border-l border-sidebarBorder'
    : 'fixed top-14 right-6 w-[600px] h-[440px] shadow-2xl rounded-xl border border-cardBorder overflow-hidden z-40 bg-white flex flex-col animate-in zoom-in-95 duration-150';

  return (
    <section className={containerClasses}>
      {/* CURSOR FANTASMA DO AGENTE (VISÍVEL APENAS QUANDO A IA ESTIVER OPERANDO) */}
      {isAgentActing && (
        <div
          className="agent-ghost-cursor fixed z-50 flex items-start gap-1 pointer-events-none transition-all duration-500 ease-out"
          style={{
            top: `${cursorPos.y}px`,
            left: `${cursorPos.x}px`
          }}
        >
          <svg
            className="w-5 h-5 text-black drop-shadow-md"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-3.596 1.734-4.35-8.879-5.428 5.879v-21z" />
          </svg>
          <div className="bg-black text-white text-[10px] font-medium px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-in fade-in duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span>{cursorTooltip || 'Operando no navegador'}</span>
          </div>
        </div>
      )}

      {/* 1. BARRA DE ABAS WEB REAIS */}
      <div className="h-9 bg-sidebarBg border-b border-sidebarBorder flex items-center justify-between px-2 shrink-0 select-none">
        <div className="flex items-center gap-1 h-full pt-1 overflow-x-auto">
          {tabs.map((tab) => {
            const isTabActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1 text-xs h-full rounded-t-md font-medium cursor-pointer transition border-t-2 ${
                  isTabActive
                    ? 'bg-white border-polarBlue text-textPrimary shadow-xs font-semibold'
                    : 'bg-transparent border-transparent text-textSecondary hover:bg-sidebarHover'
                }`}
              >
                {tab.isLoading ? (
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-textMuted border-t-transparent animate-spin" />
                ) : tab.url.includes('youtube.com') ? (
                  <span className="text-red-600 text-xs font-bold">▶</span>
                ) : (
                  <span className="text-polarBlue text-xs">🌐</span>
                )}
                <span className="truncate max-w-[150px]">
                  {tab.title || 'Nova Aba'}
                </span>
                {(tab.isAudioPlaying || (tab.url.includes('youtube.com/watch') && !tab.isLoading)) && (
                  <span className="text-[10px] text-emerald-600 animate-pulse ml-0.5" title="Reproduzindo áudio">
                    🔊
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="text-textMuted hover:text-textPrimary ml-1 rounded p-0.5"
                  title="Fechar Aba"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => createTab('https://www.google.com')}
            className="p-1 hover:bg-sidebarHover text-textSecondary rounded transition"
            title="Abrir Nova Aba Web"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Controles de Painel: Alternar Janela e Fechar Painel */}
        <div className="flex items-center gap-1 text-textSecondary">
          <button
            onClick={toggleSplitView}
            className="p-1 hover:bg-sidebarHover rounded hover:text-textPrimary transition"
            title="Alternar entre Split e Janela Flutuante"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={closeBrowser}
            className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded transition"
            title="Fechar / Remover Navegador"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BARRA DE NAVEGAÇÃO / URL BAR FUNCIONAL */}
      <div className="h-10 border-b border-sidebarBorder bg-white flex items-center gap-2 px-3 shrink-0 select-none">
        <div className="flex items-center text-textSecondary gap-1">
          <button
            onClick={handleGoBack}
            className="p-1 hover:bg-sidebarHover rounded hover:text-textPrimary transition"
            title="Voltar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleGoForward}
            className="p-1 hover:bg-sidebarHover rounded hover:text-textPrimary transition"
            title="Avançar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReload}
            className="p-1 hover:bg-sidebarHover rounded hover:text-textPrimary transition"
            title="Recarregar"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Form de URL real - Usuário pode digitar qualquer site e apertar Enter */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center bg-sidebarBg hover:bg-sidebarHover focus-within:bg-white border border-cardBorder focus-within:border-zinc-400 rounded-lg px-2.5 py-1 text-xs transition">
          <Lock className="w-3 h-3 text-textMuted mr-1.5" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Digite uma URL ou termo de busca e aperte Enter..."
            className="flex-1 bg-transparent text-xs text-textPrimary outline-none font-normal"
          />
        </form>
      </div>

      {/* 3. MOTOR CHROMIUM WEBVIEW REAL (OU IFRAME DE DESENVOLVIMENTO) */}
      <div className="flex-1 bg-white relative overflow-hidden">
        {/* Renderiza a tag oficial <webview> do Chromium no Electron */}
        <webview
          ref={webviewRef}
          src={activeTab.url}
          className="w-full h-full border-none"
          allowpopups="true"
        />
      </div>
    </section>
  );
};
