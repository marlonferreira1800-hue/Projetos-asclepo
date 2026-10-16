import React, { useState, useEffect, useRef } from 'react';
import { useBrowserStore } from '../store';
import { Sparkles, Globe, Play, Workflow, LayoutGrid, ShieldCheck, ArrowRight, CornerDownLeft, X } from 'lucide-react';

interface CommandPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTemplates: () => void;
  onOpenWorkflows: () => void;
  onOpenArmy: () => void;
}

export const CommandPanel: React.FC<CommandPanelProps> = ({
  isOpen,
  onClose,
  onOpenTemplates,
  onOpenWorkflows,
  onOpenArmy
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useBrowserStore((state) => state.sendMessage);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRun = (prompt: string) => {
    if (!prompt.trim()) return;
    sendMessage(prompt);
    onClose();
  };

  const commands = [
    {
      id: 'cmd-web',
      icon: <Globe className="w-4 h-4 text-polarBlue" />,
      title: 'Web Navigation & Research',
      desc: 'Pesquisar e navegar de forma autônoma na web',
      action: () => handleRun(query.trim() || 'Pesquise as principais novidades de tecnologia hoje')
    },
    {
      id: 'cmd-yt',
      icon: <Play className="w-4 h-4 text-red-500" />,
      title: 'Play on YouTube',
      desc: 'Abrir vídeo, música ou podcast no YouTube',
      action: () => handleRun('Abra o YouTube e busque lo-fi chill beats para focar')
    },
    {
      id: 'cmd-tpl',
      icon: <LayoutGrid className="w-4 h-4 text-purple-500" />,
      title: 'Browse Templates',
      desc: 'Explorar tarefas prontas para Ops, Data, Research e Sales',
      action: () => {
        onClose();
        onOpenTemplates();
      }
    },
    {
      id: 'cmd-wf',
      icon: <Workflow className="w-4 h-4 text-emerald-500" />,
      title: 'Scheduled Workflows',
      desc: 'Automações agendadas e rotinas recorrentes',
      action: () => {
        onClose();
        onOpenWorkflows();
      }
    },
    {
      id: 'cmd-army',
      icon: <ShieldCheck className="w-4 h-4 text-amber-500" />,
      title: 'Exército de Testes (12 Usuários)',
      desc: 'Executar bateria de testes com personas sintéticas',
      action: () => {
        onClose();
        onOpenArmy();
      }
    }
  ];

  const filteredCommands = query.startsWith('/')
    ? commands.filter(c => c.title.toLowerCase().includes(query.slice(1).toLowerCase()))
    : commands;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-cardBorder overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        {/* Barra de Entrada Superior */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-sidebarBorder bg-white">
          <Sparkles className="w-4 h-4 text-polarBlue shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'Enter') handleRun(query);
            }}
            placeholder="Describe your task, / for commands, @ for context"
            className="flex-1 bg-transparent text-sm text-textPrimary placeholder-textMuted outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => handleRun(query)}
              className="p-1 rounded-md bg-polarBlue text-white hover:bg-polarBlueHover transition"
              title="Executar Tarefa"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1 text-[10px] text-textMuted font-mono bg-sidebarHover px-1.5 py-0.5 rounded">
              <span>ESC to exit</span>
            </div>
          )}
        </div>

        {/* Lista de Ações / Sugestões Rápidas */}
        <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
          <div className="text-[10px] font-semibold text-textMuted px-2 py-1 uppercase tracking-wider">
            Quick Actions & Commands
          </div>
          {filteredCommands.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-sidebarHover text-left transition group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sidebarHover group-hover:bg-white border border-cardBorder transition shrink-0">
                  {item.icon}
                </div>
                <div>
                  <div className="text-xs font-medium text-textPrimary">{item.title}</div>
                  <div className="text-[11px] text-textSecondary">{item.desc}</div>
                </div>
              </div>
              <CornerDownLeft className="w-3.5 h-3.5 text-textMuted group-hover:text-textPrimary transition" />
            </button>
          ))}
        </div>

        {/* Rodapé Informativo */}
        <div className="px-4 py-2 border-t border-sidebarBorder bg-sidebarBg flex items-center justify-between text-[11px] text-textSecondary">
          <div className="flex items-center gap-3">
            <span><strong>Enter</strong> para executar</span>
            <span><strong>/</strong> para comandos</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] text-polarBlue font-semibold">
            <span>Asclepio Command Panel</span>
          </div>
        </div>
      </div>
    </div>
  );
};
