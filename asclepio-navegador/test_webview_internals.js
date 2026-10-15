const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const logFile = path.join(__dirname, 'webview_internals.log');
fs.writeFileSync(logFile, 'STARTING WEBVIEW INTERNALS 25S TEST\n');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

app.commandLine.appendSwitch('disable-quic');
app.commandLine.appendSwitch('no-proxy-server');
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('disable-features', 'CertRevocationChecking,CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

app.on('certificate-error', (event, _webContents, url, error, _certificate, callback) => {
  event.preventDefault();
  callback(true);
});

app.on('web-contents-created', (_event, contents) => {
  log(`[WC CREATED] Type: ${contents.getType()}, ID: ${contents.id}`);
  contents.on('did-start-loading', () => log(`[WC ${contents.id}] did-start-loading`));
  contents.on('did-stop-loading', () => log(`[WC ${contents.id}] did-stop-loading`));
  contents.on('dom-ready', () => log(`[WC ${contents.id}] dom-ready, URL: ${contents.getURL()}`));
  contents.on('did-finish-load', () => {
    log(`[WC ${contents.id}] did-finish-load, URL: ${contents.getURL()}`);
    if (contents.getType() === 'webview') {
      log(`🎉 WEBVIEW LOADED SUCCESSFULLY!`);
    }
  });
  contents.on('did-fail-load', (_e, code, desc, url) => log(`[WC ${contents.id}] FAIL-LOAD (${code} ${desc}): ${url}`));
  contents.on('page-title-updated', (_e, title) => log(`[WC ${contents.id}] TITLE: ${title}`));
});

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

app.whenReady().then(async () => {
  const defaultSess = session.defaultSession;
  defaultSess.setUserAgent(CHROME_UA);
  defaultSess.setCertificateVerifyProc((_req, cb) => cb(0));

  const persistSess = session.fromPartition('persist:asclepio');
  persistSess.setUserAgent(CHROME_UA);
  persistSess.setCertificateVerifyProc((_req, cb) => cb(0));
  persistSess.setPermissionRequestHandler((_wc, _perm, cb) => cb(true));

  ipcMain.handle('asclepio:get-ai-model-info', async () => ({
    name: 'Gemini 2.5 Flash',
    status: 'ready'
  }));
  ipcMain.handle('host:getState', async () => ({
    version: '2.0.0',
    appName: 'Asclepio',
    platform: process.platform
  }));

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    show: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));

  setTimeout(async () => {
    log('[TAKING SNAPSHOT AT 18s]');
    const img = await win.capturePage();
    fs.writeFileSync(path.join(__dirname, 'webview_at_18s.jpg'), img.toJPEG(85));
    app.quit();
  }, 20000);
});
