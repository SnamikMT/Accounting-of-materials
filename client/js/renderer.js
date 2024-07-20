// renderer.js

import { initializeWebSocket } from './websocket.js';
import { initRequestsPage } from './requests.js';
import { setupEventListeners } from './tokarny.js';

let currentUserRole = null;

document.addEventListener('DOMContentLoaded', () => {
  const contentContainer = document.getElementById('contentContainer');
  const requestsButton = document.getElementById('requests');
  const toolsButton = document.getElementById('tools');
  const logoutButton = document.getElementById('logout');

  currentUserRole = localStorage.getItem('userRole');
  console.log('User role extracted from localStorage:', currentUserRole);

  if (!currentUserRole) {
    console.error('User role not set. Redirecting to login page.');
    window.location.replace('login.html');
    return;
  }

  initializeWebSocket((data) => {
    console.log('Message from WebSocket server:', data);

    if (data.type === 'userInfo') {
      currentUserRole = data.payload.role;
      console.log(`User role updated: ${currentUserRole}`);
    }
  });

  requestsButton.addEventListener('click', async () => {
    hideAllSections();
    await loadRequestsHtml();
  });

  toolsButton.addEventListener('click', async () => {
    hideAllSections();
    await loadToolsHtml();
  });

  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('userRole');
    console.log('User logged out. Role cleared from localStorage.');
    window.location.replace('login.html');
  });

  async function loadRequestsHtml() {
    try {
      const response = await fetch('./requests.html');
      const htmlContent = await response.text();
      contentContainer.innerHTML = htmlContent;
      console.log('HTML loaded: ', contentContainer.innerHTML);
      initRequestsPage(currentUserRole);
      document.getElementById('requestsSection').style.display = 'block';
    } catch (error) {
      console.error('Error loading requests.html:', error);
    }
  }

  async function loadToolsHtml() {
    try {
      const response = await fetch('./tools.html');
      const htmlContent = await response.text();
      contentContainer.innerHTML = htmlContent;
      console.log('HTML loaded: ', contentContainer.innerHTML);
      document.getElementById('toolCategories').style.display = 'block';
      setupEventListeners();
    } catch (error) {
      console.error('Error loading tools.html:', error);
    }
  }

  function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      section.style.display = 'none';
    });

    // Also hide specific elements that are dynamically loaded
    if (document.getElementById('toolCategories')) {
      document.getElementById('toolCategories').style.display = 'none';
    }
    if (document.getElementById('requestsSection')) {
      document.getElementById('requestsSection').style.display = 'none';
    }
  }
});
