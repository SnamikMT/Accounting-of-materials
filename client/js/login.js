// login.js

// Загрузка конфигурационного файла
async function loadConfig() {
  try {
    const response = await fetch('config.json');
    return await response.json();
  } catch (error) {
    console.error('Error loading configuration:', error);
    return { serverIp: 'localhost', serverPort: 3000 }; // значения по умолчанию
  }
}

async function checkCredentials(username, password) {
  const config = await loadConfig();
  const apiBaseUrl = `http://${config.serverIp}:${config.serverPort}/api`;

  try {
    const response = await fetch(`${apiBaseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Credentials are valid. Role:', data.role);
      return { isValid: true, role: data.role };
    } else {
      console.log('Credentials are invalid');
      return { isValid: false, role: null };
    }
  } catch (error) {
    console.error('Error checking credentials:', error);
    return { isValid: false, role: null };
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('error-message');

  if (!username || !password) {
    errorMessage.textContent = 'Please enter username and password';
    errorMessage.style.display = 'block';
    return;
  }

  const result = await checkCredentials(username, password);

  if (result.isValid) {
    // Сохраняем роль пользователя в localStorage
    localStorage.setItem('userRole', result.role);
    console.log('Role saved to localStorage:', result.role);

    // Перенаправляем пользователя на главную страницу
    window.location.replace('index.html');
  } else {
    errorMessage.textContent = 'Invalid username or password';
    errorMessage.style.display = 'block';
  }
}

// Назначаем обработчик на форму входа
document.getElementById('loginForm').addEventListener('submit', handleSubmit);
