let toolsData = {}; // База данных инструментов
let selectedCategory = '';
let selectedSubcategory = '';
let selectedSize = '';
let selectedTool = '';
let selectedShape = '';
let selectedAngle = '';
let userRole = ''; // Роль пользователя

// Добавляем событие на кнопку "Выход"
document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Используем API для перехода на страницу логина
            window.api.send('logout');
        });
    }

    // Проверяем роль пользователя через IPC, когда страница загружается
    window.api.receive('userRole', (role) => {
        userRole = role;
        toggleAddToolForm(); // Обновляем видимость формы добавления инструмента на основе роли пользователя
    });

    // Настраиваем WebSocket соединение после получения конфигурации
    setupWebSocket();

    setupEventListeners();
});

// Функция для отображения или скрытия формы добавления инструмента в зависимости от роли пользователя
function toggleAddToolForm() {
    const addToolForm = document.getElementById('addToolForm');
    if (addToolForm) {
        if (userRole === 'Admin') {
            addToolForm.style.display = 'block';
        } else {
            addToolForm.style.display = 'none';
        }
    }
}

// Настройка WebSocket соединения
async function setupWebSocket() {
    try {
        const config = await window.api.getConfig();
        const ws = new WebSocket(`ws://${config.serverAddress.split('/')[2]}`);

        ws.onopen = function () {
            console.log('Connected to WebSocket server');
            ws.send(JSON.stringify({ type: 'getUserInfo' }));
        };

        ws.onmessage = function (event) {
            const data = JSON.parse(event.data);
            handleWebSocketMessage(data);
        };

        ws.onerror = function (error) {
            console.error('WebSocket error:', error);
        };

        ws.onclose = function () {
            console.log('WebSocket connection closed');
        };
    } catch (error) {
        console.error('Error setting up WebSocket:', error);
    }
}

