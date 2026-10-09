function showToast(message, type = 'success') {
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }

  const toast = document.createElement('div');
  toast.className = `app-toast app-toast-${type}`;
  toast.textContent = message;
  region.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    window.setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function redirectToLogin() {
  window.location.href = '/login.html';
}

function formatCLP(amount) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);
}

function confirmAction(message, confirmLabel = 'Confirmar') {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'app-confirm-dialog';
    dialog.innerHTML = `
      <form method="dialog">
        <p class="app-confirm-message"></p>
        <div class="app-confirm-actions">
          <button type="submit" class="btn btn-outline-secondary" value="cancel">Cancelar</button>
          <button type="submit" class="btn btn-primary" value="confirm"></button>
        </div>
      </form>
    `;
    dialog.querySelector('.app-confirm-message').textContent = message;
    dialog.querySelector('[value="confirm"]').textContent = confirmLabel;
    dialog.addEventListener('close', () => {
      resolve(dialog.returnValue === 'confirm');
      dialog.remove();
    }, { once: true });
    document.body.appendChild(dialog);
    dialog.showModal();
  });
}
