/* ── Utilitários locais ─────────────────────────────────── */
function logout() {
    Api.clearSession();
    window.location.href = '../index.html';
}

function getUser() {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
}

function guardAuth() {
    if (!Api.token) { window.location.href = '../index.html'; return false; }
    return true;
}

/* ── Definição dos badges ───────────────────────────────── */
const ALL_BADGES = [
    { id: 'first_session',   icon: '🎯', name: 'Primeira sessão',   desc: 'Complete sua 1ª sessão'    },
    { id: '10_sessions',     icon: '⚡', name: 'Dez sessões',        desc: 'Complete 10 sessões'        },
    { id: '50_sessions',     icon: '💪', name: 'Cinquenta sessões',  desc: 'Complete 50 sessões'        },
    { id: 'streak_3',        icon: '🔥', name: '3 dias seguidos',    desc: 'Sequência de 3 dias'        },
    { id: 'streak_7',        icon: '🔥', name: 'Semana de fogo',     desc: '7 dias consecutivos'        },
    { id: 'streak_30',       icon: '🌟', name: 'Mês imparável',      desc: '30 dias consecutivos'       },
    { id: '10h_studied',     icon: '📚', name: '10 horas estudadas', desc: 'Estude 10h no total'        },
    { id: '50h_studied',     icon: '🎓', name: '50 horas estudadas', desc: 'Estude 50h no total'        },
    { id: 'first_flashcard', icon: '🃏', name: 'Primeiro flashcard', desc: 'Crie seu 1º flashcard'      },
    { id: '20_flashcards',   icon: '🃏', name: 'Colecionador',       desc: 'Crie 20 flashcards'         },
    { id: 'level_3',         icon: '🥇', name: 'Nível 3',            desc: 'Alcance o nível 3'          },
    { id: 'level_5',         icon: '🏆', name: 'Mestre',             desc: 'Alcance o nível 5'          },
];

const BADGE_MAP = Object.fromEntries(ALL_BADGES.map(b => [b.id, b]));

/* ── Gamificação ────────────────────────────────────────── */
const LEVELS = [
    { level: 1,  xpMin: 0,     xpMax: 500,   rank: '🥉 Iniciante'  },
    { level: 2,  xpMin: 500,   xpMax: 1200,  rank: '🥈 Aprendiz'   },
    { level: 3,  xpMin: 1200,  xpMax: 2500,  rank: '🥇 Estudante'  },
    { level: 4,  xpMin: 2500,  xpMax: 5000,  rank: '💎 Dedicado'   },
    { level: 5,  xpMin: 5000,  xpMax: 10000, rank: '🏆 Mestre'     },
    { level: 6,  xpMin: 10000, xpMax: 99999, rank: '⭐ Lendário'   },
];

function getLevelInfo(xp) {
    const info = LEVELS.findLast(l => xp >= l.xpMin) || LEVELS[0];
    const pct  = Math.min(100, Math.round(((xp - info.xpMin) / (info.xpMax - info.xpMin)) * 100));
    return { ...info, pct };
}

/* ── Toast de conquista ─────────────────────────────────── */
const NOTIFIED_KEY = 'studyos-notified-badges';

function getNotified() {
    try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '[]')); }
    catch { return new Set(); }
}

function markNotified(badgeId) {
    const set = getNotified();
    set.add(badgeId);
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...set]));
}

