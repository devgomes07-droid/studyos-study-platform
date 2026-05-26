const loginForm = Utils.$('#login-form');
const registerForm = Utils.$('#register-form');

function getValue(selector) {
  return Utils.$(selector)?.value.trim() || '';
}

async function login() {
  Utils.clearMessage('#msg');

  const email = getValue('#email');
  const password = getValue('#password');

  if (!email || !password) {
    Utils.showMessage('#msg', 'Informe email e senha.');
    return;
  }

  try {
    const data = await Api.login({ email, password });
    Api.setSession(data);
    window.location.href = 'pages/dashboard.html';
  } catch (error) {
    Utils.showMessage('#msg', error.message || 'Email ou senha incorretos.');
  }
}

async function register() {
  Utils.clearMessage('#msg');

  const name = getValue('#reg-name');
  const email = getValue('#reg-email');
  const password = getValue('#reg-password');

  if (!name || !email || !password) {
    Utils.showMessage('#msg', 'Preencha todos os campos.');
    return;
  }

  if (password.length < 6) {
    Utils.showMessage('#msg', 'A senha deve ter pelo menos 6 caracteres.');
    return;
  }

  try {
    const data = await Api.register({ name, email, password });
    Api.setSession(data);
    window.location.href = 'pages/dashboard.html';
  } catch (error) {
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

  if (registerForm.style.display === 'block') {
    register();
  } else {
    login();
  }
});