import { initializeWebSocket, sendWebSocketMessage } from './websocket.js';

let requestsData = [];
let isRequestsSectionOpen = false; // Флаг для отслеживания, открыт ли раздел "Запросы"
let currentUserRole = 'user'; // по умолчанию 'user', будет обновлена в initRequestsPage


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

// Загрузка данных о запросах с сервера
async function loadRequestsData() {

  const config = await loadConfig();
  if (!config) return;

  try {
    const response = await fetch(`http://${config.serverIp}:${config.serverPort}/api/requests`);
    if (!response.ok) {
      throw new Error('Failed to fetch requests data');
    }
    requestsData = await response.json();
    console.log('Requests data loaded:', requestsData);
    checkForPendingRequests();
  } catch (error) {
    console.error('Error loading requests data:', error);
  }
}

// Инициализация страницы запросов
export async function initRequestsPage(userRole) {

  currentUserRole = userRole;

  const deleteButton = document.getElementById('delete-by-period-button');
    const fromDateInput = document.getElementById('delete-from-date');
    const toDateInput = document.getElementById('delete-to-date');

    if (!deleteButton || !fromDateInput || !toDateInput) {
        console.error('Один или несколько элементов не найдены на странице.');
        return;
    }

    deleteButton.addEventListener('click', async () => {
      // Проверка роли пользователя
      if (userRole !== 'admin') {
          alert('У вас нет прав для удаления записей.');
          return;
      }
  
      const fromDate = fromDateInput.value;
      const toDate = toDateInput.value;
  
      if (!fromDate || !toDate) {
          alert('Пожалуйста, выберите обе даты для удаления записей.');
          return;
      }
  
      console.log(`Удаление записей с ${fromDate} по ${toDate}`);
  
      const confirmed = confirm(`Вы уверены, что хотите удалить записи с ${fromDate} по ${toDate}?`);
      if (!confirmed) return;
  
      const fromTimestamp = new Date(fromDate).toISOString();
      const toTimestamp = new Date(toDate).toISOString();
  
      console.log('Отправка данных на сервер:', { from: fromTimestamp, to: toTimestamp });
  
      try {
          const response = await fetch(`http://${config.serverIp}:${config.serverPort}/api/requests/delete`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ from: fromTimestamp, to: toTimestamp }),
          });
  
          console.log('Ответ сервера:', response);
  
          if (response.ok) {
              const text = await response.text();
              console.log(`Записи успешно удалены: ${text}`);
              alert(text);
              await loadRequestsData();
              await initRequestsPage(userRole);
          } else {
              const errorText = await response.text();
              console.error('Не удалось удалить записи:', errorText);
              alert('Не удалось удалить записи.');
          }
      } catch (error) {
          console.error('Ошибка при удалении записей:', error);
          alert('Произошла ошибка при удалении записей.');
      }
  });
  


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
    
    // Форматирование даты и времени
    const formattedDate = new Date(request.timestamp).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  
    listItem.innerHTML = `
      <div class="request-text">
        <span class="type">${request.name}</span>
        <span class="quantity">Количество: ${request.quantity}</span>
        <span class="date">Дата: ${formattedDate}</span>
      </div>
      <div class="buttons">
        ${request.status === 'Pending' ? `<button class="process-button" data-id="${request.id}">Обработать</button>` : ''}
        ${request.status === 'Waiting' ? `<button class="receive-button" data-id="${request.id}">Получить</button>` : ''}
        ${request.status !== 'Pending' ? `<button class="revert-button" data-id="${request.id}">← Назад</button>` : ''}
        ${request.status === 'Received' ? `<span>Получено</span>` : ''}
        <button class="delete-button" data-id="${request.id}">X</button>
      </div>
    `;
  
    // Добавляем элемент в соответствующий список
    if (request.status === 'Pending') {
      pendingList.appendChild(listItem);
    } else if (request.status === 'Waiting') {
      waitingList.appendChild(listItem);
    } else if (request.status === 'Received') {
      receivedList.appendChild(listItem);
    }
  });
  

  // Добавляем обработчик для кнопки удаления
  document.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', handleDeleteButtonClick);
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

