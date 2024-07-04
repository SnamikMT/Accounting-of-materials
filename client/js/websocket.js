// websocket.js

let ws;
const serverUrl = 'ws://192.168.0.16:3000'; // Адрес WebSocket сервера

// Функция для установки соединения WebSocket
export function initializeWebSocket(onMessageCallback) {
  ws = new WebSocket(serverUrl);

  // Обработчик события при открытии соединения
  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  // Обработчик события при получении сообщения
  ws.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    const data = JSON.parse(event.data);
    if (onMessageCallback) {
      onMessageCallback(data); // Вызов коллбека при получении сообщения
    }
  };

  // Обработчик события при закрытии соединения
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  // Обработчик события ошибки
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Функция для отправки сообщения через WebSocket
export function sendWebSocketMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log('WebSocket message sent:', message);
  } else {
    console.error('WebSocket is not open. Ready state:', ws ? ws.readyState : 'No WebSocket instance');
  }
}
