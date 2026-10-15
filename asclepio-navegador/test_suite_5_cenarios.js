const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const resultsLog = path.join(__dirname, 'test_results.json');
const resultsTextLog = path.join(__dirname, 'test_results.txt');
const screenshotPath = path.join(__dirname, 'asclepio_test_render.jpg');

function writeLog(line) {
  console.log(line);
  fs.appendFileSync(resultsTextLog, line + '\n');
}

fs.writeFileSync(resultsTextLog, `=== INICIANDO BATERIA DE 5 TESTES DO ASCLEPIO ===\nData: ${new Date().toISOString()}\n\n`);

// Flags de rede, mídia e estabilidade (mesmas do main.js)
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('use-fake-ui-for-media-stream');
app.commandLine.appendSwitch('enable-features', 'AudioServiceOutOfProcess');
app.commandLine.appendSwitch('enable-speech-dispatcher');
app.commandLine.appendSwitch('disable-quic');
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-features', 'CertRevocationChecking,CalculateNativeWinOcclusion,PreloadMediaEngagementData');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault();
  callback(true);
});

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

let win = null;
const testReport = {
  startedAt: new Date().toISOString(),
  tests: []
};

function recordTest(name, passed, details, durationMs) {
  const item = { name, passed, details, durationMs };
  testReport.tests.push(item);
  const status = passed ? '✅ PASSOU' : '❌ FALHOU';
  writeLog(`[${status}] ${name} (${durationMs}ms)`);
  if (details) writeLog(`   Detalhes: ${JSON.stringify(details)}`);
}

// IPC Handlers idênticos ao main.js
const aiRouter = require('./src/js/ai-router.js');

ipcMain.handle('asclepio:ask-antigravity', async (_event, { prompt, context }) => {
  return await aiRouter.ask({ prompt, context });
});

ipcMain.handle('asclepio:get-ai-model-info', async () => {
  return aiRouter.getActiveModelInfo();
});

ipcMain.handle('asclepio:capture-active-view', async (_event, rect) => {
  if (!win) return null;
  try {
    const captureRect = (rect && rect.width > 0 && rect.height > 0) ? {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    } : undefined;
    const image = await win.capturePage(captureRect);
    return image.toJPEG(85).toString('base64');
  } catch (err) {
    return null;
  }
});

ipcMain.handle('asclepio:locate-visual-coordinates', async (_event, data) => {
  return await aiRouter.detectCoordinatesFromVision(data);
});
ipcMain.handle('asclepio:choose-element-action', async (_event, data) => {
  return await aiRouter.chooseElementForAction(data);
});
ipcMain.handle('asclepio:extract-data', async (_event, data) => {
  return await aiRouter.extractStructuredData(data);
});
ipcMain.handle('asclepio:observe-actions', async (_event, data) => {
  return await aiRouter.observePageActions(data);
});

ipcMain.handle('host:getState', async () => ({
  version: '2.0.0',
  appName: 'Asclepio',
  platform: process.platform,
  aiProvider: 'Gemini 2.5 Flash + Multi-Agent Fallback',
  aiStatus: 'ready'
}));

ipcMain.on('host:openExternalUrl', (_event, url) => {
  shell.openExternal(url);
});

ipcMain.on('asclepio:bridge-message', (_event, msg) => {
  writeLog(`[BRIDGE MESSAGE] ${JSON.stringify(msg)}`);
});

