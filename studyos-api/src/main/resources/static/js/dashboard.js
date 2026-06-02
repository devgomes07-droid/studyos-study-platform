/* dashboard.js — depende de api.js e utils.js */

Utils.requireAuth();

const user     = Utils.getUser();
const userName = user.name || 'Estudante';

/* ── Greeting ──────────────────────────────── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

Utils.setText('#greeting', getGreeting());
Utils.setText('#username', userName);

const userInfo = Utils.$('#user-info');
if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(userName)}</strong>
    <span>${user.xp ?? 0} XP — Nível ${user.level ?? 1}</span>
  `;
}

function logout() { Utils.logout(); }

/* ── Stats ─────────────────────────────────── */
function renderStats(subjects, sessions) {
  const xp     = user.xp            ?? 0;
  const level  = user.level         ?? 1;
  const streak = user.currentStreak ?? 0;

  Utils.setText('#xp', xp.toLocaleString('pt-BR'));

  const xpInLevel = xp % 500;
  const xpPct     = Math.min((xpInLevel / 500) * 100, 100);
  const xpBarEl   = Utils.$('#xp-bar');
  if (xpBarEl) setTimeout(() => xpBarEl.style.width = `${xpPct}%`, 300);
  Utils.setText('#next-level-xp', `Próximo em ${500 - xpInLevel} XP`);

  const today   = new Date().toDateString();
  const xpToday = sessions
    .filter(s => s.completed && new Date(s.startedAt).toDateString() === today)
    .reduce((acc, s) => acc + (s.xpEarned || 0), 0);
  Utils.setText('#xp-today', xpToday);

  Utils.setText('#level', level);

  Utils.setText('#streak', streak);
  const streakMsgs = {
    0: 'Comece hoje!', 1: '1 dia — ótimo início!', 3: '3 dias — pegando ritmo!',
    7: '1 semana — incrível!', 14: '2 semanas — imparável!', 30: '1 mês — lendário!'
  };
  const sk = [30,14,7,3,1,0].find(k => streak >= k);
  Utils.setText('#streak-msg',  streakMsgs[sk] || `${streak} dias seguidos!`);
  Utils.setText('#streak-icon', streak === 0 ? '💤' : '🔥');

  const totalHours = subjects.reduce((acc, s) => acc + (s.totalHoursStudied || 0), 0);
  Utils.setText('#total-hours',    Utils.formatHours ? Utils.formatHours(totalHours) : `${Math.round(totalHours)}h`);
  Utils.setText('#subjects-count', `${subjects.length} matéria${subjects.length !== 1 ? 's' : ''}`);
}

/* ── Subjects ──────────────────────────────── */
function renderSubjects(subjects) {
  const list = Utils.$('#subjects-list');
  if (!list) return;

  if (!subjects.length) {
    list.innerHTML = `<div class="empty-state">Nenhuma matéria. <a href="subjects.html">Adicionar →</a></div>`;
    return;
  }

  list.innerHTML = subjects.slice(0, 6).map(s => {
    const color = s.color || '#6366f1';
    const icon  = Utils.escapeHtml(s.icon || '📚');
    const name  = Utils.escapeHtml(s.name);
    const hours = Utils.formatHours ? Utils.formatHours(s.totalHoursStudied || 0) : `${Math.round(s.totalHoursStudied || 0)}h`;
    const goal  = s.weeklyGoalHours || 0;
    const pct   = goal > 0 ? Math.min(((s.totalHoursStudied || 0) / goal) * 100, 100) : 0;

    return `
      <div class="subject-dash-item" onclick="window.location.href='subjects.html'">
        <div class="subject-dash-icon" style="background:${color}22">${icon}</div>
        <div class="subject-dash-info">
          <p class="subject-dash-name">${name}</p>
          <p class="subject-dash-hours">${hours} estudadas</p>
        </div>
        <div class="subject-dash-bar-track">
          <div class="subject-dash-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>`;
  }).join('');
}

/* ── Sessions ──────────────────────────────── */
const METHOD_COLORS = {
  POMODORO:'#ef4444', FLOW_STATE:'#0f766e', FEYNMAN:'#d97706',
  ACTIVE_RECALL:'#16a34a', FIFTY_TWO_SEVENTEEN:'#2563eb', FLASHCARDS:'#db2777',
  TIMEBOXING:'#7c3aed', CORNELL_NOTES:'#475569', FREE_REVIEW:'#65a30d',
  SPACED_REPETITION:'#9333ea', GUIDED_READING:'#0891b2', QUESTIONS:'#ea580c'
};

const METHOD_ICONS = {
  POMODORO:'🍅', FLOW_STATE:'🌊', FEYNMAN:'✍️', ACTIVE_RECALL:'🧠',
  FIFTY_TWO_SEVENTEEN:'52', FLASHCARDS:'🃏', TIMEBOXING:'⏱',
  CORNELL_NOTES:'📝', FREE_REVIEW:'📖', SPACED_REPETITION:'SR',
  GUIDED_READING:'📄', QUESTIONS:'❓'
};

