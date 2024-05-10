const electron = require('electron');
const path = require('path');
const url = require('url');
const { app, BrowserWindow } = electron;
const reload = require('electron-reload');

reload(__dirname);

let mainWindow;

app.on('ready', function() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});
