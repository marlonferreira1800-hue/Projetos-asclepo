const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');

const logFile = path.join(__dirname, 'asclepio_debug.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { fs.appendFileSync(logFile, line); } catch (_) {}
  console.log(msg);
}

process.on('uncaughtException', (err) => {
  log(`[Asclepio Main] Uncaught Exception: ${err ? err.stack || err : ''}`);
});
process.on('unhandledRejection', (reason) => {
  log(`[Asclepio Main] Unhandled Rejection: ${reason}`);
});

log(`[Asclepio Main] Starting process PID: ${process.pid}`);
app.setPath('userData', path.join(app.getPath('appData'), 'AsclepioBrowser'));
const gotTheLock = app.requestSingleInstanceLock();
log(`[Asclepio Main] gotTheLock: ${gotTheLock}`);
if (!gotTheLock) {
  log('[Asclepio Main] Duplicate instance detected, quitting.');
  app.quit();
}

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

const AGY_PATH = 'C:\\Users\\marlo\\AppData\\Local\\agy\\bin\\agy.exe';

let mainWindow = null;

// ─── WINDOW CREATION ─────────────────────────────────────────────────────────
function createWindow() {
  console.log('[Asclepio Main] Calling createWindow()...');
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1100,
    minHeight: 680,
    title: 'Asclepio',
    backgroundColor: '#202020',      // --cn-900: Polar dark
    frame: true,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      // Needed for microphone + media permissions
      experimentalFeatures: false
    }
  });

  log(`[Asclepio Main] BrowserWindow created, id: ${mainWindow.id}`);

  // Maximizado e visível ao abrir — exatamente como o Polar abre
  mainWindow.maximize();
  mainWindow.show();
  mainWindow.focus();

  mainWindow.webContents.on('did-finish-load', () => {
    log('[Asclepio Main] index.html did-finish-load');
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_e, code, desc) => {
    log(`[Asclepio Main] index.html did-fail-load: code ${code}, desc: ${desc}`);
  });

  // Log renderer errors
  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    log(`[Asclepio:${level >= 3 ? 'ERROR' : 'LOG'}] ${message} (${sourceId}:${line})`);
  });

  log('[Asclepio Main] Loading index.html...');
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Forward popup requests as new tabs (replicates Polar tab handling)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    mainWindow.webContents.send('asclepio:new-tab', url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    log('[Asclepio Main] mainWindow closed.');
    mainWindow = null;
  });
}

// ─── APP LIFECYCLE ────────────────────────────────────────────────────────────
log('[Asclepio Main] Registering app.whenReady...');
app.whenReady().then(() => {
  log('[Asclepio Main] app.whenReady triggered!');
  // Override UA for ALL network requests (prevents YouTube bot detection)
  app.userAgentFallback = CHROME_UA;

  const defaultSess = session.defaultSession;
  defaultSess.setUserAgent(CHROME_UA);

  // ── PERMISSIONS: auto-approve microphone/media like Polar does ──
  defaultSess.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['media', 'microphone', 'audio-capture', 'geolocation', 'notifications'];
    callback(allowed.includes(permission) || true);
  });

  // ── Named persist session for tabs (cookies, login state survives restart) ──
  const persistSess = session.fromPartition('persist:asclepio');
  persistSess.setUserAgent(CHROME_UA);
  persistSess.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(true);
  });

  // Fix CORS/CSP issues for webviews
  persistSess.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    // Remove restrictive X-Frame-Options so embedded pages load
    delete headers['x-frame-options'];
    delete headers['X-Frame-Options'];
    callback({ responseHeaders: headers });
  });

  // ── PASSO 5: ADBLOCKER NATIVO NO NÍVEL DE REDE (Engine Brave / Ghostery) ──
  try {
    ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
      blocker.enableBlockingInSession(defaultSess);
      blocker.enableBlockingInSession(persistSess);
      log('[Asclepio Main] Adblocker nativo ativado com sucesso em todas as sessões!');
    }).catch(err => {
      log(`[Asclepio Main] Aviso ao baixar listas do adblocker: ${err.message}`);
    });
  } catch (err) {
    log(`[Asclepio Main] Falha no adblocker: ${err.message}`);
  }

  createWindow();

  // Focus existing window if launched again (single instance)
  app.on('second-instance', () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC: ASCLEPIO MULTI-MODEL AI ROUTER (com Fallback Simultâneo) ───────────
const aiRouter = require('./src/js/ai-router.js');

ipcMain.handle('asclepio:ask-antigravity', async (_event, { prompt, context }) => {
  return await aiRouter.ask({ prompt, context });
});

ipcMain.handle('asclepio:get-ai-model-info', async () => {
  return aiRouter.getActiveModelInfo();
});

// ─── PASSO 3: CAPTURA DE TELA PARA GROUNDING VISUAL MULTIMODAL (OPEN-INTERPRETER) ─
ipcMain.handle('asclepio:capture-active-view', async () => {
  if (!mainWindow) return null;
  try {
    const image = await mainWindow.capturePage();
    return image.toJPEG(85).toString('base64');
  } catch (err) {
    log(`[Asclepio Main] Erro ao capturar tela: ${err.message}`);
    return null;
  }
});

// ─── PASSO 3: GROUNDING VISUAL MULTIMODAL COM GEMINI 2.5 FLASH ─────────────
ipcMain.handle('asclepio:locate-visual-coordinates', async (_event, { imageBase64, targetDescription }) => {
  return await aiRouter.detectCoordinatesFromVision({ imageBase64, targetDescription });
});

// ─── PASSO 1: DECISÃO INTELIGENTE DE ELEMENTO SoM (BROWSER-USE) ──────────────
ipcMain.handle('asclepio:choose-element-action', async (_event, { instruction, elementMap }) => {
  return await aiRouter.chooseElementForAction({ instruction, elementMap });
});

// ─── PASSO 2: EXTRAÇÃO ESTRUTURADA DE DADOS DA PÁGINA (STAGEHAND EXTRACT) ───
ipcMain.handle('asclepio:extract-data', async (_event, { instruction, pageText }) => {
  return await aiRouter.extractStructuredData({ instruction, pageText });
});

// ─── PASSO 2: OBSERVAÇÃO INTELIGENTE DE AÇÕES DISPONÍVEIS (STAGEHAND OBSERVE) ─
ipcMain.handle('asclepio:observe-actions', async (_event, { pageTitle, pageUrl, elementMap }) => {
  return await aiRouter.observePageActions({ pageTitle, pageUrl, elementMap });
});

// ─── IPC: HOST STATE (mirrors Polar's host.getState) ─────────────────────────
ipcMain.handle('host:getState', async () => ({
  version: '2.0.0',
  appName: 'Asclepio',
  platform: process.platform,
  aiProvider: 'Gemini 2.5 Flash + Multi-Agent Fallback',
  aiStatus: 'ready'
}));

// ─── IPC: OPEN EXTERNAL LINK ──────────────────────────────────────────────────
ipcMain.on('host:openExternalUrl', (_event, url) => {
  shell.openExternal(url);
});

