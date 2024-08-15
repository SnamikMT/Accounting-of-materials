const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const dotenv = require('dotenv');

// Загрузка переменных окружения из .env файла
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const serverIp = process.env.SERVER_IP || 'localhost';

const usersFilePath = path.join(__dirname, 'users.json');
const requestsFilePath = path.join(__dirname, 'requests.json');
const toolsFilePath = path.join(__dirname, 'tools.json');

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, '../client')));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Установка CSP заголовка
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', `connect-src 'self' ws://${serverIp}:${port} http://${serverIp}:${port}; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';`);
  next();
});

// Маршрут для получения данных tools.json
app.get('/tools.json', (req, res) => {
  fs.readFile(toolsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading tools.json:', err);
      res.status(500).send('Error reading data');
      return;
    }
    res.send(data);
  });
});

// Маршрут для сохранения данных в tools.json
app.post('/tools.json', (req, res) => {
  const newData = req.body;
  fs.writeFile(toolsFilePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error('Error saving tools.json:', err);
      return res.status(500).send('Error saving data');
    }
    res.send('Data saved successfully');
  });
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

app.get('/api/requests', (req, res) => {
  try {
    const requests = JSON.parse(fs.readFileSync(requestsFilePath, 'utf8'));
    res.json(requests);
  } catch (error) {
    console.error('Error reading requests data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/requests/update', (req, res) => {
  const { id, status } = req.body;
  console.log(`Received request to update status: ID ${id}, new status: ${status}`);

  fs.readFile(requestsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading requests.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    try {
      const requests = JSON.parse(data);
      const requestIndex = requests.findIndex(req => req.id === parseInt(id));

      if (requestIndex !== -1) {
        requests[requestIndex].status = status;
        console.log(`Updated request ID ${id} to status ${status}`);

        fs.writeFile(requestsFilePath, JSON.stringify(requests, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing to requests.json:', err);
            res.status(500).send('Internal Server Error');
            return;
          }
          console.log('Request status updated successfully');
          res.json({ success: true });
        });

      } else {
        console.error('Request not found');
        res.status(404).send('Request not found');
      }

    } catch (parseError) {
      console.error('Error parsing requests.json:', parseError);
      res.status(500).send('Internal Server Error');
    }
  });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    console.log('Received:', message);
    
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type === 'getUserInfo') {
      const userInfo = { type: 'userInfo', payload: { role: 'Admin' } };
      ws.send(JSON.stringify(userInfo));
    }
  });

  const welcomeMessage = JSON.stringify({ message: 'Welcome to the WebSocket server!' });
  ws.send(welcomeMessage);
});
