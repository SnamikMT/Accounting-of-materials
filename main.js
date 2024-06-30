// main.js

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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'client', 'login.html'));

  // Подключение к WebSocket серверу
  ws = new WebSocket('ws://localhost:3000'); // Укажите адрес вашего сервера

  ws.on('open', function open() {
    console.log('Успешное подключение к WebSocket серверу');
    // Можно отправить сообщение на сервер
    ws.send('Привет от клиента!');
  });

  ws.on('message', function incoming(data) {
    console.log('Получено сообщение от сервера: %s', data);
    // Обработка полученного сообщения от сервера
  });

  // Обработчик успешного входа
  ipcMain.on('login-success', (event, role) => {
    mainWindow.loadFile(path.join(__dirname, 'client', 'index.html'));
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('userRole', role);
    });
  });

  // Обработчик выхода
  ipcMain.on('logout', () => {
    mainWindow.loadFile(path.join(__dirname, 'client', 'login.html'));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
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
