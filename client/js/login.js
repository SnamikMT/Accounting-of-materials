document.addEventListener('DOMContentLoaded', () => {
    const loginButton = document.querySelector('button[type="submit"]');
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');
  
    // Загружаем конфигурацию с сервера
    fetch('/config.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load configuration');
        }
        return response.json();
      })
      .then(config => {
        const serverAddress = config.serverAddress; // Получаем адрес сервера из конфигурации
  
        if (loginButton && loginForm) {
          loginForm.addEventListener('submit', function(event) {
            event.preventDefault(); // Предотвращаем отправку формы по умолчанию
  
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
  
            // Проверяем, что поля не пустые
            if (username && password) {
              console.log('Attempting to log in with:', username, password); // Отладка данных формы
  
              // Отправка данных на сервер
              fetch(`${serverAddress}/api/login`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
              })
              .then(response => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                return response.json();
              })
              .then(data => {
                if (data.success) {
                  console.log('Login successful:', data);
                  // Обработка успешного входа
                  window.location.href = '/index.html'; // Пример перенаправления на другую страницу
                } else {
                  console.error('Login failed:', data.message);
                  // Обработка ошибки входа
                  errorMessage.textContent = 'Ошибка входа: ' + data.message;
                  errorMessage.style.display = 'block';
                }
              })
              .catch(error => {
                console.error('Error during login:', error);
                errorMessage.textContent = 'Произошла ошибка. Попробуйте снова.';
                errorMessage.style.display = 'block';
              });
            } else {
              console.error('Username and password are required');
              errorMessage.textContent = 'Пожалуйста, введите имя пользователя и пароль.';
              errorMessage.style.display = 'block';
            }
          });
        } else {
          console.error('Login form or login button not found in the DOM.');
        }
      })
      .catch(error => {
        console.error('Error loading configuration:', error);
      });
  });
  