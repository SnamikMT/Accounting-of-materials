const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;  // Используйте другой порт

const toolsPath = path.join(__dirname, 'tools.json');
let tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

app.use(bodyParser.json());

app.get('/api/tools/:subcategory', (req, res) => {
  const subcategory = req.params.subcategory;
  res.json(tools[subcategory] || []);
});

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

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
