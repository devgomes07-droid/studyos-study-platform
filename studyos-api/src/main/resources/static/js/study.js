Utils.requireAuth();

/* ═══════════════════════════════════════════════
   ENRICHMENT — dados visuais e dicas por método
═══════════════════════════════════════════════ */
const METHOD_ENRICHMENT = {
  POMODORO: {
    category: 'timer',
    tip: '4 ciclos de 25 min com pausas. Ideal para foco intenso e tarefas longas.',
    action: 'Iniciar ciclos 🍅',
    needsSetup: false
  },
  FLOW_STATE: {
    category: 'timer',
    tip: 'Imersao total. Tela escura, sem interrupcoes, timer livre. So voce e o conteudo.',
    action: 'Entrar em flow 🌊',
    needsSetup: false
  },
  FIFTY_TWO_SEVENTEEN: {
    category: 'timer',
    tip: '52 min de foco profundo + 17 min de descanso real. Ciencia da produtividade.',
    action: 'Iniciar bloco ⚡',
    needsSetup: false
  },
  TIMEBOXING: {
    category: 'timer',
    tip: 'Defina um objetivo claro e um tempo fixo antes de comecar. Foco no entregavel.',
    action: 'Configurar sessao 📦',
    needsSetup: true,
    setupTitle: '📦 Configurar Timeboxing',
    setupFields: [
      { id: 'timebox-goal',     label: 'Qual e o objetivo desta sessao?',  type: 'text',   placeholder: 'Ex: Resolver 10 exercicios de calculo', required: true  },
      { id: 'timebox-duration', label: 'Quanto tempo voce tem? (minutos)', type: 'number', placeholder: '30', min: 5, max: 180, value: 30,        required: true  }
    ]
  },
  FEYNMAN: {
    category: 'escrita',
    tip: 'Explique o tema com suas palavras. Se nao consegue simplificar, ainda nao aprendeu.',
    action: 'Comecar explicacao ✍️',
    needsSetup: false
  },
  CORNELL_NOTES: {
    category: 'escrita',
    tip: 'Anote em colunas: perguntas, detalhes e resumo. Metodo da Cornell University.',
    action: 'Comecar anotacao 📝',
    needsSetup: false
  },
  GUIDED_READING: {
    category: 'escrita',
    tip: 'Leitura ativa com anotacoes guiadas. Processe, questione e conecte ideias.',
    action: 'Iniciar leitura 📖',
    needsSetup: false
  },
  ACTIVE_RECALL: {
    category: 'memoria',
    tip: 'Feche o material e escreva tudo que lembra. A dificuldade de lembrar consolida o aprendizado.',
    action: 'Testar memoria 🧠',
    needsSetup: false
  },
  FLASHCARDS: {
    category: 'memoria',
    tip: 'Revise seus cards com repeticao espacada. O algoritmo mostra o que voce esta esquecendo.',
    action: 'Revisar cards 🃏',
    needsSetup: false
  },
  QUESTIONS: {
    category: 'memoria',
    tip: 'Resolva questoes e registre acertos e erros. Descubra exatamente onde voce erra.',
    action: 'Resolver questoes ❓',
    needsSetup: false
  },
  FREE_REVIEW: {
    category: 'revisao',
    tip: 'Sessao livre para revisar o que ja estudou. Sem pressao, no seu ritmo.',
    action: 'Revisar conteudo 🔄',
    needsSetup: false
  },
  SPACED_REPETITION: {
    category: 'revisao',
    tip: 'Revisao nos intervalos certos: 1, 3, 7, 14 dias. Ciencia da memoria de longo prazo.',
    action: 'Iniciar revisao 📅',
    needsSetup: false
  }
};

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
let methods        = [];
let selectedMethod = null;
let activeCategory = 'all';

const user          = Utils.getUser();
const userInfo      = Utils.$('#user-info');
const methodsGrid   = Utils.$('#methods-grid');
const subjectSelect = Utils.$('#subject-select');
const startButton   = Utils.$('#start-method-btn');

