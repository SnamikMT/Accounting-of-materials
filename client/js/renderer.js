import { initializeWebSocket } from './websocket.js';
import { initRequestsPage } from './requests.js';
import { setupEventListeners } from './tokarny.js';

let currentUserRole = null;
let toolsData = {}; 
let materialsData = {}; 

async function loadConfig() {
    try {
      const response = await fetch('./config.json');
      if (!response.ok) {
        throw new Error('Failed to load config.json');
      }
      const config = await response.json();
      return config;
    } catch (error) {
      console.error('Error loading config.json:', error);
      return null;
    }
  }
  

document.addEventListener('DOMContentLoaded', async () => {
    const contentContainer = document.getElementById('contentContainer');
    const requestsButton = document.getElementById('requests');
    const toolsButton = document.getElementById('tools');
    const materialsButton = document.getElementById('materials');
    const logoutButton = document.getElementById('logout');

    currentUserRole = localStorage.getItem('userRole');
    console.log('User role extracted from localStorage:', currentUserRole);

    if (!currentUserRole) {
        console.error('User role not set. Redirecting to login page.');
        window.location.replace('login.html');
        return;
    }

    initializeWebSocket((data) => {
        console.log('Message from WebSocket server:', data);

        if (data.type === 'userInfo') {
            currentUserRole = data.payload.role;
            console.log(`User role updated: ${currentUserRole}`);
        }
    });

    requestsButton.addEventListener('click', async () => {
        hideAllSections();
        requestsButton.classList.add('active');
        await loadRequestsHtml();
    });

    toolsButton.addEventListener('click', async () => {
        hideAllSections();
        toolsButton.classList.add('active');
        await loadToolsHtml();
    });

    materialsButton.addEventListener('click', async () => {
        hideAllSections();
        materialsButton.classList.add('active');
        await loadMaterialsHtml();
    });

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('userRole');
        console.log('User logged out. Role cleared from localStorage.');
        window.location.replace('login.html');
    });
    

    async function loadRequestsHtml() {
        try {
            const response = await fetch('./requests.html');
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;
            console.log('HTML loaded: ', contentContainer.innerHTML);
            initRequestsPage(currentUserRole);
            document.getElementById('requestsSection').style.display = 'block';
        } catch (error) {
            console.error('Error loading requests.html:', error);
        }
    }

    async function loadToolsHtml() {
        try {
            const response = await fetch('./tools.html');
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;
            console.log('HTML loaded: ', contentContainer.innerHTML);

            toolsData = await loadToolsData();
            setupToolEventListeners(toolsData, saveToolsData);

            document.getElementById('toolCategories').style.display = 'block';
        } catch (error) {
            console.error('Error loading tools.html:', error);
        }
    }

    async function loadMaterialsHtml() {
        try {
            const response = await fetch('./materials.html'); 
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;
            console.log('HTML loaded: ', contentContainer.innerHTML);

            materialsData = await loadMaterialsData();
            setupToolEventListeners(materialsData, saveMaterialsData);

            document.getElementById('toolCategories').style.display = 'block';
        } catch (error) {
            console.error('Error loading materials.html:', error);
        }
    }

    async function loadToolsData() {

        const config = await loadConfig();
        if (!config) return;

        try {
            const response = await fetch(`http://${config.serverIp}:${config.serverPort}/tools.json`); 
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading tools.json:', error);
            return {};
        }
    }

    async function saveToolsData() {

        const config = await loadConfig();
            if (!config) return;

        try {
            const response = await fetch(`http://${config.serverIp}:${config.serverPort}/tools.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(toolsData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log('Tools data saved successfully');
        } catch (error) {
            console.error('Error saving tools.json:', error);
        }
    }

    async function loadMaterialsData() {

        const config = await loadConfig();
            if (!config) return;

        try {
            const response = await fetch(`http://${config.serverIp}:${config.serverPort}/materials.json`); 
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading materials.json:', error);
            return {};
        }
    }

    async function saveMaterialsData() {

        const config = await loadConfig();
            if (!config) return;

        try {
            const response = await fetch(`http://${config.serverIp}:${config.serverPort}/materials.json`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(materialsData)
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            console.log('Materials data saved successfully');
        } catch (error) {
            console.error('Error saving materials.json:', error);
        }
    }
    
    function hideAllSections() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        if (document.getElementById('toolCategories')) {
            document.getElementById('toolCategories').style.display = 'none';
        }
        if (document.getElementById('requestsSection')) {
            document.getElementById('requestsSection').style.display = 'none';
        }

        requestsButton.classList.remove('active');
        toolsButton.classList.remove('active');
        materialsButton.classList.remove('active');
    }
      

    function setupToolEventListeners(data, saveDataCallback) {
        const categoriesList = document.getElementById('categoriesGrid');
        const subcategoryEditorSection = document.getElementById('subcategoryEditor');
        const subcategoryList = document.getElementById('subcategoryList');
        const addSubcategoryButton = document.getElementById('addSubcategoryButton');
        const addTableButton = document.getElementById('addTableButton');
        const addSubcategoryModal = document.getElementById('addSubcategoryModal');
        const addSubcategoryInput = document.getElementById('addSubcategoryInput');
        const confirmAddSubcategoryButton = document.getElementById('confirmAddSubcategoryButton');
        const cancelAddSubcategoryButton = document.getElementById('cancelAddSubcategoryButton');
        const addDataModal = document.getElementById('addDataModal');
        const dataNameInput = document.getElementById('dataNameInput');
        const dataQuantityInput = document.getElementById('dataQuantityInput');
        const confirmAddDataButton = document.getElementById('confirmAddDataButton');
        const cancelAddDataButton = document.getElementById('cancelAddDataButton');

        const confirmModal = document.getElementById('confirmModal');
        const closeConfirmModal = document.getElementById('closeConfirmModal');
        const confirmDeleteButton = document.getElementById('confirmDeleteButton');
        const cancelDeleteButton = document.getElementById('cancelDeleteButton');

        let currentCategoryPath = []; 

        let subcategoryIdToDelete = null;
        let currentCategoryPathForDelete = [];

        categoriesList.addEventListener('click', (event) => {
            if (event.target && event.target.nodeName === 'LI') {
                currentCategoryPath = [event.target.id];
                console.log('Current category path updated:', currentCategoryPath);
                loadSubcategories(currentCategoryPath);
                subcategoryEditorSection.style.display = 'block';
            }
        });

        subcategoryList.addEventListener('click', (event) => {
            if (event.target && event.target.classList.contains('subcategory-item')) {
                const subcategoryId = event.target.dataset.id;
                currentCategoryPath.push(subcategoryId); 
                console.log('Current category path updated:', currentCategoryPath);
                loadSubcategories(currentCategoryPath);
            } else if (event.target && event.target.id === 'backButton') {
                currentCategoryPath.pop(); 
                console.log('Current category path updated:', currentCategoryPath);
                loadSubcategories(currentCategoryPath);
            } else if (event.target && event.target.classList.contains('delete-subcategory')) {
                const subcategoryId = event.target.dataset.id;
                currentCategoryPathForDelete = [...currentCategoryPath]; // Копируем текущий путь категории
                subcategoryIdToDelete = subcategoryId;
                confirmModal.style.display = 'block'; // Отображаем модальное окно
            } else if (event.target && event.target.classList.contains('quantity-button')) {
                const action = event.target.dataset.action;
                const itemId = event.target.dataset.itemId;
                updateQuantity(currentCategoryPath, itemId, action);
            } else if (event.target && event.target.classList.contains('order-button')) {
                const itemId = event.target.dataset.itemId;
                orderItem(currentCategoryPath, itemId);
            }
        });
        
        // Обработчик для подтверждения удаления
        confirmDeleteButton.addEventListener('click', () => {
            if (subcategoryIdToDelete) {
                // Если вам нужно отладить, вы можете использовать console.log без переменной i, например:
                console.log(`Deleting subcategory:`, subcategoryIdToDelete);
                console.log(`Path for deletion:`, currentCategoryPathForDelete);
        
                deleteSubcategory(currentCategoryPathForDelete, subcategoryIdToDelete);
                subcategoryIdToDelete = null;
                confirmModal.style.display = 'none'; // Закрываем модальное окно
            }
        });
        

        // Обработчик для отмены удаления
        cancelDeleteButton.addEventListener('click', () => {
            confirmModal.style.display = 'none'; // Закрываем модальное окно
            subcategoryIdToDelete = null;
        });

        closeConfirmModal.addEventListener('click', () => {
            confirmModal.style.display = 'none'; // Закрываем модальное окно
            subcategoryIdToDelete = null;
        });
    
        window.addEventListener('click', (event) => {
            if (event.target === confirmModal) {
                confirmModal.style.display = 'none';
                subcategoryIdToDelete = null;
            }
        });

        if (currentUserRole === 'admin') {
            addSubcategoryButton.style.display = 'block';
            addTableButton.style.display = 'block';
        } else {
            addSubcategoryButton.style.display = 'none';
            addTableButton.style.display = 'none';
        }

        addSubcategoryButton.addEventListener('click', () => {
            addSubcategoryModal.style.display = 'block';
        });

        confirmAddSubcategoryButton.addEventListener('click', () => {
            const newSubcategoryName = addSubcategoryInput.value.trim();
            if (newSubcategoryName) {
                addSubcategory(currentCategoryPath, newSubcategoryName);
                addSubcategoryModal.style.display = 'none';
                addSubcategoryInput.value = '';
            }
        });

        cancelAddSubcategoryButton.addEventListener('click', () => {
            addSubcategoryModal.style.display = 'none';
            addSubcategoryInput.value = '';
        });

        addTableButton.addEventListener('click', () => {
            addDataModal.style.display = 'block';
        });

        confirmAddDataButton.addEventListener('click', () => {
            const newDataName = dataNameInput.value.trim();
            const newDataQuantity = parseInt(dataQuantityInput.value.trim(), 10);
            if (newDataName && !isNaN(newDataQuantity)) {
                addData(currentCategoryPath, newDataName, newDataQuantity);
                addDataModal.style.display = 'none';
                dataNameInput.value = '';
                dataQuantityInput.value = '';
            }
        });

        cancelAddDataButton.addEventListener('click', () => {
            addDataModal.style.display = 'none';
            dataNameInput.value = '';
            dataQuantityInput.value = '';
        });

        const quantityModal = document.getElementById('quantityModal');
        const quantityInput = document.getElementById('quantityInput');
        const confirmOrderBtn = document.getElementById('confirmOrderBtn');
        const closeModal = document.querySelector('#quantityModal .close');

        function openQuantityModal(itemName, callback) {
            const quantityModal = document.getElementById('quantityModal');
            const quantityInput = document.getElementById('quantityInput');
            const confirmOrderBtn = document.getElementById('confirmOrderBtn');
            const closeModal = document.querySelector('#quantityModal .close');
        
            if (!quantityModal || !quantityInput || !confirmOrderBtn || !closeModal) {
                console.error('Не удалось найти один или несколько элементов для модального окна.');
                return;
            }
        
            quantityModal.style.display = 'block';
        
            confirmOrderBtn.onclick = () => {
                const quantity = parseInt(quantityInput.value, 10);
                if (quantity && quantity > 0) {
                    callback(quantity);
                    quantityModal.style.display = 'none';
                    quantityInput.value = '';
                } else {
                    alert('Некорректное количество.');
                }
            };
        
            closeModal.onclick = () => {
                quantityModal.style.display = 'none';
                quantityInput.value = '';
            };

            console.log('quantityModal:', quantityModal);
            console.log('quantityInput:', quantityInput);
            console.log('confirmOrderBtn:', confirmOrderBtn);
            console.log('closeModal:', closeModal);

        }

        function loadSubcategories(categoryPath) {
            const categories = findCategoryByPath(categoryPath);
        
            // Убираем кнопку, чтобы она не дублировалась
            const addTableButton = document.getElementById('addTableButton');
            addTableButton.style.display = 'none';
        
            if (categoryPath.length > 0) {
                subcategoryList.innerHTML = '<li id="backButton" class="button">Back</li>';
            } else {
                subcategoryList.innerHTML = '';
            }
        
            let isLeaf = true;
        
            for (const subcategory in categories) {
                if (typeof categories[subcategory] === 'object' && categories[subcategory] !== null) {
                    isLeaf = false; // Если есть вложенные подкатегории, это не конец ветки
                    const li = document.createElement('li');
                    li.className = 'subcategory-item';
                    li.dataset.id = subcategory;
                    li.innerHTML = `
                        ${subcategory}
                        ${currentUserRole === 'admin' ? '<button class="delete-subcategory" data-id="' + subcategory + '">Удалить</button>' : ''}
                    `;
                    subcategoryList.appendChild(li);
                } else {
                    const li = document.createElement('li');
                    li.className = 'subcategory-item';
                    li.dataset.id = subcategory;
                    li.innerHTML = `
                        ${subcategory}: ${categories[subcategory]} 
                        ${currentUserRole === 'admin' ? '<button class="quantity-button" data-action="increase" data-item-id="' + subcategory + '">+</button><button class="quantity-button" data-action="decrease" data-item-id="' + subcategory + '">-</button>' : ''}
                        <button class="order-button" data-item-id="${subcategory}">Заказать</button>
                        ${currentUserRole === 'admin' ? '<button class="delete-subcategory" data-id="' + subcategory + '">Удалить</button>' : ''}
                    `;
                    subcategoryList.appendChild(li);
                }
            }
        
            // Если это конец ветки или уже добавлены данные (например, значения чисел), показываем кнопку "Добавить данные"
            if (isLeaf || Object.values(categories).some(value => typeof value !== 'object')) {
                addTableButton.style.display = 'block';
            }
        }
        

    function findCategoryByPath(path) {
        let currentCategory = data;
        for (const category of path) {
            if (currentCategory && currentCategory[category]) {
                currentCategory = currentCategory[category];
            } else {
                return null;
            }
        }
        return currentCategory;
    }

    function deleteSubcategory(categoryPath, subcategoryId) {
        let currentLevel = data;
    
        for (let i = 0; i < categoryPath.length; i++) {
            const id = categoryPath[i];
    
            // Проверка на наличие текущего уровня
            if (!currentLevel[id]) {
                console.error(`Error: Path segment "${id}" is missing in data at level ${i}. Full path:`, categoryPath);
                return;
            }
    
            // Если это последний элемент в пути, удаляем подкатегорию
            if (i === categoryPath.length - 1) {
                if (currentLevel[id].hasOwnProperty(subcategoryId)) {
                    delete currentLevel[id][subcategoryId];
                } else {
                    console.error(`Error: Subcategory "${subcategoryId}" does not exist at level ${i}.`);
                }
            } else {
                // Если не последний уровень, проверяем наличие подкатегорий
                currentLevel = currentLevel[id];
    
                // Если следующего уровня нет, значит, структура данных не соответствует ожиданиям
                if (!currentLevel || typeof currentLevel !== 'object') {
                    console.error(`Error: Expected object at level ${i} for id "${id}", but got ${typeof currentLevel}. Full path:`, categoryPath);
                    return;
                }
            }
        }
    
        saveDataCallback();
        loadSubcategories(categoryPath.slice(0, -1)); // Обновляем родительский уровень подкатегории
    }
    

        function addSubcategory(categoryPath, subcategoryName) {
            let category = findCategoryByPath(categoryPath);
            if (category) {
                category[subcategoryName] = {};
                loadSubcategories(categoryPath);
                saveDataCallback();
            }
        }

        function addData(categoryPath, dataName, dataQuantity) {
            let category = findCategoryByPath(categoryPath);
            if (category) {
                category[dataName] = dataQuantity;
                loadSubcategories(categoryPath);
                saveDataCallback();
            }
        }        

        function updateQuantity(categoryPath, itemId, action) {
            let category = findCategoryByPath(categoryPath);
            if (category && typeof category[itemId] === 'number') {
                if (action === 'increase') {
                    category[itemId]++;
                } else if (action === 'decrease' && category[itemId] > 0) {
                    category[itemId]--;
                }
                loadSubcategories(categoryPath);
                saveDataCallback();
            } else {
                console.error('Item not found or invalid type for updating quantity:', itemId);
            }
        }
        

        async function orderItem(categoryPath, itemId) {

            const config = await loadConfig();
                if (!config) return;

            let category = findCategoryByPath(categoryPath);
            if (category) {
                const itemName = findParentItemName(category, itemId, categoryPath);

                if (itemName) {
                    openQuantityModal(itemName, (quantity) => {
                        const orderData = {
                            itemName: itemName,
                            quantity: quantity,
                            timestamp: new Date().toISOString()
                        };

                        fetch(`http://${config.serverIp}:${config.serverPort}/addRequest`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(orderData)
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.json();
                        })
                        .then(data => {
                            console.log('Request added successfully:', data);
                            alert(`Заказ на ${itemName} успешно отправлен!`);
                        })
                        .catch(error => {
                            console.error('Error adding request:', error);
                            alert('Произошла ошибка при отправке заказа.');
                        });
                    });
                } else {
                    console.error('Item not found in category:', itemId);
                }
            }
        }
        
        
        function findParentItemName(category, itemId, categoryPath) {
            if (category && category.hasOwnProperty(itemId)) {
                return itemId;
            }
            return null;
        }
        

        loadSubcategories(currentCategoryPath);
    }
});
