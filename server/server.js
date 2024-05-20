const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const port = 3000; 

const toolsPath = path.join(__dirname, 'tools.json');
let tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(express.static(path.join(__dirname, 'client')));

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "connect-src 'self' ws://localhost:3000 http://localhost:3000; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';");
  next();
});

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

  // Читаем текущие данные из файла
  const currentData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

  // Проверяем, существует ли уже объект для данной категории, подкатегории, размера и типа инструмента
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

  // Проверяем, существует ли инструмент с таким же именем в той же ветке
  let toolExists = false;
  for (let tool of currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape].angles[angle]) {
    if (tool.name === name) {
      tool.quantity += quantity; // Увеличиваем количество, если инструмент существует
      toolExists = true;
      break;
    }
  }

  // Если инструмент не существует, добавляем новый инструмент к массиву в объекте angles
  if (!toolExists) {
    currentData[category][subcategory].sizes[size].tools[toolType].shapes[shape].angles[angle].push({ name, quantity });
  }

  // Перезаписываем файл с обновленными данными
  fs.writeFileSync(toolsPath, JSON.stringify(currentData, null, 2));

  // Отправляем ответ об успешном добавлении данных
  res.json({ success: true });
});


app.get('/api/tools', (req, res) => {
  const toolsData = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));
  res.json(toolsData);
});

app.post('/api/tools/addPlastina', (req, res) => {
  const { category, subcategory, shape, angle, name, quantity } = req.body;

  // Проверяем, существует ли уже объект для данной категории, подкатегории, формы и угла инструмента
  if (!tools[category]) tools[category] = {};
  if (!tools[category][subcategory]) tools[category][subcategory] = { shapes: {} };
  if (!tools[category][subcategory].shapes[shape]) tools[category][subcategory].shapes[shape] = { angles: {} };
  if (!tools[category][subcategory].shapes[shape].angles[angle]) tools[category][subcategory].shapes[shape].angles[angle] = [];

  // Проверяем, существует ли инструмент с таким же именем в той же ветке
  let toolExists = false;
  for (let tool of tools[category][subcategory].shapes[shape].angles[angle]) {
      if (tool.name === name) {
          tool.quantity += quantity; // Увеличиваем количество, если инструмент существует
          toolExists = true;
          break;
      }
  }

  // Если инструмент не существует, добавляем новый инструмент к массиву в объекте angles
  if (!toolExists) {
      tools[category][subcategory].shapes[shape].angles[angle].push({ name, quantity });
  }

  // Перезаписываем файл с обновленными данными
  fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));

  // Отправляем ответ об успешном добавлении данных
  res.json({ success: true });
});

// Добавляем эндпоинт для отправки данных пользователей
app.get('/api/users', (req, res) => {
  // Путь к файлу с пользователями
  const usersFilePath = path.join(__dirname, 'users.json');
  
  // Отправляем файл с пользователями
  res.sendFile(usersFilePath);
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Путь к файлу с пользователями
  const usersFilePath = path.join(__dirname, 'users.json');

  // Читаем файл с пользователями
  fs.readFile(usersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users file:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    try {
      // Преобразуем содержимое файла в объект
      const users = JSON.parse(data);

      // Проверяем, существует ли пользователь с указанным именем
      if (users[username] && users[username].password === password) {
        // Учетные данные верны, возвращаем успешный статус и роль пользователя
        res.json({ success: true, role: users[username].role });
      } else {
        // Учетные данные неверны, возвращаем ошибку
        res.status(401).json({ error: 'Invalid username or password' });
      }
    } catch (error) {
      console.error('Error parsing users file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
});


const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ server });

wss.on('connection', function connection(ws) {
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    console.log('received:', data);

    if (data.type === 'updateToolInfo') {
      tools[data.payload.subcategory] = data.payload.tools;
      fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
    }

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.send(JSON.stringify({ type: 'initial', payload: tools }));
});

console.log('WebSocket server is running on ws://localhost:3000');
