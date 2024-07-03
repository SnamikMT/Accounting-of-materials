const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');

const app = express();
const port = 3000;

const toolsPath = path.join(__dirname, 'tools.json');
const usersFilePath = path.join(__dirname, 'users.json');
let tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'client')));

// Установка CSP заголовка
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "connect-src 'self' ws://192.168.0.108:3000 http://192.168.0.108:3000; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  next();
});

// API методы
app.get('/api/tools/:subcategory', (req, res) => {
  const subcategory = req.params.subcategory;
  res.json(tools[subcategory] || []);
});

app.post('/api/tools/increase', (req, res) => {
  const { category, subcategory, size, toolName, shape, angle } = req.body;
  const tool = tools[category]?.[subcategory]?.sizes?.[size]?.tools?.[toolName]?.shapes?.[shape]?.angles?.[angle];

  if (tool) {
    tool.forEach(item => {
      item.quantity++;
    });
    fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Tool not found' });
  }
});

app.post('/api/tools/add', (req, res) => {
  const { category, subcategory, size, toolType, shape, angle, name, quantity } = req.body;

  const currentData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

  if (!currentData[category]) currentData[category] = {};
  if (!currentData[category][subcategory]) currentData[category][subcategory] = { sizes: {} };
  if (!currentData[category][subcategory].sizes[size]) currentData[category][subcategory].sizes[size] = { tools: {} };
  if (!currentData[category][subcategory].sizes[size].tools[toolType]) {
    currentData[category][subcategory].sizes[size].tools[toolType] = { shapes: {} };
  }
  if (!currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape]) {
    currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape] = { angles: {} };
  }
  if (!currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape].angles[angle]) {
    currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape].angles[angle] = [];
  }

  let toolExists = false;
  for (let tool of currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape].angles[angle]) {
    if (tool.name === name) {
      tool.quantity += quantity;
      toolExists = true;
      break;
    }
  }

  if (!toolExists) {
    currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape].angles[angle].push({ name, quantity });
  }

  fs.writeFileSync(toolsPath, JSON.stringify(currentData, null, 2));
  res.json({ success: true });
});

app.get('/api/tools', (req, res) => {
  const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
  res.json(toolsData);
});

app.post('/api/tools/addPlastina', (req, res) => {
  const { category, subcategory, shape, angle, name, quantity } = req.body;

  if (!tools[category]) tools[category] = {};
  if (!tools[category][subcategory]) tools[category][subcategory] = { shapes: {} };
  if (!tools[category][subcategory].shapes[shape]) tools[category][subcategory].shapes[shape] = { angles: {} };
  if (!tools[category][subcategory].shapes[shape].angles[angle]) tools[category][subcategory].shapes[shape].angles[angle] = [];

  let toolExists = false;
  for (let tool of tools[category][subcategory].shapes[shape].angles[angle]) {
    if (tool.name === name) {
      tool.quantity += quantity;
      toolExists = true;
      break;
    }
  }

  if (!toolExists) {
    tools[category][subcategory].shapes[shape].angles[angle].push({ name, quantity });
  }

  fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
  res.json({ success: true });
});

app.get('/api/users', (req, res) => {
  const usersFilePath = path.join(__dirname, 'users.json');
  res.sendFile(usersFilePath);
});

// Добавляем обработчик POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Проверяем наличие пользователя с таким именем и паролем
  const user = Object.keys(users).find(u => u === username && users[u].password === password);

  if (user) {
    // Возвращаем роль пользователя (можно взять из users.json или установить статически)
    // Например, в users.json добавьте role для каждого пользователя
    res.json({ role: users[user].role || 'user' });
  } else {
    res.status(401).send('Invalid credentials');
  }
});

// Запуск сервера
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);
});

// WebSocket сервер
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    console.log('received:', data);

    if (data.type === 'getUserInfo') {
      const userInfo = { role: 'Admin' };
      ws.send(JSON.stringify({ type: 'userInfo', payload: userInfo }));
    }

    if (data.type === 'updateToolInfo') {
      tools[data.payload.subcategory] = data.payload.tools;
      fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
    }

    // Рассылка сообщения всем подключенным клиентам
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  // Отправка начальных данных при подключении
  ws.send(JSON.stringify({ type: 'initial', payload: tools }));
});

console.log('WebSocket server is running on ws://192.168.0.108:3000'); // Используйте IP-адрес сервера
