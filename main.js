const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

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

  // Добавим обработку входа
  ipcMain.on('login', (event, { username, password }) => {
    if (username === 'admin' && password === 'admin') {
      // Вход для администратора
      mainWindow.loadFile(path.join(__dirname, 'client', 'index.html'));
    } else if (username === 'user' && password === 'user') {
      // Вход для пользователя
      mainWindow.loadFile(path.join(__dirname, 'client', 'index.html'));
    } else {
      // Неверные учетные данные
      // Загрузить страницу ошибки или отобразить сообщение об ошибке
      console.log('Invalid username or password');
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
