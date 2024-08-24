// websocket.js

let ws;
let serverUrl;

// Function to load configuration from config.json
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    const config = await response.json();
    serverUrl = `ws://${config.serverIp}:${config.serverPort}`;
    console.log('Loaded WebSocket server URL:', serverUrl);
  } catch (error) {
    console.error('Error loading configuration:', error);
    serverUrl = 'ws://localhost:3000';
  }
}

// Function to initialize WebSocket connection
export async function initializeWebSocket(onMessageCallback) {
  await loadConfig();

  ws = new WebSocket(serverUrl);

  ws.onopen = () => {
    console.log('WebSocket connection established');
  };

  ws.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
  
    // Попробуем распарсить сообщение как JSON
    try {
      const data = JSON.parse(event.data);
      if (onMessageCallback) {
        onMessageCallback(data);
      }
    } catch (error) {
      console.warn('Received a non-JSON message:', event.data);
      // Здесь можно добавить обработку сообщений, которые не являются JSON
    }
  };
  

  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

// Function to send a WebSocket message
export function sendWebSocketMessage(message) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    console.log('WebSocket message sent:', message);
  } else {
    console.error('WebSocket is not open. Ready state:', ws ? ws.readyState : 'No WebSocket instance');
  }
}

// Function to get WebSocket server URL
export function getWebSocketServerUrl() {
  return serverUrl;
}
