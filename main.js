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
  const binaryPath = path.join(__dirname.replace('app.asar', 'app.asar.unpacked'), binaryName);

  if (!fs.existsSync(binaryPath)) {
    mainWindow.webContents.send('proxy-log', `Error: Binary not found at ${binaryPath}`);
    mainWindow.webContents.send('proxy-status', { status: 'stopped' });
    return;
  }

  // Map settings to v1.2.1 flags
  const spawnArgs = [];
  if (args.port) spawnArgs.push('--listen-addr', `127.0.0.1:${args.port}`);
  if (args.dnsAddr && args.dnsMode === 'udp') spawnArgs.push('--dns-addr', args.dnsAddr);
  if (args.dnsMode) spawnArgs.push('--dns-mode', args.dnsMode);
  if (args.dohUrl && args.dnsMode === 'doh') spawnArgs.push('--dns-https-url', args.dohUrl);
  if (args.httpsDisorder) spawnArgs.push('--https-disorder');
  if (args.httpsSplitMode) spawnArgs.push('--https-split-mode', args.httpsSplitMode);
  if (args.policyAuto) spawnArgs.push('--policy-auto');
  if (args.logLevel) spawnArgs.push('--log-level', args.logLevel);
  
  // Use silent for clean logs
  spawnArgs.push('--silent');

  mainWindow.webContents.send('proxy-log', `Info: Starting SpoofDPI v1.2.1 with flags: ${spawnArgs.join(' ')}`);

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
