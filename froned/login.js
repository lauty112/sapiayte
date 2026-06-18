const DEFAULT_API_URL = 'https://sapiayte-bz3i.onrender.com/api';
const API_URL = window.API_URL || (() => {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || window.location.protocol === 'file:';
    return isLocal ? 'http://localhost:5000/api' : DEFAULT_API_URL;
})();
console.log('API_URL =', API_URL);

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('errorMsg');
  errorDiv.textContent = '';

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',   // Importante para mantener la sesión con cookies
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.success) {
      // Redirigir al panel de administración
      window.location.href = 'admin.html';
    } else {
      errorDiv.textContent = data.error || 'Credenciales incorrectas';
    }
  } catch (err) {
    errorDiv.textContent = 'Error de conexión con el servidor';
    console.error(err);
  }
});