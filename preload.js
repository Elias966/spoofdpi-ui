const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  startProxy: (args) => ipcRenderer.send('start-proxy', args),
  stopProxy: () => ipcRenderer.send('stop-proxy'),
  onProxyLog: (callback) => ipcRenderer.on('proxy-log', (_event, value) => callback(value)),
  onProxyStatus: (callback) => ipcRenderer.on('proxy-status', (_event, value) => callback(value)),
});
