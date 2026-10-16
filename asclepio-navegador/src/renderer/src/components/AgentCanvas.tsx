import React, { useState, useRef, useEffect } from 'react';
import { useBrowserStore } from '../store';
import { EffortPopover } from './EffortPopover';
import {
  Share2,
  Columns,
  ChevronRight,
  Plus,
  ChevronDown,
  Mic,
  ArrowUp,
  ThumbsUp,
  ThumbsDown,
  Copy,
  MoreHorizontal,
  ExternalLink,
  X,
  Square
} from 'lucide-react';

export const AgentCanvas: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    effort,
    sendMessage,
    stopAgent,
    isAgentActing,
    toggleSplitView,
    isBrowserOpen,
    openBrowser
  } = useBrowserStore();

  const [inputVal, setInputVal] = useState('');
  const [isEffortOpen, setIsEffortOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dismissedBanners, setDismissedBanners] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  const handleSend = () => {
    if (!inputVal.trim()) return;
    sendMessage(inputVal);
    setInputVal('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputVal(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});

  const toggleThought = (id: string) => {
    setExpandedThoughts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const suggestions = [
    { label: 'Pesquisar novidades de IA hoje', prompt: 'Pesquise as principais novidades de IA hoje no Google e faça um resumo' },
    { label: 'Tocar música no YouTube', prompt: 'Abra o YouTube e busque lo-fi hip hop para focar' },
    { label: 'Monitorar preços de concorrentes', prompt: 'Acesse sites de e-commerce e faça uma análise comparativa de preços' },
    { label: 'Extrair dados e tabelas', prompt: 'Navegue na web e extraia uma tabela com métricas de mercado' },
  ];

  return (
    <section className="flex-1 flex flex-col bg-white border-r border-sidebarBorder relative overflow-hidden">
      {/* Topo do Canvas de Conversa */}
      <div className="h-10 flex items-center justify-between px-4 gap-2 text-textSecondary border-b border-sidebarBorder shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-textPrimary tracking-wide uppercase">Agent Canvas</span>
          {isAgentActing && (
            <span className="text-[10px] text-polarBlue font-semibold flex items-center gap-1.5 bg-polarBlue/10 border border-polarBlue/20 px-2 py-0.5 rounded-full animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-polarBlue pulse-dot" />
              <span>executando...</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isBrowserOpen && (
            <button
              onClick={() => openBrowser('https://www.google.com')}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-sidebarHover hover:bg-zinc-200 text-textPrimary transition font-medium"
              title="Abrir Navegador Web"
            >
              <span>🌐 Abrir Navegador</span>
            </button>
          )}
          <button className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md hover:bg-sidebarHover text-textSecondary transition">
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
          <button
            onClick={toggleSplitView}
            className="p-1 hover:bg-sidebarHover rounded text-textSecondary transition"
            title="Alternar Modo Split-View / Flutuante"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feed de Conversa e Ações */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 max-w-2xl mx-auto w-full">
        {messages.length === 0 ? (
          /* Empty State Polar Style: "What can I do for you?" + Suggestions */
          <div className="h-full flex flex-col items-center justify-center text-center space-y-5 pt-20 animate-in fade-in duration-200">
            <div className="w-10 h-10 rounded-2xl bg-polarBlue/10 flex items-center justify-center text-polarBlue shadow-xs">
              <span className="text-xl font-bold">🧊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-textPrimary tracking-tight">
                What can I do for you?
              </h1>
              <p className="text-xs text-textSecondary max-w-sm mt-1">
                Descreva sua tarefa. Posso navegar, pesquisar, extrair dados e automatizar fluxos complexos no Chromium.
              </p>
            </div>

            {/* Suggestion Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md pt-2">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(sug.prompt)}
                  className="text-left p-3 rounded-xl border border-cardBorder bg-sidebarBg hover:bg-white hover:border-polarBlue hover:shadow-xs transition text-xs group"
                >
                  <div className="font-semibold text-textPrimary group-hover:text-polarBlue transition">
                    {sug.label}
                  </div>
                  <div className="text-[11px] text-textMuted truncate mt-0.5">
                    {sug.prompt}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="space-y-3">
              {msg.role === 'user' ? (
                /* Balão do Usuário (Pílula cinza à direita - Polar Light User Bubble) */
                <div className="flex justify-end">
                  <div className="bg-polarLightBubble text-textPrimary text-xs px-4 py-2.5 rounded-2xl max-w-md leading-relaxed border border-cardBorder shadow-2xs font-medium">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Resposta Estruturada da IA */
                <div className="space-y-3 text-xs text-textPrimary animate-in fade-in duration-150">
                  {/* Indicador de Passos */}
                  {msg.stepsCount && (
                    <div className="text-textSecondary flex items-center gap-1.5 text-[11px]">
                      <ChevronRight className="w-3.5 h-3.5 text-textMuted" />
                      <span className="font-medium">{msg.stepsCount} steps</span>
                    </div>
                  )}

                  {/* Tempo de Pensamento CoT (Colapsável) */}
                  {msg.thoughtTime && (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => toggleThought(msg.id)}
                        className="inline-flex items-center gap-1.5 text-[11px] text-textSecondary hover:text-textPrimary bg-sidebarHover hover:bg-zinc-200 px-2 py-0.5 rounded-md transition font-mono"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedThoughts[msg.id] ? 'rotate-180' : ''}`} />
                        <span>Thought for {msg.thoughtTime}</span>
                      </button>

                      {expandedThoughts[msg.id] && (
                        <div className="p-3 bg-zinc-50 border border-cardBorder rounded-lg text-[11px] font-mono text-zinc-600 leading-relaxed animate-in fade-in duration-150">
                          {msg.thoughtTrace || 'Analisando objetivo da tarefa, mapeando seletores DOM da página atual e planejando rota de navegação com menor custo de passos...'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cards de Ação */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.actions.map((act, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cardBorder bg-white font-mono text-[11px] text-textSecondary shadow-2xs hover:border-zinc-300 transition"
                        >
                          <span className="w-2 h-2 rounded-full bg-polarBlue shrink-0" />
                          <span className="text-textPrimary font-semibold font-sans">{act.label}</span>
                          {act.detail && (
                            <span className="text-textSecondary font-mono truncate max-w-xs">
                              {act.detail}
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-sans font-medium">
                            ✓ ok
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Conteúdo em Texto */}
                  <div className="leading-relaxed whitespace-pre-wrap text-textPrimary text-xs">{msg.content}</div>

                  {/* Barra de Feedback */}
                  <div className="flex items-center gap-3 text-textMuted pt-1">
                    <button className="hover:text-textPrimary transition" title="Útil"><ThumbsUp className="w-3.5 h-3.5" /></button>
                    <button className="hover:text-textPrimary transition" title="Não útil"><ThumbsDown className="w-3.5 h-3.5" /></button>
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="hover:text-textPrimary transition flex items-center gap-1"
                      title="Copiar resposta"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedId === msg.id && <span className="text-[10px] text-emerald-600 font-sans font-medium">Copiado!</span>}
                    </button>
                    <button className="hover:text-textPrimary transition"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                  </div>

                  {/* Banner Opcional de Integração */}
                  {msg.youtubeConnectBanner && !dismissedBanners[msg.id] && (
                    <div className="p-2.5 rounded-lg bg-red-50/60 border border-red-100 flex items-center justify-between text-[11px] text-red-700 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold">▶</span>
                        <span>Connect <strong>YouTube</strong> for these tasks to be faster and cheaper</span>
                      </div>
                      <div className="flex items-center gap-2 text-textMuted">
                        <button className="hover:text-textPrimary"><ExternalLink className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={() => setDismissedBanners((prev) => ({ ...prev, [msg.id]: true }))}
                          className="hover:text-textPrimary p-0.5 rounded hover:bg-red-100 transition"
                          title="Dispensar aviso"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Flutuante (Base) */}
      <div className="p-4 bg-white border-t border-sidebarBorder">
        <div className="max-w-2xl mx-auto">
          <div className="border border-cardBorder rounded-2xl p-2.5 bg-white shadow-xs focus-within:border-polarBlue focus-within:ring-1 focus-within:ring-polarBlue/30 transition">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputVal}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={messages.length === 0 ? "Describe your task, / for commands, @ for context" : "Send a follow up, / for commands, @ for context"}
              className="w-full bg-transparent text-xs text-textPrimary placeholder-textMuted outline-none resize-none px-1 max-h-36 overflow-y-auto"
            />

            <div className="flex items-center justify-between pt-2">
              {/* Esquerda: Botão + e Seletor Effort */}
              <div className="flex items-center gap-2 relative">
                <button
                  className="p-1 hover:bg-sidebarHover rounded-full text-textSecondary transition"
                  title="Adicionar Contexto"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsEffortOpen(!isEffortOpen)}
                  className="flex items-center gap-1 text-xs text-textSecondary hover:text-textPrimary px-2 py-0.5 rounded-md hover:bg-sidebarHover transition font-medium"
                >
                  <span>{effort}</span>
                  <ChevronDown className="w-3 h-3 text-textMuted" />
                </button>

                <EffortPopover
                  isOpen={isEffortOpen}
                  onClose={() => setIsEffortOpen(false)}
                />
              </div>

              {/* Direita: Microfone e Botão de Enviar (Azul Polar) */}
              <div className="flex items-center gap-2">
                <button
                  className="p-1 text-textMuted hover:text-textPrimary transition"
                  title="Gravar por voz"
                >
                  <Mic className="w-4 h-4" />
                </button>

                {isAgentActing ? (
                  <button
                    onClick={stopAgent}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition active:scale-95 shadow-sm"
                    title="Parar Execução Imediatamente"
                  >
                    <Square className="w-3 h-3 fill-white" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    className="w-7 h-7 rounded-full bg-polarBlue hover:bg-polarBlueHover text-white flex items-center justify-center transition active:scale-95 shadow-sm"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
