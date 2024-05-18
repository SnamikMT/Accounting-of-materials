const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;
let ws;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'client', 'index.html'));
  mainWindow.webContents.openDevTools();

  const server = require('./server/server');
  ws = new WebSocket('ws://localhost:3000'); // Правильный порт здесь
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    mainWindow.webContents.send(data.type, data.payload);
  });

  ipcMain.on('updateToolInfo', (event, payload) => {
    ws.send(JSON.stringify({ type: 'updateToolInfo', payload }));
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
