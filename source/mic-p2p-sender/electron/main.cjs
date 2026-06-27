const { app, BrowserWindow, powerSaveBlocker, ipcMain } = require('electron');
const path = require('path');

let blockerId = null;
let win = null;
let launchUrl = process.argv.find(arg => arg.startsWith('sentinel-micp2p://')) || null;

ipcMain.handle('get-launch-url', () => { const u = launchUrl; launchUrl = null; return u; });

if (process.defaultApp) {
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient('sentinel-micp2p', process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient('sentinel-micp2p');
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
      const url = commandLine.find(arg => arg.startsWith('sentinel-micp2p://'));
      if (url) win.webContents.send('sentinel-micp2p-link', url);
    }
  });
  app.whenReady().then(createWindow);
}

function createWindow() {
  blockerId = powerSaveBlocker.start('prevent-app-suspension');
  win = new BrowserWindow({
    width: 420,
    height: 680,
    resizable: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    title: 'Sentinel P2P Sender',
    autoHideMenuBar: true
  });

  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, '../dist/index.html'));

  win.webContents.on('did-finish-load', () => {
    const url = process.argv.find(arg => arg.startsWith('sentinel-micp2p://'));
    if (url) win.webContents.send('sentinel-micp2p-link', url);
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => { if (blockerId !== null) powerSaveBlocker.stop(blockerId); });
