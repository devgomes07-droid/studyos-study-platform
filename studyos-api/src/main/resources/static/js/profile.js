/* ── Auth / utils ───────────────────────────────────────── */
function logout() { Api.clearSession(); window.location.href = '../index.html'; }
function getUser() { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } }
function guardAuth() { if (!Api.token) { window.location.href = '../index.html'; return false; } return true; }

/* ── Levels ─────────────────────────────────────────────── */
const LEVELS = [
    { level:1,  xpMin:0,     xpMax:500,   rank:'🥉 Iniciante' },
    { level:2,  xpMin:500,   xpMax:1200,  rank:'🥈 Aprendiz'  },
    { level:3,  xpMin:1200,  xpMax:2500,  rank:'🥇 Estudante' },
    { level:4,  xpMin:2500,  xpMax:5000,  rank:'💎 Dedicado'  },
    { level:5,  xpMin:5000,  xpMax:10000, rank:'🏆 Mestre'    },
    { level:6,  xpMin:10000, xpMax:99999, rank:'⭐ Lendário'  },
];
function getLevelInfo(xp) {
    const info = [...LEVELS].reverse().find(l => xp >= l.xpMin) || LEVELS[0];
    const pct  = Math.min(100, Math.round(((xp - info.xpMin) / (info.xpMax - info.xpMin)) * 100));
    return { ...info, pct };
}

/* ── Badges (32 conquistas) ─────────────────────────────── */
const ALL_BADGES = [
    { id:'first_session',    icon:'🎯', name:'Primeira Sessão',     desc:'Complete sua 1ª sessão'         },
    { id:'5_sessions',       icon:'📘', name:'Aquecendo',           desc:'Complete 5 sessões'              },
    { id:'10_sessions',      icon:'⚡', name:'Em Ritmo',            desc:'Complete 10 sessões'             },
    { id:'25_sessions',      icon:'🔋', name:'Sem Parar',           desc:'Complete 25 sessões'             },
    { id:'50_sessions',      icon:'💪', name:'Meio Centenário',     desc:'Complete 50 sessões'             },
    { id:'100_sessions',     icon:'🏟️', name:'Centenário',          desc:'Complete 100 sessões'            },
    { id:'streak_3',         icon:'🔥', name:'Faísca',              desc:'3 dias consecutivos'             },
    { id:'streak_7',         icon:'🔥', name:'Semana de Fogo',      desc:'7 dias consecutivos'             },
    { id:'streak_14',        icon:'🌋', name:'Duas Semanas',        desc:'14 dias consecutivos'            },
    { id:'streak_30',        icon:'🌟', name:'Mês Imparável',       desc:'30 dias consecutivos'            },
    { id:'streak_60',        icon:'☄️', name:'Dois Meses',          desc:'60 dias consecutivos'            },
    { id:'streak_100',       icon:'💥', name:'100 Dias',            desc:'100 dias consecutivos'           },
    { id:'5h_studied',       icon:'⏱️', name:'Primeiras Horas',     desc:'Estude 5h no total'              },
    { id:'10h_studied',      icon:'📚', name:'Dez Horas',           desc:'Estude 10h no total'             },
    { id:'25h_studied',      icon:'📖', name:'Estudante Sério',     desc:'Estude 25h no total'             },
    { id:'50h_studied',      icon:'🎓', name:'Meio Centenário',     desc:'Estude 50h no total'             },
    { id:'100h_studied',     icon:'🏆', name:'Cem Horas',           desc:'Estude 100h no total'            },
    { id:'200h_studied',     icon:'🌠', name:'Mestre do Tempo',     desc:'Estude 200h no total'            },
    { id:'first_flashcard',  icon:'🃏', name:'Primeiro Card',       desc:'Crie seu 1º flashcard'           },
    { id:'10_flashcards',    icon:'🃏', name:'Baralho Pequeno',     desc:'Crie 10 flashcards'              },
    { id:'20_flashcards',    icon:'🃏', name:'Colecionador',        desc:'Crie 20 flashcards'              },
    { id:'50_flashcards',    icon:'🗂️', name:'Arquivo Vivo',        desc:'Crie 50 flashcards'              },
    { id:'100_flashcards',   icon:'📦', name:'Biblioteca Pessoal',  desc:'Crie 100 flashcards'             },
    { id:'level_3',          icon:'🥇', name:'Nível 3',             desc:'Alcance o nível 3'               },
    { id:'level_5',          icon:'🏆', name:'Nível 5',             desc:'Alcance o nível 5'               },
    { id:'level_10',         icon:'💎', name:'Nível 10',            desc:'Alcance o nível 10'              },
    { id:'perfect_session',  icon:'✨', name:'Sessão Perfeita',     desc:'Conclua uma sessão sem pausas'   },
    { id:'5_perfect',        icon:'🌈', name:'Cinco Perfeitas',     desc:'5 sessões perfeitas'             },
    { id:'night_owl',        icon:'🦉', name:'Coruja',              desc:'Estude após meia-noite'          },
    { id:'early_bird',       icon:'🌅', name:'Madrugador',          desc:'Estude antes das 6h'             },
    { id:'all_methods',      icon:'🗺️', name:'Explorador',          desc:'Use todos os métodos de estudo'  },
    { id:'multi_subject',    icon:'🎨', name:'Multidisciplinar',    desc:'Estude 5 matérias diferentes'    },
];