// Функция для обработки сообщений WebSocket
function handleWebSocketMessage(data) {
    if (data.type === 'initial') {
        toolsData = data.payload;
    } else if (data.type === 'updateToolInfo') {
        toolsData[data.payload.subcategory] = data.payload.tools;
    } else if (data.type === 'userInfo') {
        userRole = data.payload.role;
        console.log(`User role received in setupWebSocket: ${userRole}`);
        toggleAddToolForm(); // Обновляем видимость формы добавления инструмента на основе новой информации о роли пользователя
    } else if (data.type === 'newRequests') {
        const hasMaterialRequests = data.payload.some(request => request.type === 'Материал');
        console.log('Received new requests:', data.payload);
        console.log('Has Material Requests:', hasMaterialRequests);

        const requestsButton = document.getElementById('requests');
        if (requestsButton) {
            if (hasMaterialRequests) {
                requestsButton.classList.add('blinking');
                console.log('Adding blinking class to requests button via WebSocket');
            } else {
                requestsButton.classList.remove('blinking');
                console.log('Removing blinking class from requests button via WebSocket');
            }
        }
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    const toolsButton = document.getElementById('tools');
    if (toolsButton) {
        toolsButton.addEventListener('click', function () {
            hideAllSections();
            const toolCategories = document.getElementById('toolCategories');
            if (toolCategories) {
                toolCategories.style.display = 'block';
            }
        });
    }

    const toolCategories = document.getElementById('toolCategories');
    if (toolCategories) {
        toolCategories.addEventListener('click', function (event) {
            selectedCategory = event.target.id;
            const subcategories = document.getElementById('subcategories');
            const tokarnySubcategories = document.getElementById('tokarnySubcategories');
            const plastinySubcategories = document.getElementById('plastinySubcategories');
            const addToolForm = document.getElementById('addToolForm');
            if (selectedCategory === 'tokarny') {
                if (subcategories) subcategories.style.display = 'block';
                if (tokarnySubcategories) tokarnySubcategories.style.display = 'block';
                if (addToolForm) addToolForm.style.display = 'none';
            } else if (selectedCategory === 'plastiny') {
                if (subcategories) subcategories.style.display = 'block';
                if (tokarnySubcategories) tokarnySubcategories.style.display = 'none';
                if (plastinySubcategories) {
                    plastinySubcategories.style.display = 'block';
                    displayPlastinySubcategories();
                }
                if (addToolForm) addToolForm.style.display = 'none';
            }
        });
    }

    const tokarnySubcategories = document.getElementById('tokarnySubcategories');
    if (tokarnySubcategories) {
        tokarnySubcategories.addEventListener('click', function (event) {
            selectedSubcategory = event.target.id;
            const sizeSelection = document.getElementById('sizeSelection');
            const toolDetails = document.getElementById('toolDetails');
            const shapeSelection = document.getElementById('shapeSelection');
            const angleSelection = document.getElementById('angleSelection');
            const availability = document.getElementById('availability');
            const addToolForm = document.getElementById('addToolForm');
            if (selectedSubcategory === 'rezcy') {
                if (sizeSelection) sizeSelection.style.display = 'block';
                if (toolDetails) toolDetails.style.display = 'none';
                if (shapeSelection) shapeSelection.style.display = 'none';
                if (angleSelection) angleSelection.style.display = 'none';
                if (availability) availability.style.display = 'none';
                if (addToolForm) addToolForm.style.display = 'none';
            }
        });
    }

    document.querySelectorAll('.size-option').forEach(function (sizeOption) {
        sizeOption.addEventListener('click', function () {
            selectedSize = sizeOption.getAttribute('data-size');
            console.log(`Selected Size: ${selectedSize}`);
            const toolDetails = document.getElementById('toolDetails');
            const sizeSelection = document.getElementById('sizeSelection');
            const shapeSelection = document.getElementById('shapeSelection');
            const angleSelection = document.getElementById('angleSelection');
            const availability = document.getElementById('availability');
            const addToolForm = document.getElementById('addToolForm');
            if (toolDetails) toolDetails.style.display = 'block';
            if (sizeSelection) sizeSelection.style.display = 'none';
            if (shapeSelection) shapeSelection.style.display = 'none';
            if (angleSelection) angleSelection.style.display = 'none';
            if (availability) availability.style.display = 'none';
            if (addToolForm) addToolForm.style.display = 'none';
            displayToolsList();
        });
    });

    document.querySelectorAll('.shape-option').forEach(function (shapeOption) {
        shapeOption.addEventListener('click', function () {
            selectedShape = shapeOption.getAttribute('data-shape');
            console.log(`Selected Shape: ${selectedShape}`);
            const shapeSelection = document.getElementById('shapeSelection');
            const angleSelection = document.getElementById('angleSelection');
            if (shapeSelection) shapeSelection.style.display = 'none';
            if (selectedShape === 'Ромбические') {
                if (angleSelection) angleSelection.style.display = 'block';
            } else {
                if (angleSelection) angleSelection.style.display = 'none';
                showAvailability();
            }
        });
    });

    document.querySelectorAll('.angle-option').forEach(function (angleOption) {
        angleOption.addEventListener('click', function () {
            selectedAngle = angleOption.getAttribute('data-angle');
            console.log(`Selected Angle: ${selectedAngle}`);
            const angleSelection = document.getElementById('angleSelection');
            if (angleSelection) angleSelection.style.display = 'none';
            showAvailability();
        });
    });

    const addToolForm = document.getElementById('addToolForm');
    if (addToolForm) {
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
                        name: toolName, // имя инструмента (например, "Tool")
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
}

// Функция отображения списка инструментов
function displayToolsList() {
    const toolList = document.getElementById('toolList');
    if (!toolList) return;

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

// Функция отображения форм выбора формы и угла инструмента
function showToolShapes() {
    const toolDetails = document.getElementById('toolDetails');
    const shapeSelection = document.getElementById('shapeSelection');
    if (toolDetails) toolDetails.style.display = 'none';
    if (shapeSelection) shapeSelection.style.display = 'block';
    document.querySelectorAll('.shape-option').forEach(function (shapeOption) {
        shapeOption.addEventListener('click', function () {
            selectedShape = shapeOption.getAttribute('data-shape');
            console.log(`Selected Shape for ${selectedTool}: ${selectedShape}`);
            if (shapeSelection) shapeSelection.style.display = 'none';
            const angleSelection = document.getElementById('angleSelection');
            if (selectedShape === 'Ромбические') {
                if (angleSelection) angleSelection.style.display = 'block';
            } else {
                if (angleSelection) angleSelection.style.display = 'none';
                showAvailability();
            }
        });
    });
}

// Функция отображения таблицы доступности инструментов
function showAvailability() {
    console.log('Calling showAvailability');
    console.log(`Current user role in showAvailability: ${userRole}`);

    const availability = document.getElementById('availability');
    const availabilityTable = document.getElementById('availabilityTable');
    if (availability) availability.style.display = 'block';
    if (availabilityTable) availabilityTable.innerHTML = '';

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

// Функция отображения подкатегорий "Пластины"
function displayPlastinySubcategories() {
    const plastinyData = toolsData['plastiny'];
    const plastinySubcategories = document.getElementById('plastinySubcategories');
    if (!plastinySubcategories) return;

    plastinySubcategories.innerHTML = '';
    for (const subcategory in plastinyData) {
        const li = document.createElement('li');
        li.textContent = subcategory;
        li.addEventListener('click', function () {
            selectedSubcategory = subcategory;
            const sizeSelection = document.getElementById('sizeSelection');
            const toolDetails = document.getElementById('toolDetails');
            const shapeSelection = document.getElementById('shapeSelection');
            const angleSelection = document.getElementById('angleSelection');
            const availability = document.getElementById('availability');
            const addToolForm = document.getElementById('addToolForm');
            if (sizeSelection) sizeSelection.style.display = 'block';
            if (toolDetails) toolDetails.style.display = 'none';
            if (shapeSelection) shapeSelection.style.display = 'none';
            if (angleSelection) angleSelection.style.display = 'none';
            if (availability) availability.style.display = 'none';
            if (addToolForm) addToolForm.style.display = 'none';
        });
        plastinySubcategories.appendChild(li);
    }
}

// Функция скрытия всех секций
function hideAllSections() {
    const toolCategories = document.getElementById('toolCategories');
    const subcategories = document.getElementById('subcategories');
    const sizeSelection = document.getElementById('sizeSelection');
    const toolDetails = document.getElementById('toolDetails');
    const shapeSelection = document.getElementById('shapeSelection');
    const angleSelection = document.getElementById('angleSelection');
    const availability = document.getElementById('availability');
    const addToolForm = document.getElementById('addToolForm');
    if (toolCategories) toolCategories.style.display = 'block';
    if (subcategories) subcategories.style.display = 'none';
    if (sizeSelection) sizeSelection.style.display = 'none';
    if (toolDetails) toolDetails.style.display = 'none';
    if (shapeSelection) shapeSelection.style.display = 'none';
    if (angleSelection) angleSelection.style.display = 'none';
    if (availability) availability.style.display = 'none';
    if (addToolForm) addToolForm.style.display = 'none';
}

export { setupWebSocket, setupEventListeners };
