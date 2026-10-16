import React, { useEffect } from 'react';
import { AppHeader } from './components/AppHeader';
import { Sidebar } from './components/Sidebar';
import { AgentCanvas } from './components/AgentCanvas';
import { BrowserPane } from './components/BrowserPane';
import { useBrowserStore } from './store';

export const App: React.FC = () => {
  const initAgentListeners = useBrowserStore((state) => state.initAgentListeners);

  useEffect(() => {
    initAgentListeners();
  }, [initAgentListeners]);
  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden select-none">
      {/* 1. Header do Aplicativo (Abas e Controles de Janela) */}
      <AppHeader />

      {/* 2. Área Central com as 3 Colunas Integradas */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Coluna 1: Sidebar de Navegação e Recentes */}
        <Sidebar />

        {/* Coluna 2: Canvas de Conversa e Ações da IA */}
        <AgentCanvas />

        {/* Coluna 3: Navegador Embutido Real (Split-View ou Janela Flutuante) */}
        <BrowserPane />
      </main>
    </div>
  );
};

export default App;