/* ═══════════════════════════════════════════════
   USER INFO
═══════════════════════════════════════════════ */
if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP - Nivel ${user.level ?? 1}</span>
  `;
}

function logout() { Utils.logout(); }

/* ═══════════════════════════════════════════════
   ENRICH
═══════════════════════════════════════════════ */
function enrich(method) {
  const extra = METHOD_ENRICHMENT[method.id] || {
    category: 'timer', tip: method.description,
    action: 'Iniciar sessao', needsSetup: false
  };
  return { ...method, ...extra };
}

/* ═══════════════════════════════════════════════
   RENDER METHODS
═══════════════════════════════════════════════ */
function getCategoryLabel(cat) {
  return { timer:'⏱ Timer', escrita:'✍️ Escrita', memoria:'🧠 Memoria', revisao:'🔄 Revisao' }[cat] || '📚 Estudo';
}

function renderMethods() {
  const enriched = methods.map(enrich);
  const filtered = activeCategory === 'all'
    ? enriched
    : enriched.filter((m) => m.category === activeCategory);

  if (!filtered.length) {
    methodsGrid.innerHTML = `<div class="empty-state">Nenhum metodo nessa categoria.</div>`;
    return;
  }

  methodsGrid.innerHTML = filtered.map((method) => {
    const isSelected = selectedMethod?.id === method.id;
    return `
      <article
        class="method-card card${isSelected ? ' selected' : ''}"
        data-method-id="${method.id}"
        style="--method-color: ${method.color}"
        role="button" tabindex="0"
      >
        <div class="method-top">
          <span class="method-icon">${Utils.escapeHtml(method.icon)}</span>
          <span class="method-category-badge">${getCategoryLabel(method.category)}</span>
        </div>
        <h2 class="method-name">${Utils.escapeHtml(method.name)}</h2>
        <p class="method-desc">${Utils.escapeHtml(method.description)}</p>
        <p class="method-tip">${Utils.escapeHtml(method.tip)}</p>
        <div class="method-meta">
          <span>${Utils.escapeHtml(method.duration)}</span>
          <span>${Utils.escapeHtml(method.intensity)}</span>
          ${method.needsSetup ? '<span>⚙️ Requer configuracao</span>' : ''}
        </div>
        <button class="btn method-select-btn${isSelected ? ' selected-btn' : ''}" type="button">
          ${isSelected ? '✓ Selecionado' : 'Selecionar'}
        </button>
      </article>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════════
   FILTER TABS
═══════════════════════════════════════════════ */
Utils.$('#methods-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  activeCategory = btn.dataset.category;
  document.querySelectorAll('.filter-btn').forEach((b) =>
    b.classList.toggle('active', b === btn)
  );
  renderMethods();
});

/* ═══════════════════════════════════════════════
   SELECT METHOD
═══════════════════════════════════════════════ */
function selectMethod(methodId) {
  const raw = methods.find((m) => m.id === methodId);
  if (!raw) return;

  selectedMethod = enrich(raw);

  const icon = Utils.$('#selected-panel-icon');
  if (icon) icon.textContent = selectedMethod.icon;

  Utils.setText('#selected-method-name', selectedMethod.name);
  Utils.setText('#selected-method-tip',  selectedMethod.tip);
  Utils.setText('#start-method-btn',     selectedMethod.action);

  startButton.disabled = false;

  const panel = Utils.$('#selected-panel');
  if (panel) {
    panel.style.setProperty('--panel-color', selectedMethod.color);
    panel.classList.add('has-selection');
  }

  renderMethods();
  Toast.info(`Metodo "${selectedMethod.name}" selecionado.`, 2500);
}

