import { loginApi } from './api.js';

export function initAuth(onLoginSuccess) {
  const form = document.getElementById('login-form');
  const userInp = document.getElementById('login-user');
  const pinInp = document.getElementById('login-pin');
  const btnText = document.querySelector('#login-btn .btn-text');
  const loader = document.querySelector('#login-btn .loader');
  const errorMsg = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  // Check persistent session
  const savedSession = localStorage.getItem('pixl_session');
  if (savedSession) {
    const session = JSON.parse(savedSession);
    if (session && session.username) {
      onLoginSuccess(session);
      return;
    }
  }

  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const username = userInp.value.trim();
    const pin = pinInp.value.trim();

    if (!username || !pin) return;

    isSubmitting = true;
    errorMsg.classList.add('hidden');
    btnText.classList.add('hidden');
    loader.classList.remove('hidden');
    btn.disabled = true;

    const result = await loginApi(username, pin);

    isSubmitting = false;
    btnText.classList.remove('hidden');
    loader.classList.add('hidden');
    btn.disabled = false;

    if (result && result.success) {
      const sessionData = {
        username,
        assignedStock: result.assignedStock || 0
      };
      localStorage.setItem('pixl_session', JSON.stringify(sessionData));
      onLoginSuccess(sessionData);
    } else {
      let msg = 'Invalid credentials';
      if (result && result.error === 'timeout') msg = 'Server busy. Try again.';
      if (result && result.error === 'network') msg = 'Network error or Server busy.';
      errorMsg.textContent = msg;
      errorMsg.classList.remove('hidden');
    }
  });
}

export function logout() {
  localStorage.removeItem('pixl_session');
  window.location.reload();
}
