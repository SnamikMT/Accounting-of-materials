const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const dotenv = require('dotenv');

// Загрузка переменных окружения из .env файла
dotenv.config();

let mainWindow;
let serverProcess;

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

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
    }
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

  startServer();
}

function startServer() {
  serverProcess = spawn('node', [path.join(__dirname, 'server', 'server.js')]);

  serverProcess.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });

  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  if (serverProcess) {
    serverProcess.kill();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
