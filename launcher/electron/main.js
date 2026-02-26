const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const isDev = require('electron-is-dev');
const fs = require('fs');
const fsPromises = require('fs').promises;
const http = require('http');

let mainWindow;
let backendProcess;
let appWindow;

const installPath = path.join(app.getPath('userData'), 'beacon-backend');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
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
    app.quit();
  });
}

function waitForServer(port) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds total

    const check = () => {
      attempts++;
      const req = http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          res.resume();
          if (attempts >= maxAttempts) {
            reject(new Error('Timeout waiting for backend server'));
          } else {
            setTimeout(check, 500);
          }
        }
      }).on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error('Timeout waiting for backend server'));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    };
    check();
  });
}

async function startBackend() {
  if (backendProcess) return;

  const scriptPath = path.join(installPath, 'server.js');

  if (!fs.existsSync(scriptPath)) {
    console.error('Backend not found at:', scriptPath);
    return;
  }

  console.log('Starting backend from:', scriptPath);

  backendProcess = fork(scriptPath, [], {
    cwd: installPath,
    env: { ...process.env, PORT: 3000, SERVE_STATIC: 'true' },
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

  await waitForServer(3000);
}

async function performInstall(event) {
  try {
    let sourcePath;
    if (isDev) {
      sourcePath = path.join(__dirname, '../../backend');
    } else {
      sourcePath = path.join(process.resourcesPath, 'backend');
    }

    if (!fs.existsSync(sourcePath)) {
      console.error("Source path does not exist:", sourcePath);
      return;
    }

    if (!fs.existsSync(installPath)) {
      await fsPromises.mkdir(installPath, { recursive: true });
    }

    // Report initial progress
    event.sender.send('install-progress', 10);

    // Stop backend if running before updating/installing
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }

    console.log(`Copying from ${sourcePath} to ${installPath}`);

    // In dev mode, we copy everything including node_modules to ensure functionality.
    // In production, resources/backend should already contain necessary files (including bundled modules).
    const filter = (src) => {
      if (src.includes('.git')) return false;
      return true;
    };

    // Use asynchronous copy to avoid blocking the main thread
    await fsPromises.cp(sourcePath, installPath, { recursive: true, filter });

    event.sender.send('install-progress', 100);
    event.sender.send('install-complete');

  } catch (error) {
    console.error("Install/Update failed:", error);
    event.sender.send('install-error', error.message);
  }
}

app.whenReady().then(() => {
  createWindow();

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

ipcMain.handle('check-install', () => {
  const scriptPath = path.join(installPath, 'server.js');
  return fs.existsSync(scriptPath);
});

ipcMain.on('install-app', async (event) => {
  await performInstall(event);
});

ipcMain.on('update-app', async (event) => {
  await performInstall(event);
});

ipcMain.on('uninstall-app', async (event) => {
  try {
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }

    if (appWindow) {
      appWindow.close();
    }

    if (fs.existsSync(installPath)) {
      await fsPromises.rm(installPath, { recursive: true, force: true });
    }

    event.sender.send('uninstall-complete');
  } catch (error) {
    console.error("Uninstall failed:", error);
  }
});

ipcMain.on('launch-app', async (event) => {
  if (appWindow) {
    appWindow.focus();
    return;
  }

  try {
    await startBackend();

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

    appWindow.loadURL('http://localhost:3000');

    appWindow.on('closed', () => {
      appWindow = null;
      if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
      }
      if (mainWindow) {
        mainWindow.webContents.send('app-closed');
      }
    });

    event.sender.send('app-launched');
  } catch (error) {
    console.error('Launch failed:', error);
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
    event.sender.send('launch-error', error.message);
  }
});
