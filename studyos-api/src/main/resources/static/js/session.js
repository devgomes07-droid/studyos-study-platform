Utils.requireAuth();

const draft = JSON.parse(localStorage.getItem('studySessionDraft') || 'null');

let activeSession = JSON.parse(
  localStorage.getItem('activeStudySession') || 'null'
);

let elapsedSeconds = 0;
let countdownSeconds = null;
let timerInterval = null;
let isPaused = false;
let isFinishing = false;
let focusScore = 100;
let tabSwitches = 0;
let wakeLock = null;

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

async function enableWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (error) {
    console.log('Wake Lock indisponivel');
  }
}

function enterFullscreen() {
  const element = document.documentElement;
  if (element.requestFullscreen) {
    element.requestFullscreen();
  }
}

function getMethodDurationMinutes(duration) {
  const map = {
    '25/5': 25,
    '52/17': 52,
    'Curta': 15,
    'Revisao': 20,
    'Deep Focus': 90
  };
  return map[duration] || null;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimerRing() {
  const ring = Utils.$('#timer-ring');
  if (!ring || countdownSeconds === null) return;

  const progress = ((countdownSeconds - elapsedSeconds) / countdownSeconds) * 100;
  const clamp = Math.max(0, Math.min(100, progress));

  const methodColors = {
    POMODORO: '#ef4444',
    FLOW_STATE: '#0f766e',
    FEYNMAN: '#d97706',
    ACTIVE_RECALL: '#16a34a',
    FIFTY_TWO_SEVENTEEN: '#2563eb',
    FLASHCARDS: '#db2777',
    TIMEBOXING: '#7c3aed',
    CORNELL_NOTES: '#475569',
    FREE_REVIEW: '#65a30d',
    SPACED_REPETITION: '#9333ea',
    GUIDED_READING: '#0891b2',
    QUESTIONS: '#ea580c'
  };

  const color = methodColors[draft.method] || '#6366f1';
  const bg = `radial-gradient(circle, #0f172a 58%, transparent 59%), conic-gradient(${color} ${clamp}%, #1e293b 0%)`;
  ring.style.background = bg;
}

function renderSessionInfo() {
  Utils.setText('#method-name', draft.methodName || draft.method);
  Utils.setText('#method-description', draft.methodDescription || 'Sessao de estudo.');
  Utils.setText('#subject-name', draft.subjectName || 'Materia selecionada');

  const hero = Utils.$('#session-hero');
  if (hero) {
    hero.style.borderTop = `5px solid ${draft.color || '#4f46e5'}`;
  }

  // Aplica classe do método no body
  document.body.classList.add(`method-${draft.method}`);

  // Flow State — fullscreen e wake lock
  if (draft.method === 'FLOW_STATE') {
    document.body.classList.add('deep-focus-mode');
    enterFullscreen();
    enableWakeLock();
  }

  // Pomodoro — mostra ciclos
  if (draft.method === 'POMODORO') {
    const timerCard = Utils.$('.timer-card');
    if (timerCard) {
      const cycles = document.createElement('div');
      cycles.className = 'pomodoro-cycles';
      cycles.innerHTML = '🍅🍅🍅🍅';
      timerCard.insertBefore(cycles, timerCard.firstChild);
    }
  }

  // 52/17 — barra de progresso
  if (draft.method === 'FIFTY_TWO_SEVENTEEN') {
    const timerCard = Utils.$('.timer-card');
    if (timerCard) {
      const bar = document.createElement('div');
      bar.className = 'progress-bar-container';
      bar.innerHTML = '<div class="progress-bar-fill" id="progress-bar" style="width:100%"></div>';
      timerCard.appendChild(bar);
    }
  }
}

function updateProgressBar() {
  if (draft.method !== 'FIFTY_TWO_SEVENTEEN') return;
  const bar = Utils.$('#progress-bar');
  if (!bar || countdownSeconds === null) return;
  const progress = ((countdownSeconds - elapsedSeconds) / countdownSeconds) * 100;
  bar.style.width = `${Math.max(0, progress)}%`;
}

function updateFocusScore() {
  focusScore = Math.max(0, 100 - (tabSwitches * 10));
  const el = Utils.$('#focus-score');
  if (el) Utils.setText('#focus-score', `${focusScore}%`);
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    tabSwitches++;
    updateFocusScore();
  }
});

function updateTimer() {
  if (countdownSeconds !== null) {
    const remaining = Math.max(countdownSeconds - elapsedSeconds, 0);
    Utils.setText('#timer-display', formatTime(remaining));
    updateTimerRing();
    updateProgressBar();
    if (remaining === 0) {
      finishSession();
    }
    return;
  }
  Utils.setText('#timer-display', formatTime(elapsedSeconds));
  updateTimerRing();
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

function calculateXP() {
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 5) return 0;

  let xp = minutes * 2;
  if (focusScore >= 90) xp += 50;
  if (draft.method === 'FLOW_STATE') xp = Math.floor(xp * 1.8);
  if (draft.method === 'FEYNMAN' || draft.method === 'ACTIVE_RECALL') xp = Math.floor(xp * 1.5);

  return xp;
}

async function finishSession() {
  if (!activeSession?.id || isFinishing) return;
  isFinishing = true;
  clearInterval(timerInterval);

  const finishButton = Utils.$('#finish-btn');
  const notes = Utils.$('#session-notes')?.value.trim() || '';

  if (finishButton) {
    finishButton.disabled = true;
    finishButton.textContent = 'Finalizando...';
  }

  try {
    const xpEarned = calculateXP();

    await Api.finishSession(activeSession.id, {
      subjectId: draft.subjectId,
      studyMethod: draft.method,
      notes,
      elapsedSeconds,
      focusScore,
      perfectSession: focusScore >= 90
    });

    localStorage.removeItem('studySessionDraft');
    localStorage.removeItem('activeStudySession');

    window.alert(`Sessao finalizada!\n\nXP ganho: ${xpEarned}\nFocus Score: ${focusScore}%`);
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
  const confirmed = window.confirm('Cancelar esta sessao?');
  if (!confirmed) return;
  localStorage.removeItem('studySessionDraft');
  localStorage.removeItem('activeStudySession');
  window.location.href = 'study.html';
}

async function initSession() {
  renderSessionInfo();
  updateFocusScore();

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