function renderSessions(sessions) {
  const list   = Utils.$('#sessions-list');
  if (!list) return;
  const recent = sessions.filter(s => s.completed).slice(0, 6);

  if (!recent.length) {
    list.innerHTML = `<div class="empty-state">Nenhuma sessão ainda.</div>`;
    return;
  }

  list.innerHTML = recent.map(s => {
    const method  = s.studyMethod || 'FREE_REVIEW';
    const color   = METHOD_COLORS[method] || '#6366f1';
    const icon    = METHOD_ICONS[method]  || '📚';
    const subject = Utils.escapeHtml(s.subjectName || 'Matéria');
    const mins    = s.durationMinutes || 0;
    const xp      = s.xpEarned || 0;
    const dateStr = new Date(s.startedAt).toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });

    return `
      <div class="session-dash-item">
        <div class="session-dash-method" style="background:${color}">${icon}</div>
        <div class="session-dash-info">
          <p class="session-dash-subject">${subject}</p>
          <p class="session-dash-meta">${mins}min · ${dateStr}</p>
        </div>
        <span class="session-dash-xp">+${xp} XP</span>
      </div>`;
  }).join('');
}

/* ── Charts ────────────────────────────────── */
let _charts = {};

function buildCharts(subjects, sessions) {
  const isDark    = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const surface   = isDark ? '#253347' : '#fff';
  const textMain  = isDark ? '#f1f5f9' : '#111827';

  Object.values(_charts).forEach(c => c.destroy());
  _charts = {};

  const tooltipDefaults = {
    backgroundColor: surface,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    titleColor: textMain,
    bodyColor: textColor,
    padding: 10,
  };

  /* BAR: horas por dia */
  const barCtx = document.getElementById('chart-bar');
  if (barCtx) {
    const ctx      = barCtx.getContext('2d');
    const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    const labels   = [], data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      labels.push(dayNames[d.getDay()]);
      const h = sessions
        .filter(s => s.completed && new Date(s.startedAt).toDateString() === d.toDateString())
        .reduce((a, s) => a + (s.durationMinutes || 0) / 60, 0);
      data.push(Math.round(h * 10) / 10);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, 'rgba(99,102,241,0.9)');
    grad.addColorStop(1, 'rgba(99,102,241,0.3)');

    _charts.bar = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ data, backgroundColor: grad, borderRadius: 7, borderSkipped: false }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { ...tooltipDefaults, callbacks: { label: c => ` ${c.raw}h` } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: v => v + 'h' }, beginAtZero: true }
        }
      }
    });
  }

  /* LINE: XP acumulado por semana */
  const lineCtx = document.getElementById('chart-line');
  if (lineCtx) {
    const ctx    = lineCtx.getContext('2d');
    const labels = [], data = [];

    for (let i = 6; i >= 0; i--) {
      const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() - i * 7);
      labels.push(`S${7 - i}`);
      const xp = sessions
        .filter(s => s.completed && new Date(s.startedAt) <= weekEnd)
        .reduce((a, s) => a + (s.xpEarned || 0), 0);
      data.push(xp);
    }

    const grad = ctx.createLinearGradient(0, 0, 0, 160);
    grad.addColorStop(0, 'rgba(99,102,241,0.25)');
    grad.addColorStop(1, 'rgba(99,102,241,0)');

    _charts.line = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ data, borderColor: '#6366f1', borderWidth: 2.5, backgroundColor: grad, fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 4, pointHoverRadius: 6 }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { ...tooltipDefaults, callbacks: { label: c => ` ${c.raw} XP` } } },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
          y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } }, beginAtZero: true }
        }
      }
    });
  }

  /* PIE: distribuição por matéria */
  const pieCtx = document.getElementById('chart-pie');
  if (pieCtx) {
    if (subjects.length) {
      _charts.pie = new Chart(pieCtx.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: subjects.map(s => s.name),
          datasets: [{ data: subjects.map(s => s.totalHoursStudied || 0), backgroundColor: subjects.map(s => s.color || '#6366f1'), borderWidth: 0, hoverOffset: 6 }]
        },
        options: {
          responsive: true, cutout: '68%',
          plugins: {
            legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 }, padding: 10, boxWidth: 10, boxHeight: 10 } },
            tooltip: { ...tooltipDefaults, callbacks: { label: c => ` ${c.raw}h estudadas` } }
          }
        }
      });
    } else {
      pieCtx.parentElement.innerHTML = '<p style="color:var(--soft-text);font-size:13px;text-align:center;padding:40px 0">Nenhuma matéria ainda.</p>';
    }
  }
}

/* ── Init ───────────────────────────────────── */
async function init() {
  try {
    const [subjects, sessions] = await Promise.all([
      Api.getSubjects(),
      Api.getSessions ? Api.getSessions() : Promise.resolve([])
    ]);

    // Usa apenas dados reais da API — sem fallback demo
    const s = Array.isArray(subjects) ? subjects : [];
    const e = Array.isArray(sessions) ? sessions : [];

    renderStats(s, e);
    renderSubjects(s);
    renderSessions(e);
    buildCharts(s, e);

  } catch (err) {
    console.error('Dashboard error:', err);
    // Em caso de erro de rede, mostra tela vazia (não dados fictícios)
    renderStats([], []);
    renderSubjects([]);
    renderSessions([]);
    buildCharts([], []);
    if (typeof Toast !== 'undefined') Toast.error('Erro ao carregar dados.');
  }
}

/* rebuilda charts ao trocar tema */
document.documentElement.addEventListener && (() => {
  const obs = new MutationObserver(() => {
    if (Object.keys(_charts).length) {
      // Relê os dados atuais dos arrays já carregados, sem reinventar dados
      // Os charts serão rebuiltados com arrays vazios se não houver dados
      buildCharts([], []);
    }
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
})();

init();