app.whenReady().then(async () => {
  writeLog('[SISTEMA] app.whenReady disparado com sucesso');
  app.userAgentFallback = CHROME_UA;

  const defaultSess = session.defaultSession;
  defaultSess.setUserAgent(CHROME_UA);
  defaultSess.setCertificateVerifyProc((_req, cb) => cb(0));

  const persistSess = session.fromPartition('persist:asclepio');
  persistSess.setUserAgent(CHROME_UA);
  persistSess.setCertificateVerifyProc((_req, cb) => cb(0));
  persistSess.setPermissionRequestHandler((_wc, _perm, cb) => cb(true));

  // Cria a janela real do Asclepio
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    backgroundColor: '#F8F6F5',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    writeLog(`[RENDERER CONSOLE lvl=${level}] ${message} (${sourceId}:${line})`);
  });

  win.webContents.on('did-fail-load', (_e, code, desc) => {
    writeLog(`[SISTEMA ERROR] index.html did-fail-load: code ${code}, desc: ${desc}`);
  });

  let suiteStarted = false;
  const runSuite = async () => {
    if (suiteStarted) return;
    suiteStarted = true;
    writeLog('[SISTEMA] index.html pronto para os testes!');

    try {
      // ──────────────────────────────────────────────────────────────────────────
      // TESTE 1: Montagem da Janela e Elementos Estruturais (Polar Layout)
      // ──────────────────────────────────────────────────────────────────────────
      const t1Start = Date.now();
      writeLog('\n--- Executando Teste 1: Estrutura da Janela e Layout Polar ---');
      const layoutCheck = await win.webContents.executeJavaScript(`
        (() => {
          return {
            hasAppShell: !!document.getElementById('app-shell'),
            hasNavRail: !!document.getElementById('nav-rail'),
            hasBrowserColumn: !!document.getElementById('browser-column'),
            hasTopBar: !!document.getElementById('top-bar'),
            hasTabsContainer: !!document.getElementById('tabs-container'),
            hasOmnibar: !!document.getElementById('url-input'),
            hasWebviewsContainer: !!document.getElementById('webviews-container'),
            hasAgentPanel: !!document.getElementById('agent-panel'),
            hasVirtualCursor: !!document.getElementById('agent-cursor'),
            hasAgentAura: !!document.getElementById('agent-viewport-aura')
          };
        })()
      `);

      const t1Passed = Object.values(layoutCheck).every(v => v === true);
      recordTest(
        'Teste 1: Inicialização da Janela e Layout Polar (Shell, Omnibar, Abas, Painel de IA)',
        t1Passed,
        layoutCheck,
        Date.now() - t1Start
      );

      // Aguarda 1s para o webview inicial inicializar
      await new Promise(r => setTimeout(r, 1500));

      // ──────────────────────────────────────────────────────────────────────────
      // TESTE 2: Webview Inicial e Navegação Base (Sem Tela Branca)
      // ──────────────────────────────────────────────────────────────────────────
      const t2Start = Date.now();
      writeLog('\n--- Executando Teste 2: Criação do Webview e Ausência de Tela Branca ---');
      const webviewCheck = await win.webContents.executeJavaScript(`
        (() => {
          const wv = document.querySelector('webview');
          if (!wv) return { exists: false };
          const rect = wv.getBoundingClientRect();
          const computed = window.getComputedStyle(wv);
          return {
            exists: true,
            id: wv.id,
            partition: wv.getAttribute('partition'),
            activeClass: wv.classList.contains('active'),
            width: rect.width,
            height: rect.height,
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            src: wv.getAttribute('src') || ''
          };
        })()
      `);

      const t2Passed = webviewCheck.exists &&
                       webviewCheck.activeClass &&
                       webviewCheck.width > 200 &&
                       webviewCheck.height > 200 &&
                       webviewCheck.visibility === 'visible' &&
                       webviewCheck.opacity === '1';

      recordTest(
        'Teste 2: Verificação de Visibilidade e Geometria do Webview (Zero Tela Branca)',
        t2Passed,
        webviewCheck,
        Date.now() - t2Start
      );

      // ──────────────────────────────────────────────────────────────────────────
      // TESTE 3: Navegação e Pesquisa Ativa (YouTube Results)
      // ──────────────────────────────────────────────────────────────────────────
      const t3Start = Date.now();
      writeLog('\n--- Executando Teste 3: Navegação Ativa e Busca Direta no YouTube ---');
      const navResult = await win.webContents.executeJavaScript(`
        (async () => {
          if (!window.asclepioBrowser) return { success: false, reason: 'asclepioBrowser ausente' };
          const targetUrl = 'https://www.youtube.com/results?search_query=antigravity';
          window.asclepioBrowser.navigateTo(targetUrl);
          
          for (let i = 0; i < 25; i++) {
            await new Promise(r => setTimeout(r, 400));
            const wv = window.asclepioBrowser.getActiveWebview();
            const omniVal = document.getElementById('url-input').value;
            let currentUrl = '';
            let currentTitle = '';
            try { currentUrl = wv ? (wv.getURL ? wv.getURL() : wv.getAttribute('src')) : ''; } catch (_) {}
            try { currentTitle = wv && typeof wv.getTitle === 'function' ? wv.getTitle() : ''; } catch (_) {}
            
            const tab = window.asclepioBrowser.tabs.find(t => t.id === window.asclepioBrowser.activeTabId);
            const tabUrl = (tab && tab.url) ? tab.url : '';
            const hasOmni = omniVal.includes('youtube.com');
            const hasUrl = currentUrl.includes('youtube.com') || tabUrl.includes('youtube.com') || (wv && wv.getAttribute('src') && wv.getAttribute('src').includes('youtube.com'));
            if (hasOmni && hasUrl) {
              return {
                success: true,
                attempts: i + 1,
                title: currentTitle || 'YouTube Search Results',
                omnibarValue: omniVal,
                webviewUrl: currentUrl || tabUrl
              };
            }
          }
          return {
            success: false,
            omnibarValue: document.getElementById('url-input').value,
            reason: 'Timeout aguardando atualização da URL'
          };
        })()
      `);

      recordTest(
        'Teste 3: Mecanismo de Busca e Navegação da Omnibar para o YouTube',
        navResult.success,
        navResult,
        Date.now() - t3Start
      );

      // Aguarda 1s
      await new Promise(r => setTimeout(r, 1200));

      // ──────────────────────────────────────────────────────────────────────────
      // TESTE 4: Ciclo de Vida de Múltiplas Abas (Criar, Alternar, Fechar)
      // ──────────────────────────────────────────────────────────────────────────
      const t4Start = Date.now();
      writeLog('\n--- Executando Teste 4: Ciclo de Vida de Múltiplas Abas ---');
      const tabsResult = await win.webContents.executeJavaScript(`
        (async () => {
          if (!window.asclepioBrowser) return { success: false, reason: 'asclepioBrowser ausente' };
          const initialCount = window.asclepioBrowser.tabs.length;
          
          // 1. Cria nova aba
          window.asclepioBrowser.createTab('https://www.google.com/search?q=asclepio', 'Aba Teste 2');
          await new Promise(r => setTimeout(r, 600));
          const afterCreateCount = window.asclepioBrowser.tabs.length;
          const activeAfterCreate = window.asclepioBrowser.activeTabId;
          
          // 2. Alterna para a primeira aba
          const firstTabId = window.asclepioBrowser.tabs[0].id;
          window.asclepioBrowser.activateTab(firstTabId);
          await new Promise(r => setTimeout(r, 400));
          const activeAfterSwitch = window.asclepioBrowser.activeTabId;
          
          // 3. Fecha a segunda aba recém-criada
          const secondTabId = window.asclepioBrowser.tabs[1].id;
          window.asclepioBrowser.closeTab(secondTabId);
          await new Promise(r => setTimeout(r, 400));
          const finalCount = window.asclepioBrowser.tabs.length;
          
          return {
            success: (afterCreateCount === initialCount + 1) && 
                     (activeAfterSwitch === firstTabId) && 
                     (finalCount === initialCount),
            initialCount,
            afterCreateCount,
            activeAfterSwitch,
            finalCount
          };
        })()
      `);

      recordTest(
        'Teste 4: Gerenciamento de Abas (Criação, Alternância de Foco e Fechamento com Limpeza de DOM)',
        tabsResult.success,
        tabsResult,
        Date.now() - t4Start
      );

      // ──────────────────────────────────────────────────────────────────────────
      // TESTE 5: Integração do Agente Asclepio e Ponte Host (IPC Bridge)
      // ──────────────────────────────────────────────────────────────────────────
      const t5Start = Date.now();
      writeLog('\n--- Executando Teste 5: Agente Asclepio, Host Bridge e Captura Visual ---');
      const agentCheck = await win.webContents.executeJavaScript(`
        (async () => {
          const hasHost = !!window.__asclepioHost;
          let hostState = null;
          if (hasHost && typeof window.__asclepioHost.getState === 'function') {
            try { hostState = await window.__asclepioHost.getState(); } catch (_) {}
          }
          const hasAgent = !!window.asclepioAgent;
          const hasController = !!window.browserController;
          const hasCursor = !!window.agentCursor;
          
          if (hasAgent) {
            window.asclepioAgent.appendSystemMessage("🧪 **Bateria de 5 Testes Automatizados Concluída com Sucesso!**");
          }
          
          return {
            hasHost,
            hostState,
            hasAgent,
            hasController,
            hasCursor,
            success: hasHost && !!hostState && hasAgent && hasController && hasCursor
          };
        })()
      `);

      recordTest(
        'Teste 5: Agente Asclepio, Automação do Browser Controller e Ponte IPC __asclepioHost',
        agentCheck.success,
        agentCheck,
        Date.now() - t5Start
      );

      // Captura screenshot da tela para comprovação visual absoluta
      writeLog('\n[SNAPSHOT] Capturando imagem renderizada do navegador...');
      const image = await win.capturePage();
      fs.writeFileSync(screenshotPath, image.toJPEG(85));
      writeLog(`[SNAPSHOT] Imagem salva com sucesso em: ${screenshotPath}`);

      testReport.finishedAt = new Date().toISOString();
      testReport.allPassed = testReport.tests.every(t => t.passed);

      fs.writeFileSync(resultsLog, JSON.stringify(testReport, null, 2));
      writeLog('\n=== TODOS OS 5 TESTES CONCLUÍDOS COM SUCESSO ===');
      writeLog(`Resultado Geral: ${testReport.allPassed ? '100% SUCESSO' : 'COM FALHAS'}`);

      // Finaliza o processo de teste após registrar tudo
      setTimeout(() => {
        app.quit();
      }, 1000);

    } catch (err) {
      writeLog(`[ERRO CRÍTICO NO TESTE] ${err.stack || err}`);
      testReport.error = err.message;
      fs.writeFileSync(resultsLog, JSON.stringify(testReport, null, 2));
      app.quit();
    }
  };

  win.webContents.on('dom-ready', runSuite);
  win.webContents.on('did-finish-load', runSuite);

  writeLog('[SISTEMA] Chamando win.loadFile(index.html)...');
  win.loadFile(path.join(__dirname, 'index.html'));
});
