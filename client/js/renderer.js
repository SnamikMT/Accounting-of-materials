import { setupWebSocket, setupEventListeners } from './tokarny.js';

document.addEventListener('DOMContentLoaded', function () {
  const ws = new WebSocket('ws://localhost:3000'); // Убедитесь, что используется правильный порт

  setupWebSocket(ws);
  setupEventListeners();

  // Другие глобальные настройки, если есть
});
