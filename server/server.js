const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Пример данных о инструментах в виде JSON
let toolsData = {
  "tokarny": [
    { "id": 1, "название": "Отрезной", "количество": 10 },
    { "id": 2, "название": "Проходной", "количество": 5 }
  ],
  "frezerny": [
    { "id": 3, "название": "Фрезер", "количество": 8 }
  ],
  // Добавьте другие категории инструментов сюда
};

app.use(bodyParser.json());

// Получить список инструментов в выбранной категории
app.get('/api/tools/:category', (req, res) => {
  const category = req.params.category;
  const tools = toolsData[category] || [];
  res.json(tools);
});

// Добавить новый инструмент в выбранную категорию
app.post('/api/tools/:category', (req, res) => {
  const category = req.params.category;
  const newTool = req.body;

  // Генерируем уникальный ID для нового инструмента
  newTool.id = Date.now();

  // Добавляем новый инструмент в соответствующую категорию
  if (!toolsData[category]) {
    toolsData[category] = [];
  }
  toolsData[category].push(newTool);

  res.json({ message: 'Инструмент добавлен' });
});

// Старт сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
