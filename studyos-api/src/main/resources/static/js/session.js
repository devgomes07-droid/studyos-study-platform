Utils.requireAuth();

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
const draft = JSON.parse(localStorage.getItem('studySessionDraft') || 'null');
let activeSession    = JSON.parse(localStorage.getItem('activeStudySession') || 'null');
let elapsedSeconds   = 0;
let countdownSeconds = null;
let timerInterval    = null;
let isPaused         = false;
let isFinishing      = false;
let focusScore       = 100;
let tabSwitches      = 0;
let wakeLock         = null;

/* ─── Pomodoro state ─────────────────────────── */
const POMODORO = { FOCUS: 25*60, SHORT_BREAK: 5*60, LONG_BREAK: 15*60, CYCLES_BEFORE_LONG: 4 };
let pomodoroPhase           = 'FOCUS';
let pomodoroCompletedCycles = 0;
let isPomodoro              = false;

const user = Utils.getUser();

if (!draft) {
  Toast.error('Escolha um metodo antes de iniciar uma sessao.');
  setTimeout(() => window.location.href = 'study.html', 1500);
}

/* ═══════════════════════════════════════════════
   USER INFO
═══════════════════════════════════════════════ */
const userInfo = Utils.$('#user-info');
if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP - Nivel ${user.level ?? 1}</span>
  `;
}

function logout() { Utils.logout(); }

/* ═══════════════════════════════════════════════
   WAKE LOCK / FULLSCREEN
═══════════════════════════════════════════════ */
async function enableWakeLock() {
  try {
    if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
  } catch (_) {}
}

function enterFullscreen() {
  if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
}

/* ═══════════════════════════════════════════════
   BELL SOUND
═══════════════════════════════════════════════ */
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    function tone(freq, start, dur, gain = 0.4) {
      const osc = ctx.createOscillator();
      const vol = ctx.createGain();
      osc.connect(vol); vol.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      vol.gain.setValueAtTime(0, start);
      vol.gain.linearRampToValueAtTime(gain, start + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.start(start); osc.stop(start + dur);
    }
    tone(880, ctx.currentTime,        1.2);
    tone(660, ctx.currentTime + 0.6,  1.2);
    tone(440, ctx.currentTime + 1.2,  1.8);
  } catch (_) {}
}

/* ═══════════════════════════════════════════════
   CYCLE ANIMATION
═══════════════════════════════════════════════ */
function showCycleAnimation(label, color) {
  const el = document.createElement('div');
  el.className = 'cycle-overlay';
  el.innerHTML = `
    <div class="cycle-overlay-box" style="--anim-color:${color}">
      <div class="cycle-overlay-icon">✓</div>
      <p class="cycle-overlay-label">${label}</p>
    </div>
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

/* ═══════════════════════════════════════════════
   TIMER RING
═══════════════════════════════════════════════ */
const METHOD_COLORS = {
  POMODORO:'#ef4444', FLOW_STATE:'#0f766e', FEYNMAN:'#d97706',
  ACTIVE_RECALL:'#16a34a', FIFTY_TWO_SEVENTEEN:'#2563eb',
  FLASHCARDS:'#db2777', TIMEBOXING:'#7c3aed', CORNELL_NOTES:'#475569',
  FREE_REVIEW:'#65a30d', SPACED_REPETITION:'#9333ea',
  GUIDED_READING:'#0891b2', QUESTIONS:'#ea580c'
};

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function updateTimerRing(color) {
  const ring = Utils.$('#timer-ring');
  if (!ring || countdownSeconds === null) return;
  const remaining = Math.max(countdownSeconds - elapsedSeconds, 0);
  const pct       = Math.max(0, Math.min(100, (remaining / countdownSeconds) * 100));
  const bg        = getCssVar('--bg')    || '#0f172a';
  const muted     = getCssVar('--muted') || '#1e293b';
  const c         = color || METHOD_COLORS[draft.method] || '#6366f1';
  ring.style.background = `radial-gradient(circle,${bg} 58%,transparent 59%),conic-gradient(${c} ${pct}%,${muted} 0%)`;
}

/* ═══════════════════════════════════════════════
   POMODORO
═══════════════════════════════════════════════ */
function getPomodoroColor() {
  return { FOCUS:'#ef4444', SHORT_BREAK:'#22c55e', LONG_BREAK:'#3b82f6' }[pomodoroPhase];
}

function getPomodoroPhaseLabel() {
  return { FOCUS:'Foco', SHORT_BREAK:'Pausa curta', LONG_BREAK:'Pausa longa' }[pomodoroPhase];
}

