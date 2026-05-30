Utils.requireAuth();

/* ═══════════════════════════════════════════════
   ENRICHMENT — dados visuais e dicas por método
   (complementam o que vem da API)
═══════════════════════════════════════════════ */
const METHOD_ENRICHMENT = {
  POMODORO: {
    category: 'timer',
    tip: '4 ciclos de 25 min com pausas. Ideal para foco intenso e tarefas longas.',
    action: 'Iniciar ciclos 🍅'
  },
  FLOW_STATE: {
    category: 'timer',
    tip: 'Imersao total. Tela escura, sem interrupcoes, timer livre. So voce e o conteudo.',
    action: 'Entrar em flow 🌊'
  },
  FIFTY_TWO_SEVENTEEN: {
    category: 'timer',
    tip: '52 min de foco profundo + 17 min de descanso real. Ciencia da produtividade.',
    action: 'Iniciar bloco ⚡'
  },
  TIMEBOXING: {
    category: 'timer',
    tip: 'Defina um objetivo claro e um tempo fixo. Foco no entregavel, nao no relogio.',
    action: 'Definir objetivo 📦'
  },
  FEYNMAN: {
    category: 'escrita',
    tip: 'Explique o tema com suas palavras. Se nao consegue simplificar, ainda nao aprendeu.',
    action: 'Comecar explicacao ✍️'
  },
  CORNELL_NOTES: {
    category: 'escrita',
    tip: 'Anote em colunas: perguntas, detalhes e resumo. Metodo da Cornell University.',
    action: 'Comecar anotacao 📝'
  },
  GUIDED_READING: {
    category: 'escrita',
    tip: 'Leitura ativa com anotacoes guiadas. Processe, questione e conecte ideias.',
    action: 'Iniciar leitura 📖'
  },
  ACTIVE_RECALL: {
    category: 'memoria',
    tip: 'Feche o material e escreva tudo que lembra. A dificuldade de lembrar consolida o aprendizado.',
    action: 'Testar memoria 🧠'
  },
  FLASHCARDS: {
    category: 'memoria',
    tip: 'Revise seus cards com repeticao espacada. O algoritmo mostra o que voce esta esquecendo.',
    action: 'Revisar cards 🃏'
  },
  QUESTIONS: {
    category: 'memoria',
    tip: 'Resolva questoes e registre acertos e erros. Descubra exatamente onde voce erra.',
    action: 'Resolver questoes ❓'
  },
  FREE_REVIEW: {
    category: 'revisao',
    tip: 'Sessao livre para revisar o que ja estudou. Sem pressao, no seu ritmo.',
    action: 'Revisar conteudo 🔄'
  },
  SPACED_REPETITION: {
    category: 'revisao',
    tip: 'Revisao nos intervalos certos: 1, 3, 7, 14 dias. Ciencia da memoria de longo prazo.',
    action: 'Iniciar revisao 📅'
  }
};

/* ═══════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════ */
let methods        = [];
let selectedMethod = null;
let activeCategory = 'all';

const user         = Utils.getUser();
const userInfo     = Utils.$('#user-info');
const methodsGrid  = Utils.$('#methods-grid');
const subjectSelect = Utils.$('#subject-select');
const startButton  = Utils.$('#start-method-btn');

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
   ENRICH — mescla dados da API com enrichment local
═══════════════════════════════════════════════ */
function enrich(method) {
  const extra = METHOD_ENRICHMENT[method.id] || {
    category: 'timer',
    tip: method.description,
    action: 'Iniciar sessao'
  };
  return { ...method, ...extra };
}

/* ═══════════════════════════════════════════════
   RENDER METHODS
═══════════════════════════════════════════════ */
function renderMethods() {
  const enriched = methods.map(enrich);
  const filtered = activeCategory === 'all'
    ? enriched
    : enriched.filter((m) => m.category === activeCategory);

  if (!filtered.length) {
    methodsGrid.innerHTML = `<div class="empty-state">Nenhum metodo nessa categoria.</div>`;
    return;
  }

  methodsGrid.innerHTML = filtered.map((method) => `
    <article
      class="method-card card${selectedMethod?.id === method.id ? ' selected' : ''}"
      data-method-id="${method.id}"
      style="--method-color: ${method.color}"
      role="button"
      tabindex="0"
      aria-label="Selecionar metodo ${Utils.escapeHtml(method.name)}"
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
      </div>

      <button class="btn method-select-btn${selectedMethod?.id === method.id ? ' selected-btn' : ''}" type="button">
        ${selectedMethod?.id === method.id ? '✓ Selecionado' : 'Selecionar'}
      </button>
    </article>
  `).join('');
}

function getCategoryLabel(category) {
  const labels = {
    timer:   '⏱ Timer',
    escrita: '✍️ Escrita',
    memoria: '🧠 Memoria',
    revisao: '🔄 Revisao'
  };
  return labels[category] || '📚 Estudo';
}

/* ═══════════════════════════════════════════════
   FILTER TABS
═══════════════════════════════════════════════ */
Utils.$('#methods-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;

  activeCategory = btn.dataset.category;

  document.querySelectorAll('.filter-btn').forEach((b) => {
    b.classList.toggle('active', b === btn);
  });

  renderMethods();
});

/* ═══════════════════════════════════════════════
   SELECT METHOD
═══════════════════════════════════════════════ */
function selectMethod(methodId) {
  const raw     = methods.find((m) => m.id === methodId);
  if (!raw) return;

  selectedMethod = enrich(raw);

  // Atualiza painel inferior
  const icon = Utils.$('#selected-panel-icon');
  if (icon) icon.textContent = selectedMethod.icon;

  Utils.setText('#selected-method-name', selectedMethod.name);
  Utils.setText('#selected-method-tip',  selectedMethod.tip);
  Utils.setText('#start-method-btn',     selectedMethod.action);

  startButton.disabled = false;

  // Destaca painel
  const panel = Utils.$('#selected-panel');
  if (panel) {
    panel.style.setProperty('--panel-color', selectedMethod.color);
    panel.classList.add('has-selection');
  }

  // Re-renderiza pra refletir estado selecionado
  renderMethods();
}

/* ═══════════════════════════════════════════════
   START SESSION
═══════════════════════════════════════════════ */
function startMethod() {
  if (!selectedMethod) {
    window.alert('Escolha um metodo de estudo.');
    return;
  }
  if (!subjectSelect.value) {
    window.alert('Escolha uma materia antes de iniciar.');
    return;
  }

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
    startedAt:         new Date().toISOString()
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
  }
}

async function loadSubjects() {
  try {
    const subjects = await Api.getSubjects();
    if (!subjects.length) {
      subjectSelect.innerHTML = `<option value="">Nenhuma materia cadastrada</option>`;
      return;
    }
    subjectSelect.innerHTML = `
      <option value="">Escolha uma materia</option>
      ${subjects.map((s) => `
        <option value="${s.id}">${Utils.escapeHtml(s.name)}</option>
      `).join('')}
    `;
  } catch (_) {
    subjectSelect.innerHTML = `<option value="">Erro ao carregar materias</option>`;
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