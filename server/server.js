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
const materialsFilePath = path.join(__dirname, 'materials.json');


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

const config = {
  serverIp: process.env.SERVER_IP,
  serverPort: process.env.PORT
};

// Запись конфигурации в config.json
fs.writeFileSync(
  path.join(__dirname, 'config.json'),
  JSON.stringify(config, null, 2)
);

console.log('Configuration saved to config.json');

// Пример использования updateHierarchicalData (описан ранее)
function updateHierarchicalData(obj, keys, quantity) {
  let current = obj;

  // Итерируем через все ключи, кроме последнего
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {}; // Создаем объект на этом уровне, если его нет
    }
    current = current[keys[i]];
  }

  // Последний ключ - это место, где находится количество
  const finalKey = keys[keys.length - 1];

  if (current[finalKey]) {
    // Если объект существует, обновляем количество
    if (current[finalKey].quantities) {
      current[finalKey].quantities += quantity;
    } else if (Array.isArray(current[finalKey].quantities)) {
      // Если количество хранится в массиве
      current[finalKey].quantities[0] += quantity;
    } else {
      current[finalKey] = { quantities: quantity };
    }
  } else {
    // Если объекта нет, добавляем его с новым количеством
    current[finalKey] = { quantities: quantity };
  }
}

// Обновление данных в tools.json или materials.json
app.post('/api/update-stock', (req, res) => {
  const { type, keys, quantity } = req.body;  // keys будет массивом ключей

  const filePath = type === 'tool' ? toolsFilePath : materialsFilePath;
  const stock = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  updateHierarchicalData(stock, keys, quantity);

  fs.writeFileSync(filePath, JSON.stringify(stock, null, 2));
  res.json({ success: true });
});

app.post('/addRequest', (req, res) => {
  const { itemName, quantity, type } = req.body;  // Добавлен параметр type

  // Генерация уникального ID (можно использовать временной штамп)
  const id = Date.now();

  // Создаем новый объект с нужными ключами и значениями
  const newRequest = {
    id: id,                 // Добавляем ID
    name: itemName,         // Используем название материала
    quantity: quantity,
    type: type,             // Сохраняем тип (tool или material)
    timestamp: new Date().toISOString(),
    status: 'Pending'       // Начальный статус
  };

  if (!fs.existsSync(requestsFilePath)) {
    // Если файл не существует, создаем файл с пустым массивом
    fs.writeFileSync(requestsFilePath, JSON.stringify([]));
  }

  fs.readFile(requestsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading requests.json:', err);
      res.status(500).send('Server Error: Unable to read requests.json');
      return;
    }

    let requests = [];
    try {
      if (data) {
        requests = JSON.parse(data);
      }
    } catch (parseErr) {
      console.error('Error parsing requests.json:', parseErr);
      res.status(500).send('Server Error: Unable to parse requests.json');
      return;
    }

    // Добавляем новый запрос в массив
    requests.push(newRequest);

    // Записываем обновленный массив в файл
    fs.writeFile(requestsFilePath, JSON.stringify(requests, null, 2), (err) => {
      if (err) {
        console.error('Error writing to requests.json:', err);
        res.status(500).send('Server Error: Unable to write to requests.json');
        return;
      }

      res.status(200).json({ message: 'Request added successfully' });
    });
  });
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

app.get('/materials.json', (req, res) => {
  console.log('Attempting to read materials.json from:', materialsFilePath);  // Добавьте этот лог
  fs.readFile(materialsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading materials.json:', err);
      res.status(500).send('Error reading data');
      return;
    }
    res.send(data);
  });
});

