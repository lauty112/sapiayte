const API_URL = 'http://127.0.0.1:5000/api';  // Ajusta si tu backend corre en otro puerto

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