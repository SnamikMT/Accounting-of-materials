// tokarny.js

// Функция для загрузки данных из tools.json
async function loadToolsData() {
  const response = await fetch('./tools.json');
  const data = await response.json();
  return data;
}

// Функция для сохранения данных в tools.json
async function saveToolsData(data) {
  await fetch('./tools.json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

// Функция для инициализации страницы инструментов
export function setupEventListeners() {
  const editCategoriesButton = document.getElementById('editCategoriesButton');
  const subcategoryEditor = document.getElementById('subcategoryEditor');
  const categoriesGrid = document.getElementById('categoriesGrid');
  const addSubcategoryButton = document.getElementById('addSubcategoryButton');
  let toolsData = {};

  // Загрузить данные инструментов при инициализации
  loadToolsData().then(data => {
    toolsData = data;
  });

  editCategoriesButton.addEventListener('click', () => {
    subcategoryEditor.style.display = 'block';
    renderSubcategoryEditor('tokarny'); // Выберите нужную категорию для редактирования
  });

  addSubcategoryButton.addEventListener('click', () => {
    const newSubcategoryName = prompt('Введите название новой подкатегории:');
    if (newSubcategoryName) {
      toolsData.tokarny[newSubcategoryName] = {}; // Добавить новую подкатегорию
      renderSubcategoryEditor('tokarny'); // Перерисовать редактор
      saveToolsData(toolsData); // Сохранить данные
    }
  });
}

// Функция для рендеринга редактора подкатегорий
function renderSubcategoryEditor(category) {
  const subcategoryList = document.getElementById('subcategoryList');
  subcategoryList.innerHTML = '';

  for (const subcategory in toolsData[category]) {
    const subcategoryElement = document.createElement('div');
    subcategoryElement.textContent = subcategory;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Удалить';
    deleteButton.addEventListener('click', () => {
      delete toolsData[category][subcategory]; // Удалить подкатегорию
      renderSubcategoryEditor(category); // Перерисовать редактор
      saveToolsData(toolsData); // Сохранить данные
    });

    subcategoryElement.appendChild(deleteButton);
    subcategoryList.appendChild(subcategoryElement);
  }
}
