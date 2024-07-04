const { contextBridge, ipcRenderer } = require('electron');

// Экспонируем функции через контекст мост
contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  // Предполагается, что настройка userRole больше не нужна при использовании WebSocket
  onUserRole: (callback) => {
    ipcRenderer.on('userRole', (event, role) => callback(role));
  }
});
