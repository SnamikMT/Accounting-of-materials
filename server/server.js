const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');

const app = express();
const port = 3000;

const usersFilePath = path.join(__dirname, 'users.json');

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'client')));

// Установка CSP заголовка
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "connect-src 'self' ws://192.168.0.16:3000 http://192.168.0.16:3000; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  next();
});

// API методы
app.get('/api/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    res.json(users);
  } catch (error) {
    console.error('Error reading users data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Логика для обработки POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Received login request for username: ${username}, password: ${password}`);

  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf8'));
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      console.log('User found:', user);
      res.json({ success: true, role: user.role });
    } else {
      console.log('Invalid credentials');
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login processing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Запуск сервера Express
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

// WebSocket сервер
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    console.log('Received:', data);

    if (data.type === 'getUserInfo') {
      const userInfo = { role: 'Admin' }; // Временная заглушка, замените на логику получения информации о пользователе
      ws.send(JSON.stringify({ type: 'userInfo', payload: userInfo }));
    }

    if (data.type === 'updateToolInfo') {
      // Добавьте обработку обновления информации о инструментах здесь
    }

    // Рассылка сообщения всем подключенным клиентам
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  // Отправка начальных данных при подключении
  ws.send(JSON.stringify({ type: 'initial', payload: {} })); // Отправка начальных данных, если требуется
});

console.log('WebSocket server is running on ws://192.168.0.16:3000'); // Используйте IP-адрес сервера
