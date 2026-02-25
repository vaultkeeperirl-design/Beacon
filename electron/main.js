const { app, BrowserWindow, screen, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let tray = null;
let isQuitting = false;

function createWindow(port) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
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
    mainWindow.loadURL(`http://localhost:5173?port=${port}`);
  } else {
    // Production mode
    mainWindow.loadFile(path.join(__dirname, 'dist/frontend/index.html'), { query: { port: port.toString() } });
  }

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

function createTray() {
  const iconPath = path.join(__dirname, 'build/icon.png');
  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Beacon',
      click: () => mainWindow.show()
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
    mainWindow.show();
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    const isDev = !app.isPackaged;

    if (isDev) {
      // Assume backend is running on 3000
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

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });
  });
}

app.whenReady().then(async () => {
  try {
    const port = await startBackend();
    createTray();
    createWindow(port);
  } catch (err) {
    console.error('Failed to initialize app:', err);
    app.quit();
  }

  app.on('activate', () => {
    if (mainWindow) {
        mainWindow.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
  if (backendProcess) {
    backendProcess.kill();
  }
});
