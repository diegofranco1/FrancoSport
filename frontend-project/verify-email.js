const verificationMessage = document.getElementById('verification-message');
const loginLink = document.getElementById('login-link');
const token = new URLSearchParams(window.location.search).get('token');

if (!token) {
  verificationMessage.textContent = 'El enlace no es válido o venció. Solicita uno nuevo desde la página de inicio de sesión.';
  verificationMessage.classList.add('is-error');
} else {
  fetch('/api/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  })
    .then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No pudimos confirmar el correo.');
      verificationMessage.textContent = data.message;
      loginLink.hidden = false;
    })
    .catch(error => {
      console.error('Error al confirmar el correo:', error);
      verificationMessage.textContent = error instanceof TypeError
        ? 'No pudimos conectar con el servidor. Intenta nuevamente.'
        : error.message;
      verificationMessage.classList.add('is-error');
    });
}
