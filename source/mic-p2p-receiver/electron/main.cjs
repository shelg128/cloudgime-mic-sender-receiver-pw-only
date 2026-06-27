const { app, BrowserWindow, powerSaveBlocker, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let blockerId = null;
let win = null;
let tray = null;
app.isQuitting = false;

function generateId() {
  const range = 100000;
  const id = crypto.randomInt(range, range * 10);
  return String(id).slice(0, 6);
}

function generatePassword() {
  const range = 100000;
  return String(crypto.randomInt(range, range * 10)).slice(0, 6);
}

function loadPairing() {
  const userData = app.getPath('userData');
  const file = path.join(userData, 'p2p-pairing.json');
  if (fs.existsSync(file)) {
    try {
      const raw = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(raw);
      if (data && data.p2pId && data.p2pPassword) return data;
    } catch {}
  }
  const fresh = { p2pId: generateId(), p2pPassword: generatePassword(), createdAt: Date.now() };
  fs.mkdirSync(userData, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(fresh, null, 2), 'utf8');
  return fresh;
}

function savePairing(pairing) {
  const userData = app.getPath('userData');
  const file = path.join(userData, 'p2p-pairing.json');
  fs.writeFileSync(file, JSON.stringify(pairing, null, 2), 'utf8');
}

function createTray(pairing) {
  if (tray) return;
  const base64Icon = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAYklEQVR42mNkoBAwUqifAWcgVj/DIEY1GsgGxEaG4Y9qNJANiI0M4y/VaCAbEBsZxkmq0UA2IDYyTJhUo4FsQGxkGB2pRgPZgNjIMCFSjQayAbGRYTSkGg1kA2IjwwAAMmBwT354Lq8AAAAASUVORK5CYII=';
  const trayIcon = nativeImage.createFromBuffer(Buffer.from(base64Icon, 'base64'));
  tray = new Tray(trayIcon);
  const ctx = Menu.buildFromTemplate([
    { label: 'Sentinel P2P Receiver', enabled: false },
    { type: 'separator' },
    { label: `ID: ${pairing.p2pId}`, enabled: false },
    { label: `PW: ${pairing.p2pPassword}`, enabled: false },
    { type: 'separator' },
    { label: 'Tampilkan Jendela', click: () => { if (win) win.show(); } },
    { label: 'Sembunyikan Jendela', click: () => { if (win) win.hide(); } },
    { type: 'separator' },
    { label: 'Keluar Aplikasi', click: () => { app.isQuitting = true; app.quit(); } }
  ]);
  tray.setToolTip(`Sentinel P2P Receiver — ID ${pairing.p2pId}`);
  tray.setContextMenu(ctx);
  tray.on('click', () => { if (win) { win.isVisible() ? win.hide() : win.show(); win.focus(); } });
}

ipcMain.handle('get-pairing', () => loadPairing());
ipcMain.handle('regenerate-password', () => {
  const pairing = loadPairing();
  pairing.p2pPassword = generatePassword();
  savePairing(pairing);
  return pairing;
});
ipcMain.handle('regenerate-id', () => {
  const pairing = loadPairing();
  pairing.p2pId = generateId();
  pairing.p2pPassword = generatePassword();
  savePairing(pairing);
  return pairing;
});

function createWindow() {
  blockerId = powerSaveBlocker.start('prevent-app-suspension');
  const menu = Menu.buildFromTemplate([{ label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectall' }] }]);
  Menu.setApplicationMenu(menu);

  win = new BrowserWindow({
    width: 420,
    height: 760,
    resizable: false,
    show: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false },
    title: 'Sentinel P2P Receiver',
    autoHideMenuBar: true
  });

  if (process.env.VITE_DEV_SERVER_URL) win.loadURL(process.env.VITE_DEV_SERVER_URL);
  else win.loadFile(path.join(__dirname, '../dist/index.html'));

  win.on('close', (event) => {
    if (!app.isQuitting) { event.preventDefault(); win.hide(); }
    return false;
  });

  const pairing = loadPairing();
  createTray(pairing);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('will-quit', () => {
  app.isQuitting = true;
  if (blockerId !== null) powerSaveBlocker.stop(blockerId);
  if (tray) { tray.destroy(); tray = null; }
});
