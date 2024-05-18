document.addEventListener('DOMContentLoaded', function () {
  const toolsButton = document.getElementById('tools');
  const toolCategories = document.getElementById('toolCategories');
  const toolDetails = document.getElementById('toolDetails');
  const toolList = document.getElementById('toolList');
  const addToolButton = document.getElementById('addToolButton');
  const addToolForm = document.getElementById('addToolForm');
  const ws = new WebSocket('ws://localhost:3000'); // Убедитесь, что используется правильный порт

  let toolsData = {};

  ws.onopen = function () {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'initial') {
      toolsData = data.payload;
    } else if (data.type === 'updateToolInfo') {
      toolsData[data.payload.subcategory] = data.payload.tools;
    }
  };

  toolsButton.addEventListener('click', function () {
    toolCategories.style.display = 'block';
    toolDetails.style.display = 'none';
    addToolForm.style.display = 'none';
  });

  toolCategories.addEventListener('click', function (event) {
    const selectedTool = event.target.id;
    const toolCategory = toolsData[selectedTool];

    if (toolCategory && toolCategory.length > 0) {
      toolDetails.style.display = 'block';
      toolList.innerHTML = '';
      toolCategory.forEach(tool => {
        const li = document.createElement('li');
        li.textContent = tool.name;
        li.addEventListener('click', function () {
          showToolCharacteristics(tool);
        });
        toolList.appendChild(li);
      });
    }
  });

  function showToolCharacteristics(tool) {
    const characteristicsList = document.getElementById('characteristicsList');
    if (!characteristicsList) {
      console.error("Element with id 'characteristicsList' not found.");
      return;
    }
    characteristicsList.innerHTML = '';
    tool.characteristics.forEach(char => {
      const li = document.createElement('li');
      li.textContent = `Тип: ${char.type}, Количество: ${char.quantity}`;
      characteristicsList.appendChild(li);
    });
    addToolForm.style.display = 'block';
  }
  

  addToolForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const type = document.getElementById('typeInput').value;
    const quantity = document.getElementById('quantityInput').value;
    const selectedTool = document.querySelector('#toolCategories li.active').id;

    if (type && quantity && selectedTool) {
      const toolCategory = toolsData[selectedTool];
      const tool = toolCategory.find(t => t.name === selectedTool);
      tool.characteristics.push({ type, quantity });
      ws.send(JSON.stringify({ type: 'updateToolInfo', payload: { subcategory: selectedTool, tools: toolCategory } }));
    }
  });
});
