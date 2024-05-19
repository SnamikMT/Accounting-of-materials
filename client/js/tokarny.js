let toolsData = {}; // База данных инструментов
let selectedCategory = '';
let selectedSubcategory = '';
let selectedSize = '';
let selectedTool = '';
let selectedShape = '';
let selectedAngle = '';

function setupWebSocket(ws) {
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
}

function setupEventListeners() {
    document.getElementById('tools').addEventListener('click', function () {
        toolCategories.style.display = 'block';
        subcategories.style.display = 'none';
        sizeSelection.style.display = 'none';
        toolDetails.style.display = 'none';
        shapeSelection.style.display = 'none';
        angleSelection.style.display = 'none';
        availability.style.display = 'none';
        addToolForm.style.display = 'none';
    });

    document.getElementById('toolCategories').addEventListener('click', function (event) {
        selectedCategory = event.target.id;
        if (selectedCategory === 'tokarny') {
            subcategories.style.display = 'block';
            tokarnySubcategories.style.display = 'block';
        } else if (selectedCategory === 'plastiny') {
            subcategories.style.display = 'block';
            plastinySubcategories.style.display = 'block';
            displayPlastinySubcategories();
        } else {
            // handle other categories if necessary
        }
    });

    tokarnySubcategories.addEventListener('click', function (event) {
        selectedSubcategory = event.target.id;
        if (selectedSubcategory === 'rezcy') {
            sizeSelection.style.display = 'block';
            toolDetails.style.display = 'none';
            shapeSelection.style.display = 'none';
            angleSelection.style.display = 'none';
            availability.style.display = 'none';
        } else {
            // handle other subcategories if necessary
        }
    });

    document.querySelectorAll('.size-option').forEach(function (sizeOption) {
        sizeOption.addEventListener('click', function () {
            selectedSize = sizeOption.getAttribute('data-size');
            console.log(`Selected Size: ${selectedSize}`);
            toolDetails.style.display = 'block';
            sizeSelection.style.display = 'none';
            shapeSelection.style.display = 'none';
            angleSelection.style.display = 'none';
            availability.style.display = 'none';
            displayToolsList();
        });
    });

    document.querySelectorAll('.shape-option').forEach(function (shapeOption) {
        shapeOption.addEventListener('click', function () {
            selectedShape = shapeOption.getAttribute('data-shape');
            console.log(`Selected Shape: ${selectedShape}`);
            shapeSelection.style.display = 'none';
            if (selectedShape === 'Ромбические') {
                angleSelection.style.display = 'block';
            } else {
                angleSelection.style.display = 'none';
                showAvailability();
            }
        });
    });

    document.querySelectorAll('.angle-option').forEach(function (angleOption) {
        angleOption.addEventListener('click', function () {
            selectedAngle = angleOption.getAttribute('data-angle');
            console.log(`Selected Angle: ${selectedAngle}`);
            angleSelection.style.display = 'none';
            showAvailability();
        });
    });

    addToolForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const toolName = document.getElementById('toolName').value.trim();
        const toolQuantity = parseInt(document.getElementById('toolQuantity').value);

        if (toolName && !isNaN(toolQuantity)) {
            fetch('http://localhost:3000/api/tools/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: selectedCategory,
                    subcategory: selectedSubcategory,
                    size: selectedSize,
                    toolType: selectedTool,  // тип инструмента (например, "Проходной")
                    shape: selectedShape,
                    angle: selectedAngle,
                    name: toolName, // имя инструмента (например, "Tool A")
                    quantity: toolQuantity
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Запросить обновленные данные с сервера
                    fetch('http://localhost:3000/api/tools')
                    .then(response => response.json())
                    .then(updatedData => {
                        toolsData = updatedData;
                        showAvailability();
                    })
                    .catch(error => {
                        console.error('Error fetching updated tools data:', error);
                    });
                } else {
                    console.error('Failed to add tool');
                }
            })
            .catch(error => {
                console.error('Error adding tool:', error);
            });
        }
    });
}

function displayToolsList() {
    const tools = toolsData[selectedCategory][selectedSubcategory].sizes[selectedSize].tools;
    console.log(`Tools: ${JSON.stringify(tools, null, 2)}`);
    toolList.innerHTML = '';
    for (const toolName in tools) {
        const li = document.createElement('li');
        li.textContent = toolName;
        li.addEventListener('click', function () {
            console.log(`Selected Tool: ${toolName}`);
            selectedTool = toolName;
            showToolShapes();
        });
        toolList.appendChild(li);
    }
}

