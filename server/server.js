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

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const usersFilePath = path.join(__dirname, 'users.json');

  fs.readFile(usersFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading users file:', err);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    try {
      const users = JSON.parse(data);
      if (users[username] && users[username].password === password) {
        res.json({ success: true, role: users[username].role });
      } else {
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

    if (data.type === 'getUserInfo') {
      const userInfo = { role: 'Admin' }; // Пример, в реальной ситуации данные о пользователе можно брать из сессии или JWT токена
      ws.send(JSON.stringify({ type: 'userInfo', payload: userInfo }));
    }

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