const BADGE_MAP = Object.fromEntries(ALL_BADGES.map(b => [b.id, b]));
const BADGES_INITIAL = 8; // quantas mostrar por padrão

/* ── Toast ──────────────────────────────────────────────── */
const NOTIFIED_KEY = 'studyos-notified-badges';
function getNotified() { try { return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY)||'[]')); } catch { return new Set(); } }
function markNotified(id) { const s=getNotified(); s.add(id); localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...s])); }

function showBadgeToast(badge) {
    let c = document.getElementById('badge-toast-container');
    if (!c) { c = document.createElement('div'); c.id='badge-toast-container'; document.body.appendChild(c); }
    const t = document.createElement('div');
    t.className = 'badge-toast';
    t.innerHTML = `<span class="badge-toast-icon">${badge.icon}</span>
        <div class="badge-toast-info">
            <p class="badge-toast-title">🏅 Conquista desbloqueada!</p>
            <p class="badge-toast-name">${badge.name}</p>
        </div>`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 4000);
}

function notifyNewBadges(ids) {
    const notified = getNotified();
    ids.filter(id => !notified.has(id)).forEach((id, i) => {
        const badge = BADGE_MAP[id]; if (!badge) return;
        setTimeout(() => { showBadgeToast(badge); markNotified(id); }, i * 700);
    });
}

/* ── Render helpers ─────────────────────────────────────── */
const set = (id, val) => { const el=document.getElementById(id); if(el) el.textContent=val; };

