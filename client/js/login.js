async function checkCredentials(username, password) {
    try {
      const response = await fetch('http://192.168.0.108:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Credentials are valid');
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
  
      // Перенаправляем пользователя на главную страницу
      window.location.replace('index.html');
    } else {
      errorMessage.textContent = 'Invalid username or password';
      errorMessage.style.display = 'block';
    }
  }
  
  // Назначаем обработчик на форму входа
  document.getElementById('loginForm').addEventListener('submit', handleSubmit);
  