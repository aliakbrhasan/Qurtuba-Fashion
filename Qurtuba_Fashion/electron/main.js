const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      // Security hardening for legacy JS entry (prefer using main.ts)
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      enableRemoteModule: false
    }
  });

  // Try to load the built app first, fallback to dev server
  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }

  // Deny all new windows/popups
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Prevent navigation to arbitrary domains
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isDev) return; // allow localhost navigation during dev
    event.preventDefault();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Global security default for any created webContents
app.on('web-contents-created', (_evt, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
});