function showBadgeToast(badge) {
    let container = document.getElementById('badge-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'badge-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'badge-toast';
    toast.innerHTML = `
        <span class="badge-toast-icon">${badge.icon}</span>
        <div class="badge-toast-info">
            <p class="badge-toast-title">🏅 Conquista desbloqueada!</p>
            <p class="badge-toast-name">${badge.name}</p>
        </div>
    `;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

function notifyNewBadges(unlockedIds) {
    const notified = getNotified();
    const toNotify = unlockedIds.filter(id => !notified.has(id));

    toNotify.forEach((id, i) => {
        const badge = BADGE_MAP[id];
        if (!badge) return;
        setTimeout(() => {
            showBadgeToast(badge);
            markNotified(id);
        }, i * 700);
    });
}

/* ── Renderização ───────────────────────────────────────── */
function renderAvatar(name) {
    const initials = (name || '?')
        .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('profile-avatar').textContent = initials;
}

function renderHero(user) {
    document.getElementById('profile-name').textContent  = user.name  || 'Usuário';
    document.getElementById('profile-email').textContent = user.email || '';
    renderAvatar(user.name);

    const since = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : null;
    if (since) document.getElementById('profile-member-since').textContent = `📅 Desde ${since}`;

    document.getElementById('edit-name').value  = user.name  || '';
    document.getElementById('edit-email').value = user.email || '';
}

function renderXP(xp) {
    const info = getLevelInfo(xp);
    document.getElementById('xp-level').textContent     = info.level;
    document.getElementById('xp-current').textContent   = xp.toLocaleString('pt-BR');
    document.getElementById('xp-next').textContent      = info.xpMax.toLocaleString('pt-BR');
    document.getElementById('xp-bar-fill').style.width  = info.pct + '%';
    document.getElementById('profile-level-badge').textContent = info.level;
    document.getElementById('profile-rank').textContent = info.rank;
    document.getElementById('xp-msg').textContent =
        `Faltam ${(info.xpMax - xp).toLocaleString('pt-BR')} XP para o próximo nível`;
    document.getElementById('stat-xp').textContent = xp.toLocaleString('pt-BR');
}

function renderStats(stats) {
    const hours = Math.floor((stats.totalMinutes || 0) / 60);
    const mins  = (stats.totalMinutes || 0) % 60;
    document.getElementById('stat-streak').textContent     = stats.streak     || 0;
    document.getElementById('stat-hours').textContent      = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    document.getElementById('stat-sessions').textContent   = stats.sessions   || 0;
    document.getElementById('stat-subjects').textContent   = stats.subjects   || 0;
    document.getElementById('stat-flashcards').textContent = stats.flashcards || 0;
}

function renderBadges(unlockedIds) {
    const grid  = document.getElementById('badges-grid');
    const idSet = new Set(unlockedIds);
    let count   = 0;

    grid.innerHTML = ALL_BADGES.map(b => {
        const unlocked = idSet.has(b.id);
        if (unlocked) count++;
        return `
        <div class="badge-card ${unlocked ? 'unlocked' : 'locked'}">
            <span class="badge-icon">${b.icon}</span>
            <p class="badge-name">${b.name}</p>
            <p class="badge-desc">${b.desc}</p>
        </div>`;
    }).join('');

    document.getElementById('badges-count').textContent = `${count} desbloqueadas`;
}

function renderActivity(sessions) {
    const list = document.getElementById('activity-list');

    if (!sessions || sessions.length === 0) {
        list.innerHTML = '<div class="empty-state">Nenhuma atividade ainda. Comece a estudar! 🚀</div>';
        return;
    }

    const ICONS = {
        POMODORO: '🍅', FEYNMAN: '🧠', ACTIVE_RECALL: '🎯',
        SPACED_REPETITION: '🔁', CORNELL_NOTES: '📝',
        FLOW_STATE: '🌊', FLASHCARDS: '🃏', DEFAULT: '📚'
    };

    list.innerHTML = sessions.slice(0, 10).map(s => {
        const icon      = ICONS[s.studyMethod] || ICONS.DEFAULT;
        const date      = new Date(s.endedAt || s.startedAt);
        const dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        const duration  = s.durationMinutes
            ? (s.durationMinutes >= 60
                ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m`
                : `${s.durationMinutes}min`)
            : '—';
        return `
        <div class="activity-item">
            <span class="activity-icon">${icon}</span>
            <div class="activity-info">
                <p class="activity-title">${s.subjectName || 'Sessão de estudo'}</p>
                <p class="activity-sub">${s.studyMethod || 'Livre'} · ${duration}</p>
            </div>
            <div class="activity-meta">
                <span class="activity-xp">+${s.xpEarned || 0} XP</span>
                <span class="activity-date">${dateLabel}</span>
            </div>
        </div>`;
    }).join('');
}

/* ── Carregamento de dados ──────────────────────────────── */
async function loadProfile() {
    if (!guardAuth()) return;

    const user = getUser();
    renderHero(user);
    renderXP(user.xp || 0);
    document.getElementById('user-info').textContent = user.name || 'Usuário';

    try {
        const [sessionsRes, subjectsRes, flashcardsRes, badgesRes] = await Promise.allSettled([
            Api.getSessions(),
            Api.getSubjects(),
            Api.getFlashcards(),
            Api.get('/badges'),
        ]);

        const sessions   = sessionsRes.status   === 'fulfilled' ? (sessionsRes.value   || []) : [];
        const subjects   = subjectsRes.status   === 'fulfilled' ? (subjectsRes.value   || []) : [];
        const flashcards = flashcardsRes.status === 'fulfilled' ? (flashcardsRes.value || []) : [];
        const badges     = badgesRes.status     === 'fulfilled' ? (badgesRes.value     || []) : [];

        const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

        renderStats({
            sessions:     sessions.length,
            totalMinutes,
            subjects:     subjects.length,
            flashcards:   flashcards.length,
            streak:       user.currentStreak || user.streak || 0,
        });

        renderXP(user.xp || 0);

        // Badges vêm do backend com badgeId e unlockedAt
        const unlockedIds = badges.map(b => b.badgeId);
        renderBadges(unlockedIds);

        // Toast para badges que o usuário ainda não viu
        notifyNewBadges(unlockedIds);

        renderActivity(sessions);

    } catch (err) {
        console.warn('Erro ao carregar perfil:', err);
    }
}

/* ── Modal de edição ────────────────────────────────────── */
function openEditModal() {
    document.getElementById('edit-modal').classList.add('open');
    document.getElementById('edit-msg').textContent = '';
    document.getElementById('edit-password').value = '';
    document.getElementById('edit-password-confirm').value = '';
}

function closeEditModal(event) {
    if (event && event.target !== document.getElementById('edit-modal')) return;
    document.getElementById('edit-modal').classList.remove('open');
}

async function saveProfile() {
    const msg    = document.getElementById('edit-msg');
    const name   = document.getElementById('edit-name').value.trim();
    const email  = document.getElementById('edit-email').value.trim();
    const pw     = document.getElementById('edit-password').value;
    const pwConf = document.getElementById('edit-password-confirm').value;

    msg.className   = 'form-msg';
    msg.textContent = '';

    if (!name || !email) { msg.textContent = 'Nome e email são obrigatórios.'; return; }
    if (pw && pw.length < 6) { msg.textContent = 'A senha deve ter pelo menos 6 caracteres.'; return; }
    if (pw && pw !== pwConf) { msg.textContent = 'As senhas não coincidem.'; return; }

    const payload = { name, email };
    if (pw) payload.password = pw;

    try {
        const btn = document.querySelector('.btn-primary');
        btn.textContent = 'Salvando...';
        btn.disabled    = true;

        const updated = await Api.put('/users/me', payload);
        Api.setSession({ ...getUser(), ...updated });

        renderHero(updated);
        document.getElementById('user-info').textContent = updated.name;

        msg.className   = 'form-msg success';
        msg.textContent = '✓ Perfil atualizado!';
        setTimeout(() => document.getElementById('edit-modal').classList.remove('open'), 1200);

    } catch (err) {
        msg.textContent = err.message || 'Erro ao salvar perfil.';
    } finally {
        const btn = document.querySelector('.btn-primary');
        btn.textContent = 'Salvar';
        btn.disabled    = false;
    }
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.getElementById('edit-modal').classList.remove('open');
});

/* ── Init ───────────────────────────────────────────────── */
loadProfile();