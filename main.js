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

  // Установка заголовка CSP (если требуется)
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self'; connect-src 'self' ws://192.168.0.16:3000 http://192.168.0.16:3000; script-src 'self'; style-src 'self' 'unsafe-inline';"]
      }
    });
  });

  // Подключение к WebSocket серверу
  const ws = new WebSocket('ws://192.168.0.16:3000'); // Используйте IP-адрес сервера

  // Обработка сообщений от WebSocket сервера
  ws.on('message', (message) => {
    const data = JSON.parse(message);
    mainWindow.webContents.send(data.type, data.payload);
  });

  // Отправка сообщений от клиента на WebSocket сервер
  ipcMain.on('updateToolInfo', (event, payload) => {
    ws.send(JSON.stringify({ type: 'updateToolInfo', payload }));
  });

  // WebSocket слушатель для роли пользователя (можно использовать, если нужно)
  ipcMain.on('getUserRole', (event) => {
    // Пример получения роли пользователя от WebSocket сервера
    ws.send(JSON.stringify({ type: 'getUserInfo' }));
    ws.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'userInfo') {
        event.reply('userRole', data.payload.role);
      }
    });
  });

  // Обработка закрытия окна
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
