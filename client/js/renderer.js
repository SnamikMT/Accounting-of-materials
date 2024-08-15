import { initializeWebSocket } from './websocket.js';
import { initRequestsPage } from './requests.js';
import { setupEventListeners } from './tokarny.js';

let currentUserRole = null;
let toolsData = {}; // This will hold the JSON data

document.addEventListener('DOMContentLoaded', async () => {
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
    requestsButton.classList.add('active');
    await loadRequestsHtml();
  });

  toolsButton.addEventListener('click', async () => {
    hideAllSections();
    toolsButton.classList.add('active');
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
      toolsData = await loadToolsData();
      document.getElementById('toolCategories').style.display = 'block';
      setupToolEventListeners();
    } catch (error) {
      console.error('Error loading tools.html:', error);
    }
  }

  async function loadToolsData() {
    try {
      // Обновляем путь для правильной загрузки tools.json
      const response = await fetch('http://192.168.0.108:3000/tools.json'); // Используем IP из .env файла
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading tools.json:', error);
      return {};
    }
  }  

  async function saveToolsData() {
    try {
      // Путь должен соответствовать маршруту на сервере
      const response = await fetch('http://192.168.0.108:3000/tools.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(toolsData)
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      console.log('Data saved successfully');
    } catch (error) {
      console.error('Error saving tools.json:', error);
    }
  }  

  function hideAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
      section.style.display = 'none';
    });

    if (document.getElementById('toolCategories')) {
      document.getElementById('toolCategories').style.display = 'none';
    }
    if (document.getElementById('requestsSection')) {
      document.getElementById('requestsSection').style.display = 'none';
    }

    requestsButton.classList.remove('active');
    toolsButton.classList.remove('active');
  }

  function setupToolEventListeners() {
    const categoriesList = document.getElementById('categoriesGrid');
    const subcategoryEditorSection = document.getElementById('subcategoryEditor');
    const subcategoryList = document.getElementById('subcategoryList');
    const addSubcategoryButton = document.getElementById('addSubcategoryButton');
    const addSubcategoryModal = document.getElementById('addSubcategoryModal');
    const addSubcategoryInput = document.getElementById('addSubcategoryInput');
    const confirmAddSubcategoryButton = document.getElementById('confirmAddSubcategoryButton');
    const cancelAddSubcategoryButton = document.getElementById('cancelAddSubcategoryButton');

    let currentCategoryPath = []; // This will keep track of the current category path

    categoriesList.addEventListener('click', (event) => {
        if (event.target && event.target.nodeName === 'LI') {
            currentCategoryPath = [event.target.id]; // Reset to the selected category
            loadSubcategories(currentCategoryPath);
            subcategoryEditorSection.style.display = 'block';
        }
    });

    subcategoryList.addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('subcategory-item')) {
            const subcategoryId = event.target.dataset.id;
            currentCategoryPath.push(subcategoryId); // Add the selected subcategory to the path
            loadSubcategories(currentCategoryPath);
        } else if (event.target && event.target.id === 'backButton') {
            currentCategoryPath.pop(); // Remove the last category from the path
            loadSubcategories(currentCategoryPath);
        }
    });

    addSubcategoryButton.addEventListener('click', () => {
        addSubcategoryModal.style.display = 'block';
    });

    confirmAddSubcategoryButton.addEventListener('click', () => {
        const newSubcategoryName = addSubcategoryInput.value.trim();
        if (newSubcategoryName) {
            addSubcategory(currentCategoryPath, newSubcategoryName);
        }
        addSubcategoryModal.style.display = 'none';
        addSubcategoryInput.value = '';
    });

    cancelAddSubcategoryButton.addEventListener('click', () => {
        addSubcategoryModal.style.display = 'none';
        addSubcategoryInput.value = '';
    });

    function loadSubcategories(categoryPath) {
        subcategoryList.innerHTML = '';

        if (categoryPath.length > 0) {
            // Add a back button that shows the previous level's category name
            const backButton = document.createElement('div');
            backButton.textContent = `← Back to ${categoryPath[categoryPath.length - 2] || 'Categories'}`;
            backButton.classList.add('back-button');
            backButton.id = 'backButton';
            subcategoryList.appendChild(backButton);
        }

        const subcategories = getSubcategories(categoryPath);
        subcategories.forEach(subcat => {
            const subcatElement = document.createElement('div');
            subcatElement.textContent = subcat.name;
            subcatElement.classList.add('subcategory-item');
            subcatElement.dataset.id = subcat.id;
            subcategoryList.appendChild(subcatElement);
        });
        console.log(`Loaded subcategories for category "${categoryPath.join(' > ')}": `, subcategories);
    }

    function addSubcategory(categoryPath, name) {
        let currentLevel = toolsData;

        // Traverse to the correct category level
        categoryPath.forEach(category => {
            if (!currentLevel[category]) {
                currentLevel[category] = {};
            }
            currentLevel = currentLevel[category];
        });

        currentLevel[name] = {}; // Add the new subcategory
        saveToolsData().then(() => {
            loadSubcategories(categoryPath); // Reload subcategories
        });
    }

    function getSubcategories(categoryPath) {
        let currentLevel = toolsData;

        // Traverse to the correct category level
        categoryPath.forEach(category => {
            currentLevel = currentLevel[category];
        });

        return Object.keys(currentLevel || {}).map(subcat => ({
            id: subcat,
            name: subcat
        }));
    }
  }

});