function renderAvatar(name) {
    const el = document.getElementById('profile-avatar');
    if (el) el.textContent = (name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
}

function renderHero(user) {
    set('profile-name',  user.name  || 'Usuário');
    set('profile-email', user.email || '');
    renderAvatar(user.name);
    if (user.createdAt) {
        const since = new Date(user.createdAt).toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
        set('profile-member-since', `📅 Desde ${since}`);
    }
    const n = document.getElementById('edit-name');  if(n) n.value  = user.name  || '';
    const e = document.getElementById('edit-email'); if(e) e.value = user.email || '';
}

function renderXP(xp) {
    const info = getLevelInfo(xp);
    set('xp-level',            info.level);
    set('xp-current',          xp.toLocaleString('pt-BR'));
    set('xp-next',             info.xpMax.toLocaleString('pt-BR'));
    set('profile-level-badge', info.level);
    set('profile-rank',        info.rank);
    set('xp-msg',              `Faltam ${(info.xpMax-xp).toLocaleString('pt-BR')} XP para o próximo nível`);
    set('stat-xp',             xp.toLocaleString('pt-BR'));
    const bar = document.getElementById('xp-bar-fill');
    if (bar) bar.style.width = info.pct + '%';
}

function renderOverall(user) {
    set('overall-number', user.overall ?? 0);
    const skills = [
        { label:'🔥 Consistência',  val: user.skillConsistency   ?? 1 },
        { label:'📚 Sessões',        val: user.skillSessions      ?? 1 },
        { label:'⏱️ Horas',          val: user.skillHours         ?? 1 },
        { label:'🗂️ Flashcards',     val: user.skillFlashcards    ?? 1 },
        { label:'🎯 Produtividade',  val: user.skillProductivity  ?? 1 },
        { label:'🎯 Foco',           val: user.skillFocus         ?? 1 },
        { label:'🌙 Madrugador',     val: user.skillNightOwl      ?? 1 },
        { label:'🧘 Disciplina',     val: user.skillDiscipline    ?? 1 },
        { label:'💎 Perfeccionista', val: user.skillPerfectionist ?? 1 },
        { label:'🗺️ Explorador',     val: user.skillExplorer      ?? 1 },
    ];
    const container = document.getElementById('overall-skills');
    if (!container) return;
    container.innerHTML = skills.map(s => {
        const stars = Array.from({length:5},(_,i) =>
            `<span class="skill-star ${i < s.val ? 'filled':''}">★</span>`).join('');
        return `<div class="skill-row">
            <span class="skill-name">${s.label}</span>
            <div class="skill-stars">${stars}</div>
        </div>`;
    }).join('');
}

function renderStats(stats) {
    const h = Math.floor((stats.totalMinutes||0)/60);
    const m = (stats.totalMinutes||0)%60;
    set('stat-streak',     stats.streak     || 0);
    set('stat-hours',      m > 0 ? `${h}h ${m}m` : `${h}h`);
    set('stat-sessions',   stats.sessions   || 0);
    set('stat-subjects',   stats.subjects   || 0);
    set('stat-flashcards', stats.flashcards || 0);
}

/* ── Badges com Ver mais / Ver menos ────────────────────── */
function renderBadges(unlockedIds) {
    const grid = document.getElementById('badges-grid');
    if (!grid) return;

    const idSet = new Set(unlockedIds);
    let count = 0;

    const cards = ALL_BADGES.map((b, i) => {
        const ok = idSet.has(b.id);
        if (ok) count++;
        const hidden = i >= BADGES_INITIAL ? 'badge-hidden' : '';
        return `<div class="badge-card ${ok ? 'unlocked' : 'locked'} ${hidden}" data-badge-index="${i}">
            <span class="badge-icon">${b.icon}</span>
            <p class="badge-name">${b.name}</p>
            <p class="badge-desc">${b.desc}</p>
        </div>`;
    }).join('');

    const remaining = ALL_BADGES.length - BADGES_INITIAL;

    grid.innerHTML = cards + `
        <div class="badges-show-more">
            <button class="btn-show-more" id="btn-badges-toggle" onclick="toggleBadges()">
                Ver mais <span class="arrow">▼</span> <span id="badges-remaining">(+${remaining})</span>
            </button>
        </div>`;

    set('badges-count', `${count} de ${ALL_BADGES.length} desbloqueadas`);
}

function toggleBadges() {
    const btn = document.getElementById('btn-badges-toggle');
    const hidden = document.querySelectorAll('.badge-hidden');
    const expanded = btn.classList.contains('expanded');

    if (expanded) {
        document.querySelectorAll('[data-badge-index]').forEach(el => {
            const i = parseInt(el.dataset.badgeIndex);
            if (i >= BADGES_INITIAL) el.classList.add('badge-hidden');
        });
        btn.classList.remove('expanded');
        btn.innerHTML = `Ver mais <span class="arrow">▼</span> <span id="badges-remaining">(+${ALL_BADGES.length - BADGES_INITIAL})</span>`;
    } else {
        document.querySelectorAll('[data-badge-index]').forEach(el => {
            el.classList.remove('badge-hidden');
        });
        btn.classList.add('expanded');
        btn.innerHTML = `Ver menos <span class="arrow">▼</span>`;
    }
}

/* ── Atividade com Ver mais / Ver menos ─────────────────── */
const ACTIVITY_INITIAL = 4;

function renderActivity(sessions) {
    const list = document.getElementById('activity-list');
    if (!list) return;

    if (!sessions?.length) {
        list.innerHTML = '<div class="empty-state">Nenhuma atividade ainda. Comece a estudar! 🚀</div>';
        return;
    }

    const ICONS = { POMODORO:'🍅', FEYNMAN:'🧠', ACTIVE_RECALL:'🎯', SPACED_REPETITION:'🔁', CORNELL_NOTES:'📝', FLOW_STATE:'🌊', FLASHCARDS:'🃏' };

    const items = sessions.slice(0, 20).map((s, i) => {
        const icon  = ICONS[s.studyMethod] || '📚';
        const date  = new Date(s.endedAt || s.startedAt);
        const label = date.toLocaleDateString('pt-BR', { day:'2-digit', month:'short' });
        const dur   = s.durationMinutes
            ? (s.durationMinutes >= 60 ? `${Math.floor(s.durationMinutes/60)}h ${s.durationMinutes%60}m` : `${s.durationMinutes}min`)
            : '—';
        const hidden = i >= ACTIVITY_INITIAL ? 'activity-hidden' : '';
        return `<div class="activity-item ${hidden}" data-activity-index="${i}">
            <span class="activity-icon">${icon}</span>
            <div class="activity-info">
                <p class="activity-title">${s.subjectName || 'Sessão de estudo'}</p>
                <p class="activity-sub">${s.studyMethod || 'Livre'} · ${dur}</p>
            </div>
            <div class="activity-meta">
                <span class="activity-xp">+${s.xpEarned || 0} XP</span>
                <span class="activity-date">${label}</span>
            </div>
        </div>`;
    }).join('');

    const remaining = Math.min(sessions.length, 20) - ACTIVITY_INITIAL;
    const showMoreBtn = remaining > 0 ? `
        <div class="activity-show-more">
            <button class="btn-show-more" id="btn-activity-toggle" onclick="toggleActivity()">
                Ver mais <span class="arrow">▼</span> <span>(+${remaining})</span>
            </button>
        </div>` : '';

    list.innerHTML = items + showMoreBtn;
}

function toggleActivity() {
    const btn = document.getElementById('btn-activity-toggle');
    const expanded = btn.classList.contains('expanded');

    if (expanded) {
        document.querySelectorAll('[data-activity-index]').forEach(el => {
            const i = parseInt(el.dataset.activityIndex);
            if (i >= ACTIVITY_INITIAL) el.classList.add('activity-hidden');
        });
        btn.classList.remove('expanded');
        const total = document.querySelectorAll('[data-activity-index]').length;
        btn.innerHTML = `Ver mais <span class="arrow">▼</span> <span>(+${total - ACTIVITY_INITIAL})</span>`;
    } else {
        document.querySelectorAll('[data-activity-index]').forEach(el => {
            el.classList.remove('activity-hidden');
        });
        btn.classList.add('expanded');
        btn.innerHTML = `Ver menos <span class="arrow">▼</span>`;
    }
}

/* ── Load ───────────────────────────────────────────────── */
async function loadProfile() {
    if (!guardAuth()) return;
    const user = getUser();
    renderHero(user);
    renderXP(user.xp || 0);
    renderOverall(user);
    set('user-info', user.name || 'Usuário');

    try {
        const [sessionsRes, subjectsRes, flashcardsRes, badgesRes] = await Promise.allSettled([
            Api.getSessions(), Api.getSubjects(), Api.getFlashcards(), Api.get('/badges'),
        ]);
        const sessions   = sessionsRes.status   === 'fulfilled' ? (sessionsRes.value   || []) : [];
        const subjects   = subjectsRes.status   === 'fulfilled' ? (subjectsRes.value   || []) : [];
        const flashcards = flashcardsRes.status === 'fulfilled' ? (flashcardsRes.value || []) : [];
        const badges     = badgesRes.status     === 'fulfilled' ? (badgesRes.value     || []) : [];

        renderStats({
            sessions:     sessions.length,
            totalMinutes: sessions.reduce((a,s) => a+(s.durationMinutes||0), 0),
            subjects:     subjects.length,
            flashcards:   flashcards.length,
            streak:       user.currentStreak || 0,
        });
        renderXP(user.xp || 0);
        const unlockedIds = badges.map(b => b.badgeId);
        renderBadges(unlockedIds);
        notifyNewBadges(unlockedIds);
        renderActivity(sessions);
    } catch(err) { console.warn('Erro ao carregar perfil:', err); }
}

/* ── Modal ──────────────────────────────────────────────── */
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
    msg.className = 'form-msg'; msg.textContent = '';
    if (!name||!email)       { msg.textContent='Nome e email são obrigatórios.'; return; }
    if (pw && pw.length < 6) { msg.textContent='Senha deve ter pelo menos 6 caracteres.'; return; }
    if (pw && pw !== pwConf) { msg.textContent='As senhas não coincidem.'; return; }
    const payload = { name, email };
    if (pw) payload.password = pw;
    try {
        const btn = document.querySelector('.modal-footer .btn-primary');
        btn.textContent='Salvando...'; btn.disabled=true;
        const updated = await Api.put('/users/me', payload);
        Api.setSession({ ...getUser(), ...updated });
        renderHero(updated);
        set('user-info', updated.name);
        msg.className='form-msg success'; msg.textContent='✓ Perfil atualizado!';
        setTimeout(() => document.getElementById('edit-modal').classList.remove('open'), 1200);
    } catch(err) {
        msg.textContent = err.message || 'Erro ao salvar.';
    } finally {
        const btn = document.querySelector('.modal-footer .btn-primary');
        if (btn) { btn.textContent='Salvar'; btn.disabled=false; }
    }
}

document.addEventListener('keydown', e => {
    if (e.key==='Escape') document.getElementById('edit-modal')?.classList.remove('open');
});

loadProfile();