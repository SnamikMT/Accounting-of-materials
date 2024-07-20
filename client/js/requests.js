import { initializeWebSocket, sendWebSocketMessage, getWebSocketServerUrl } from './websocket.js';

let requestsData = [];
let isRequestsSectionOpen = false; // Флаг для отслеживания, открыт ли раздел "Запросы"

// Загрузка данных о запросах с сервера
async function loadRequestsData() {
  try {
    const response = await fetch('http://192.168.0.108:3000/api/requests');
    requestsData = await response.json();
    console.log('Requests data loaded:', requestsData);
    checkForPendingRequests();
  } catch (error) {
    console.error('Error loading requests data:', error);
  }
}

// Инициализация страницы запросов
export async function initRequestsPage(userRole) {
  await loadRequestsData();

  const pendingList = document.getElementById('pendingList');
  const waitingList = document.getElementById('waitingList');
  const receivedList = document.getElementById('receivedList');

  if (!pendingList || !waitingList || !receivedList) {
    console.error('One or more list elements are not found in the DOM.');
    return;
  }

  pendingList.innerHTML = '';
  waitingList.innerHTML = '';
  receivedList.innerHTML = '';

  requestsData.forEach(request => {
    const listItem = document.createElement('li');
    listItem.innerHTML = `
      ${request.type}: ${request.name} - Quantity: ${request.quantity}
      <div class="buttons">
        ${request.status === 'Pending' ? `<button class="process-button" data-id="${request.id}">Process</button>` : ''}
        ${request.status === 'Waiting' ? `<button class="receive-button" data-id="${request.id}">Receive</button>` : ''}
        ${request.status !== 'Pending' ? `<button class="revert-button" data-id="${request.id}">← Back</button>` : ''}
        ${request.status === 'Received' ? `<span>Received</span>` : ''}
      </div>
    `;
    if (request.status === 'Pending') {
      pendingList.appendChild(listItem);
    } else if (request.status === 'Waiting') {
      waitingList.appendChild(listItem);
    } else if (request.status === 'Received') {
      receivedList.appendChild(listItem);
    }
  });

  document.querySelectorAll('.process-button').forEach(button => {
    button.addEventListener('click', handleProcessButtonClick);
  });

  document.querySelectorAll('.receive-button').forEach(button => {
    button.addEventListener('click', handleReceiveButtonClick);
  });

  document.querySelectorAll('.revert-button').forEach(button => {
    button.addEventListener('click', handleRevertButtonClick);
  });

  checkForPendingRequests();

  console.log(`Current user role in initRequestsPage: ${userRole}`);
}

// Обработчик для кнопки "Process"
async function handleProcessButtonClick(event) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);
  if (request) {
    request.status = 'Waiting';
    await updateRequestStatusOnServer(requestId, 'Waiting');
    await initRequestsPage('user');
  }
}

// Обработчик для кнопки "Receive"
async function handleReceiveButtonClick(event) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);
  if (request) {
    request.status = 'Received';
    await updateRequestStatusOnServer(requestId, 'Received');
    await initRequestsPage('user');
  }
}

// Обработчик для кнопки "← Back"
async function handleRevertButtonClick(event) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);
  if (request) {
    const confirmed = confirm(`Вы уверены, что хотите изменить статус запроса для ${request.name}?`);
    if (!confirmed) return;

    let previousStatus;
    if (request.status === 'Waiting') {
      previousStatus = 'Pending';
    } else if (request.status === 'Received') {
      previousStatus = 'Waiting';
    }

    if (previousStatus) {
      request.status = previousStatus;
      await updateRequestStatusOnServer(requestId, previousStatus);
      await initRequestsPage('user');
    }
  }
}

// Обновление статуса запроса на сервере
async function updateRequestStatusOnServer(requestId, newStatus) {
  try {
    const response = await fetch('http://192.168.0.108:3000/api/requests/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: requestId, status: newStatus }),
    });

    if (!response.ok) {
      console.error('Failed to update request status:', response.statusText);
      return;
    }

    const result = await response.json();
    if (result.success) {
      console.log(`Request status updated successfully on server: ID ${requestId} -> ${newStatus}`);
    } else {
      console.error('Failed to update request status on server');
    }
  } catch (error) {
    console.error('Error updating request status on server:', error);
  }
}

// Проверка наличия заявок со статусом "Pending"
export function checkForPendingRequests() {
  const requestsButton = document.getElementById('requests');
  const hasPendingRequests = requestsData.some(
    request => request.status === 'Pending'
  );

  if (hasPendingRequests && !isRequestsSectionOpen) {
    requestsButton.classList.add('blinking');
  } else {
    requestsButton.classList.remove('blinking');
  }
}

// Вызов функции checkForPendingRequests при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
  await loadRequestsData();
  checkForPendingRequests();

  // Обработчик для кнопки "Запросы"
  const requestsButton = document.getElementById('requests');
  requestsButton.addEventListener('click', () => {
    isRequestsSectionOpen = true;
    requestsButton.classList.remove('blinking'); // Останавливаем мигание после нажатия
  });
  
  // Дополнительно: периодически проверяем наличие заявок (например, каждые 10 секунд)
  setInterval(async () => {
    await loadRequestsData();
    checkForPendingRequests();
  }, 10000);
});
