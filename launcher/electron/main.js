const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const isDev = require('electron-is-dev');

let mainWindow;
let backendProcess;
let appWindow; // The actual streaming app window

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a', // match bg-gray-900
      symbolColor: '#ffffff'
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../public/icon.png')
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    // If launcher closes, we should probably close everything?
    // Or should we keep the node running?
    // Usually launcher closing means quitting the app.
    app.quit();
  });
}

function startBackend() {
  if (backendProcess) return;

  let scriptPath;
  if (isDev) {
    scriptPath = path.join(__dirname, '../../backend/server.js');
  } else {
    scriptPath = path.join(process.resourcesPath, 'backend/server.js');
  }

  console.log('Starting backend from:', scriptPath);

  // Fork the backend process
  // We need to ensure the backend uses its own node_modules
  const cwd = isDev ? path.join(__dirname, '../../backend') : path.join(process.resourcesPath, 'backend');

  backendProcess = fork(scriptPath, [], {
    cwd: cwd,
    env: { ...process.env, PORT: 3000, SERVE_STATIC: 'true' }, // Force port 3000
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend exited with code ${code}`);
    backendProcess = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  startBackend(); // Start backend immediately as it acts as the node

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC Handlers

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.on('install-app', (event) => {
  // Simulate installation
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 5; // Random increment
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      event.sender.send('install-progress', 100);
    } else {
      event.sender.send('install-progress', progress);
    }
  }, 200);
});

ipcMain.on('launch-app', (event) => {
  if (appWindow) {
    appWindow.focus();
    return;
  }

  appWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    title: 'Beacon Streaming',
    icon: path.join(__dirname, '../public/icon.png')
  });

  // Load the backend URL
  // The backend should be serving the frontend static files if built
  // Or in dev, we might want to load the dev server?
  // But the request says "bundle the local node/backend... launch and update the main steaming app".
  // So we should load from localhost:3000
  appWindow.loadURL('http://localhost:3000');

  appWindow.on('closed', () => {
    appWindow = null;
    if (mainWindow) {
        mainWindow.webContents.send('app-closed');
    }
  });

  event.sender.send('app-launched');
});

ipcMain.on('update-app', (event) => {
    // Mock update
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            event.sender.send('install-progress', 100);
        } else {
            event.sender.send('install-progress', progress);
        }
    }, 100);
});
