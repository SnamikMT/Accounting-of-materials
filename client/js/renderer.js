import { setupWebSocket, setupEventListeners } from './tokarny.js';

document.addEventListener('DOMContentLoaded', function () {
    const ws = new WebSocket('ws://localhost:3000');
    setupWebSocket(ws);
    setupEventListeners();
});
