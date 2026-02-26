const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const isDev = require('electron-is-dev');
const fs = require('fs');
const fsPromises = require('fs').promises;
const http = require('http');
const net = require('net');

let mainWindow;
let backendProcess;
let backendPort;
let appWindow;
let tray = null;
let isQuitting = false;

const installPath = path.join(app.getPath('userData'), 'beacon-backend');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function createTray() {
  const iconPath = path.join(__dirname, '../public/icon.png');
  tray = new Tray(iconPath);
  tray.setToolTip('Beacon Launcher');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Launcher',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Launch Beacon Streaming',
      click: () => {
        if (mainWindow) {
          launchStreamingApp(mainWindow.webContents);
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

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

  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function waitForServer(port) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 60; // 30 seconds total

    const check = () => {
      attempts++;
      // Use 127.0.0.1 to avoid IPv4/IPv6 ambiguity on localhost
      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
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
  if (backendProcess && backendPort) return backendPort;

  const scriptPath = path.join(installPath, 'server.js');

  if (!fs.existsSync(scriptPath)) {
    console.error('Backend not found at:', scriptPath);
    throw new Error('Backend script not found. Please (re)install the app.');
  }

  const port = await getFreePort();
  console.log(`Starting backend from: ${scriptPath} on port ${port}`);

  backendProcess = fork(scriptPath, [], {
    cwd: installPath,
    env: { ...process.env, PORT: port, SERVE_STATIC: 'true' },
    stdio: 'pipe'
  });

  backendPort = port;

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  const serverPromise = waitForServer(port);

  const exitPromise = new Promise((_, reject) => {
    // Only listen for 'close' if the process is still running
    if (backendProcess) {
      backendProcess.once('close', (code) => {
        console.log(`Backend exited prematurely with code ${code}`);
        backendProcess = null;
        backendPort = null;
        reject(new Error(`Backend exited with code ${code}`));
      });
    }
  });

  await Promise.race([serverPromise, exitPromise]);
  return port;
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
    event.sender.send('install-status', 'Preparing installation...');

    // Stop backend if running before updating/installing
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
      backendPort = null;
    }

    console.log(`Copying from ${sourcePath} to ${installPath}`);
    event.sender.send('install-status', 'Copying application files...');

    // In dev mode, we copy everything including node_modules to ensure functionality.
    // In production, resources/backend should already contain necessary files (including bundled modules).
    const filter = (src) => {
      if (src.includes('.git')) return false;
      return true;
    };

    // Use asynchronous copy to avoid blocking the main thread
    await fsPromises.cp(sourcePath, installPath, { recursive: true, filter });

    event.sender.send('install-progress', 100);
    event.sender.send('install-status', 'Installation complete!');
    event.sender.send('install-complete');

  } catch (error) {
    console.error("Install/Update failed:", error);
    event.sender.send('install-error', error.message);
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // On Windows/Linux, we now minimize to tray instead of quitting on close.
  // The 'close' handler on mainWindow prevents the window from actually closing unless quitting.
  // But if all windows ARE somehow closed (e.g. via code), we normally quit.
  // However, with tray, we want the app to stay alive.
  // We only quit if isQuitting is true or on macOS (where window-all-closed is standard app behavior diff).
  // Actually, the requirement says "launcher closes to tray".
  // The window close event handler handles the minimizing.
  // If we reach here, it means windows are actually gone.
  // If we are quitting, we proceed.
  if (isQuitting && process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
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

ipcMain.handle('get-backend-version', async () => {
    try {
        const pkgPath = path.join(installPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(await fsPromises.readFile(pkgPath, 'utf8'));
            return pkg.version;
        }
    } catch (e) {
        console.error('Failed to read backend version', e);
    }
    return null;
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
      backendPort = null;
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

async function launchStreamingApp(eventSender) {
  if (appWindow) {
    appWindow.focus();
    return;
  }

  try {
    const port = await startBackend();

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

    appWindow.loadURL(`http://127.0.0.1:${port}`);

    appWindow.on('closed', () => {
      appWindow = null;
      if (backendProcess) {
        backendProcess.kill();
        backendProcess = null;
        backendPort = null;
      }
      if (mainWindow) {
        mainWindow.webContents.send('app-closed');
      }
    });

    if (eventSender) {
      eventSender.send('app-launched');
    }
  } catch (error) {
    console.error('Launch failed:', error);
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
      backendPort = null;
    }
    if (eventSender) {
      eventSender.send('launch-error', error.message);
    }
  }
}

ipcMain.on('launch-app', async (event) => {
  await launchStreamingApp(event.sender);
});