function updatePomodoroCyclesDisplay() {
  const el = Utils.$('.pomodoro-cycles');
  if (!el) return;
  const done = pomodoroCompletedCycles % POMODORO.CYCLES_BEFORE_LONG;
  el.innerHTML = Array.from({ length: POMODORO.CYCLES_BEFORE_LONG }, (_, i) =>
    `<span style="opacity:${i < done ? '1' : '0.3'};transition:opacity .4s">🍅</span>`
  ).join('');
}

function setPomodoroPhase(phase) {
  pomodoroPhase  = phase;
  elapsedSeconds = 0;
  const cfg = { FOCUS:{s:POMODORO.FOCUS,label:'Foco',color:'#ef4444'},
                SHORT_BREAK:{s:POMODORO.SHORT_BREAK,label:'Pausa curta',color:'#22c55e'},
                LONG_BREAK:{s:POMODORO.LONG_BREAK,label:'Pausa longa',color:'#3b82f6'} }[phase];
  countdownSeconds = cfg.s;
  Utils.setText('#timer-mode', cfg.label);
  updateTimerRing(cfg.color);
  updatePomodoroCyclesDisplay();
}

function advancePomodoroPhase() {
  playBell();
  if (pomodoroPhase === 'FOCUS') {
    pomodoroCompletedCycles++;
    updatePomodoroCyclesDisplay();
    const isLong = (pomodoroCompletedCycles % POMODORO.CYCLES_BEFORE_LONG) === 0;
    if (isLong) {
      showCycleAnimation('🎉 Pausa longa merecida!', '#3b82f6');
      setTimeout(() => setPomodoroPhase('LONG_BREAK'), 2200);
    } else {
      showCycleAnimation('✅ Ciclo completo! Descanse.', '#22c55e');
      setTimeout(() => setPomodoroPhase('SHORT_BREAK'), 2200);
    }
  } else {
    showCycleAnimation('🔥 Hora de focar!', '#ef4444');
    setTimeout(() => setPomodoroPhase('FOCUS'), 2200);
  }
}

/* ═══════════════════════════════════════════════
   TIMER CORE
═══════════════════════════════════════════════ */
function formatTime(s) {
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}

function getMethodDurationMinutes(dur) {
  return {'25/5':25,'52/17':52,'Curta':15,'Revisao':20,'Deep Focus':90}[dur] || null;
}

function updateProgressBar() {
  if (draft.method !== 'FIFTY_TWO_SEVENTEEN') return;
  const bar = Utils.$('#progress-bar');
  if (!bar || countdownSeconds === null) return;
  bar.style.width = `${Math.max(0, ((countdownSeconds - elapsedSeconds) / countdownSeconds) * 100)}%`;
}

function updateTimer() {
  if (countdownSeconds !== null) {
    const remaining = Math.max(countdownSeconds - elapsedSeconds, 0);
    Utils.setText('#timer-display', formatTime(remaining));
    updateTimerRing(isPomodoro ? getPomodoroColor() : null);
    updateProgressBar();
    if (remaining === 0) {
      if (isPomodoro) advancePomodoroPhase();
      else finishSession();
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
    elapsedSeconds++;
    updateTimer();
  }, 1000);
}

/* ═══════════════════════════════════════════════
   FOCUS SCORE
═══════════════════════════════════════════════ */
function updateFocusScore() {
  focusScore = Math.max(0, 100 - tabSwitches * 10);
  const el = Utils.$('#focus-score');
  if (el) el.textContent = `${focusScore}%`;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { tabSwitches++; updateFocusScore(); }
});

/* ═══════════════════════════════════════════════
   RENDER SESSION INFO
═══════════════════════════════════════════════ */
function renderSessionInfo() {
  Utils.setText('#method-name',        draft.methodName || draft.method);
  Utils.setText('#method-description', draft.methodDescription || 'Sessao de estudo.');
  Utils.setText('#subject-name',       draft.subjectName || 'Materia selecionada');

  const hero = Utils.$('#session-hero');
  if (hero) hero.style.borderTopColor = draft.color || '#4f46e5';

  document.body.classList.add(`method-${draft.method}`);

  if (draft.method === 'FLOW_STATE') {
    document.body.classList.add('deep-focus-mode');
    enterFullscreen();
    enableWakeLock();
  }

  if (draft.method === 'POMODORO') {
    isPomodoro = true;
    const timerCard = Utils.$('.timer-card');
    if (timerCard) {
      const cycles = document.createElement('div');
      cycles.className = 'pomodoro-cycles';
      timerCard.insertBefore(cycles, timerCard.firstChild);
      updatePomodoroCyclesDisplay();
    }
  }

  if (draft.method === 'FIFTY_TWO_SEVENTEEN') {
    const timerCard = Utils.$('.timer-card');
    if (timerCard) {
      const bar = document.createElement('div');
      bar.className = 'progress-bar-container';
      bar.innerHTML = '<div class="progress-bar-fill" id="progress-bar" style="width:100%"></div>';
      timerCard.appendChild(bar);
    }
  }

  // Timeboxing — mostra objetivo definido
  if (draft.method === 'TIMEBOXING' && draft['timebox-goal']) {
    const hero = Utils.$('#session-hero');
    if (hero) {
      const goal = document.createElement('div');
      goal.className = 'session-goal-tag';
      goal.innerHTML = `🎯 <strong>Objetivo:</strong> ${Utils.escapeHtml(draft['timebox-goal'])}`;
      hero.appendChild(goal);
    }
  }
}

