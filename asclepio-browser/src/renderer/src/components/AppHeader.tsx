import React, { useState, useEffect } from 'react';
import { useBrowserStore } from '../store';
import {
  Menu,
  Plus,
  Settings,
  Minus,
  Square,
  X,
  Check,
  ShieldCheck,
  Key,
  Eye,
  EyeOff,
  Cpu,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import type { AIModel } from '../../preload';

export const AppHeader: React.FC = () => {
  const {
    toggleSidebar,
    sessions,
    activeSessionId,
    setActiveSession,
    createNewSession,
    closeSession
  } = useBrowserStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modelsList, setModelsList] = useState<AIModel[]>([]);
  const [activeModelId, setActiveModelId] = useState<string>('meta/llama-3.2-11b-vision-instruct');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Carrega chave e modelos salvos ao abrir o modal
  useEffect(() => {
    if (isSettingsOpen) {
      // 1. Carrega Chave
      const localKey = localStorage.getItem('asclepio_nvidia_api_key');
      if (localKey) {
        setApiKeyInput(localKey);
      } else if (window.api?.getApiKey) {
        window.api.getApiKey().then((res) => {
          if (res?.key) {
            setApiKeyInput(res.key);
          }
        });
      }

      // 2. Carrega Modelos
      if (window.api?.getModels) {
        window.api.getModels().then((res) => {
          if (res?.models && res.models.length > 0) {
            setModelsList(res.models);
            if (res.current) {
              setActiveModelId(res.current.id);
            }
          }
        });
      }
    }
  }, [isSettingsOpen]);

  const handleSaveKey = async () => {
    const cleanKey = apiKeyInput.trim();
    if (!cleanKey) return;

    localStorage.setItem('asclepio_nvidia_api_key', cleanKey);
    if (window.api?.setApiKey) {
      await window.api.setApiKey(cleanKey);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleSelectModel = async (modelId: string, index: number) => {
    setActiveModelId(modelId);
    localStorage.setItem('asclepio_selected_model', modelId);
    if (window.api?.setModelIndex) {
      await window.api.setModelIndex(index);
    }
  };

  const handleApplyCustomModel = async () => {
    const cleanId = customModelInput.trim();
    if (!cleanId) return;

    setActiveModelId(cleanId);
    localStorage.setItem('asclepio_selected_model', cleanId);
    if (window.api?.setCustomModel) {
      const res = await window.api.setCustomModel(cleanId);
      if (res?.models) {
        setModelsList(res.models);
      }
    }
    setCustomModelInput('');
    setIsCustomMode(false);
  };

  const handleMinimize = () => window.api?.minimizeWindow();
  const handleMaximize = () => window.api?.maximizeWindow();
  const handleClose = () => window.api?.closeWindow();

  return (
    <header className="h-10 bg-white border-b border-sidebarBorder flex items-center justify-between px-3 z-50 shrink-0 select-none app-drag-region app-region-drag" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Esquerda: Toggle Sidebar + Abas de Tarefa */}
      <div className="flex items-center gap-2 h-full app-no-drag app-region-no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button
          onClick={toggleSidebar}
          className="p-1.5 text-textSecondary hover:text-textPrimary hover:bg-sidebarHover rounded transition"
          title="Recolher/Exibir Sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Abas Superiores de Sessões/Tarefas */}
        <div className="flex items-center gap-1 h-full pt-1 overflow-x-auto max-w-[70vw]">
          {sessions.slice(0, 4).map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => setActiveSession(session.id)}
                className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold h-full rounded-t-md cursor-pointer transition border-t-2 ${
                  isActive
                    ? 'bg-white border-polarBlue text-textPrimary shadow-xs'
                    : 'bg-transparent border-transparent text-textSecondary hover:bg-sidebarHover font-normal'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-polarBlue' : 'bg-zinc-300'}`} />
                <span className="truncate max-w-[200px]">{session.title || 'New task'}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(session.id);
                  }}
                  className="text-textMuted hover:text-textPrimary hover:bg-zinc-200 rounded px-1 transition text-xs"
                  title="Fechar Tarefa"
                >
                  ×
                </button>
              </div>
            );
          })}

          {/* Botão Configurações */}
          <div
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center gap-1.5 px-3 py-1 hover:bg-sidebarHover text-xs text-textSecondary hover:text-polarBlue h-full rounded-t-md cursor-pointer transition font-medium"
            title="Configurar Chave de API e Modelos de IA"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </div>

          {/* Botão Nova Aba / Nova Tarefa */}
          <button
            onClick={createNewSession}
            className="p-1 hover:bg-sidebarHover text-textSecondary rounded transition"
            title="Nova Tarefa"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Região de Arrasto Central da Janela Frameless */}
      <div
        className="flex-1 h-full cursor-grab active:cursor-grabbing flex items-center justify-center text-[10px] text-zinc-300 font-mono tracking-widest select-none app-drag-region"
        style={{ WebkitAppRegion: 'drag' } as any}
        title="Clique e arraste para mover a janela"
      >
        <span>:::</span>
      </div>

      {/* Direita: Avatar N1 + Controles Windows */}
      <div className="flex items-center gap-3 app-no-drag" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <div
          className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-xs"
          title="Usuário Ativo: Marlon (N1)"
        >
          N1
        </div>
        <div className="flex items-center text-textMuted text-xs gap-3 pr-1">
          <button onClick={handleMinimize} className="hover:text-textPrimary p-1" title="Minimizar">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleMaximize} className="hover:text-textPrimary p-1" title="Maximizar / Restaurar">
            <Square className="w-3 h-3" />
          </button>
          <button onClick={handleClose} className="hover:text-rose-600 p-1" title="Fechar">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Modal Completo de Configuração de IA e Chave de API */}
      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs app-no-drag p-4 animate-in fade-in duration-150"
          style={{ WebkitAppRegion: 'no-drag' } as any}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSettingsOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-cardBorder w-full max-w-lg p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b pb-3 border-zinc-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-polarBlue/10 flex items-center justify-center text-polarBlue">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-textPrimary">Painel do Asclepio Browser</h3>
                  <p className="text-[11px] text-textSecondary">Configure sua Chave de API e escolha manualmente o modelo de IA</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 p-1 rounded-lg hover:bg-zinc-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="space-y-5 overflow-y-auto pr-1 text-xs text-zinc-700">
              {/* 1. SEÇÃO DE CHAVE DE API DA NVIDIA */}
              <div className="space-y-2 p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-textPrimary flex items-center gap-1.5 text-xs">
                    <Key className="w-3.5 h-3.5 text-polarBlue" />
                    <span>Chave de API NVIDIA (Manual)</span>
                  </label>
                  {saveSuccess && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Chave Ativa!
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-textSecondary leading-relaxed">
                  Insira sua chave própria (<code className="font-mono bg-zinc-200/60 px-1 py-0.5 rounded text-[10px]">nvapi-...</code>). Ela é salva e utilizada diretamente pelo motor de inferência.
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex-1 relative flex items-center">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="nvapi-..."
                      className="w-full bg-white border border-cardBorder focus:border-polarBlue focus:ring-1 focus:ring-polarBlue/30 rounded-lg px-3 py-2 pr-9 text-xs font-mono text-textPrimary outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 text-zinc-400 hover:text-zinc-600 p-0.5"
                      title={showKey ? 'Ocultar Chave' : 'Exibir Chave'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={handleSaveKey}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-polarBlue hover:bg-polarBlueHover text-white font-medium rounded-lg text-xs transition active:scale-95 shadow-xs shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>

              {/* 2. SEÇÃO DE ESCOLHA MANUAL DO MODELO DE IA */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-textPrimary flex items-center gap-1.5 text-xs">
                    <Cpu className="w-3.5 h-3.5 text-polarBlue" />
                    <span>Modelos de IA Disponíveis na NVIDIA API</span>
                  </label>
                  <button
                    onClick={() => setIsCustomMode(!isCustomMode)}
                    className="text-[11px] text-polarBlue hover:underline font-medium"
                  >
                    {isCustomMode ? '← Ver Modelos Recomendados' : '+ Inserir Outro ID'}
                  </button>
                </div>

                {isCustomMode ? (
                  /* Campo para Digitar Qualquer Modelo Customizado */
                  <div className="p-3 bg-zinc-50 border border-cardBorder rounded-xl space-y-2">
                    <p className="text-[11px] text-textSecondary">
                      Digite o identificador exato do modelo na NVIDIA Integrate API:
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        placeholder="ex: nvidia/llama-3.1-nemotron-70b-instruct"
                        className="flex-1 bg-white border border-cardBorder rounded-lg px-3 py-1.5 text-xs font-mono text-textPrimary outline-none focus:border-polarBlue"
                      />
                      <button
                        onClick={handleApplyCustomModel}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium"
                      >
                        Ativar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Grade / Lista de Modelos Escolhíveis Manualmente */
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {modelsList.map((model, idx) => {
                      const isSelected = activeModelId === model.id;
                      return (
                        <div
                          key={model.id}
                          onClick={() => handleSelectModel(model.id, idx)}
                          className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-polarBlue bg-polarBlue/5 shadow-2xs'
                              : 'border-cardBorder bg-white hover:bg-zinc-50 hover:border-zinc-300'
                          }`}
                        >
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-textPrimary text-xs truncate">
                                {model.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                                {model.provider}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-sans font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  ⚡ ~1s
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-textSecondary truncate">
                              {model.description}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isSelected ? (
                              <span className="w-5 h-5 rounded-full bg-polarBlue text-white flex items-center justify-center text-xs shadow-xs font-bold">
                                ✓
                              </span>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-zinc-300" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. DIAGNÓSTICO DO SISTEMA */}
              <div className="p-3 bg-zinc-50 border border-zinc-200/60 rounded-xl space-y-1.5 text-[11px] text-zinc-600">
                <div className="flex justify-between py-0.5">
                  <span>Versão do Navegador:</span>
                  <span className="font-mono text-zinc-900 font-medium">v1.2.0 (Polar Core)</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Controle Físico CDP:</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ativo (Porta 9223)
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span>Pool de Contingência:</span>
                  <span className="text-polarBlue font-medium">
                    10 Modelos NVIDIA com Failover Ativo
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="pt-2 flex items-center justify-between border-t border-zinc-100 shrink-0">
              <span className="text-[11px] text-textSecondary flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Modelo Ativo: <strong>{activeModelId.split('/').pop()}</strong></span>
              </span>

              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium transition active:scale-95 shadow-xs"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
