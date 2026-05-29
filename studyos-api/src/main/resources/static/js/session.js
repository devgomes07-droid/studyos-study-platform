Utils.requireAuth();

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
const draft = JSON.parse(localStorage.getItem('studySessionDraft') || 'null');

let activeSession = JSON.parse(localStorage.getItem('activeStudySession') || 'null');

let elapsedSeconds      = 0;
let countdownSeconds    = null;
let timerInterval       = null;
let isPaused            = false;
let isFinishing         = false;
let focusScore          = 100;
let tabSwitches         = 0;
let wakeLock            = null;

/* ─── Pomodoro state ─────────────────────────── */
const POMODORO = {
  FOCUS:       25 * 60,
  SHORT_BREAK:  5 * 60,
  LONG_BREAK:  15 * 60,
  CYCLES_BEFORE_LONG: 4
};

let pomodoroPhase          = 'FOCUS';   // 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK'
let pomodoroCompletedCycles = 0;
let isPomodoro             = false;

const user = Utils.getUser();

if (!draft) {
  window.alert('Escolha um metodo antes de iniciar.');
  window.location.href = 'study.html';
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
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
    }
  } catch (_) {}
}

function enterFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  }
}

/* ═══════════════════════════════════════════════
   BELL SOUND  (Web Audio API — sem arquivos externos)
═══════════════════════════════════════════════ */
function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    function tone(freq, startTime, duration, gain = 0.4) {
      const osc  = ctx.createOscillator();
      const vol  = ctx.createGain();
      osc.connect(vol);
      vol.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      vol.gain.setValueAtTime(0, startTime);
      vol.gain.linearRampToValueAtTime(gain, startTime + 0.01);
      vol.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    // Três badaladas em sequência
    tone(880, ctx.currentTime,        1.2);
    tone(660, ctx.currentTime + 0.6,  1.2);
    tone(440, ctx.currentTime + 1.2,  1.8);
  } catch (_) {
    console.log('Audio indisponivel');
  }
}

