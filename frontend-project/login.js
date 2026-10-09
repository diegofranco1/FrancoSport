const loginForm = document.getElementById('login-form');
const loginFeedback = document.getElementById('login-feedback');
const resendButton = document.getElementById('resend-verification');

function showLoginFeedback(message, isError = false) {
  loginFeedback.textContent = message;
  loginFeedback.classList.toggle('is-error', isError);
  loginFeedback.hidden = false;
}

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!loginForm.reportValidity()) return;

  const submitButton = loginForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Ingresando...';
  resendButton.hidden = true;

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value.trim(),
        password: document.getElementById('password').value,
      }),
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      showLoginFeedback(data.error || 'No pudimos iniciar sesión.', true);
      resendButton.hidden = data.code !== 'EMAIL_NOT_VERIFIED';
      return;
    }

    window.location.href = '/';
  } catch (error) {
    console.error('Error en la solicitud de inicio de sesión:', error);
    showLoginFeedback('No pudimos conectar con el servidor. Intenta nuevamente.', true);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Iniciar sesión';
  }
});

resendButton.addEventListener('click', async () => {
  resendButton.disabled = true;
  try {
    const response = await fetch('/api/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: document.getElementById('email').value.trim() }),
    });
    const data = await response.json();
    showLoginFeedback(
      response.ok ? data.message : (data.error || 'No pudimos reenviar el enlace.'),
      !response.ok,
    );
  } catch (error) {
    console.error('Error al reenviar la confirmación:', error);
    showLoginFeedback('No pudimos conectar con el servidor. Intenta nuevamente.', true);
  } finally {
    resendButton.disabled = false;
  }
});