async function handleDeleteButtonClick(event) {

  const config = await loadConfig();
  if (!config) return;

  const requestId = event.target.getAttribute('data-id');
  const confirmed = confirm('Вы уверены, что хотите удалить эту запись?');
  if (!confirmed) return;

  // Проверка роли пользователя
  if (currentUserRole !== 'admin') {
      alert('У вас нет прав для удаления этой записи.');
      return;
  }

  try {
      const response = await fetch(`http://${config.serverIp}:${config.serverPort}/api/requests/${requestId}`, {
          method: 'DELETE',
      });

      if (response.ok) {
          console.log(`Request ID ${requestId} deleted successfully.`);
          // Удаляем запись из локального массива данных
          requestsData = requestsData.filter(request => request.id !== requestId);
          // Перерисовываем список
          await initRequestsPage(currentUserRole);
      } else {
          console.error('Failed to delete request');
      }
  } catch (error) {
      console.error('Error deleting request:', error);
  }
}


// Обработчик для кнопки "Process"
async function handleProcessButtonClick(event) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);
  if (request) {
    request.status = 'Waiting';
    request.timestamp = new Date().toISOString(); // Обновляем timestamp
    await updateRequestStatusOnServer(requestId, 'Waiting', request.timestamp);

    await initRequestsPage('user');
  }
}

async function handleReceiveButtonClick(event) {
  const requestId = event.target.getAttribute('data-id');
  const request = requestsData.find(req => req.id == requestId);

  if (request) {
      console.log(`Processing request: ID ${requestId}, Name: ${request.name}, Quantity: ${request.quantity}, Type: ${request.type}`);
      
      request.status = 'Received';
      request.timestamp = new Date().toISOString(); // Обновляем timestamp
      await updateRequestStatusOnServer(requestId, 'Received', request.timestamp);

      // Попробуем сначала обновить в tools.json
      let updatedInTools = await updateStockData('tool', [request.name], request.quantity);

      if (!updatedInTools) {
          // Если не удалось обновить в tools.json, пробуем в materials.json
          let updatedInMaterials = await updateStockData('material', [request.name], request.quantity);

          if (!updatedInMaterials) {
              console.error('Item not found in either tools or materials JSON files');
          }
      }

      await initRequestsPage('user');
  }
}


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
          
          // Уменьшение количества на складе (откат)
          let decreasedInTools = await decreaseStockData('tool', [request.name], request.quantity);

          if (!decreasedInTools) {
              let decreasedInMaterials = await decreaseStockData('material', [request.name], request.quantity);
              if (!decreasedInMaterials) {
                  console.error('Key not found in either tools or materials JSON files');
              }
          }
      }

      if (previousStatus) {
          request.status = previousStatus;
          request.timestamp = new Date().toISOString(); // Обновляем timestamp
          await updateRequestStatusOnServer(requestId, previousStatus, request.timestamp);
          await initRequestsPage('user');
      }
  }
}

