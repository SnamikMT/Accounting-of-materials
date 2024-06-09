import { setupWebSocket, setupEventListeners } from './tokarny.js';
import { initRequestsPage, checkForPendingRequests, handleWebSocketMessage } from './requests.js';

document.addEventListener('DOMContentLoaded', () => {
    const contentContainer = document.getElementById('contentContainer');
    const requestsButton = document.getElementById('requests');
    const toolsButton = document.getElementById('tools');

    requestsButton.addEventListener('click', async () => {
        hideAllSections();
        await loadRequestsHtml();
    });

    toolsButton.addEventListener('click', async () => {
        hideAllSections();
        await loadToolsHtml();
    });

    async function loadRequestsHtml() {
        try {
            const response = await fetch('./requests.html');
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;

            // Инициализация контента страницы запросов
            initRequestsPage();
        } catch (error) {
            console.error('Ошибка при загрузке requests.html:', error);
        }
    }

    async function loadToolsHtml() {
        try {
            const response = await fetch('./tools.html');
            const htmlContent = await response.text();
            contentContainer.innerHTML = htmlContent;
            // Инициализация контента страницы инструментов
            // initToolsPage();
        } catch (error) {
            console.error('Ошибка при загрузке tools.html:', error);
        }
    }

    function hideAllSections() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.style.display = 'none';
        });
    }

    // Пример инициализации для WebSocket
    const ws = new WebSocket('ws://localhost:3000');
    ws.addEventListener('message', (event) => {
        handleWebSocketMessage(event); // Обработка новых данных о заявках через WebSocket
    });

    setupWebSocket(ws);
    setupEventListeners();

    // Изначально проверяем наличие незакрытых заявок
    checkForPendingRequests();
});
