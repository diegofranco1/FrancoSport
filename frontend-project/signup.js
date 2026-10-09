const signupForm = document.getElementById('signupForm');
const signupFeedback = document.getElementById('signup-feedback');
const signupButton = signupForm.querySelector('button[type="submit"]');

function showSignupFeedback(message, isError = false) {
  signupFeedback.textContent = message;
  signupFeedback.classList.toggle('is-error', isError);
  signupFeedback.hidden = false;
}

signupForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (!signupForm.reportValidity()) return;

  const name = document.getElementById('exampleInputName1').value.trim().replace(/\s+/g, ' ');
  const email = document.getElementById('exampleInputEmail1').value.trim();
  const password = document.getElementById('exampleInputPassword1').value;
  const nameParts = name.split(' ');
  if (nameParts.length < 2) {
    showSignupFeedback('Escribe tu nombre y al menos un apellido.', true);
    return;
  }
  if (
    password.length < 12
    || password.length > 128
    || !/[a-z]/.test(password)
    || !/[A-Z]/.test(password)
    || !/[0-9]/.test(password)
    || !/[^A-Za-z0-9\s]/.test(password)
  ) {
    showSignupFeedback('La contraseña debe tener 12 caracteres e incluir mayúscula, minúscula, número y símbolo.', true);
    return;
  }

  signupButton.disabled = true;
  signupButton.textContent = 'Creando cuenta...';

  try {
    const response = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      showSignupFeedback(data.error || 'No pudimos crear la cuenta. Intenta nuevamente.', true);
      return;
    }

    showSignupFeedback(data.message);
    signupForm.reset();
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    showSignupFeedback('No pudimos conectar con el servidor. Intenta nuevamente.', true);
  } finally {
    signupButton.disabled = false;
    signupButton.textContent = 'Crear cuenta';
  }
});
