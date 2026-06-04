const loginForm    = Utils.$('#login-form');
const registerForm = Utils.$('#register-form');

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

/* ── Auth ───────────────────────────────────── */
async function login() {
  Utils.clearMessage('#msg');

  const email    = getValue('#email');
  const password = getValue('#password');

  if (!email || !password) {
    Utils.showMessage('#msg', 'Informe email e senha.');
    return;
  }

  const btn = document.querySelector('#login-form .btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Entrando...'; }

  try {
    const data = await Api.login({ email, password });
    Api.setSession(data);

    showLoading('Bem-vindo de volta! 🚀');
    await new Promise(r => setTimeout(r, 1800));
    window.location.href = 'pages/dashboard.html';

  } catch (error) {
    hideLoading();
    if (btn) { btn.disabled = false; btn.textContent = 'Entrar →'; }
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

  const btn = document.querySelector('#register-form .btn-login');
  if (btn) { btn.disabled = true; btn.textContent = 'Criando conta...'; }

  try {
    const data = await Api.register({ name, email, password });
    Api.setSession(data);

    showLoading('showLoading('Conta criada! Preparando tudo... 🚀⚡');
    await new Promise(r => setTimeout(r, 1800));
    window.location.href = 'pages/dashboard.html';

  } catch (error) {
    hideLoading();
    if (btn) { btn.disabled = false; btn.textContent = 'Criar conta →'; }
    Utils.showMessage('#msg', error.message || 'Erro ao cadastrar usuário.');
  }
}

function showRegister() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
  Utils.clearMessage('#msg');
}

function showLogin() {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
  Utils.clearMessage('#msg');
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;
  if (registerForm.style.display === 'block') register();
  else login();
});