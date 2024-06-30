// server/server.js

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');

const app = express();
const port = 3000;

const usersPath = path.join(__dirname, 'users.json');

// Middlewares
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, '../client')));

// WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Массив для хранения всех подключений WebSocket
let clients = [];

wss.on('connection', function connection(ws) {
  console.log('Новое соединение WebSocket установлено');
  
  // Сохранение нового клиента
  clients.push(ws);

  ws.on('message', function incoming(message) {
    console.log('Получено сообщение от клиента:', message);

    // Рассылка сообщения всем клиентам
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  // Удаление клиента из списка при закрытии соединения
  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
  });

  // Пример отправки сообщения клиенту
  ws.send('Вы успешно подключились к серверу WebSocket.');
});

// HTTP обработчик для обработки WebSocket handshake
app.server = app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});

app.server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (socket) => {
    wss.emit('connection', socket, request);
  });
});

// Проверка пользователя
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  fs.readFile(usersPath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading users file');
      return;
    }

    let users;
    try {
      users = JSON.parse(data);
    } catch (error) {
      console.error('Error parsing users data:', error);
      res.status(500).send('Error processing users data');
      return;
    }

    if (!Array.isArray(users)) {
      console.error('Users data is not an array');
      res.status(500).send('Invalid users data');
      return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      res.json({ success: true, role: user.role });
    } else {
      res.json({ success: false, message: 'Invalid username or password' });
    }
  });
});
