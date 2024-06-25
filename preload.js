const { contextBridge, ipcRenderer } = require('electron');

// Exposing the API to the renderer process
contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => {
    // Validating channels (optional, for security)
    let validChannels = ['get-config', 'login-success', 'logout']; // Добавлено 'logout'
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    // Validating channels (optional, for security)
    let validChannels = ['config-data', 'userRole'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  },
  // Method to request configuration
  getConfig: () => {
    return new Promise((resolve) => {
      ipcRenderer.send('get-config'); // Request configuration
      ipcRenderer.once('config-data', (event, config) => {
        resolve(config); // Resolve with the received config
      });
    });
  }
});
