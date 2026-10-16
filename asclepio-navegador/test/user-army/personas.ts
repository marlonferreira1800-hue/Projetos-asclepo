import type { BugReport, PersonaResult } from './types.ts';

// =========================================================================
// PERSONA 1: LUCAS "THE SPEEDSTER" (Power User & High Concurrency)
// =========================================================================
export async function runLucasTests(storeModule: any): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;

  const { useBrowserStore } = storeModule;

  // Scenario 1.1: Rapid Session Creation (Stress Test)
  scenariosRun++;
  try {
    const initialCount = useBrowserStore.getState().sessions.length;
    for (let i = 0; i < 5; i++) {
      useBrowserStore.getState().createNewSession();
    }
    const currentSessions = useBrowserStore.getState().sessions;
    const currentActiveId = useBrowserStore.getState().activeSessionId;

    if (currentSessions.length !== initialCount + 5) {
      bugs.push({
        id: 'BUG-LUCAS-01',
        personaName: 'Lucas Speed',
        title: 'Falha na criação rápida concorrente de sessões',
        severity: 'HIGH',
        category: 'STATE_DESYNC',
        description: `Esperava ${initialCount + 5} sessões, mas foram criadas ${currentSessions.length}.`,
        reproductionSteps: ['Disparar createNewSession() 5 vezes consecutivas rapidamente.'],
        expected: `${initialCount + 5} sessões com IDs únicos.`,
        actual: `${currentSessions.length} sessões registradas.`,
        fixed: false
      });
    } else if (currentSessions[0].id !== currentActiveId) {
      bugs.push({
        id: 'BUG-LUCAS-02',
        personaName: 'Lucas Speed',
        title: 'Sessão ativa não aponta para a sessão recém-criada',
        severity: 'MEDIUM',
        category: 'STATE_DESYNC',
        description: 'Ao criar nova sessão, a activeSessionId não foi atualizada para a mais recente.',
        reproductionSteps: ['Chamar createNewSession()', 'Verificar activeSessionId'],
        expected: currentSessions[0].id,
        actual: currentActiveId,
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-LUCAS-CRASH',
      personaName: 'Lucas Speed',
      title: 'Crash durante criação rápida de sessões',
      severity: 'CRITICAL',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['Chamar createNewSession() em loop'],
      expected: 'Execução síncrona segura',
      actual: err.stack || err.message,
      fixed: false
    });
  }

  // Scenario 1.2: Envio de Mensagens Vazias ou com apenas Espaços
  scenariosRun++;
  try {
    const activeSessionBefore = useBrowserStore.getState().sessions.find(
      (s: any) => s.id === useBrowserStore.getState().activeSessionId
    );
    const msgCountBefore = activeSessionBefore?.messages.length || 0;

    useBrowserStore.getState().sendMessage('');
    useBrowserStore.getState().sendMessage('    \n\t  ');

    const activeSessionAfter = useBrowserStore.getState().sessions.find(
      (s: any) => s.id === useBrowserStore.getState().activeSessionId
    );
    const msgCountAfter = activeSessionAfter?.messages.length || 0;

    if (msgCountAfter > msgCountBefore) {
      bugs.push({
        id: 'BUG-LUCAS-03',
        personaName: 'Lucas Speed',
        title: 'Mensagens vazias ou de espaços em branco são enviadas para o chat',
        severity: 'LOW',
        category: 'USABILITY',
        description: 'O chat permitiu o envio de mensagens com espaços vazios, poluindo a UI.',
        reproductionSteps: ['sendMessage("")', 'sendMessage("   ")'],
        expected: 'Mensagens vazias devem ser descartadas.',
        actual: `Mensagens aumentaram de ${msgCountBefore} para ${msgCountAfter}.`,
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-LUCAS-04',
      personaName: 'Lucas Speed',
      title: 'Erro ao validar mensagem vazia',
      severity: 'MEDIUM',
      category: 'UI_FREEZE',
      description: err.message,
      reproductionSteps: ['sendMessage("")'],
      expected: 'Ignorar',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Lucas Speed',
    role: 'Power User & Concurrency Tester',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 2: SOFIA "THE TAB HOARDER" (Multi-Tab & Session Persistence)
// =========================================================================
export async function runSofiaTests(storeModule: any): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;

  const { useBrowserStore } = storeModule;

  // Scenario 2.1: Session-Scoped Tab Persistence (Perda de Abas ao Trocar de Sessão)
  scenariosRun++;
  try {
    // 1. Cria Sessão Alpha
    useBrowserStore.getState().createNewSession();
    const sessionAlphaId = useBrowserStore.getState().activeSessionId;

    // Abre 3 abas na Sessão Alpha
    useBrowserStore.getState().createTab('https://www.youtube.com');
    useBrowserStore.getState().createTab('https://github.com');
    const tabsInAlphaBefore = useBrowserStore.getState().tabs.length;

    // 2. Cria Sessão Beta
    useBrowserStore.getState().createNewSession();
    const sessionBetaId = useBrowserStore.getState().activeSessionId;
    useBrowserStore.getState().createTab('https://news.ycombinator.com');

    // 3. Volta para a Sessão Alpha
    useBrowserStore.getState().setActiveSession(sessionAlphaId);
    const tabsInAlphaAfter = useBrowserStore.getState().tabs.length;

    if (tabsInAlphaAfter < tabsInAlphaBefore) {
      bugs.push({
        id: 'BUG-SOFIA-01',
        personaName: 'Sofia Tab-Hoarder',
        title: 'Perda catastrófica de abas ao alternar entre sessões (Data Loss)',
        severity: 'CRITICAL',
        category: 'DATA_LOSS',
        description: `Ao alternar para outra sessão e voltar, as ${tabsInAlphaBefore} abas abertas pelo usuário foram apagadas e substituídas por apenas 1 aba padrão.`,
        reproductionSteps: [
          'Abrir 3 abas na Sessão 1',
          'Criar ou alternar para a Sessão 2',
          'Voltar para a Sessão 1',
          'Verificar lista de abas'
        ],
        expected: `Preservar todas as ${tabsInAlphaBefore} abas abertas da Sessão 1.`,
        actual: `Restaram apenas ${tabsInAlphaAfter} abas.`,
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-SOFIA-ERROR-01',
      personaName: 'Sofia Tab-Hoarder',
      title: 'Exceção ao alternar sessões com múltiplas abas',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['setActiveSession()'],
      expected: 'Troca de sessão fluida',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 2.2: Fechamento de Sessão Ativa (`closeSession`)
  scenariosRun++;
  try {
    const hasCloseSession = typeof useBrowserStore.getState().closeSession === 'function';
    if (!hasCloseSession) {
      bugs.push({
        id: 'BUG-SOFIA-02',
        personaName: 'Sofia Tab-Hoarder',
        title: 'Botão de fechar sessão "×" no AppHeader não possui ação (Função closeSession inexistente)',
        severity: 'HIGH',
        category: 'USABILITY',
        description: 'O usuário clica no "×" da aba de sessão no topo da tela, mas nada acontece pois a action closeSession não existe na store.',
        reproductionSteps: ['Verificar se store possui closeSession(sessionId)'],
        expected: 'closeSession deve existir, remover a sessão e ativar a próxima disponível.',
        actual: 'Função closeSession é undefined na store.',
        fixed: false
      });
    } else {
      const beforeCount = useBrowserStore.getState().sessions.length;
      const targetId = useBrowserStore.getState().activeSessionId;
      useBrowserStore.getState().closeSession(targetId);
      const afterCount = useBrowserStore.getState().sessions.length;

      if (afterCount !== beforeCount - 1) {
        bugs.push({
          id: 'BUG-SOFIA-03',
          personaName: 'Sofia Tab-Hoarder',
          title: 'closeSession falhou em remover a sessão especificada',
          severity: 'HIGH',
          category: 'STATE_DESYNC',
          description: `Esperava ${beforeCount - 1} sessões, restaram ${afterCount}.`,
          reproductionSteps: ['closeSession(activeSessionId)'],
          expected: `${beforeCount - 1} sessões`,
          actual: `${afterCount} sessões`,
          fixed: false
        });
      } else {
        scenariosPassed++;
      }
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-SOFIA-ERROR-02',
      personaName: 'Sofia Tab-Hoarder',
      title: 'Erro ao fechar sessão',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['closeSession()'],
      expected: 'Remoção segura',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 2.3: Fechar todas as abas até 0 e reviver o navegador
  scenariosRun++;
  try {
    const tabs = [...useBrowserStore.getState().tabs];
    for (const t of tabs) {
      useBrowserStore.getState().closeTab(t.id);
    }
    const currentTabs = useBrowserStore.getState().tabs;
    const isBrowserOpen = useBrowserStore.getState().isBrowserOpen;

    if (currentTabs.length !== 0 || isBrowserOpen !== false) {
      bugs.push({
        id: 'BUG-SOFIA-04',
        personaName: 'Sofia Tab-Hoarder',
        title: 'Navegador não fecha corretamente quando todas as abas são encerradas',
        severity: 'MEDIUM',
        category: 'STATE_DESYNC',
        description: 'Ao fechar a última aba, o isBrowserOpen deveria ser false e tabs vazio.',
        reproductionSteps: ['closeTab em todas as abas'],
        expected: 'tabs: [], isBrowserOpen: false',
        actual: `tabs: ${currentTabs.length}, isBrowserOpen: ${isBrowserOpen}`,
        fixed: false
      });
    } else {
      // Tenta reabrir o navegador chamando openBrowser
      useBrowserStore.getState().openBrowser('https://www.google.com');
      const revivedTabs = useBrowserStore.getState().tabs;
      const revivedOpen = useBrowserStore.getState().isBrowserOpen;

      if (revivedTabs.length === 0 || !revivedOpen) {
        bugs.push({
          id: 'BUG-SOFIA-05',
          personaName: 'Sofia Tab-Hoarder',
          title: 'openBrowser falha ao reviver o navegador após todas as abas terem sido fechadas',
          severity: 'HIGH',
          category: 'UI_FREEZE',
          description: 'openBrowser não criou uma nova aba ao ser invocado com 0 abas.',
          reproductionSteps: ['Fechar todas as abas', 'Chamar openBrowser("https://www.google.com")'],
          expected: 'Navegador aberto com 1 aba ativa em google.com',
          actual: `tabs: ${revivedTabs.length}, isOpen: ${revivedOpen}`,
          fixed: false
        });
      } else {
        scenariosPassed++;
      }
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-SOFIA-ERROR-03',
      personaName: 'Sofia Tab-Hoarder',
      title: 'Erro ao zerar abas',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['closeTab() em loop'],
      expected: 'Fechar suavemente',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Sofia Tab-Hoarder',
    role: 'Multi-Tab & Persistence Tester',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 3: CARLOS "THE CHAOS FUZZER" (Fuzzer & Edge Cases)
// =========================================================================
export async function runCarlosTests(storeModule: any): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;

  const { useBrowserStore } = storeModule;

  // Scenario 3.1: Envio de Payload Gigante (50.000 caracteres)
  scenariosRun++;
  try {
    const hugePayload = '🚀 Teste de estresse com IA '.repeat(2000);
    useBrowserStore.getState().sendMessage(hugePayload);

    const activeSession = useBrowserStore.getState().sessions.find(
      (s: any) => s.id === useBrowserStore.getState().activeSessionId
    );
    const lastMsg = activeSession?.messages[activeSession.messages.length - 2];

    if (!lastMsg || !lastMsg.content.startsWith('🚀 Teste')) {
      bugs.push({
        id: 'BUG-CARLOS-01',
        personaName: 'Carlos Fuzzer',
        title: 'Mensagens volumosas sofrem corrupção ou perda no feed',
        severity: 'MEDIUM',
        category: 'UI_FREEZE',
        description: 'O store não registrou adequadamente a mensagem de alto volume.',
        reproductionSteps: ['sendMessage(hugePayload)'],
        expected: 'Mensagem íntegra registrada',
        actual: 'Mensagem truncada ou perdida',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-CARLOS-02',
      personaName: 'Carlos Fuzzer',
      title: 'Crash ao enviar string de 50.000 caracteres',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['sendMessage(50k chars)'],
      expected: 'Suportar sem crash',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 3.2: Fuzzing de Alternância Rápida de Telas (SplitView & Sidebar)
  scenariosRun++;
  try {
    for (let i = 0; i < 20; i++) {
      useBrowserStore.getState().toggleSplitView();
      useBrowserStore.getState().toggleSidebar();
    }
    const state = useBrowserStore.getState();
    if (typeof state.isSplitView !== 'boolean' || typeof state.isSidebarOpen !== 'boolean') {
      bugs.push({
        id: 'BUG-CARLOS-03',
        personaName: 'Carlos Fuzzer',
        title: 'Estado boolean corrompido em toggle frequente',
        severity: 'MEDIUM',
        category: 'STATE_DESYNC',
        description: 'isSplitView ou isSidebarOpen deixou de ser boolean.',
        reproductionSteps: ['20 toggles consecutivos'],
        expected: 'boolean válido',
        actual: `${typeof state.isSplitView}, ${typeof state.isSidebarOpen}`,
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-CARLOS-04',
      personaName: 'Carlos Fuzzer',
      title: 'Crash em toggle rápido de layout',
      severity: 'HIGH',
      category: 'UI_FREEZE',
      description: err.message,
      reproductionSteps: ['toggleSplitView() em loop'],
      expected: 'Executar suavemente',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Carlos Fuzzer',
    role: 'Chaos & Boundary Tester',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 4: BEATRIZ "THE USABILITY & ACCESSIBILITY AUDITOR"
// =========================================================================
export async function runBeatrizTests(storeModule: any, projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;

  const { useBrowserStore } = storeModule;

  // Scenario 4.1: Nível de Esforço (Effort Level) e Integração com o Agente
  scenariosRun++;
  try {
    const levels: Array<'Low' | 'Medium' | 'High' | 'Max'> = ['Low', 'Medium', 'High', 'Max'];
    for (const lvl of levels) {
      useBrowserStore.getState().setEffort(lvl);
      if (useBrowserStore.getState().effort !== lvl) {
        throw new Error(`Falha ao definir esforço para ${lvl}`);
      }
    }
    scenariosPassed++;
  } catch (err: any) {
    bugs.push({
      id: 'BUG-BEATRIZ-01',
      personaName: 'Beatriz A11y',
      title: 'Slider de Esforço (Effort) não atualiza estado global',
      severity: 'MEDIUM',
      category: 'STATE_DESYNC',
      description: err.message,
      reproductionSteps: ['setEffort("High")'],
      expected: 'effort === "High"',
      actual: useBrowserStore.getState().effort,
      fixed: false
    });
  }

  // Scenario 4.2: Auditoria de Draggability da Janela Frameless Electron
  scenariosRun++;
  try {
    const fs = await import('fs');
    const path = await import('path');
    const headerPath = path.join(projectRoot, 'src', 'renderer', 'src', 'components', 'AppHeader.tsx');
    const headerCode = fs.readFileSync(headerPath, 'utf-8');

    const hasDragRegion = headerCode.includes('app-region') || headerCode.includes('-webkit-app-region');

    if (!hasDragRegion) {
      bugs.push({
        id: 'BUG-BEATRIZ-02',
        personaName: 'Beatriz A11y',
        title: 'Janela sem bordas (frame: false) não possui região de arrasto (-webkit-app-region: drag)',
        severity: 'HIGH',
        category: 'USABILITY',
        description: 'Como a janela possui frame: false, o usuário fica impossibilitado de clicar e arrastar a janela pela barra de título no Windows.',
        reproductionSteps: ['Inspecionar AppHeader.tsx por classes ou estilos de arrasto'],
        expected: 'Barra de cabeçalho com classe de arrasto e botões com no-drag',
        actual: 'Nenhum estilo -webkit-app-region configurado no AppHeader',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-BEATRIZ-ERROR-02',
      personaName: 'Beatriz A11y',
      title: 'Erro ao auditar cabeçalho',
      severity: 'LOW',
      category: 'USABILITY',
      description: err.message,
      reproductionSteps: ['Ler AppHeader.tsx'],
      expected: 'Arquivo legível',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Beatriz A11y',
    role: 'Usability & Accessibility Auditor',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 5: DANIEL "THE AI & CDP ROBUSTNESS ARCHITECT"
// =========================================================================
export async function runDanielTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;

  const fs = await import('fs');
  const path = await import('path');

  // Scenario 5.1: Auditoria do Extrator de JSON do Orchestrator
  scenariosRun++;
  try {
    const orchPath = path.join(projectRoot, 'src', 'main', 'agent', 'orchestrator.ts');
    const orchCode = fs.readFileSync(orchPath, 'utf-8');

    // Verifica se há o bug do loop infinito de navegação se lower.includes('youtube')
    const hasInfiniteLoopRisk = orchCode.includes("if (lower.includes('youtube'))") &&
      !orchCode.includes("!snapshot.url.includes('youtube')");

    if (hasInfiniteLoopRisk) {
      bugs.push({
        id: 'BUG-DANIEL-01',
        personaName: 'Daniel AI Architect',
        title: 'Loop infinito de navegação na IA quando JSON falha em passos subsequentes',
        severity: 'HIGH',
        category: 'AI_LOGIC',
        description: 'Se o objetivo contiver "youtube" e o modelo responder em texto puro no passo 2 ou 3, o fallback re-navega para youtube.com indefinidamente em vez de operar na página atual.',
        reproductionSteps: [
          'Goal: "abra o youtube toque jogado aos tubaroes"',
          'Passo 1 navega para youtube.com',
          'Passo 2 modelo responde texto sem JSON',
          'Fallback detecta "youtube" no goal e re-navega para youtube.com'
        ],
        expected: 'Só navegar diretamente se a página atual ainda NÃO for youtube.com',
        actual: 'Navega repetidamente a cada passo sem verificar a URL atual',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-DANIEL-02',
      personaName: 'Daniel AI Architect',
      title: 'Erro ao analisar orchestrator.ts',
      severity: 'HIGH',
      category: 'AI_LOGIC',
      description: err.message,
      reproductionSteps: ['Ler orchestrator.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 5.2: Auditoria de Resiliência no CDPController (Destroyed WebContents)
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasDestroyedCheck = cdpCode.includes('isDestroyed()') || cdpCode.includes("contents.on('destroyed'");

    if (!hasDestroyedCheck) {
      bugs.push({
        id: 'BUG-DANIEL-03',
        personaName: 'Daniel AI Architect',
        title: 'Vulnerabilidade de crash ao tentar enviar comando CDP para WebContents destruído',
        severity: 'CRITICAL',
        category: 'CRASH_RISK',
        description: 'Se o usuário fechar uma aba ou o webview for desmontado, o cdpController retém a referência morta e causa crash na chamada debugger.sendCommand.',
        reproductionSteps: ['Fechar webview', 'Executar cdpController.getSemanticSnapshot()'],
        expected: 'Verificar isDestroyed() antes de qualquer comando e limpar referência se destruído',
        actual: 'Nenhuma checagem isDestroyed() encontrada no CDPController',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-DANIEL-04',
      personaName: 'Daniel AI Architect',
      title: 'Erro ao auditar cdp-controller.ts',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['Ler cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 5.3: Auditoria do BrowserPane - Sincronização de URL ao Trocar de Aba
  scenariosRun++;
  try {
    const panePath = path.join(projectRoot, 'src', 'renderer', 'src', 'components', 'BrowserPane.tsx');
    const paneCode = fs.readFileSync(panePath, 'utf-8');

    // Ao mudar activeTabId, ele chama webviewRef.current.loadURL(activeTab.url)?
    const hasLoadUrlOnTabChange = paneCode.includes('loadURL(activeTab.url)');

    if (!hasLoadUrlOnTabChange) {
      bugs.push({
        id: 'BUG-DANIEL-05',
        personaName: 'Daniel AI Architect',
        title: 'Webview não carrega nova URL ao alternar de aba (Browser Desync)',
        severity: 'CRITICAL',
        category: 'STATE_DESYNC',
        description: 'Ao clicar em outra aba na barra de abas, apenas o campo de texto da URL é atualizado, mas o motor Chromium continua exibindo o site da aba anterior.',
        reproductionSteps: [
          'Abrir Aba 1 (YouTube)',
          'Abrir Aba 2 (Google)',
          'Clicar na Aba 1',
          'Verificar se webview.loadURL foi disparado'
        ],
        expected: 'webview.loadURL(activeTab.url) deve ser invocado ao trocar a aba ativa',
        actual: 'Apenas setUrlInput() é chamado no useEffect de activeTab?.url',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-DANIEL-06',
      personaName: 'Daniel AI Architect',
      title: 'Erro ao auditar BrowserPane.tsx',
      severity: 'HIGH',
      category: 'STATE_DESYNC',
      description: err.message,
      reproductionSteps: ['Ler BrowserPane.tsx'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 5.4: Auditoria de Anti-Loop Guard no Orchestrator
  scenariosRun++;
  try {
    const orchPath = path.join(projectRoot, 'src', 'main', 'agent', 'orchestrator.ts');
    const orchCode = fs.readFileSync(orchPath, 'utf-8');

    const hasAntiLoopGuard = orchCode.includes('ANTI-LOOP GUARD') &&
                             orchCode.includes('isSameDomain') &&
                             orchCode.includes('results?search_query=');

    if (!hasAntiLoopGuard) {
      bugs.push({
        id: 'BUG-DANIEL-07',
        personaName: 'Daniel AI Architect',
        title: 'Ausência de Anti-Loop Guard no Orchestrator',
        severity: 'CRITICAL',
        category: 'AI_LOGIC',
        description: 'Se o modelo emitir navegação para o mesmo domínio onde já está, o orchestrator entrará em loop cíclico sem direcionar para a busca.',
        reproductionSteps: ['Modelo tenta navigate para mesma URL'],
        expected: 'Bloqueio de re-navegação e redirecionamento de busca',
        actual: 'Orchestrator executa navegação redundante indefinidamente',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-DANIEL-08',
      personaName: 'Daniel AI Architect',
      title: 'Erro ao validar Anti-Loop Guard',
      severity: 'HIGH',
      category: 'AI_LOGIC',
      description: err.message,
      reproductionSteps: ['Validar orchestrator.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 5.5: Auditoria de Suporte a Shadow DOM no CDPController
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasShadowDomSupport = cdpCode.includes('shadowRoot') && cdpCode.includes('queryAllDeep');

    if (!hasShadowDomSupport) {
      bugs.push({
        id: 'BUG-DANIEL-09',
        personaName: 'Daniel AI Architect',
        title: 'CDPController não perfura Shadow DOM em páginas modernas como YouTube',
        severity: 'HIGH',
        category: 'AI_LOGIC',
        description: 'Elementos de busca e vídeo dentro de Polymer/WebComponents ficam invisíveis para o agente.',
        reproductionSteps: ['Executar snapshot em página com Shadow DOM'],
        expected: 'queryAllDeep com travessia de shadowRoot',
        actual: 'Apenas querySelectorAll superficial',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-DANIEL-10',
      personaName: 'Daniel AI Architect',
      title: 'Erro ao validar Shadow DOM no CDPController',
      severity: 'HIGH',
      category: 'AI_LOGIC',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 5.6: Auditoria de Auto-Hide do Ghost Cursor no Store
  scenariosRun++;
  try {
    const storePath = path.join(projectRoot, 'src', 'renderer', 'src', 'store.ts');
    const storeCode = fs.readFileSync(storePath, 'utf-8');

    const hasCursorAutoHide = storeCode.includes('isAgentActing: false') &&
                              storeCode.includes('setTimeout') &&
                              storeCode.includes('stopAgent');

    if (!hasCursorAutoHide) {
      bugs.push({
        id: 'BUG-DANIEL-11',
        personaName: 'Daniel AI Architect',
        title: 'Cursor fantasma não possui auto-limpeza ou suporte a parada de emergência',
        severity: 'MEDIUM',
        category: 'UI_FREEZE',
        description: 'O cursor fantasma fica permanentemente desenhado sobre o webview e não há método de parada limpa.',
        reproductionSteps: ['Executar ação com cursor', 'Verificar se o cursor desaparece'],
        expected: 'Auto-hide suave após término e suporte a stopAgent()',
        actual: 'Cursor congelado sobre o conteúdo do navegador',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-DANIEL-12',
      personaName: 'Daniel AI Architect',
      title: 'Erro ao validar Auto-Hide do Cursor no store.ts',
      severity: 'HIGH',
      category: 'UI_FREEZE',
      description: err.message,
      reproductionSteps: ['Validar store.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Daniel AI Architect',
    role: 'AI & CDP Robustness Architect',
    icon: '🧠',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 6: HELENA "THE SPA & WEBCOMPONENTS MASTER"
// =========================================================================
export async function runHelenaTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 6.1: Auditoria de Perfuração Recursiva de Shadow DOM (Polymer / YouTube)
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasDeepShadow = cdpCode.includes('queryAllDeep') &&
                          cdpCode.includes('shadowRoot') &&
                          cdpCode.includes('TreeWalker');

    if (!hasDeepShadow) {
      bugs.push({
        id: 'BUG-HELENA-01',
        personaName: 'Helena SPA Master',
        title: 'Falha na extração de nós WebComponents dentro de Shadow DOM',
        severity: 'HIGH',
        category: 'AI_LOGIC',
        description: 'Elementos aninhados em Shadow Roots não são identificados em componentes modernos.',
        reproductionSteps: ['Testar página com Custom Elements ou Polymer'],
        expected: 'queryAllDeep recursivo perfurando shadowRoot',
        actual: 'Seletores convencionais ignoram Shadow DOM',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-HELENA-02',
      personaName: 'Helena SPA Master',
      title: 'Erro ao validar Shadow DOM',
      severity: 'HIGH',
      category: 'AI_LOGIC',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 6.2: Auditoria de Sincronização Atômica de Virtual DOM (React/Vue Value Setters)
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasVDomSync = cdpCode.includes('prototypeValueSetter') &&
                        cdpCode.includes("dispatchEvent(new Event('input'") &&
                        cdpCode.includes("dispatchEvent(new Event('change'");

    if (!hasVDomSync) {
      bugs.push({
        id: 'BUG-HELENA-03',
        personaName: 'Helena SPA Master',
        title: 'Perda de dados em inputs controlados por Virtual DOM (React/Vue/Svelte)',
        severity: 'CRITICAL',
        category: 'DATA_LOSS',
        description: 'Inputs digitados via script perdem o valor no submit porque setters nativos não foram chamados.',
        reproductionSteps: ['Preencher formulário React controlado'],
        expected: 'Chamar prototypeValueSetter.call() e despachar input/change',
        actual: 'Apenas atribuição el.value = text',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-HELENA-04',
      personaName: 'Helena SPA Master',
      title: 'Erro ao validar Virtual DOM',
      severity: 'HIGH',
      category: 'DATA_LOSS',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 6.3: Auditoria de Espera Ativa de Hidratação de SPA
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasHydrationWait = cdpCode.includes('rawElements.length <= 3') &&
                             cdpCode.includes('youtube.com');

    if (!hasHydrationWait) {
      bugs.push({
        id: 'BUG-HELENA-05',
        personaName: 'Helena SPA Master',
        title: 'Snapshot prematuro em SPAs causando tela vazia de 2 elementos',
        severity: 'HIGH',
        category: 'AI_LOGIC',
        description: 'Ao navegar para o YouTube, o snapshot captura o esqueleto inicial antes da hidratação.',
        reproductionSteps: ['Navegar para YouTube', 'Executar snapshot imediatamente'],
        expected: 'Retentativa com delay quando elementos <= 3',
        actual: 'Snapshot retorna apenas esqueleto inicial',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-HELENA-06',
      personaName: 'Helena SPA Master',
      title: 'Erro ao validar hidratação',
      severity: 'HIGH',
      category: 'AI_LOGIC',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Helena SPA Master',
    role: 'Shadow DOM & Virtual DOM Specialist',
    icon: '🌐',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 7: MARCOS "THE NETWORK & RESILIENCE TESTER"
// =========================================================================
export async function runMarcosTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 7.1: Auditoria de Interrupção Limpa com AbortController
  scenariosRun++;
  try {
    const orchPath = path.join(projectRoot, 'src', 'main', 'agent', 'orchestrator.ts');
    const orchCode = fs.readFileSync(orchPath, 'utf-8');

    const hasAbortController = orchCode.includes('this.abortController = new AbortController()') &&
                               orchCode.includes('this.abortController?.signal.aborted') &&
                               orchCode.includes('this.abortController.abort()');

    if (!hasAbortController) {
      bugs.push({
        id: 'BUG-MARCOS-01',
        personaName: 'Marcos Network Tester',
        title: 'Falta de mecanismo de cancelamento imediato na execução de objetivos',
        severity: 'HIGH',
        category: 'UI_FREEZE',
        description: 'Quando o usuário clica em Stop, o loop continua rodando até o maxSteps.',
        reproductionSteps: ['Iniciar objetivo', 'Chamar stop()'],
        expected: 'Interrupção imediata no próximo passo com AbortController',
        actual: 'Execução continua em background',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-MARCOS-02',
      personaName: 'Marcos Network Tester',
      title: 'Erro ao validar AbortController',
      severity: 'HIGH',
      category: 'UI_FREEZE',
      description: err.message,
      reproductionSteps: ['Validar orchestrator.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 7.2: Auditoria de Timeout de Navegação e Auto-Fallback de IA
  scenariosRun++;
  try {
    const poolPath = path.join(projectRoot, 'src', 'main', 'agent', 'nvidia-pool.ts');
    const poolCode = fs.readFileSync(poolPath, 'utf-8');

    const hasFallbackLoop = poolCode.includes('generateWithFallback') &&
                            poolCode.includes('TOP_10_NVIDIA_MODELS');

    if (!hasFallbackLoop) {
      bugs.push({
        id: 'BUG-MARCOS-03',
        personaName: 'Marcos Network Tester',
        title: 'Ausência de pool de contingência para falhas de rede de IA',
        severity: 'CRITICAL',
        category: 'CRASH_RISK',
        description: 'Se o modelo primário sofrer rate-limit ou timeout, a aplicação trava.',
        reproductionSteps: ['Simular erro 429 ou 503 na API'],
        expected: 'Fallback automático sequencial entre modelos',
        actual: 'Erro lançado diretamente para o usuário',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-MARCOS-04',
      personaName: 'Marcos Network Tester',
      title: 'Erro ao validar Pool de IA',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['Validar nvidia-pool.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Marcos Network Tester',
    role: 'Network Resilience & Timeout Auditor',
    icon: '⚡',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 8: RENATA "THE SECURITY & SANDBOX GUARDIAN"
// =========================================================================
export async function runRenataTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 8.1: Auditoria de Supressão de Popups Nativos e Janelas Não Solicitadas
  scenariosRun++;
  try {
    const mainPath = path.join(projectRoot, 'src', 'main', 'index.ts');
    const mainCode = fs.readFileSync(mainPath, 'utf-8');

    const hasPopupDenial = mainCode.includes('setWindowOpenHandler') &&
                           mainCode.includes("action: 'deny'");

    if (!hasPopupDenial) {
      bugs.push({
        id: 'BUG-RENATA-01',
        personaName: 'Renata Security Guardian',
        title: 'Vulnerabilidade a popups maliciosos e janelas não solicitadas',
        severity: 'CRITICAL',
        category: 'SECURITY',
        description: 'Páginas web podem abrir novas janelas descontroladas e sequestrar o foco do navegador.',
        reproductionSteps: ['Executar window.open em página maliciosa'],
        expected: 'setWindowOpenHandler intercepta e delega ou nega com segurança',
        actual: 'Popups abertos sem controle',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-RENATA-02',
      personaName: 'Renata Security Guardian',
      title: 'Erro ao auditar index.ts',
      severity: 'HIGH',
      category: 'SECURITY',
      description: err.message,
      reproductionSteps: ['Validar index.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 8.2: Auditoria de Sanitização de URLs na Omnibar
  scenariosRun++;
  try {
    const panePath = path.join(projectRoot, 'src', 'renderer', 'src', 'components', 'BrowserPane.tsx');
    const paneCode = fs.readFileSync(panePath, 'utf-8');

    const hasUrlSanitization = paneCode.includes("startsWith('http://')") &&
                              paneCode.includes("startsWith('https://')") &&
                              paneCode.includes('encodeURIComponent');

    if (!hasUrlSanitization) {
      bugs.push({
        id: 'BUG-RENATA-03',
        personaName: 'Renata Security Guardian',
        title: 'Falta de sanitização e redirecionamento de busca na Omnibar',
        severity: 'MEDIUM',
        category: 'SECURITY',
        description: 'Digitar termos com espaços ou URLs sem protocolo causa erro de carregamento.',
        reproductionSteps: ['Digitar termo de busca na Omnibar e pressionar Enter'],
        expected: 'Redirecionamento automático para Google com encodeURIComponent',
        actual: 'Tentativa de carregar string literal como URL',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-RENATA-04',
      personaName: 'Renata Security Guardian',
      title: 'Erro ao validar Omnibar',
      severity: 'HIGH',
      category: 'SECURITY',
      description: err.message,
      reproductionSteps: ['Validar BrowserPane.tsx'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Renata Security Guardian',
    role: 'Security & Sandbox Auditor',
    icon: '🛡️',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 9: TIAGO "THE STATE & IPC SYNCHRONIZER"
// =========================================================================
export async function runTiagoTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 9.1: Auditoria de Eventos Bidirecionais de Navegação (Chromium -> UI)
  scenariosRun++;
  try {
    const mainPath = path.join(projectRoot, 'src', 'main', 'index.ts');
    const mainCode = fs.readFileSync(mainPath, 'utf-8');

    const hasNavEvents = mainCode.includes('browser:url-changed') &&
                         mainCode.includes('browser:title-changed');

    if (!hasNavEvents) {
      bugs.push({
        id: 'BUG-TIAGO-01',
        personaName: 'Tiago State Sync',
        title: 'Perda de sincronia de URL/Título entre Chromium Guest e UI Electron',
        severity: 'HIGH',
        category: 'STATE_DESYNC',
        description: 'Quando o site navega internamente (SPA), a Omnibar e a aba não atualizam.',
        reproductionSteps: ['Clicar em link em SPA', 'Verificar barra de endereços'],
        expected: 'Disparo de browser:url-changed e browser:title-changed',
        actual: 'Barra desatualizada',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-TIAGO-02',
      personaName: 'Tiago State Sync',
      title: 'Erro ao validar eventos IPC',
      severity: 'HIGH',
      category: 'STATE_DESYNC',
      description: err.message,
      reproductionSteps: ['Validar index.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 9.2: Auditoria de Preload Bridge e Tipagem Segura
  scenariosRun++;
  try {
    const preloadPath = path.join(projectRoot, 'src', 'preload', 'index.ts');
    const preloadCode = fs.readFileSync(preloadPath, 'utf-8');

    const hasSafeBridge = preloadCode.includes('contextBridge.exposeInMainWorld') &&
                          preloadCode.includes('runGoal') &&
                          preloadCode.includes('stopAgent');

    if (!hasSafeBridge) {
      bugs.push({
        id: 'BUG-TIAGO-03',
        personaName: 'Tiago State Sync',
        title: 'Preload script não expõe métodos essenciais no objeto window.api',
        severity: 'CRITICAL',
        category: 'CRASH_RISK',
        description: 'Renderer tenta invocar window.api.runGoal e falha com TypeError: undefined is not a function.',
        reproductionSteps: ['Verificar window.api em ambiente Electron'],
        expected: 'exposeInMainWorld com métodos runGoal e stopAgent',
        actual: 'Métodos ausentes no preload',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-TIAGO-04',
      personaName: 'Tiago State Sync',
      title: 'Erro ao auditar preload/index.ts',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['Validar preload/index.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Tiago State Sync',
    role: 'IPC & State Synchronizer',
    icon: '🔄',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 10: LARISSA "THE GHOST CURSOR & UX FEEDBACK SPECIALIST"
// =========================================================================
export async function runLarissaTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 10.1: Auditoria do Protocolo Físico de Clique (Mouse move -> Press -> Release)
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasPhysicalProtocol = cdpCode.includes("type: 'mouseMoved'") &&
                                cdpCode.includes("type: 'mousePressed'") &&
                                cdpCode.includes("type: 'mouseReleased'");

    if (!hasPhysicalProtocol) {
      bugs.push({
        id: 'BUG-LARISSA-01',
        personaName: 'Larissa Ghost Cursor',
        title: 'Protocolo de clique físico incompleto (Vulnerabilidade a Ghost Clicks)',
        severity: 'HIGH',
        category: 'USABILITY',
        description: 'Cliques simulados apenas com mousePressed falham em menus dropdowns e botões com hover pre-flight.',
        reproductionSteps: ['Clicar em menu suspenso sensível a hover'],
        expected: 'mouseMoved com delay prévio antes de mousePressed e mouseReleased',
        actual: 'Disparo direto sem hover',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-LARISSA-02',
      personaName: 'Larissa Ghost Cursor',
      title: 'Erro ao validar clique físico',
      severity: 'HIGH',
      category: 'USABILITY',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 10.2: Auditoria de Renderização do Cursor com Tooltip na Interface
  scenariosRun++;
  try {
    const panePath = path.join(projectRoot, 'src', 'renderer', 'src', 'components', 'BrowserPane.tsx');
    const paneCode = fs.readFileSync(panePath, 'utf-8');

    const hasCursorElement = paneCode.includes('agent-ghost-cursor') &&
                             paneCode.includes('isAgentActing') &&
                             paneCode.includes('cursorTooltip');

    if (!hasCursorElement) {
      bugs.push({
        id: 'BUG-LARISSA-03',
        personaName: 'Larissa Ghost Cursor',
        title: 'Falta de feedback visual das ações físicas do agente no navegador',
        severity: 'MEDIUM',
        category: 'USABILITY',
        description: 'O usuário não consegue ver onde o agente está clicando ou o que está digitando.',
        reproductionSteps: ['Executar ação de agente'],
        expected: 'Cursor fantasma com tooltip explicativo animado',
        actual: 'Ações invisíveis sem indicador de cursor',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-LARISSA-04',
      personaName: 'Larissa Ghost Cursor',
      title: 'Erro ao validar cursor no BrowserPane.tsx',
      severity: 'HIGH',
      category: 'USABILITY',
      description: err.message,
      reproductionSteps: ['Validar BrowserPane.tsx'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Larissa Ghost Cursor',
    role: 'Ghost Cursor & Hardware Emulation Auditor',
    icon: '🎯',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 11: EDUARDO "THE CRASH RECOVERY SPECIALIST"
// =========================================================================
export async function runEduardoTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 11.1: Auditoria de Proteção contra Crash em WebContents Desmontados
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasEnsureAttached = cdpCode.includes('ensureAttached') &&
                              cdpCode.includes('isDestroyed()') &&
                              cdpCode.includes('attachDebugger');

    if (!hasEnsureAttached) {
      bugs.push({
        id: 'BUG-EDUARDO-01',
        personaName: 'Eduardo Crash Recovery',
        title: 'Crash fatal ao invocar CDP em janela/aba fechada',
        severity: 'CRITICAL',
        category: 'CRASH_RISK',
        description: 'Tentar enviar comando para debugger sem checagem de estado ativo causa término forçado do Electron.',
        reproductionSteps: ['Fechar aba durante requisição CDP'],
        expected: 'Lançar erro tratável sem derrubar o processo principal',
        actual: 'Unhandled exception no processo principal do Electron',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-EDUARDO-02',
      personaName: 'Eduardo Crash Recovery',
      title: 'Erro ao auditar cdp-controller.ts',
      severity: 'HIGH',
      category: 'CRASH_RISK',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 11.2: Auditoria de Auto-Cura de Sessão Vazia no Store
  scenariosRun++;
  try {
    const storePath = path.join(projectRoot, 'src', 'renderer', 'src', 'store.ts');
    const storeCode = fs.readFileSync(storePath, 'utf-8');

    const hasSessionRecovery = storeCode.includes('fallbackSession') &&
                               storeCode.includes('remaining.length === 0');

    if (!hasSessionRecovery) {
      bugs.push({
        id: 'BUG-EDUARDO-03',
        personaName: 'Eduardo Crash Recovery',
        title: 'Tela em branco ao fechar todas as sessões do navegador',
        severity: 'HIGH',
        category: 'STATE_DESYNC',
        description: 'Fechar a última sessão deixa o estado em branco sem sessão ativa.',
        reproductionSteps: ['Fechar todas as sessões existentes'],
        expected: 'Criar automaticamente uma nova sessão limpa de fallback',
        actual: 'Array vazio com tela travada',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-EDUARDO-04',
      personaName: 'Eduardo Crash Recovery',
      title: 'Erro ao validar store.ts',
      severity: 'HIGH',
      category: 'STATE_DESYNC',
      description: err.message,
      reproductionSteps: ['Validar store.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Eduardo Crash Recovery',
    role: 'Crash Recovery & Fault Tolerance Specialist',
    icon: '🚑',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}

// =========================================================================
// PERSONA 12: CAMILA "THE MEMORY LEAK & RESOURCE AUDITOR"
// =========================================================================
export async function runCamilaTests(projectRoot: string): Promise<PersonaResult> {
  const bugs: BugReport[] = [];
  const start = Date.now();
  let scenariosRun = 0;
  let scenariosPassed = 0;
  const fs = await import('fs');
  const path = await import('path');

  // Scenario 12.1: Auditoria de Remoção de Event Listeners no WebContents
  scenariosRun++;
  try {
    const panePath = path.join(projectRoot, 'src', 'renderer', 'src', 'components', 'BrowserPane.tsx');
    const paneCode = fs.readFileSync(panePath, 'utf-8');

    const hasCleanRemoval = paneCode.includes('removeEventListener') &&
                            paneCode.includes('onDidNavigate') &&
                            paneCode.includes('onTitleUpdated');

    if (!hasCleanRemoval) {
      bugs.push({
        id: 'BUG-CAMILA-01',
        personaName: 'Camila Memory Auditor',
        title: 'Vazamento contínuo de Event Listeners ao remontar abas do navegador',
        severity: 'HIGH',
        category: 'MEMORY_LEAK',
        description: 'Listeners adicionados no useEffect sem função de cleanup geram acúmulo de memória e callbacks duplicados.',
        reproductionSteps: ['Alternar abas 50 vezes'],
        expected: 'Remover todos os listeners na cleanup function do useEffect',
        actual: 'Acúmulo de listeners na instância webview',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-CAMILA-02',
      personaName: 'Camila Memory Auditor',
      title: 'Erro ao validar BrowserPane.tsx',
      severity: 'HIGH',
      category: 'MEMORY_LEAK',
      description: err.message,
      reproductionSteps: ['Validar BrowserPane.tsx'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  // Scenario 12.2: Auditoria de Compressão de Screenshots Base64
  scenariosRun++;
  try {
    const cdpPath = path.join(projectRoot, 'src', 'main', 'agent', 'cdp-controller.ts');
    const cdpCode = fs.readFileSync(cdpPath, 'utf-8');

    const hasOptimizedCapture = cdpCode.includes("format: 'jpeg'") &&
                                cdpCode.includes('quality: 70');

    if (!hasOptimizedCapture) {
      bugs.push({
        id: 'BUG-CAMILA-03',
        personaName: 'Camila Memory Auditor',
        title: 'Vazamento de RAM por screenshots PNG não comprimidas transmitidas via IPC',
        severity: 'MEDIUM',
        category: 'PERFORMANCE',
        description: 'Screenshots brutas em PNG geram payloads de 5MB por frame sobrecarregando o canal IPC.',
        reproductionSteps: ['Capturar screenshots contínuas do webview'],
        expected: 'Formato JPEG com qualidade equilibrada (70%)',
        actual: 'PNG sem compressão',
        fixed: false
      });
    } else {
      scenariosPassed++;
    }
  } catch (err: any) {
    bugs.push({
      id: 'BUG-CAMILA-04',
      personaName: 'Camila Memory Auditor',
      title: 'Erro ao validar compressão de screenshots',
      severity: 'HIGH',
      category: 'PERFORMANCE',
      description: err.message,
      reproductionSteps: ['Validar cdp-controller.ts'],
      expected: 'Arquivo válido',
      actual: err.message,
      fixed: false
    });
  }

  return {
    personaName: 'Camila Memory Auditor',
    role: 'Memory Leak & Resource Auditor',
    icon: '🧹',
    scenariosRun,
    scenariosPassed,
    scenariosFailed: scenariosRun - scenariosPassed,
    bugsFound: bugs,
    durationMs: Date.now() - start
  };
}
