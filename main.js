const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'client', 'login.html'));
  mainWindow.webContents.openDevTools();

  // Установка заголовка CSP
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; connect-src 'self' ws://localhost:3000 http://localhost:3000; script-src 'self'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });

  const server = require('./server/server');

  const ws = new WebSocket('ws://localhost:3000');
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    mainWindow.webContents.send(data.type, data.payload);
  });

  ipcMain.on('updateToolInfo', (event, payload) => {
    ws.send(JSON.stringify({ type: 'updateToolInfo', payload }));
  });

  ipcMain.on('login', (event, { username, password }) => {
    fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        mainWindow.loadFile(path.join(__dirname, 'client', 'index.html'));
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow.webContents.send('userRole', data.role);
          console.log('User role sent to renderer:', data.role); // Добавленная отладочная информация
        });
      } else {
        console.error('Invalid username or password');
      }
    })
    .catch(error => console.error('Error during login:', error));
  });
  
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
