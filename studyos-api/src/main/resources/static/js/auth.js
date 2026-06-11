const loginForm    = Utils.$('#login-form');
const registerForm = Utils.$('#register-form');
const forgotForm   = Utils.$('#forgot-form');

function getValue(selector) {
  return Utils.$(selector)?.value.trim() || '';
}

/* ── Loading screen ────────────────────────── */
function showLoading(message = 'Entrando no StudyOS...') {
  const el = document.getElementById('loading-screen');
  const msg = document.getElementById('loading-msg');
  if (msg) msg.textContent = message;
  if (el) el.classList.add('active');
}

function hideLoading() {
  const el = document.getElementById('loading-screen');
  if (el) el.classList.remove('active');
}

/* ── Btn loading state ─────────────────────── */
function setBtnLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('loading', loading);
  if (!loading) {
    const span = btn.querySelector('.btn-txt');
    if (span) span.textContent = text;
  }
}

/* ── Auth ───────────────────────────────────── */
async function login() {
  Utils.clearMessage('#msg');

  const email    = getValue('#email');
  const password = getValue('#password');

  if (!email || !password) {
    Utils.showMessage('#msg', 'Informe email e senha.');
    return;
  }

  const btn = document.querySelector('#login-form .btn-main');
  setBtnLoading(btn, true);

  try {
    const data = await Api.login({ email, password });
    Api.setSession(data);

    showLoading('Bem-vindo de volta! 🚀');
    await new Promise(r => setTimeout(r, 1800));
    window.location.href = 'pages/dashboard.html';

  } catch (error) {
    hideLoading();
    setBtnLoading(btn, false, 'Entrar no StudyOS');
    Utils.showMessage('#msg', error.message || 'Email ou senha incorretos.');
  }
}

async function register() {
  Utils.clearMessage('#msg');

  const name     = getValue('#reg-name');
  const email    = getValue('#reg-email');
  const password = getValue('#reg-password');

  if (!name || !email || !password) {
    Utils.showMessage('#msg', 'Preencha todos os campos.');
    return;
  }

  if (password.length < 6) {
    Utils.showMessage('#msg', 'A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  const btn = document.querySelector('#register-form .btn-main');
  setBtnLoading(btn, true);

  try {
    const data = await Api.register({ name, email, password });
    Api.setSession(data);

    showLoading('Conta criada! Preparando tudo... 🚀⚡');
    await new Promise(r => setTimeout(r, 1800));
    window.location.href = 'pages/dashboard.html';

  } catch (error) {
    hideLoading();
    setBtnLoading(btn, false, 'Criar conta');
    Utils.showMessage('#msg', error.message || 'Erro ao cadastrar usuário.');
  }
}

/* ── Esqueci a senha ────────────────────────── */
async function forgotPassword() {
  Utils.clearMessage('#msg');

  const email   = getValue('#forgot-email');
  const btn     = document.getElementById('forgot-btn');
  const success = document.getElementById('forgot-success');

  if (!email) {
    Utils.showMessage('#msg', 'Informe seu email.');
    return;
  }

  setBtnLoading(btn, true);
  success.style.display = 'none';

  try {
    await Promise.race([
      Api.post('/auth/forgot-password', { email }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
    ]);
  } catch (err) {
    // silencia — não revela se email existe
  } finally {
    setBtnLoading(btn, false, 'Enviar link');
    success.style.display = 'block';
  }
}

/* ── Expõe no window para os onclick do HTML ── */
window._login          = login;
window._register       = register;
window._forgotPassword = forgotPassword;

/* ── Navegação entre forms ─────────────────── */
function showRegister() {
  loginForm.style.display    = 'none';
  registerForm.style.display = 'block';
  if (forgotForm) forgotForm.style.display = 'none';
  Utils.clearMessage('#msg');
}

function showLogin() {
  registerForm.style.display = 'none';
  if (forgotForm) forgotForm.style.display = 'none';
  loginForm.style.display    = 'block';
  Utils.clearMessage('#msg');
}

function showForgot() {
  loginForm.style.display    = 'none';
  registerForm.style.display = 'none';
  forgotForm.style.display   = 'block';
  document.getElementById('forgot-success').style.display = 'none';
  setBtnLoading(document.getElementById('forgot-btn'), false, 'Enviar link');
  Utils.clearMessage('#msg');
}

/* ── Enter ──────────────────────────────────── */
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  if (registerForm.style.display === 'block') register();
  else if (forgotForm && forgotForm.style.display === 'block') forgotPassword();
  else login();
});