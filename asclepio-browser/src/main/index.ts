import { app, shell, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { cdpController } from './agent/cdp-controller';
import { agentOrchestrator, AgentConfig } from './agent/orchestrator';
import { nvidiaPool, TOP_10_NVIDIA_MODELS } from './agent/nvidia-pool';

// Configurações do Chromium essenciais para IA autônoma e supressão de popups nativos
app.commandLine.appendSwitch('disable-notifications');
app.commandLine.appendSwitch('disable-save-password-bubble');
app.commandLine.appendSwitch('disable-infobars');
app.commandLine.appendSwitch('no-first-run');
app.commandLine.appendSwitch('disable-features', 'PreloadMediaEngagementData');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: true,
    autoHideMenuBar: true,
    frame: false, // Frame minimalista estilo Polar Browser
    title: 'Asclepio Browser - Navegador com IA Autônoma',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webviewTag: true // Habilita a tag nativa <webview> do Chromium
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Carrega URL de desenvolvimento (Vite) ou build estático
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

// ==============================================================
// CAPTURA A WEBVIEW GUEST E ANEXA O CONTROLADOR CDP AUTOMATICAMENTE
// ==============================================================
app.on('web-contents-created', (_, contents) => {
  if (contents.getType() === 'webview') {
    console.log('[Main] Guest webview detectado. Anexando CDPController...');
    cdpController.setWebContents(contents);

    contents.on('did-start-navigation', (_, url) => {
      if (url && url !== 'about:blank' && !url.startsWith('chrome-extension://')) {
        mainWindow?.webContents.send('browser:url-changed', url);
      }
    });

    contents.on('did-navigate', (_, url) => {
      if (url && url !== 'about:blank' && !url.startsWith('chrome-extension://')) {
        mainWindow?.webContents.send('browser:url-changed', url);
      }
    });

    contents.on('page-title-updated', (_, title) => {
      if (title && title !== 'about:blank') {
        mainWindow?.webContents.send('browser:title-changed', title);
      }
    });
  }
});

// ==============================================================
// IPC HANDLERS: CONTROLES DE JANELA
// ==============================================================
ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());

// ==============================================================
// IPC HANDLERS: AGENTE AUTÔNOMO ORCHESTRATOR
// ==============================================================
ipcMain.handle('agent:run-goal', async (_, goal: string, config: AgentConfig = {}) => {
  if (mainWindow) {
    agentOrchestrator.runGoal(goal, mainWindow, config);
  }
  return { status: 'started' };
});

ipcMain.handle('agent:stop', () => {
  agentOrchestrator.stop();
  return { status: 'stopped' };
});

ipcMain.handle('agent:get-key', () => {
  return { key: nvidiaPool.getApiKey() };
});

ipcMain.handle('agent:set-key', (_, key: string) => {
  nvidiaPool.setApiKey(key);
  return { success: true, key: nvidiaPool.getApiKey() };
});

ipcMain.handle('agent:get-models', () => {
  return {
    models: nvidiaPool.getModels(),
    current: nvidiaPool.getCurrentModel()
  };
});

ipcMain.handle('agent:set-model-index', (_, index: number) => {
  nvidiaPool.setModelIndex(index);
  return nvidiaPool.getCurrentModel();
});

ipcMain.handle('agent:set-custom-model', (_, modelId: string, name?: string) => {
  const model = nvidiaPool.setCustomModel(modelId, name);
  return {
    success: true,
    current: model,
    models: nvidiaPool.getModels()
  };
});

// Navegação direta acionada pelo usuário via CDP
ipcMain.handle('browser:navigate', async (_, url: string) => {
  try {
    await cdpController.navigate(url);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
