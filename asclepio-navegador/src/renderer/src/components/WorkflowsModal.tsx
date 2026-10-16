import React, { useState } from 'react';
import { useBrowserStore } from '../store';
import { RotateCw, Clock, Play, Pause, Plus, X, Calendar, CheckCircle2 } from 'lucide-react';

interface WorkflowsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WorkflowItem {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  status: 'active' | 'paused';
  prompt: string;
}

const initialWorkflows: WorkflowItem[] = [
  {
    id: 'wf-1',
    name: 'Daily Morning AI & Tech Briefing',
    schedule: 'Weekdays at 8:00 AM',
    lastRun: 'Hoje às 08:00 (Sucesso)',
    status: 'active',
    prompt: 'Navegue pelos principais portais de tecnologia e compile um resumo executivo com os 5 principais fatos do dia.'
  },
  {
    id: 'wf-2',
    name: 'Competitor Pricing & Catalog Sync',
    schedule: 'Daily at 6:00 PM',
    lastRun: 'Ontem às 18:00 (Sucesso)',
    status: 'active',
    prompt: 'Verifique a página de preços dos concorrentes e aponte variações de planos ou descontos.'
  },
  {
    id: 'wf-3',
    name: 'Weekly Financial News Roundup',
    schedule: 'Every Monday at 9:00 AM',
    lastRun: 'Segunda às 09:00 (Sucesso)',
    status: 'paused',
    prompt: 'Faça um apanhado geral das taxas de câmbio, balanços e decisões de juros da semana.'
  }
];

export const WorkflowsModal: React.FC<WorkflowsModalProps> = ({ isOpen, onClose }) => {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(initialWorkflows);
  const { sendMessage, createNewSession } = useBrowserStore();

  if (!isOpen) return null;

  const handleToggleStatus = (id: string) => {
    setWorkflows((prev) =>
      prev.map((wf) =>
        wf.id === id
          ? { ...wf, status: wf.status === 'active' ? 'paused' : 'active' }
          : wf
      )
    );
  };

  const handleRunNow = (wf: WorkflowItem) => {
    createNewSession();
    setTimeout(() => {
      sendMessage(wf.prompt);
    }, 100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-cardBorder overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-sidebarBorder flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <RotateCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-textPrimary flex items-center gap-2">
                Scheduled Workflows
                <span className="text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Polar Engine
                </span>
              </h2>
              <p className="text-xs text-textSecondary">
                Tarefas com gatilhos automáticos baseados em tempo e comandos rápidos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-textMuted hover:text-textPrimary hover:bg-sidebarHover transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Workflows */}
        <div className="p-5 overflow-y-auto space-y-3">
          {workflows.map((wf) => (
            <div
              key={wf.id}
              className="border border-cardBorder rounded-xl p-4 bg-white hover:border-zinc-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-textPrimary">{wf.name}</h3>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      wf.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}
                  >
                    {wf.status === 'active' ? '● Ativo' : '○ Pausado'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-textSecondary">
                  <div className="flex items-center gap-1 text-textPrimary font-medium">
                    <Clock className="w-3.5 h-3.5 text-textMuted" />
                    <span>{wf.schedule}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-textMuted">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Última execução: {wf.lastRun}</span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleStatus(wf.id)}
                  className="px-2.5 py-1 rounded-lg border border-cardBorder text-xs text-textSecondary hover:bg-sidebarHover hover:text-textPrimary transition flex items-center gap-1.5"
                >
                  {wf.status === 'active' ? (
                    <>
                      <Pause className="w-3 h-3 text-amber-500" />
                      <span>Pausar</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-500" />
                      <span>Retomar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleRunNow(wf)}
                  className="px-3 py-1 rounded-lg bg-polarBlue hover:bg-polarBlueHover text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Play className="w-3 h-3" />
                  <span>Run now</span>
                </button>
              </div>
            </div>
          ))}

          {/* Card para Adicionar Novo Workflow */}
          <button
            onClick={() => {
              createNewSession();
              setTimeout(() => {
                sendMessage('Crie um novo workflow de monitoramento semanal');
              }, 100);
              onClose();
            }}
            className="w-full border border-dashed border-cardBorder rounded-xl p-4 flex items-center justify-center gap-2 text-xs text-textSecondary hover:text-polarBlue hover:border-polarBlue hover:bg-polarBlue/5 transition"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Criar Novo Workflow com Agendamento</span>
          </button>
        </div>
      </div>
    </div>
  );
};
