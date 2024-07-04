import { initializeWebSocket } from './websocket.js';
import { initRequestsPage } from './requests.js';
import { setupEventListeners } from './tokarny.js'; // Import setupEventListeners

let currentUserRole = null; // Variable to store user role

document.addEventListener('DOMContentLoaded', () => {
  const contentContainer = document.getElementById('contentContainer');
  const requestsButton = document.getElementById('requests');
  const toolsButton = document.getElementById('tools');
  const logoutButton = document.getElementById('logout'); // Logout button

  // Extract user role from localStorage
  currentUserRole = localStorage.getItem('userRole');
  console.log('User role extracted from localStorage:', currentUserRole);

  // Check if user role is set correctly
  if (!currentUserRole) {
    console.error('User role not set. Redirecting to login page.');
    window.location.replace('login.html');
    return;
  }

  // Initialize WebSocket connection upon page load
  initializeWebSocket((data) => {
    console.log('Message from WebSocket server:', data);

    // Example: Handle messages from server
    if (data.type === 'userInfo') {
      currentUserRole = data.payload.role;
      console.log(`User role updated: ${currentUserRole}`);
    }

    // Additional message handling can be added here
  });

  // Event listener for "Requests" button
  requestsButton.addEventListener('click', async () => {
    hideAllSections();
    await loadRequestsHtml();
  });

  // Event listener for "Tools" button
  toolsButton.addEventListener('click', async () => {
    hideAllSections();
    await loadToolsHtml(); // Load tools content first
    setupEventListeners(); // Then setup event listeners
  });

  // Event listener for "Logout" button
  logoutButton.addEventListener('click', () => {
    // Clear user role from localStorage
    localStorage.removeItem('userRole');
    console.log('User logged out. Role cleared from localStorage.');

    // Redirect to login page
    window.location.replace('login.html');
  });

  async function loadRequestsHtml() {
    try {
      const response = await fetch('./requests.html');
      const htmlContent = await response.text();
      contentContainer.innerHTML = htmlContent;

      // Ensure HTML is loaded and elements are available
      console.log('HTML loaded: ', contentContainer.innerHTML);

      // Initialize requests page with user role
      initRequestsPage(currentUserRole);
    } catch (error) {
      console.error('Error loading requests.html:', error);
    }
  }

  async function loadToolsHtml() {
    try {
      // Example: Load tools.html content dynamically if needed
      console.log('Loading tools.html content...');
    } catch (error) {
      console.error('Error loading tools.html:', error);
    }
  }

  function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      section.style.display = 'none';
    });
  }
});