/* ═══════════════════════════════════════════════
   PAUSE / CANCEL
═══════════════════════════════════════════════ */
function togglePause() {
  isPaused = !isPaused;
  Utils.setText('#pause-btn',  isPaused ? 'Continuar' : 'Pausar');
  Utils.setText('#timer-mode', isPaused ? 'Pausado'   : (isPomodoro ? getPomodoroPhaseLabel() : 'Foco'));
  if (isPaused) Toast.info('Sessao pausada.', 2000);
}

async function cancelSession() {
  const confirmed = await Toast.confirm(
    'Cancelar esta sessao?',
    '🛑',
    'Sim, cancelar',
    'Continuar estudando',
    true
  );
  if (!confirmed) return;
  localStorage.removeItem('studySessionDraft');
  localStorage.removeItem('activeStudySession');
  window.location.href = 'study.html';
}

/* ═══════════════════════════════════════════════
   XP
═══════════════════════════════════════════════ */
function calculateXP() {
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 5) return 0;
  let xp = minutes * 2;
  if (focusScore >= 90) xp += 50;
  if (isPomodoro)       xp += pomodoroCompletedCycles * 20;
  if (draft.method === 'FLOW_STATE')   xp = Math.floor(xp * 1.8);
  if (draft.method === 'FEYNMAN' || draft.method === 'ACTIVE_RECALL') xp = Math.floor(xp * 1.5);
  return xp;
}

/* ═══════════════════════════════════════════════
   FINISH
═══════════════════════════════════════════════ */
async function finishSession() {
  if (!activeSession?.id || isFinishing) return;
  isFinishing = true;
  clearInterval(timerInterval);
  playBell();

  const finishBtn = Utils.$('#finish-btn');
  const notes     = Utils.$('#session-notes')?.value.trim() || '';

  if (finishBtn) { finishBtn.disabled = true; finishBtn.textContent = 'Finalizando...'; }

  try {
    const xpEarned = calculateXP();

    await Api.finishSession(activeSession.id, {
      subjectId:     draft.subjectId,
      studyMethod:   draft.method,
      notes,
      elapsedSeconds,
      focusScore,
      perfectSession: focusScore >= 90
    });

    localStorage.removeItem('studySessionDraft');
    localStorage.removeItem('activeStudySession');

    Toast.showFinish({
      xp:         xpEarned,
      minutes:    Math.floor(elapsedSeconds / 60),
      focusScore,
      cycles:     isPomodoro ? pomodoroCompletedCycles : null,
      onDashboard: () => window.location.href = 'dashboard.html'
    });

  } catch (error) {
    Toast.error(error.message || 'Erro ao finalizar sessao. Tente novamente.');
    isFinishing = false;
    if (finishBtn) { finishBtn.disabled = false; finishBtn.textContent = 'Finalizar sessao'; }
    startTimer();
  }
}

/* ═══════════════════════════════════════════════
   BACKEND
═══════════════════════════════════════════════ */
async function startBackendSession() {
  if (activeSession?.id) return;
  activeSession = await Api.startSession({
    subjectId:   draft.subjectId,
    studyMethod: draft.method,
    notes:       ''
  });
  localStorage.setItem('activeStudySession', JSON.stringify(activeSession));
}

/* ═══════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════ */
async function initSession() {
  renderSessionInfo();
  updateFocusScore();

  if (isPomodoro) {
    setPomodoroPhase('FOCUS');
  } else {
    const durationMinutes = draft['timebox-duration'] || getMethodDurationMinutes(draft.duration);
    countdownSeconds = durationMinutes ? durationMinutes * 60 : null;
    updateTimer();
  }

  try {
    await startBackendSession();
    startTimer();
    Toast.success(`Sessao iniciada! Bons estudos. 📚`, 3000);
  } catch (error) {
    Toast.error(error.message || 'Erro ao iniciar sessao.');
    setTimeout(() => window.location.href = 'study.html', 2000);
  }
}

/* ═══════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════ */
Utils.$('#pause-btn').addEventListener('click',  togglePause);
Utils.$('#finish-btn').addEventListener('click', finishSession);
Utils.$('#cancel-btn').addEventListener('click', cancelSession);

initSession();