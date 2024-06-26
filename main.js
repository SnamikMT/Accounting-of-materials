const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const config = require('./server/config.json');

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

    // Загружаем login.html при старте
    mainWindow.loadFile(path.join(__dirname, 'client', 'login.html'));
    mainWindow.webContents.openDevTools();

    // Установка заголовка CSP
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        // Получаем серверный адрес из config.json
        const serverAddress = config.serverAddress;
        const serverHost = serverAddress.split('/')[2]; // Получаем хост из URL
        
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [`default-src 'self'; connect-src 'self' ws://${serverHost} ws://localhost:3000 http://${serverHost}; script-src 'self'; style-src 'self' 'unsafe-inline';`]
            }
        });
    });

    // Когда рендерер запрашивает конфигурацию
    ipcMain.on('get-config', (event) => {
        event.reply('config-data', config);
    });


    // Обработка запроса на смену окна после успешного входа
    ipcMain.on('login-success', (event, role) => {
        mainWindow.loadFile(path.join(__dirname, 'client', 'index.html'));
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.webContents.send('userRole', role);
            console.log('User role sent to renderer:', role);
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