/* ═══════════════════════════════════════════════
   COMPLETION ANIMATION
═══════════════════════════════════════════════ */
function showCycleCompleteAnimation(label, color) {
  const overlay = document.createElement('div');
  overlay.className = 'cycle-overlay';
  overlay.innerHTML = `
    <div class="cycle-overlay-box" style="--anim-color: ${color}">
      <div class="cycle-overlay-icon">✓</div>
      <p class="cycle-overlay-label">${label}</p>
    </div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2200);
}

/* ═══════════════════════════════════════════════
   TIMER RING
═══════════════════════════════════════════════ */
const METHOD_COLORS = {
  POMODORO:            '#ef4444',
  FLOW_STATE:          '#0f766e',
  FEYNMAN:             '#d97706',
  ACTIVE_RECALL:       '#16a34a',
  FIFTY_TWO_SEVENTEEN: '#2563eb',
  FLASHCARDS:          '#db2777',
  TIMEBOXING:          '#7c3aed',
  CORNELL_NOTES:       '#475569',
  FREE_REVIEW:         '#65a30d',
  SPACED_REPETITION:   '#9333ea',
  GUIDED_READING:      '#0891b2',
  QUESTIONS:           '#ea580c'
};

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function updateTimerRing(overrideColor) {
  const ring = Utils.$('#timer-ring');
  if (!ring || countdownSeconds === null) return;

  const remaining = Math.max(countdownSeconds - elapsedSeconds, 0);
  const progress  = (remaining / countdownSeconds) * 100;
  const clamp     = Math.max(0, Math.min(100, progress));

  const color   = overrideColor || METHOD_COLORS[draft.method] || '#6366f1';
  const bgInner = getCssVar('--bg')    || '#0f172a';
  const bgTrack = getCssVar('--muted') || '#1e293b';

  ring.style.background = `
    radial-gradient(circle, ${bgInner} 58%, transparent 59%),
    conic-gradient(${color} ${clamp}%, ${bgTrack} 0%)
  `;
}

/* ═══════════════════════════════════════════════
   POMODORO — CICLOS
═══════════════════════════════════════════════ */
function getPomodoroColor() {
  if (pomodoroPhase === 'FOCUS')       return '#ef4444';
  if (pomodoroPhase === 'SHORT_BREAK') return '#22c55e';
  return '#3b82f6'; // LONG_BREAK
}

function updatePomodoroCyclesDisplay() {
  const el = Utils.$('.pomodoro-cycles');
  if (!el) return;

  const total    = POMODORO.CYCLES_BEFORE_LONG;
  const done     = pomodoroCompletedCycles % total;
  const tomatoes = Array.from({ length: total }, (_, i) =>
    `<span style="opacity:${i < done ? '1' : '0.3'};transition:opacity .4s"}>🍅</span>`
  ).join('');

  el.innerHTML = tomatoes;
}

function setPomodoroPhase(phase) {
  pomodoroPhase    = phase;
  elapsedSeconds   = 0;

  const phaseConfig = {
    FOCUS:       { seconds: POMODORO.FOCUS,       label: 'Foco',         color: '#ef4444' },
    SHORT_BREAK: { seconds: POMODORO.SHORT_BREAK, label: 'Pausa curta',  color: '#22c55e' },
    LONG_BREAK:  { seconds: POMODORO.LONG_BREAK,  label: 'Pausa longa',  color: '#3b82f6' }
  };

  const cfg = phaseConfig[phase];
  countdownSeconds = cfg.seconds;

  Utils.setText('#timer-mode', cfg.label);
  updateTimerRing(cfg.color);
  updatePomodoroCyclesDisplay();
}

function advancePomodoroPhase() {
  playBell();

  if (pomodoroPhase === 'FOCUS') {
    pomodoroCompletedCycles++;
    updatePomodoroCyclesDisplay();

    const isLongBreak = (pomodoroCompletedCycles % POMODORO.CYCLES_BEFORE_LONG) === 0;

    if (isLongBreak) {
      showCycleCompleteAnimation('🎉 Pausa longa merecida!', '#3b82f6');
      setTimeout(() => setPomodoroPhase('LONG_BREAK'), 2200);
    } else {
      showCycleCompleteAnimation('✅ Ciclo completo! Descanse.', '#22c55e');
      setTimeout(() => setPomodoroPhase('SHORT_BREAK'), 2200);
    }
  } else {
    // Fim da pausa → volta ao foco
    showCycleCompleteAnimation('🔥 Hora de focar!', '#ef4444');
    setTimeout(() => setPomodoroPhase('FOCUS'), 2200);
  }
}

/* ═══════════════════════════════════════════════
   TIMER CORE
═══════════════════════════════════════════════ */
function formatTime(totalSeconds) {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function getMethodDurationMinutes(duration) {
  const map = { '25/5': 25, '52/17': 52, 'Curta': 15, 'Revisao': 20, 'Deep Focus': 90 };
  return map[duration] || null;
}

function updateProgressBar() {
  if (draft.method !== 'FIFTY_TWO_SEVENTEEN') return;
  const bar = Utils.$('#progress-bar');
  if (!bar || countdownSeconds === null) return;
  const progress = ((countdownSeconds - elapsedSeconds) / countdownSeconds) * 100;
  bar.style.width = `${Math.max(0, progress)}%`;
}

function updateTimer() {
  if (countdownSeconds !== null) {
    const remaining = Math.max(countdownSeconds - elapsedSeconds, 0);
    Utils.setText('#timer-display', formatTime(remaining));
    updateTimerRing(isPomodoro ? getPomodoroColor() : null);
    updateProgressBar();

    if (remaining === 0) {
      if (isPomodoro) {
        advancePomodoroPhase();
      } else {
        finishSession();
      }
    }
    return;
  }

  // Modo livre (sem countdown)
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

  // Pomodoro — ciclos visuais
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

/* ═══════════════════════════════════════════════
   PAUSE / FINISH / CANCEL
═══════════════════════════════════════════════ */
function togglePause() {
  isPaused = !isPaused;
  Utils.setText('#pause-btn',   isPaused ? 'Continuar' : 'Pausar');
  Utils.setText('#timer-mode',  isPaused ? 'Pausado'   : (isPomodoro ? getPomodoroPhaseLabel() : 'Foco'));
}

function getPomodoroPhaseLabel() {
  return { FOCUS: 'Foco', SHORT_BREAK: 'Pausa curta', LONG_BREAK: 'Pausa longa' }[pomodoroPhase];
}

function calculateXP() {
  const minutes = Math.floor(elapsedSeconds / 60);
  if (minutes < 5) return 0;
  let xp = minutes * 2;
  if (focusScore >= 90) xp += 50;
  if (isPomodoro) xp += pomodoroCompletedCycles * 20;
  if (draft.method === 'FLOW_STATE') xp = Math.floor(xp * 1.8);
  if (draft.method === 'FEYNMAN' || draft.method === 'ACTIVE_RECALL') xp = Math.floor(xp * 1.5);
  return xp;
}

async function finishSession() {
  if (!activeSession?.id || isFinishing) return;
  isFinishing = true;
  clearInterval(timerInterval);
  playBell();

  const finishBtn = Utils.$('#finish-btn');
  const notes     = Utils.$('#session-notes')?.value.trim() || '';

  if (finishBtn) {
    finishBtn.disabled     = true;
    finishBtn.textContent  = 'Finalizando...';
  }

  try {
    const xpEarned = calculateXP();

    await Api.finishSession(activeSession.id, {
      subjectId:    draft.subjectId,
      studyMethod:  draft.method,
      notes,
      elapsedSeconds,
      focusScore,
      perfectSession: focusScore >= 90
    });

    localStorage.removeItem('studySessionDraft');
    localStorage.removeItem('activeStudySession');

    const cyclesInfo = isPomodoro
      ? `\nCiclos completos: ${pomodoroCompletedCycles}` : '';

    window.alert(
      `Sessao finalizada!\n\nXP ganho: ${xpEarned}\nFocus Score: ${focusScore}%${cyclesInfo}`
    );
    window.location.href = 'dashboard.html';

  } catch (error) {
    window.alert(error.message || 'Erro ao finalizar sessao.');
    isFinishing = false;
    if (finishBtn) { finishBtn.disabled = false; finishBtn.textContent = 'Finalizar sessao'; }
    startTimer();
  }
}

function cancelSession() {
  if (!window.confirm('Cancelar esta sessao?')) return;
  localStorage.removeItem('studySessionDraft');
  localStorage.removeItem('activeStudySession');
  window.location.href = 'study.html';
}

/* ═══════════════════════════════════════════════
   BACKEND SESSION
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
    const durationMinutes = getMethodDurationMinutes(draft.duration);
    countdownSeconds = durationMinutes ? durationMinutes * 60 : null;
    updateTimer();
  }

  try {
    await startBackendSession();
    startTimer();
  } catch (error) {
    window.alert(error.message || 'Erro ao iniciar sessao.');
    window.location.href = 'study.html';
  }
}

/* ═══════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════ */
Utils.$('#pause-btn').addEventListener('click',  togglePause);
Utils.$('#finish-btn').addEventListener('click', finishSession);
Utils.$('#cancel-btn').addEventListener('click', cancelSession);

initSession();