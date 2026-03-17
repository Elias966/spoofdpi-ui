const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let spoofProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    icon: path.join(__dirname, 'build/icon.png'),
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (spoofProcess) {
      spoofProcess.kill('SIGINT');
    }
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('start-proxy', (event, args) => {
  if (spoofProcess) {
    spoofProcess.removeAllListeners('close');
    spoofProcess.kill('SIGINT');
    spoofProcess = null;
  }

  const binaryName = 'spoofdpi';
  // Use a reliable path that works in AppImage and dev
  const binaryPath = path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), binaryName);

  if (!fs.existsSync(binaryPath)) {
    mainWindow.webContents.send('proxy-log', `Error: Binary not found at ${binaryPath}`);
    mainWindow.webContents.send('proxy-status', { status: 'stopped' });
    return;
  }

  // Map settings to STABLE v0.12.0 flags
  const spawnArgs = [];
  if (args.port) spawnArgs.push('-port', args.port.toString());
  if (args.dnsAddr) {
    const [ip, port] = args.dnsAddr.split(':');
    spawnArgs.push('-dns-addr', ip);
    if (port) spawnArgs.push('-dns-port', port);
  }
  if (args.dnsMode === 'doh') spawnArgs.push('-enable-doh');
  
  // v0.12.0 uses -window-size for fragmentation control
  if (args.httpsSplitMode === 'chunk') spawnArgs.push('-window-size', '1');
  
  // Default to silent to keep logs clean
  spawnArgs.push('-silent');

  mainWindow.webContents.send('proxy-log', `Info: Executing ${binaryName} ${spawnArgs.join(' ')}`);

  try {
    const currentProcess = spawn(binaryPath, spawnArgs, {
      env: { ...process.env },
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    spoofProcess = currentProcess;

    currentProcess.stdout.on('data', (data) => {
      if (mainWindow) mainWindow.webContents.send('proxy-log', data.toString());
    });

    currentProcess.stderr.on('data', (data) => {
      if (mainWindow) mainWindow.webContents.send('proxy-log', data.toString());
    });

    currentProcess.on('error', (err) => {
      if (spoofProcess === currentProcess) {
        mainWindow.webContents.send('proxy-log', `Fatal: Failed to start: ${err.message}`);
        mainWindow.webContents.send('proxy-status', { status: 'stopped' });
        spoofProcess = null;
      }
    });

    currentProcess.on('close', (code, signal) => {
      if (spoofProcess === currentProcess) {
        mainWindow.webContents.send('proxy-log', `Info: Process exited with code ${code} and signal ${signal}`);
        mainWindow.webContents.send('proxy-status', { status: 'stopped' });
        spoofProcess = null;
      }
    });

    mainWindow.webContents.send('proxy-status', { status: 'running' });
  } catch (err) {
    mainWindow.webContents.send('proxy-log', `Fatal: Unexpected error: ${err.message}`);
    mainWindow.webContents.send('proxy-status', { status: 'stopped' });
  }
});

ipcMain.on('stop-proxy', () => {
  if (spoofProcess) {
    spoofProcess.kill('SIGINT');
    spoofProcess = null;
  }
  mainWindow.webContents.send('proxy-status', { status: 'stopped' });
});
