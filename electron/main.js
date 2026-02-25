const { app, BrowserWindow, screen, Tray, Menu, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let launcherWindow;
let appWindow;
let backendProcess;
let tray = null;
let isQuitting = false;
let backendPort = null;

function createLauncherWindow() {
  launcherWindow = new BrowserWindow({
    width: 800,
    height: 600,
    resizable: false,
    frame: true,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'build/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this launcher script
    }
  });

  launcherWindow.loadFile(path.join(__dirname, 'launcher/index.html'));

  launcherWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      launcherWindow.hide();
      return false;
    }
  });
}

function createAppWindow(port) {
  if (appWindow) {
    appWindow.show();
    appWindow.focus();
    return;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  appWindow = new BrowserWindow({
    width: Math.min(1200, width),
    height: Math.min(800, height),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'build/icon.png'),
    autoHideMenuBar: true
  });

  if (!app.isPackaged) {
    // Development mode
    appWindow.loadURL(`http://localhost:5173?port=${port}`);
  } else {
    // Production mode
    appWindow.loadFile(path.join(__dirname, 'dist/frontend/index.html'), { query: { port: port.toString() } });
  }

  appWindow.on('closed', () => {
    appWindow = null;
    // When main app closes, show launcher again
    if (launcherWindow) launcherWindow.show();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'build/icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Launcher',
      click: () => {
        if (launcherWindow) launcherWindow.show();
      }
    },
    {
      label: 'Quit Beacon',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Beacon P2P Node');
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (launcherWindow) launcherWindow.show();
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;

    if (isDev) {
      console.log('Running in development mode. Assuming backend at port 3000.');
      resolve(3000);
      return;
    }

    const backendPath = path.join(process.resourcesPath, 'backend');
    const serverPath = path.join(backendPath, 'server.js');

    console.log('Starting backend from:', serverPath);

    backendProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: 0 },
      cwd: backendPath
    });

    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Backend: ${output}`);

      const match = output.match(/Server running on port (\d+)/);
      if (match) {
        resolve(parseInt(match[1], 10));
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });
  });
}

app.whenReady().then(async () => {
  createLauncherWindow();
  createTray();

  try {
    backendPort = await startBackend();
    if (launcherWindow) {
      launcherWindow.webContents.send('node-ready');
    }
  } catch (err) {
    console.error('Failed to initialize app:', err);
    if (launcherWindow) {
        launcherWindow.webContents.send('node-error');
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        if (launcherWindow) launcherWindow.show();
    }
  });
});

ipcMain.on('launch-app', () => {
    if (backendPort) {
        createAppWindow(backendPort);
        if (launcherWindow) launcherWindow.hide(); // Hide launcher when app starts
    } else {
        console.error('Backend not ready yet');
    }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});