// Отображение формы выбора формы (shape) и угла (angle) для выбранного инструмента
function showToolShapes() {
    toolDetails.style.display = 'none';
    shapeSelection.style.display = 'block';
    document.querySelectorAll('.shape-option').forEach(function (shapeOption) {
        shapeOption.addEventListener('click', function () {
            selectedShape = shapeOption.getAttribute('data-shape');
            console.log(`Selected Shape for ${selectedTool}: ${selectedShape}`);
            shapeSelection.style.display = 'none';
            if (selectedShape === 'Ромбические') {
                angleSelection.style.display = 'block';
            } else {
                angleSelection.style.display = 'none';
                showAvailability();
            }
        });
    });
}

// Отображение таблицы доступности инструментов
function showAvailability() {
    availability.style.display = 'block';
    availabilityTable.innerHTML = '';

    // Получаем данные из JSON файла в соответствии с выбранными значениями
    const tool = toolsData[selectedCategory]?.[selectedSubcategory]?.sizes[selectedSize]?.tools[selectedTool]?.shapes[selectedShape]?.angles[selectedAngle];
    if (tool) {
        tool.forEach(item => {
            const row = document.createElement('tr');
            const nameCell = document.createElement('td');
            const quantityCell = document.createElement('td');
            nameCell.textContent = item.name;
            quantityCell.textContent = item.quantity;
            row.appendChild(nameCell);
            row.appendChild(quantityCell);
            availabilityTable.appendChild(row);
        });

        // Проверяем, существует ли уже кнопка "Создать новый"
        if (!document.getElementById('addButton')) {
            // Создаем кнопку "Создать новый"
            const addButton = document.createElement('button');
            addButton.id = 'addButton';
            addButton.textContent = 'Создать новый';
            addButton.addEventListener('click', function () {
                // Показываем форму для добавления нового инструмента
                addToolForm.style.display = 'block';
            });

            // Добавляем кнопку в DOM
            availability.appendChild(addButton);
        }
    } else {
        console.error(`Tools not found for ${selectedShape} at ${selectedAngle}`);
    }
}

// Отображение подкатегорий для пластин
function displayPlastinySubcategories() {
    plastinySubcategories.innerHTML = '';
    const plastinyData = toolsData['plastiny'];
    for (const subcategory in plastinyData) {
        const button = document.createElement('button');
        button.id = subcategory;
        button.textContent = subcategory;
        button.addEventListener('click', function () {
            selectedSubcategory = subcategory;
            shapeSelection.style.display = 'block';
            displayShapes();
        });
        plastinySubcategories.appendChild(button);
    }
}

// Отображение форм для выбора формы (shape) для пластин
function displayShapes() {
    shapeSelection.innerHTML = '';
    const shapes = toolsData['plastiny'][selectedSubcategory]['shapes'];
    for (const shape in shapes) {
        const button = document.createElement('button');
        button.className = 'shape-option';
        button.setAttribute('data-shape', shape);
        button.textContent = shape;
        button.addEventListener('click', function () {
            selectedShape = shape;
            shapeSelection.style.display = 'none';
            showPlastinaAvailability();
        });
        shapeSelection.appendChild(button);
    }
}

// Отображение таблицы доступности для пластин
function showPlastinaAvailability() {
    availability.style.display = 'block';
    availabilityTable.innerHTML = '';

    const tools = toolsData['plastiny'][selectedSubcategory]['shapes'][selectedShape];
    tools.forEach(item => {
      const row = document.createElement('tr');
      const nameCell = document.createElement('td');
      const quantityCell = document.createElement('td');
      nameCell.textContent = item.name;
      quantityCell.textContent = item.quantity;
      row.appendChild(nameCell);
      row.appendChild(quantityCell);
      availabilityTable.appendChild(row);
  });

  // Проверяем, существует ли уже кнопка "Создать новый"
  if (!document.getElementById('addButton')) {
      // Создаем кнопку "Создать новый"
      const addButton = document.createElement('button');
      addButton.id = 'addButton';
      addButton.textContent = 'Создать новый';
      addButton.addEventListener('click', function () {
          // Показываем форму для добавления нового инструмента
          addToolForm.style.display = 'block';
      });

      // Добавляем кнопку в DOM
      availability.appendChild(addButton);
  }
}

// Экспортируем функции
export { setupWebSocket, setupEventListeners, displayPlastinySubcategories };
