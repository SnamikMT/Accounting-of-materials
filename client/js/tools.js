import { initializeWebSocket } from './websocket.js';
import { initRequestsPage } from './requests.js';

let toolsData = {}; // База данных инструментов
let currentUserRole = null;
let selectedNode = null;

document.addEventListener('DOMContentLoaded', () => {
    currentUserRole = localStorage.getItem('userRole');

    if (!currentUserRole) {
        window.location.replace('login.html');
        return;
    }

    initializeWebSocket();
    setupEventListeners();
    loadToolsData(); // Загрузка данных инструментов при загрузке страницы
});

function setupEventListeners() {
    const toolsButton = document.getElementById('tools');
    const addNodeButton = document.getElementById('addNodeButton');
    const addTableButton = document.getElementById('addTableButton'); // Кнопка "Добавить Таблицу"
    const nodeModal = document.getElementById('nodeModal');
    const closeModal = document.querySelector('.close');
    const nodeForm = document.getElementById('nodeForm');

    toolsButton.addEventListener('click', () => {
        hideAllSections();
        document.getElementById('toolCategories').style.display = 'block';
    });

    document.getElementById('tokarny').addEventListener('click', () => {
        hideAllSections();
        document.getElementById('editTree').style.display = 'block';
        renderTree();
    });

    addNodeButton.addEventListener('click', () => {
        selectedNode = null;
        nodeForm.reset();
        nodeModal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        nodeModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === nodeModal) {
            nodeModal.style.display = 'none';
        }
    });

    nodeForm.addEventListener('submit', handleNodeFormSubmit);

    // Обработчик для добавления таблицы
    addTableButton.addEventListener('click', () => {
        if (selectedNode && isLeafNode(selectedNode)) {
            showTableModal(); // Показать модальное окно для создания таблицы
        } else {
            alert('Таблицу можно добавить только в конце ветви.');
        }
    });
}

// Проверка, является ли узел конечной ветвью (листьевым узлом)
function isLeafNode(node) {
    const nodeName = node.textContent.trim();
    const nodeData = getNodeData(toolsData, nodeName);
    const isLeaf = nodeData && Object.keys(nodeData).length === 0;
    console.log(`isLeafNode(${nodeName}) = ${isLeaf}`); // Отладочное сообщение
    return isLeaf;
}

// Получение данных для узла по имени
function getNodeData(data, nodeName) {
    if (data[nodeName]) {
        return data[nodeName];
    }
    for (const key in data) {
        const result = getNodeData(data[key], nodeName);
        if (result) return result;
    }
    return null;
}

// Функция показа модального окна для создания таблицы
function showTableModal() {
    const tableModal = document.createElement('div');
    tableModal.className = 'modal';
    tableModal.innerHTML = `
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Добавить Таблицу</h2>
            <input type="text" id="itemName" placeholder="Введите наименование">
            <input type="number" id="itemQuantity" placeholder="Введите количество">
            <button id="confirmAddTableButton">Добавить</button>
        </div>
    `;
    document.body.appendChild(tableModal);

    // Показать модальное окно
    tableModal.style.display = 'block';

    // Закрыть модальное окно
    tableModal.querySelector('.close-button').addEventListener('click', () => {
        tableModal.remove();
    });

    // Обработчик для добавления данных таблицы
    tableModal.querySelector('#confirmAddTableButton').addEventListener('click', () => {
        const itemName = document.getElementById('itemName').value.trim();
        const itemQuantity = document.getElementById('itemQuantity').value.trim();

        if (itemName && itemQuantity) {
            addTableToCategory(itemName, itemQuantity);
            tableModal.remove();
        } else {
            alert('Пожалуйста, заполните все поля.');
        }
    });

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (event) => {
        if (event.target === tableModal) {
            tableModal.remove();
        }
    });
}

// Функция добавления данных таблицы в категорию
function addTableToCategory(itemName, itemQuantity) {
    const categoryPath = selectedNode.textContent.trim();
    const nodeData = getNodeData(toolsData, categoryPath);

    if (nodeData) {
        if (!nodeData.items) {
            nodeData.items = [];
        }
        nodeData.items.push({
            name: itemName,
            quantity: itemQuantity
        });
        console.log(`Добавлены данные: ${itemName}, Количество: ${itemQuantity}`); // Отладочное сообщение
        renderTree(); // Обновить отображение дерева категорий
        saveToolsData(); // Сохранить данные на сервере
    } else {
        alert('Ошибка: не удалось найти выбранную категорию.');
    }
}

function handleNodeFormSubmit(event) {
    event.preventDefault();
    const nodeName = document.getElementById('nodeName').value.trim();

    if (selectedNode) {
        // Добавление новой подкатегории в выбранный узел
        const parentNodeData = getNodeData(toolsData, selectedNode.textContent.trim());
        parentNodeData[nodeName] = {};
    } else {
        // Добавление новой категории на корневом уровне
        toolsData[nodeName] = {};
    }

    document.getElementById('nodeModal').style.display = 'none';
    renderTree(); // Перерисовать дерево с новым узлом
    saveToolsData(); // Сохранить данные после добавления/редактирования узла
}

function hideAllSections() {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
}

function renderTree() {
    const treeContainer = document.getElementById('treeContainer');
    treeContainer.innerHTML = ''; // Очистить текущее дерево

    function renderNodes(nodes, parentElement) {
        Object.keys(nodes).forEach(nodeName => {
            const node = document.createElement('li');
            node.textContent = nodeName;
            node.addEventListener('click', (event) => {
                event.stopPropagation(); // Предотвращение вызова события клика у родителя
                selectNode(node, nodes[nodeName]);
            });
            parentElement.appendChild(node);

            const childUl = document.createElement('ul');
            parentElement.appendChild(childUl);
            renderNodes(nodes[nodeName], childUl);
        });
    }

    renderNodes(toolsData, treeContainer);
}

function selectNode(node, nodeData) {
    selectedNode = node;
    document.getElementById('nodeName').value = node.textContent;

    // Показать кнопку "Добавить Таблицу", только если это конечный узел
    const addTableButton = document.getElementById('addTableButton');
    if (isLeafNode(node)) {
        addTableButton.style.display = 'inline-block';
        console.log('Кнопка "Добавить Таблицу" видима'); // Отладочное сообщение
    } else {
        addTableButton.style.display = 'none';
        console.log('Кнопка "Добавить Таблицу" скрыта'); // Отладочное сообщение
    }
}

async function saveToolsData() {
    try {
        const response = await fetch('http://localhost:3000/tools.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(toolsData)
        });

        if (!response.ok) {
            throw new Error('Ошибка при сохранении tools.json');
        }

        console.log('Данные успешно сохранены');
    } catch (error) {
        console.error('Ошибка при сохранении tools.json:', error);
    }
}

async function loadToolsData() {
    try {
        const response = await fetch('/tools.json'); // Убедитесь, что сервер обслуживает этот путь
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        toolsData = await response.json();
        renderTree();
    } catch (error) {
        console.error('Ошибка при загрузке tools.json:', error);
    }
}
