import React, { useState, useEffect } from 'react';
import { useBrowserStore } from '../store';
import { Plus, Search, Columns, RotateCw, LayoutGrid, Box, ChevronDown, Check, ShieldCheck, Sparkles } from 'lucide-react';
import { UserArmyModal } from './UserArmyModal';
import { CommandPanel } from './CommandPanel';
import { TemplatesModal } from './TemplatesModal';
import { WorkflowsModal } from './WorkflowsModal';

export const Sidebar: React.FC = () => {
  const {
    isSidebarOpen,
    sessions,
    activeSessionId,
    setActiveSession,
    createNewSession,
    toggleSplitView
  } = useBrowserStore();

  const [isArmyModalOpen, setIsArmyModalOpen] = useState(false);
  const [isCommandPanelOpen, setIsCommandPanelOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isWorkflowsOpen, setIsWorkflowsOpen] = useState(false);

  // Atalho global Ctrl+K ou Cmd+K para abrir o Command Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isSidebarOpen) return null;

  return (
    <>
      <aside className="w-60 bg-sidebarBg border-r border-sidebarBorder flex flex-col justify-between shrink-0 text-xs select-none">
        {/* Topo da Sidebar */}
        <div className="p-3 space-y-4 overflow-y-auto">
          {/* Ícones de Ação Rápida */}
          <div className="flex items-center justify-between text-textSecondary px-1">
            <button
              onClick={() => setIsCommandPanelOpen(true)}
              className="flex items-center gap-1.5 hover:text-polarBlue transition"
              title="Abrir Command Panel (Ctrl+K)"
            >
              <Search className="w-4 h-4 cursor-pointer" />
              <span className="text-[10px] font-mono text-textMuted bg-sidebarHover px-1.5 py-0.5 rounded border border-cardBorder">
                Ctrl+K
              </span>
            </button>
            <button
              onClick={toggleSplitView}
              className="p-1 hover:text-textPrimary rounded transition"
              title="Alternar Divisão de Tela"
            >
              <Columns className="w-4 h-4 cursor-pointer" />
            </button>
          </div>

          {/* Botão New Task */}
          <button
            onClick={createNewSession}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-sidebarBorder bg-white hover:bg-sidebarHover text-textPrimary font-semibold shadow-xs transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-polarBlue" />
            <span>New task</span>
          </button>

          {/* Menu Principal de Navegação */}
          <nav className="space-y-0.5 text-textSecondary font-medium">
            <button
              onClick={() => setIsArmyModalOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 transition text-left"
              title="Abrir o Exército de Usuários e Diagnóstico de Bugs"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Exército de Testes</span>
              <span className="ml-auto text-[9px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                100%
              </span>
            </button>

            <button
              onClick={() => setIsWorkflowsOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-sidebarHover hover:text-textPrimary transition text-left"
            >
              <RotateCw className="w-4 h-4 text-emerald-600" />
              <span>Workflows</span>
              <span className="ml-auto text-[9px] bg-sidebarHover border border-cardBorder px-1.5 py-0.2 rounded font-mono text-textMuted">
                Cron
              </span>
            </button>

            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-sidebarHover hover:text-textPrimary transition text-left"
            >
              <LayoutGrid className="w-4 h-4 text-purple-600" />
              <span>Templates</span>
              <span className="ml-auto text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded font-semibold">
                Hub
              </span>
            </button>

            <button
              onClick={() => setIsCommandPanelOpen(true)}
              className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-sidebarHover hover:text-textPrimary transition text-left"
            >
              <Sparkles className="w-4 h-4 text-polarBlue" />
              <span>Command Panel</span>
            </button>
          </nav>

          {/* Seção Projects */}
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-textMuted px-2">Projects</div>
            <div className="text-textMuted px-2 text-[11px]">No projects</div>
          </div>

          {/* Seção Recents */}
          <div className="space-y-1 pt-1">
            <div className="text-[11px] font-medium text-textMuted px-2">Recents</div>

            <div className="space-y-0.5">
              {sessions.map((session) => {
                const isActive = session.id === activeSessionId;
                return (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session.id)}
                    className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md transition truncate ${
                      isActive
                        ? 'bg-sidebarActive text-textPrimary font-medium'
                        : 'hover:bg-sidebarHover text-textSecondary'
                    }`}
                  >
                    {session.statusDot === 'blue' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                    {session.statusDot === 'orange' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                    )}
                    {(!session.statusDot || session.statusDot === 'none') && (
                      <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />
                    )}
                    <span className="truncate">{session.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Base da Sidebar: Get started checklist */}
        <div className="p-3 border-t border-sidebarBorder bg-sidebarBg">
          <div className="flex items-center justify-between text-[11px] text-textSecondary font-medium mb-2 cursor-pointer">
            <span>Get started</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-1.5 text-[11px] text-textSecondary">
            <div className="flex items-center gap-2 text-textPrimary">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Run your first task</span>
            </div>
            <div className="flex items-center gap-2 text-textPrimary">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Exército de Usuários Aprovado</span>
            </div>
            <div className="flex items-center gap-2 text-textMuted">
              <span className="w-3.5 h-3.5 rounded-full border border-sidebarBorder" />
              <span>Connect an app</span>
            </div>
            <div className="flex items-center gap-2 text-textMuted">
              <span className="w-3.5 h-3.5 rounded-full border border-sidebarBorder" />
              <span>Run a workflow</span>
            </div>
          </div>
        </div>
      </aside>

      <UserArmyModal isOpen={isArmyModalOpen} onClose={() => setIsArmyModalOpen(false)} />
      <CommandPanel
        isOpen={isCommandPanelOpen}
        onClose={() => setIsCommandPanelOpen(false)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenWorkflows={() => setIsWorkflowsOpen(true)}
        onOpenArmy={() => setIsArmyModalOpen(true)}
      />
      <TemplatesModal isOpen={isTemplatesOpen} onClose={() => setIsTemplatesOpen(false)} />
      <WorkflowsModal isOpen={isWorkflowsOpen} onClose={() => setIsWorkflowsOpen(false)} />
    </>
  );
};
