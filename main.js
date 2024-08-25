const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const dotenv = require('dotenv');

// Загрузка переменных окружения из .env файла
dotenv.config();

let mainWindow;
const serverIp = process.env.SERVER_IP || 'localhost';
const port = process.env.PORT || 3000;

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

  // Set CSP header
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    headers['Content-Security-Policy'] = [
      "default-src 'self'; " +
      "connect-src 'self' ws://localhost:3000 http://localhost:3000; " +
      "script-src 'self'; " +
      "style-src 'self' 'unsafe-inline';"
    ];
    callback({ responseHeaders: headers });
  });


  const ws = new WebSocket(`ws://${serverIp}:${port}`);

  ws.on('open', () => {
    console.log('Connected to WebSocket server');
    ws.send('Hello from Electron client!');
  });

  ws.on('message', (message) => {
    console.log(`Received from server: ${message}`);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ipcMain.on('sendMessage', (event, message) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  ipcMain.on('closeConnection', () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
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
