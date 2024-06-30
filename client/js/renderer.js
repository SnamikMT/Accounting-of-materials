// client/js/renderer.js

import { initRequestsPage, handleWebSocketMessage } from './requests.js';

document.addEventListener('DOMContentLoaded', () => {
  const logoutButton = document.getElementById('logout');
  const requestsButton = document.getElementById('requests');
  let currentUserRole = 'user'; // Инициализация с базовой ролью, которую можно обновить

  // WebSocket адрес для подключения
  const webSocketUrl = 'ws://192.168.0.108:3000'; // IP-адрес и порт вашего ПК

  // Обработчик выхода из системы
  logoutButton.addEventListener('click', () => {
      window.api.send('logout'); // Сообщаем main процессу о выходе
      window.location.href = 'login.html'; // Перенаправляем на страницу входа
  });

  // Получение и отображение роли пользователя
  window.api.receive('userRole', (role) => {
      console.log('User role:', role);
      currentUserRole = role; // Обновление текущей роли пользователя
      adjustInterfaceForRole(role); // Настройка интерфейса в зависимости от роли пользователя
  });

  // Обработчик для кнопки "Запросы"
  requestsButton.addEventListener('click', () => {
      hideAllSections(); // Скрыть все другие секции
      showRequestsSection(); // Показать секцию запросов
      initRequestsPage(currentUserRole); // Инициализировать страницу запросов с учетом роли пользователя
  });

  // Подключение к WebSocket и обработка сообщений
  const webSocket = new WebSocket(webSocketUrl);
  webSocket.onmessage = (event) => {
      handleWebSocketMessage(event); // Обработка входящих сообщений
  };

  // Инициализация страницы при загрузке
  initRequestsPage(currentUserRole); // Инициализировать страницу запросов с учетом роли пользователя
});

// Функция скрытия всех секций
function hideAllSections() {
  const sections = document.querySelectorAll('.subcategory, .category');
  sections.forEach(section => {
      section.style.display = 'none';
  });

  // Скрываем секцию запросов, если она была ранее отображена
  const requestsContainer = document.getElementById('requestsContainer');
  if (requestsContainer) {
      requestsContainer.style.display = 'none';
  }
}

// Функция показа секции запросов
function showRequestsSection() {
  const requestsContainer = document.getElementById('requestsContainer');
  if (requestsContainer) {
      requestsContainer.style.display = 'block';
  }
}

// Функция настройки интерфейса в зависимости от роли пользователя
function adjustInterfaceForRole(role) {
  // Пример настройки интерфейса для разных ролей
  if (role === 'admin') {
      // Например, показать администраторские элементы
      console.log('Настройка интерфейса для администратора');
  } else if (role === 'user') {
      // Скрыть или показать элементы для обычного пользователя
      console.log('Настройка интерфейса для пользователя');
  }
}
