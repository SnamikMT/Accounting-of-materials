import { sendWebSocketMessage } from './websocket.js';

let requestsData = [
  { id: 1, type: 'Материал', name: 'Сталь', quantity: 50, status: 'Pending' },
  { id: 2, type: 'Инструмент', name: 'Сверло', quantity: 20, status: 'Pending' },
  { id: 3, type: 'Материал', name: 'Алюминий', quantity: 30, status: 'Pending' },
  { id: 5, type: 'Материал', name: 'Пластик', quantity: 100, status: 'Pending' },
];

export function initRequestsPage(userRole) {
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
      ${request.type}: ${request.name} - Количество: ${request.quantity}
      <div class="buttons">
        ${request.status === 'Pending' ? `<button class="process-button" data-id="${request.id}">Далее</button>` : ''}
        ${request.status === 'Waiting' ? `<button class="receive-button" data-id="${request.id}">Принято</button>` : ''}
        ${request.status === 'Received' ? `<span>Получено</span>` : ''}
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
    button.addEventListener('click', () => handleProcessButtonClick(userRole)); // Pass userRole
  });

  document.querySelectorAll('.receive-button').forEach(button => {
    button.addEventListener('click', () => handleReceiveButtonClick(userRole)); // Pass userRole
  });

  // Вызов функции проверки наличия незакрытых заявок
  checkForPendingRequests();

  // Логирование роли пользователя
  console.log(`Текущая роль пользователя в initRequestsPage: ${userRole}`);
}

function handleProcessButtonClick(userRole) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);
  if (request) {
    request.status = 'Waiting';
    // Отправляем данные на сервер через WebSocket
    sendWebSocketMessage({ type: 'updateRequestStatus', payload: { id: request.id, status: 'Waiting' } });
    initRequestsPage(userRole); // Use userRole passed from click event
  }
}

function handleReceiveButtonClick(userRole) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);
  if (request) {
    request.status = 'Received';
    // Отправляем данные на сервер через WebSocket
    sendWebSocketMessage({ type: 'updateRequestStatus', payload: { id: request.id, status: 'Received' } });
    initRequestsPage(userRole); // Use userRole passed from click event
  }
}

export function checkForPendingRequests() {
  const requestsButton = document.getElementById('requests');
  const hasPendingMaterialRequests = requestsData.some(
    request => request.type === 'Материал' && (request.status === 'Pending' || request.status === 'Waiting')
  );

  if (hasPendingMaterialRequests) {
    requestsButton.classList.add('blinking');
  } else {
    requestsButton.classList.remove('blinking');
  }
}