/* ═══════════════════════════════════════════════
   SETUP MODAL (Timeboxing + futuros métodos)
═══════════════════════════════════════════════ */
function openSetupModal(method) {
  // Remove modal anterior se existir
  Utils.$('#setup-modal')?.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop open';
  modal.id = 'setup-modal';

  const fieldsHtml = method.setupFields.map((f) => `
    <label style="display:grid;gap:8px;font-weight:800;color:var(--text)">
      ${f.label}
      <input
        class="input"
        id="${f.id}"
        type="${f.type}"
        placeholder="${f.placeholder || ''}"
        ${f.min  !== undefined ? `min="${f.min}"`   : ''}
        ${f.max  !== undefined ? `max="${f.max}"`   : ''}
        ${f.value !== undefined ? `value="${f.value}"` : ''}
      />
    </label>
  `).join('');

  modal.innerHTML = `
    <section class="modal" style="display:grid;gap:18px">
      <header class="modal-header">
        <h2 style="margin:0;color:var(--text)">${method.setupTitle}</h2>
        <button class="icon-button" id="setup-close">✕</button>
      </header>
      ${fieldsHtml}
      <footer class="modal-actions">
        <button class="btn btn-secondary" id="setup-cancel">Cancelar</button>
        <button class="btn btn-primary"   id="setup-confirm">Iniciar sessao →</button>
      </footer>
    </section>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#setup-close').addEventListener('click',   closeSetupModal);
  modal.querySelector('#setup-cancel').addEventListener('click',  closeSetupModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeSetupModal(); });

  modal.querySelector('#setup-confirm').addEventListener('click', () => {
    const values = {};
    let valid = true;

    method.setupFields.forEach((f) => {
      const el  = Utils.$(`#${f.id}`);
      const val = el?.value?.trim();
      if (f.required && !val) {
        Toast.warning(`Preencha o campo: ${f.label}`);
        el?.focus();
        valid = false;
        return;
      }
      values[f.id] = f.type === 'number' ? Number(val) : val;
    });

    if (!valid) return;

    closeSetupModal();
    launchSession(values);
  });
}

function closeSetupModal() {
  const modal = Utils.$('#setup-modal');
  if (modal) modal.remove();
}

/* ═══════════════════════════════════════════════
   START SESSION
═══════════════════════════════════════════════ */
function startMethod() {
  if (!selectedMethod) {
    Toast.warning('Escolha um metodo de estudo primeiro.');
    return;
  }
  if (!subjectSelect.value) {
    Toast.warning('Selecione uma materia antes de iniciar a sessao.');
    return;
  }

  if (selectedMethod.needsSetup) {
    openSetupModal(selectedMethod);
    return;
  }

  launchSession();
}

function launchSession(setupValues = {}) {
  const selectedSubject = subjectSelect.selectedOptions[0];

  const sessionDraft = {
    method:            selectedMethod.id,
    methodName:        selectedMethod.name,
    methodDescription: selectedMethod.description,
    duration:          selectedMethod.duration,
    intensity:         selectedMethod.intensity,
    color:             selectedMethod.color,
    subjectId:         Number(subjectSelect.value),
    subjectName:       selectedSubject.textContent.trim(),
    startedAt:         new Date().toISOString(),
    ...setupValues
  };

  localStorage.setItem('studySessionDraft', JSON.stringify(sessionDraft));
  localStorage.removeItem('activeStudySession');
  window.location.href = 'session.html';
}

/* ═══════════════════════════════════════════════
   LOAD DATA
═══════════════════════════════════════════════ */
async function loadStudyMethods() {
  try {
    methodsGrid.innerHTML = `<div class="empty-state">Carregando metodos...</div>`;
    methods = await Api.getStudyMethods();
    renderMethods();
  } catch (_) {
    methodsGrid.innerHTML = `<div class="empty-state">Nao foi possivel carregar os metodos.</div>`;
    Toast.error('Erro ao carregar metodos de estudo.');
  }
}

async function loadSubjects() {
  try {
    const subjects = await Api.getSubjects();
    if (!subjects.length) {
      subjectSelect.innerHTML = `<option value="">Nenhuma materia cadastrada</option>`;
      Toast.warning('Voce ainda nao tem materias. Crie uma antes de estudar.');
      return;
    }
    subjectSelect.innerHTML = `
      <option value="">Escolha uma materia</option>
      ${subjects.map((s) => `<option value="${s.id}">${Utils.escapeHtml(s.name)}</option>`).join('')}
    `;
  } catch (_) {
    subjectSelect.innerHTML = `<option value="">Erro ao carregar materias</option>`;
    Toast.error('Erro ao carregar suas materias.');
  }
}

/* ═══════════════════════════════════════════════
   EVENTS
═══════════════════════════════════════════════ */
methodsGrid.addEventListener('click', (e) => {
  const card = e.target.closest('.method-card');
  if (!card) return;
  selectMethod(card.dataset.methodId);
});

methodsGrid.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('.method-card');
  if (!card) return;
  e.preventDefault();
  selectMethod(card.dataset.methodId);
});

startButton.addEventListener('click', startMethod);

loadStudyMethods();
loadSubjects();