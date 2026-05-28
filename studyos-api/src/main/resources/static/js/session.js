Utils.requireAuth();

const draft = JSON.parse(localStorage.getItem('studySessionDraft') || 'null');
let activeSession = JSON.parse(localStorage.getItem('activeStudySession') || 'null');

let elapsedSeconds = 0;
let countdownSeconds = null;
let timerInterval = null;
let isPaused = false;
let isFinishing = false;

const user = Utils.getUser();

if (!draft) {
  window.alert('Escolha um metodo antes de iniciar.');
  window.location.href = 'study.html';
}

const userInfo = Utils.$('#user-info');

if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP - Nivel ${user.level ?? 1}</span>
  `;
}

function logout() {
  Utils.logout();
}

function getMethodDurationMinutes(duration) {
  const map = {
    '25/5': 25,
    '52/17': 52,
    'Curta': 15,
    'Revisao': 20
  };

  return map[duration] || null;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function renderSessionInfo() {
  Utils.setText('#method-name', draft.methodName || draft.method);
  Utils.setText('#method-description', draft.methodDescription || 'Sessao de estudo.');
  Utils.setText('#subject-name', draft.subjectName || 'Materia selecionada');

  const hero = Utils.$('#session-hero');

  if (hero) {
    hero.style.borderTop = `5px solid ${draft.color || '#4f46e5'}`;
  }
}

function updateTimer() {
  if (countdownSeconds !== null) {
    const remaining = Math.max(countdownSeconds - elapsedSeconds, 0);
    Utils.setText('#timer-display', formatTime(remaining));

    if (remaining === 0) {
      finishSession();
    }

    return;
  }

  Utils.setText('#timer-display', formatTime(elapsedSeconds));
}

function startTimer() {
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (isPaused || isFinishing) return;

    elapsedSeconds += 1;
    updateTimer();
  }, 1000);
}

async function startBackendSession() {
  if (activeSession?.id) return;

  activeSession = await Api.startSession({
    subjectId: draft.subjectId,
    studyMethod: draft.method,
    notes: ''
  });

  localStorage.setItem('activeStudySession', JSON.stringify(activeSession));
}

function togglePause() {
  isPaused = !isPaused;
  Utils.setText('#pause-btn', isPaused ? 'Continuar' : 'Pausar');
  Utils.setText('#timer-mode', isPaused ? 'Pausado' : 'Foco');
}

async function finishSession() {
  if (!activeSession?.id || isFinishing) return;

  isFinishing = true;
  clearInterval(timerInterval);

  const finishButton = Utils.$('#finish-btn');
  const notes = Utils.$('#session-notes').value.trim();

  if (finishButton) {
    finishButton.disabled = true;
    finishButton.textContent = 'Finalizando...';
  }

  try {
    const result = await Api.finishSession(activeSession.id, {
      subjectId: draft.subjectId,
      studyMethod: draft.method,
      notes
    });

    localStorage.removeItem('studySessionDraft');
    localStorage.removeItem('activeStudySession');

    window.alert(`Sessao finalizada. XP ganho: ${result.xpEarned}`);
    window.location.href = 'dashboard.html';
  } catch (error) {
    window.alert(error.message || 'Erro ao finalizar sessao.');

    isFinishing = false;

    if (finishButton) {
      finishButton.disabled = false;
      finishButton.textContent = 'Finalizar sessao';
    }

    startTimer();
  }
}

function cancelSession() {
  const confirmed = window.confirm('Cancelar esta sessao? O progresso nao sera salvo.');

  if (!confirmed) return;

  localStorage.removeItem('studySessionDraft');
  localStorage.removeItem('activeStudySession');

  window.location.href = 'study.html';
}

async function initSession() {
  renderSessionInfo();

  const durationMinutes = getMethodDurationMinutes(draft.duration);
  countdownSeconds = durationMinutes ? durationMinutes * 60 : null;

  updateTimer();

  try {
    await startBackendSession();
    startTimer();
  } catch (error) {
    window.alert(error.message || 'Erro ao iniciar sessao.');
    window.location.href = 'study.html';
  }
}

Utils.$('#pause-btn').addEventListener('click', togglePause);
Utils.$('#finish-btn').addEventListener('click', finishSession);
Utils.$('#cancel-btn').addEventListener('click', cancelSession);

initSession();