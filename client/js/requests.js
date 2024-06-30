// client/js/requests.js

// Пример данных запросов
export const requestsData = [
    { id: 1, type: 'Материал', name: 'Сталь', quantity: 50, status: 'Pending' },
    { id: 2, type: 'Инструмент', name: 'Сверло', quantity: 20, status: 'Pending' },
    { id: 3, type: 'Материал', name: 'Алюминий', quantity: 30, status: 'Pending' },
    { id: 4, type: 'Материал', name: 'Пластик', quantity: 100, status: 'Pending' },
];

// Инициализация страницы запросов
export function initRequestsPage() {
    const pendingList = document.getElementById('pendingList');
    const waitingList = document.getElementById('waitingList');
    const receivedList = document.getElementById('receivedList');

    if (pendingList) {
        pendingList.innerHTML = '';
    }
    if (waitingList) {
        waitingList.innerHTML = '';
    }
    if (receivedList) {
        receivedList.innerHTML = '';
    }
    
    requestsData.forEach(request => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${request.type}: ${request.name} - Количество: ${request.quantity}
            <div class="buttons">
                ${request.status === 'Pending' ? `<button class="process-button" data-id="${request.id}">Заказано</button>` : ''}
                ${request.status === 'Waiting' ? `<button class="receive-button" data-id="${request.id}">Принять</button>` : ''}
                ${request.status === 'Received' ? `<span>Получено</span>` : ''}
            </div>
        `;
    
        // Добавляем класс для анимации
        listItem.classList.add('request-item');
    
        if (request.status === 'Pending' && pendingList) {
            pendingList.appendChild(listItem);
        } else if (request.status === 'Waiting' && waitingList) {
            waitingList.appendChild(listItem);
        } else if (request.status === 'Received' && receivedList) {
            receivedList.appendChild(listItem);
        }
    });
    
    document.querySelectorAll('.process-button').forEach(button => {
        button.addEventListener('click', handleProcessButtonClick);
    });
    
    document.querySelectorAll('.receive-button').forEach(button => {
        button.addEventListener('click', handleReceiveButtonClick);
    });
    
    checkForPendingRequests();
}

// Обработчик для кнопки "Заказано"
function handleProcessButtonClick(event) {
    const requestId = event.target.getAttribute('data-id');
    const request = requestsData.find(req => req.id == requestId);
    if (request) {
        request.status = 'Waiting';
        initRequestsPage();
    }
}

// Обработчик для кнопки "Принято"
function handleReceiveButtonClick(event) {
    const requestId = event.target.getAttribute('data-id');
    const request = requestsData.find(req => req.id == requestId);
    if (request) {
        request.status = 'Received';
        initRequestsPage();
    }
}

// Функция проверки наличия ожидающих запросов и мигания кнопки "Запросы"
export function checkForPendingRequests() {
    const requestsButton = document.getElementById('requests');
    const hasPendingMaterialRequests = requestsData.some(
        request => request.type === 'Материал' && (request.status === 'Pending' || request.status === 'Waiting')
    );

    if (requestsButton) {
        if (hasPendingMaterialRequests) {
            requestsButton.classList.add('blinking');
        } else {
            requestsButton.classList.remove('blinking');
        }
    }
}

// Обработка сообщений WebSocket
export function handleWebSocketMessage(event) {
    const newRequest = JSON.parse(event.data);
    requestsData.push(newRequest);
    initRequestsPage();
}

// Убедитесь, что initRequestsPage вызывается только после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    initRequestsPage();
});
