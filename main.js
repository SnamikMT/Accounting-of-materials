// main.js

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
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

  // Set CSP header if needed
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [`default-src 'self'; connect-src 'self' ws://${serverIp}:${port} http://${serverIp}:${port}; script-src 'self'; style-src 'self' 'unsafe-inline';`]
      }
    });
  });

  // Initialize WebSocket in the main process
  const ws = new WebSocket.Server({ port: port });

  // Handle WebSocket connections
  ws.on('connection', (ws) => {
    console.log('WebSocket connection established');

    // Example: Handle messages from the renderer process
    ipcMain.on('updateToolInfo', (event, payload) => {
      ws.send(JSON.stringify({ type: 'updateToolInfo', payload }));
    });

    // Example: Handle sending user role to the renderer process
    ipcMain.on('getUserRole', (event) => {
      ws.send(JSON.stringify({ type: 'getUserInfo' }));
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'userInfo') {
          event.reply('userRole', data.payload.role);
        }
      });
    });

    // Example: Handle closing window
    mainWindow.on('closed', () => {
      mainWindow = null;
    });
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