async function decreaseStockData(type, keys, quantity) {

  const config = await loadConfig();
  if (!config) return;


  try {
      const url = type === 'tool' ? `http://${config.serverIp}:${config.serverPort}/tools.json` : `http://${config.serverIp}:${config.serverPort}/materials.json`;

      // Загружаем текущие данные из файла
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error('Failed to fetch current stock data');
      }
      let data = await response.json();

      // Рекурсивная функция для поиска и уменьшения количества
      function decreaseQuantityIfExists(data, key, quantity) {
          for (let k in data) {
              if (k === key) {
                  if (typeof data[k] === 'number') {
                      data[k] = Math.max(0, data[k] - quantity);
                      return true;
                  } else if (typeof data[k] === 'object' && data[k].quantity !== undefined) {
                      data[k].quantity = Math.max(0, data[k].quantity - quantity);
                      return true;
                  }
              } else if (typeof data[k] === 'object') {
                  let found = decreaseQuantityIfExists(data[k], key, quantity);
                  if (found) return true;
              }
          }
          return false; // Ключ не найден
      }

              // Начинаем поиск и уменьшение с переданного ключа
              let key = keys[0];
              let decreased = decreaseQuantityIfExists(data, key, quantity);
      
              if (decreased) {
                  // Сохраняем обновленные данные обратно в файл
                  const saveResponse = await fetch(url, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(data),
                  });
      
                  if (!saveResponse.ok) {
                      const errorText = await saveResponse.text();
                      throw new Error(`Failed to save updated stock data: ${errorText}`);
                  }
      
                  console.log(`Stock decreased successfully: ${type} - ${key} - Quantity: ${quantity}`);
                  return true;
              } else {
                  console.error(`Key ${key} not found in ${type}`);
                  return false;
              }
          } catch (error) {
              console.error('Error decreasing stock data:', error);
              return false;
          }
      }
      

async function updateStockData(type, keys, quantity) {

  const config = await loadConfig();
  if (!config) return;

  try {
      const url = type === 'tool' ? `http://${config.serverIp}:${config.serverPort}/tools.json` : `http://${config.serverIp}:${config.serverPort}/materials.json`;

      // Загрузка данных из файла
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error('Failed to fetch stock data');
      }
      let data = await response.json();

      // Рекурсивная функция для поиска и обновления количества
      function updateQuantityIfExists(data, key, quantity) {
          for (let k in data) {
              if (k === key) {
                  if (typeof data[k] === 'number') {
                      data[k] += quantity;
                      return true;
                  } else if (typeof data[k] === 'object' && data[k].quantity !== undefined) {
                      data[k].quantity += quantity;
                      return true;
                  }
              } else if (typeof data[k] === 'object') {
                  // Рекурсивный вызов для вложенных объектов
                  let found = updateQuantityIfExists(data[k], key, quantity);
                  if (found) return true;
              }
          }
          return false; // Ключ не найден
      }

      // Начинаем поиск и обновление с первого уровня
      let updated = updateQuantityIfExists(data, keys[0], quantity);

      if (updated) {
          // Сохранение данных обратно в файл
          const saveResponse = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
          });

          if (!saveResponse.ok) {
              const errorText = await saveResponse.text();
              throw new Error(`Failed to save updated stock data: ${errorText}`);
          }

          console.log(`Stock updated successfully for: ${keys[0]} with quantity: ${quantity}`);
          return true; // Возвращаем true, если обновление прошло успешно
      } else {
          console.error('Item not found in the JSON file');
          return false; // Возвращаем false, если ключ не был найден
      }
  } catch (error) {
      console.error('Error updating stock data:', error);
      return false;
  }
}


async function updateRequestStatusOnServer(requestId, newStatus, newTimestamp, revertQuantity) {

  const config = await loadConfig();
  if (!config) return;

  try {
      const response = await fetch(`http://${config.serverIp}:${config.serverPort}/api/requests/update`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: requestId, status: newStatus, timestamp: newTimestamp, revertQuantity }),
      });

      const text = await response.text();

      // Печатаем текстовый ответ для отладки
      console.log('Server response:', text);

      // Если ответ содержит "Request updated successfully", считаем его успешным
      if (text.includes("Request updated successfully")) {
          console.log(`Request status updated successfully on server: ID ${requestId} -> ${newStatus}`);
      } else {
          // Попробуем распарсить как JSON, если это не текст
          try {
              const result = JSON.parse(text);
              if (result.success) {
                  console.log(`Request status updated successfully on server: ID ${requestId} -> ${newStatus}`);
              } else {
                  console.error('Failed to update request status on server');
              }
          } catch (e) {
              console.warn('Response is not a valid JSON:', text);
              throw new Error(`Failed to update request status: ${text}`);
          }
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
