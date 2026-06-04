/* flashcards.js — depende de api.js + utils.js */

Utils.requireAuth();

const user = Utils.getUser();
if (Utils.$('#user-info')) {
  Utils.$('#user-info').innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP — Nível ${user.level ?? 1}</span>
  `;
}

function logout() { Utils.logout(); }

/* ══════════════════════════════════════════════
   MARKDOWN-LIGHT PARSER
══════════════════════════════════════════════ */
function parseContent(raw) {
  if (!raw) return '';
  raw = raw.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const highlighted = (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang))
      ? hljs.highlight(code, { language: lang }).value : escaped;
    return `<pre class="fc-code-block"><code>${highlighted}</code></pre>`;
  });
  raw = raw.replace(/`([^`]+)`/g, '<code>$1</code>');
  raw = raw.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  raw = raw.replace(/_(.+?)_/g, '<em>$1</em>');
  raw = raw.split('\n').map(line => {
    if (line.startsWith('- ') || line.startsWith('• ')) return `<li>${line.slice(2)}</li>`;
    return line ? `<p>${line}</p>` : '';
  }).join('');
  raw = raw.replace(/(<li>.*?<\/li>)+/gs, match => `<ul>${match}</ul>`);
  return raw;
}

/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
let allCards     = [];
let dueCards     = [];
let subjects     = [];
let filtered     = [];
let activeFilter = 'all';

// edit
let editingId    = null;

// study
let studyQueue   = [];
let studyIdx     = 0;
let studyFlipped = false;
let studyReviewed= 0;

/* ══════════════════════════════════════════════
   LOAD
══════════════════════════════════════════════ */
async function load() {
  try {
    const [cards, subs] = await Promise.all([Api.getFlashcards(), Api.getSubjects()]);
    allCards = cards;
    subjects = subs;
    const now = new Date();
    dueCards  = cards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    renderSummary();
    renderDueAlert();
    renderSubjectChips();
    renderSubjectSelect();
    renderEditSubjectSelect();
    applyFilter();
    const btnAll = Utils.$('#btn-study-all');
    if (btnAll && allCards.length) btnAll.style.display = '';
  } catch (err) {
    console.error(err);
    renderGrid([]);
    Toast.error('Erro ao carregar flashcards.');
  }
}

/* ── Summary ── */
function renderSummary() {
  Utils.setText('#stat-total', allCards.length);
  Utils.setText('#stat-due',   dueCards.length);
  const mastered = allCards.filter(c => (c.repetitions ?? 0) >= 3 && (c.easeFactor ?? 2.5) >= 2.5).length;
  Utils.setText('#stat-mastered', mastered);
  const maxRep = allCards.reduce((m, c) => Math.max(m, c.repetitions ?? 0), 0);
  Utils.setText('#stat-streak', maxRep);
}

/* ── Due alert ── */
function renderDueAlert() {
  const el = Utils.$('#due-alert');
  if (!el) return;
  if (dueCards.length > 0) {
    el.classList.remove('hidden');
    Utils.setText('#due-alert-title', `${dueCards.length} card${dueCards.length !== 1 ? 's' : ''} para revisar hoje`);
    Utils.setText('#due-alert-sub', 'Revise agora para não perder o ritmo de aprendizado.');
  } else {
    el.classList.add('hidden');
  }
}

/* ── Subject chips ── */
function renderSubjectChips() {
  const wrap = Utils.$('#subject-chips');
  if (!wrap) return;
  const seen = new Map();
  allCards.forEach(c => {
    if (!seen.has(c.subjectId))
      seen.set(c.subjectId, { id: c.subjectId, name: c.subjectName, color: c.subjectColor, icon: c.subjectIcon });
  });
  wrap.innerHTML = [...seen.values()].map(s =>
    `<button class="fc-chip" onclick="setFilter('sub-${s.id}', this)">
       <span class="fc-chip-dot" style="background:${s.color || 'var(--primary)'}"></span>
       ${s.icon || ''} ${Utils.escapeHtml(s.name)}
     </button>`
  ).join('');
}

/* ── Subject select (create modal) ── */
function renderSubjectSelect() {
  const sel = Utils.$('#fc-subject-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
    subjects.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`).join('');
}

/* ── Subject select (edit modal) ── */
function renderEditSubjectSelect() {
  const sel = Utils.$('#edit-subject-sel');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
    subjects.map(s => `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`).join('');
}

/* ══════════════════════════════════════════════
   FILTER
══════════════════════════════════════════════ */
function setFilter(filter, el) {
  activeFilter = filter;
  document.querySelectorAll('.fc-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  applyFilter();
}

function applyFilter() {
  const now = new Date();
  if (activeFilter === 'all')           filtered = [...allCards];
  else if (activeFilter === 'due')      filtered = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
  else if (activeFilter === 'new')      filtered = allCards.filter(c => (c.repetitions ?? 0) === 0);
  else if (activeFilter === 'mastered') filtered = allCards.filter(c => (c.repetitions ?? 0) >= 3 && (c.easeFactor ?? 2.5) >= 2.5);
  else if (activeFilter.startsWith('sub-')) {
    const id = parseInt(activeFilter.replace('sub-', ''));
    filtered = allCards.filter(c => c.subjectId === id);
  }
  renderGrid(filtered);
}

/* ══════════════════════════════════════════════
   GRID
══════════════════════════════════════════════ */
function renderGrid(cards) {
  const grid = Utils.$('#fc-grid');
  if (!grid) return;
  if (!cards.length) {
    grid.innerHTML = `
      <div class="fc-empty">
        <div class="fc-empty-emoji">🃏</div>
        <h3>Nenhum card aqui</h3>
        <p>Crie seu primeiro flashcard clicando em "+ Novo card".</p>
      </div>`;
    return;
  }
  const now = new Date();
  grid.innerHTML = cards.map(c => {
    const color    = c.subjectColor || 'var(--primary)';
    const icon     = c.subjectIcon  || '📚';
    const subName  = Utils.escapeHtml(c.subjectName || '');
    const isDue    = !c.nextReviewAt || new Date(c.nextReviewAt) <= now;
    const isNew    = (c.repetitions ?? 0) === 0;
    const mastered = (c.repetitions ?? 0) >= 3 && (c.easeFactor ?? 2.5) >= 2.5;
    const interval = c.intervalDays != null ? `📅 +${c.intervalDays}d` : '✨ novo';
    const qPreview = Utils.escapeHtml(c.question).slice(0, 120) + (c.question.length > 120 ? '…' : '');
    const badge = isNew ? '<span class="fc-badge fc-badge-new">novo</span>'
                : mastered ? '<span class="fc-badge fc-badge-mastered">dominado</span>'
                : isDue ? '<span class="fc-badge fc-badge-due">revisar</span>' : '';
    return `
      <div class="fc-card" id="fc-${c.id}">
        <div class="fc-card-stripe" style="background:${color}"></div>
        <div class="fc-card-body">
          <div class="fc-card-meta">
            <div class="fc-card-subject" style="color:${color}">
              <div class="fc-card-subject-icon" style="background:${color}22">${icon}</div>
              ${subName}
            </div>
            <div class="fc-card-badges">${badge}</div>
          </div>
          <p class="fc-card-question">${qPreview}</p>
          <div class="fc-card-footer">
            <span class="fc-card-interval">${interval}</span>
            <div class="fc-card-actions">
              <button class="fc-icon-btn" title="Estudar" onclick="startStudy('single',${c.id})">▶</button>
              <button class="fc-icon-btn edit" title="Editar" onclick="openEdit(${c.id})">✏️</button>
              <button class="fc-icon-btn danger" title="Apagar" onclick="deleteCard(${c.id})">✕</button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   DELETE
══════════════════════════════════════════════ */
async function deleteCard(id) {
  if (!confirm('Apagar este flashcard?')) return;
  try {
    await Api.deleteFlashcard(id);
    allCards = allCards.filter(c => c.id !== id);
    dueCards = dueCards.filter(c => c.id !== id);
    renderSummary(); renderDueAlert(); renderSubjectChips(); applyFilter();
    Toast.success('Flashcard apagado!');
  } catch (err) {
    Toast.error('Erro ao apagar.');
  }
}

/* ══════════════════════════════════════════════
   CREATE MODAL
══════════════════════════════════════════════ */
function openCreate() {
  Utils.$('#fc-err').textContent           = '';
  Utils.$('#fc-question-input').value      = '';
  Utils.$('#fc-answer-input').value        = '';
  Utils.$('#fc-subject-sel').value         = '';
  Utils.$('#preview-q-wrap').style.display = 'none';
  Utils.$('#preview-a-wrap').style.display = 'none';
  Utils.$('#create-modal').classList.add('open');
}

function closeCreate() {
  Utils.$('#create-modal').classList.remove('open');
}

function updatePreview(which) {
  const inputId   = which === 'q' ? '#fc-question-input' : '#fc-answer-input';
  const previewId = which === 'q' ? '#preview-q'         : '#preview-a';
  const wrapId    = which === 'q' ? '#preview-q-wrap'    : '#preview-a-wrap';
  const val = Utils.$(inputId).value;
  const wrap = Utils.$(wrapId);
  if (!val.trim()) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  Utils.$(previewId).innerHTML = parseContent(val);
}

async function createCard() {
  const subjectId = parseInt(Utils.$('#fc-subject-sel').value);
  const question  = Utils.$('#fc-question-input').value.trim();
  const answer    = Utils.$('#fc-answer-input').value.trim();
  const errEl     = Utils.$('#fc-err');
  if (!subjectId) { errEl.textContent = 'Selecione uma matéria.'; return; }
  if (!question)  { errEl.textContent = 'Pergunta obrigatória.';  return; }
  if (!answer)    { errEl.textContent = 'Resposta obrigatória.';  return; }
  errEl.textContent = '';
  try {
    const created = await Api.createFlashcard({ subjectId, question, answer });
    allCards.push(created);
    const now = new Date();
    dueCards  = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    renderSummary(); renderDueAlert(); renderSubjectChips(); renderSubjectSelect(); applyFilter();
    closeCreate();
    Toast.success('Flashcard criado!');
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao criar flashcard.';
  }
}

/* ══════════════════════════════════════════════
   EDIT MODAL
══════════════════════════════════════════════ */
function openEdit(id) {
  const card = allCards.find(c => c.id === id);
  if (!card) return;
  editingId = id;

  Utils.$('#edit-err').textContent              = '';
  Utils.$('#edit-subject-sel').value            = card.subjectId || '';
  Utils.$('#edit-question-input').value         = card.question  || '';
  Utils.$('#edit-answer-input').value           = card.answer    || '';
  Utils.$('#edit-preview-q-wrap').style.display = 'none';
  Utils.$('#edit-preview-a-wrap').style.display = 'none';

  Utils.$('#edit-modal').classList.add('open');
}

function closeEdit() {
  Utils.$('#edit-modal').classList.remove('open');
  editingId = null;
}

function updateEditPreview(which) {
  const inputId   = which === 'q' ? '#edit-question-input'  : '#edit-answer-input';
  const previewId = which === 'q' ? '#edit-preview-q'       : '#edit-preview-a';
  const wrapId    = which === 'q' ? '#edit-preview-q-wrap'  : '#edit-preview-a-wrap';
  const val = Utils.$(inputId).value;
  const wrap = Utils.$(wrapId);
  if (!val.trim()) { wrap.style.display = 'none'; return; }
  wrap.style.display = '';
  Utils.$(previewId).innerHTML = parseContent(val);
}

async function saveEdit() {
  if (!editingId) return;
  const subjectId = parseInt(Utils.$('#edit-subject-sel').value);
  const question  = Utils.$('#edit-question-input').value.trim();
  const answer    = Utils.$('#edit-answer-input').value.trim();
  const errEl     = Utils.$('#edit-err');
  if (!subjectId) { errEl.textContent = 'Selecione uma matéria.'; return; }
  if (!question)  { errEl.textContent = 'Pergunta obrigatória.';  return; }
  if (!answer)    { errEl.textContent = 'Resposta obrigatória.';  return; }
  errEl.textContent = '';
  try {
    const updated = await Api.updateFlashcard(editingId, { subjectId, question, answer });
    const i = allCards.findIndex(c => c.id === editingId);
    if (i !== -1) allCards[i] = updated;
    const now = new Date();
    dueCards  = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
    renderSummary(); renderDueAlert(); renderSubjectChips(); applyFilter();
    closeEdit();
    Toast.success('Flashcard atualizado!');
  } catch (err) {
    errEl.textContent = err.message || 'Erro ao salvar alterações.';
  }
}

/* ══════════════════════════════════════════════
   STUDY MODE
══════════════════════════════════════════════ */
function startStudy(mode, singleId) {
  if (mode === 'due')         studyQueue = [...dueCards];
  else if (mode === 'single') studyQueue = allCards.filter(c => c.id === singleId);
  else                        studyQueue = [...filtered];
  if (!studyQueue.length) { Toast.error('Nenhum card para estudar.'); return; }
  studyIdx = 0; studyFlipped = false; studyReviewed = 0;
  const overlay = Utils.$('#fc-study');
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  Utils.$('#study-title').textContent =
    mode === 'due' ? 'Revisão do dia' : mode === 'single' ? 'Estudar card' : 'Estudo livre';
  Utils.$('#study-done').classList.remove('visible');
  Utils.$('#study-main').style.display = '';
  showStudyCard();
}

function showStudyCard() {
  const card = studyQueue[studyIdx];
  studyFlipped = false;
  Utils.$('#study-flip').classList.remove('flipped');
  Utils.$('#study-actions').classList.add('hidden');
  const color = card.subjectColor || 'var(--primary)';
  Utils.$('#study-subject-front').innerHTML =
    `<span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block"></span>
     <span style="color:${color};font-weight:800;font-size:12px">${Utils.escapeHtml(card.subjectName || '')}</span>`;
  Utils.$('#study-question').innerHTML = parseContent(card.question);
  Utils.$('#study-answer').innerHTML   = parseContent(card.answer);
  Utils.$('#study-question').querySelectorAll('pre code').forEach(b => hljs && hljs.highlightElement(b));
  Utils.$('#study-answer').querySelectorAll('pre code').forEach(b => hljs && hljs.highlightElement(b));
  const pct = (studyIdx / studyQueue.length) * 100;
  Utils.$('#study-progress').style.width = `${pct}%`;
  Utils.$('#study-counter').textContent  = `${studyIdx + 1} / ${studyQueue.length}`;
}

function flipCard() {
  if (studyFlipped) return;
  studyFlipped = true;
  Utils.$('#study-flip').classList.add('flipped');
  setTimeout(() => Utils.$('#study-actions').classList.remove('hidden'), 320);
}

async function submitReview(quality) {
  const card = studyQueue[studyIdx];
  try {
    const updated = await Api.reviewFlashcard(card.id, quality);
    const i = allCards.findIndex(c => c.id === card.id);
    if (i !== -1) allCards[i] = updated;
    studyReviewed++;
  } catch (err) { console.error('Erro ao revisar:', err); }
  studyIdx++;
  if (studyIdx >= studyQueue.length) finishStudy();
  else showStudyCard();
}

function finishStudy() {
  Utils.$('#study-main').style.display = 'none';
  Utils.$('#study-progress').style.width = '100%';
  Utils.$('#study-done-sub').textContent =
    `Você revisou ${studyReviewed} card${studyReviewed !== 1 ? 's' : ''}. Continue assim! 💪`;
  Utils.$('#study-done').classList.add('visible');
  const now = new Date();
  dueCards  = allCards.filter(c => !c.nextReviewAt || new Date(c.nextReviewAt) <= now);
  renderSummary(); renderDueAlert(); applyFilter();
}

function closeStudy() {
  Utils.$('#fc-study').classList.remove('open');
  Utils.$('#study-main').style.display = '';
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
load();