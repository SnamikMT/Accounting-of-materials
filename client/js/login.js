// client/js/login.js

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('error-message');

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Предотвращаем отправку формы по умолчанию

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Проверяем, что поля не пустые
    if (username && password) {
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (data.success) {
          window.api.send('login-success', data.role); // Сообщаем main процессу об успешном входе
        } else {
          errorMessage.textContent = 'Ошибка входа: ' + data.message;
          errorMessage.style.display = 'block';
        }
      } catch (error) {
        errorMessage.textContent = 'Произошла ошибка. Попробуйте снова.';
        errorMessage.style.display = 'block';
      }
    } else {
      errorMessage.textContent = 'Пожалуйста, введите имя пользователя и пароль.';
      errorMessage.style.display = 'block';
    }
  });
});
