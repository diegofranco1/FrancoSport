async function fetchProfile() {
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        redirectToLogin();
        return;
      } else {
        showToast('No pudimos cargar tu perfil. Intenta nuevamente.', 'error');
      }
      return;
    }
    const data = await response.json();
    const { name, email, wallet } = data.profile;
    document.getElementById('user-name').textContent = `Nombre: ${name}`;
    document.getElementById('user-email').textContent = `Correo: ${email}`;
    document.getElementById('user-wallet').textContent = `Saldo: ${formatCLP(wallet)}`;
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    showToast('No pudimos conectar con el servidor. Intenta nuevamente.', 'error');
  }
}
fetchProfile();
