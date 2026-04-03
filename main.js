const { app, BrowserWindow, shell, dialog, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const url = require('url');

// Keep a global reference of the window object
let mainWindow;

// Auto-updater configuration
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Update not available.');
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progressObj);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info.version);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
    // Show dialog to user
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'עדכון זמין',
      message: `גרסה ${info.version} הורדה. האפליקציה תעדכן בסגירה הבאה.`,
      buttons: ['עדכן עכשיו', 'מאוחר יותר'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });

  // Check for updates after 3 seconds (avoid Squirrel first-run lock)
  if (!process.argv.includes('--squirrel-firstrun')) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 3000);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'עורך כתוביות',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Required for WebCodecs and WebGPU
      webSecurity: true,
    },
    backgroundColor: '#0f1117',
    show: false, // Don't show until ready
  });

  // Load the built React app
  const indexPath = path.join(__dirname, 'app', 'index.html');
  mainWindow.loadFile(indexPath);

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url: openUrl }) => {
    shell.openExternal(openUrl);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Handle Squirrel.Windows events (required for auto-update)
function handleSquirrelEvent() {
  if (process.platform !== 'win32') return false;

  const squirrelCommand = process.argv[1];
  switch (squirrelCommand) {
    case '--squirrel-install':
    case '--squirrel-updated':
      // Create desktop shortcut
      app.quit();
      return true;
    case '--squirrel-uninstall':
      app.quit();
      return true;
    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
  return false;
}

// IPC handlers
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdatesAndNotify());

// App lifecycle
if (handleSquirrelEvent()) {
  // Squirrel event handled, quit
} else {
  app.whenReady().then(() => {
    createWindow();
    setupAutoUpdater();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
