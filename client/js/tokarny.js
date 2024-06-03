let toolsData = {}; // База данных инструментов
let selectedCategory = '';
let selectedSubcategory = '';
let selectedSize = '';
let selectedTool = '';
let selectedShape = '';
let selectedAngle = '';
let userRole = ''; // Роль пользователя

document.getElementById('logout').addEventListener('click', function() {
    window.location.replace('login.html');
  });

// Определяем роль пользователя из localStorage
function getUserRoleFromStorage() {
    console.log(localStorage.getItem('userRole'))
    return localStorage.getItem('userRole');
}

// Функция для отображения или скрытия формы добавления инструмента в зависимости от роли пользователя
function toggleAddToolForm() {
    const addToolForm = document.getElementById('addToolForm');
    const userRole = getUserRoleFromStorage();
    if (userRole === 'Admin') {
        addToolForm.style.display = 'block';
    } else {
        addToolForm.style.display = 'none';
    }
}

// Вызываем функцию для отображения или скрытия формы при загрузке страницы
toggleAddToolForm();


function setupWebSocket(ws) {
    ws.onopen = function () {
        console.log('Connected to WebSocket server');
        ws.send(JSON.stringify({ type: 'getUserInfo' }));
    };

    ws.onmessage = function (event) {
        const data = JSON.parse(event.data);
        if (data.type === 'initial') {
            toolsData = data.payload;
        } else if (data.type === 'updateToolInfo') {
            toolsData[data.payload.subcategory] = data.payload.tools;
        } else if (data.type === 'userInfo') {
            userRole = data.payload.role;
            console.log(`User role received in setupWebSocket: ${userRole}`);
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
            addToolForm.style.display = 'none';  // скрываем форму при смене категории
        } else if (selectedCategory === 'plastiny') {
            subcategories.style.display = 'block';
            plastinySubcategories.style.display = 'block';
            displayPlastinySubcategories();
            addToolForm.style.display = 'none';  // скрываем форму при смене категории
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
            addToolForm.style.display = 'none';  // скрываем форму при смене подкатегории
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
            addToolForm.style.display = 'none';  // скрываем форму при смене размера
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
    const subcategoryData = toolsData[selectedCategory]?.[selectedSubcategory];
    if (!subcategoryData) {
        console.error(`Subcategory ${selectedSubcategory} not found in category ${selectedCategory}`);
        return;
    }
    const sizeData = subcategoryData.sizes?.[selectedSize];
    if (!sizeData) {
        console.error(`Size ${selectedSize} not found in subcategory ${selectedSubcategory}`);
        return;
    }
    const tools = sizeData.tools;
    if (!tools) {
        console.error(`Tools not found for size ${selectedSize}`);
        return;
    }

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
    console.log('Calling showAvailability');
    console.log(`Current user role in showAvailability: ${userRole}`);
    availability.style.display = 'block';
    availabilityTable.innerHTML = '';

    const tool = toolsData[selectedCategory]?.[selectedSubcategory]?.sizes?.[selectedSize]?.tools?.[selectedTool]?.shapes?.[selectedShape]?.angles?.[selectedAngle];
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

    } else {
        console.error('Tools not found');
    }
}

function displayPlastinySubcategories() {
    const plastinyData = toolsData['plastiny'];
    for (const subcategory in plastinyData) {
        const li = document.createElement('li');
        li.textContent = subcategory;
        li.addEventListener('click', function () {
            selectedSubcategory = subcategory;
            sizeSelection.style.display = 'block';
            toolDetails.style.display = 'none';
            shapeSelection.style.display = 'none';
            angleSelection.style.display = 'none';
            availability.style.display = 'none';
            addToolForm.style.display = 'none'; 
        });
        plastinySubcategories.appendChild(li);
    }
}

export { setupWebSocket, setupEventListeners };