// Маршрут для сохранения данных в materials.json
app.post('/materials.json', (req, res) => {
  const newData = req.body;
  fs.writeFile(materialsFilePath, JSON.stringify(newData, null, 2), (err) => {
    if (err) {
      console.error('Error saving materials.json:', err);
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

// Обработчик для обновления статуса заявки
app.post('/api/requests/update', (req, res) => {
  const { id, status, timestamp, revertQuantity } = req.body;
  console.log(`Received request to update status: ID ${id}, new status: ${status}, new timestamp: ${timestamp}`);

  fs.readFile(requestsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading requests.json:', err);
      res.status(500).send('Internal Server Error');
      return;
    }

    try {
      const requests = JSON.parse(data);
      const requestIndex = requests.findIndex(req => req.id === parseInt(id));

      if (requestIndex === -1) {
        res.status(404).send('Request not found');
        return;
      }

      requests[requestIndex].status = status;
      requests[requestIndex].timestamp = timestamp;

      if (revertQuantity) {
        const { name, quantity, type } = requests[requestIndex];
        const filePath = type === 'tool' ? toolsFilePath : materialsFilePath;
        const stock = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        updateHierarchicalData(stock, [name], quantity);

        fs.writeFileSync(filePath, JSON.stringify(stock, null, 2));
      }

      fs.writeFileSync(requestsFilePath, JSON.stringify(requests, null, 2));
      res.status(200).send('Request updated successfully');
    } catch (parseErr) {
      console.error('Error parsing requests.json:', parseErr);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.post('/api/decrease-stock', (req, res) => {
  const { type, keys, quantity } = req.body; // keys - массив ключей

  const filePath = type === 'tool' ? toolsFilePath : materialsFilePath;
  const stock = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let current = stock;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }

  const finalKey = keys[keys.length - 1];

  if (current[finalKey] && current[finalKey].quantities) {
    if (Array.isArray(current[finalKey].quantities)) {
      current[finalKey].quantities[0] -= quantity;
    } else {
      current[finalKey].quantities -= quantity;
    }
  } else {
    res.status(400).json({ success: false, message: 'Quantity not found or insufficient' });
    return;
  }

  fs.writeFileSync(filePath, JSON.stringify(stock, null, 2));
  res.json({ success: true });
});


// Маршрут для получения данных о всех запросах
app.get('/requests.json', (req, res) => {
  fs.readFile(requestsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading requests.json:', err);
      res.status(500).send('Error reading data');
      return;
    }
    res.send(data);
  });
});

app.delete('/api/requests/:id', (req, res) => {
  const requestId = parseInt(req.params.id, 10); // Преобразуем ID в число
  const requestsFilePath = path.join(__dirname, 'requests.json');

  fs.readFile(requestsFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading requests file:', err);
      return res.status(500).send('Internal server error');
    }

    let requests = JSON.parse(data);
    console.log(`Requests before deletion:`, requests);

    const updatedRequests = requests.filter(request => request.id !== requestId);

    if (updatedRequests.length === requests.length) {
      console.error(`Request with ID ${requestId} not found`);
      return res.status(404).send('Request not found');
    }

    fs.writeFile(requestsFilePath, JSON.stringify(updatedRequests, null, 2), (err) => {
      if (err) {
        console.error('Error writing to requests file:', err);
        return res.status(500).send('Internal server error');
      }

      res.send('Request deleted successfully');
    });
  });
});

// Пример функции удаления записей на сервере
app.post('/api/requests/delete', (req, res) => {
  const { from, to } = req.body;
  console.log(`Запрос на удаление записей с ${from} по ${to}`);

  const requestsFilePath = path.join(__dirname, 'requests.json');

  // Чтение содержимого файла requests.json
  fs.readFile(requestsFilePath, 'utf8', (err, data) => {
      if (err) {
          console.error('Ошибка чтения файла запросов:', err);
          return res.status(500).send('Внутренняя ошибка сервера');
      }

      let requests;
      try {
          requests = JSON.parse(data); // Парсинг данных из файла
      } catch (parseError) {
          console.error('Ошибка парсинга requests.json:', parseError);
          return res.status(500).send('Ошибка парсинга файла запросов');
      }

      // Фильтрация записей для удаления
      const updatedRequests = requests.filter(request => {
          return !(request.status === 'Received' && request.timestamp >= from && request.timestamp <= to);
      });

      if (updatedRequests.length === requests.length) {
          console.log('Записи для удаления не найдены');
          return res.status(404).send('Записи для удаления не найдены');
      }

      // Запись обновленных данных обратно в файл
      fs.writeFile(requestsFilePath, JSON.stringify(updatedRequests, null, 2), (err) => {
          if (err) {
              console.error('Ошибка записи файла запросов:', err);
              return res.status(500).send('Внутренняя ошибка сервера');
          }

          console.log('Записи успешно удалены');
          res.send('Записи успешно удалены');
      });
  });
});


// WebSocket сервер на том же порту
const server = app.listen(port, () => {
  console.log(`Server is running on http://${serverIp}:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  // Отправляем сообщение клиенту при подключении
  ws.send('Welcome to the WebSocket server!');

  // Обработка сообщений от клиента
  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    // Отправляем обратно подтверждение
    ws.send(`Server received: ${message}`);
  });

  // Обработка отключения клиента
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
