Utils.requireAuth();

const methods = [
  {
    id: 'POMODORO',
    icon: 'POM',
    name: 'Pomodoro',
    description: 'Ciclos de foco e pausa para estudar com ritmo e evitar desgaste.',
    duration: '25/5',
    intensity: 'Foco guiado',
    color: '#ef4444'
  },
  {
    id: 'FLOW_STATE',
    icon: 'FLOW',
    name: 'Flow State',
    description: 'Sessao livre, sem cronometro pressionando. Ideal para foco profundo.',
    duration: 'Livre',
    intensity: 'Imersivo',
    color: '#0f766e'
  },
  {
    id: 'FIFTY_TWO_SEVENTEEN',
    icon: '52',
    name: '52/17',
    description: '52 minutos de foco e 17 minutos de pausa para blocos mais longos.',
    duration: '52/17',
    intensity: 'Foco longo',
    color: '#2563eb'
  },
  {
    id: 'TIMEBOXING',
    icon: 'BOX',
    name: 'Timeboxing',
    description: 'Defina um bloco fechado de tempo para uma tarefa especifica.',
    duration: 'Personalizado',
    intensity: 'Planejado',
    color: '#7c3aed'
  },
  {
    id: 'FEYNMAN',
    icon: 'FEY',
    name: 'Feynman',
    description: 'Estude e explique com suas palavras para encontrar falhas no entendimento.',
    duration: 'Livre',
    intensity: 'Explicacao',
    color: '#d97706'
  },
  {
    id: 'ACTIVE_RECALL',
    icon: 'AR',
    name: 'Active Recall',
    description: 'Tente lembrar antes de consultar o material. Excelente para memoria.',
    duration: 'Livre',
    intensity: 'Memoria ativa',
    color: '#16a34a'
  },
  {
    id: 'FLASHCARDS',
    icon: 'CARD',
    name: 'Flashcards',
    description: 'Revise perguntas e respostas com repeticao espacada.',
    duration: 'Revisao',
    intensity: 'SM-2',
    color: '#db2777'
  },
  {
    id: 'SPACED_REPETITION',
    icon: 'SR',
    name: 'Repeticao Espacada',
    description: 'Revise no momento certo para fortalecer memoria de longo prazo.',
    duration: 'Agenda',
    intensity: 'Retencao',
    color: '#9333ea'
  },
  {
    id: 'GUIDED_READING',
    icon: 'READ',
    name: 'Leitura Guiada',
    description: 'Estude PDFs, textos e materiais com anotacoes e destaques.',
    duration: 'Livre',
    intensity: 'Leitura',
    color: '#0891b2'
  },
  {
    id: 'QUESTIONS',
    icon: 'QST',
    name: 'Questoes',
    description: 'Treine com perguntas, simulados e exercicios da materia.',
    duration: 'Variavel',
    intensity: 'Pratica',
    color: '#ea580c'
  },
  {
    id: 'CORNELL_NOTES',
    icon: 'COR',
    name: 'Metodo Cornell',
    description: 'Organize anotacoes em ideias principais, detalhes e resumo final.',
    duration: 'Livre',
    intensity: 'Anotacao',
    color: '#475569'
  },
  {
    id: 'FREE_REVIEW',
    icon: 'REV',
    name: 'Revisao Livre',
    description: 'Sessao curta para revisar conceitos, resumos ou anotacoes antigas.',
    duration: 'Curta',
    intensity: 'Revisao',
    color: '#65a30d'
  }
];

let selectedMethod = null;

const user = Utils.getUser();
const userInfo = Utils.$('#user-info');
const methodsGrid = Utils.$('#methods-grid');
const subjectSelect = Utils.$('#subject-select');
const startButton = Utils.$('#start-method-btn');

if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP - Nivel ${user.level ?? 1}</span>
  `;
}

function logout() {
  Utils.logout();
}

function renderMethods() {
  methodsGrid.innerHTML = methods.map((method) => `
    <article
      class="method-card card"
      data-method-id="${method.id}"
      style="--method-color: ${method.color}"
    >
      <div class="method-top">
        <span class="method-icon">${method.icon}</span>
        <span class="method-dot"></span>
      </div>

      <h2>${method.name}</h2>
      <p>${method.description}</p>

      <div class="method-meta">
        <span>${method.duration}</span>
        <span>${method.intensity}</span>
      </div>

      <button class="btn btn-secondary method-action" type="button">
        Selecionar
      </button>
    </article>
  `).join('');
}

async function loadSubjects() {
  try {
    const subjects = await Api.getSubjects();

    if (!subjects.length) {
      subjectSelect.innerHTML = `
        <option value="">Nenhuma materia cadastrada</option>
      `;
      return;
    }

    subjectSelect.innerHTML = `
      <option value="">Escolha uma materia</option>
      ${subjects.map((subject) => `
        <option value="${subject.id}">
          ${Utils.escapeHtml(subject.name)}
        </option>
      `).join('')}
    `;
  } catch (error) {
    subjectSelect.innerHTML = `
      <option value="">Erro ao carregar materias</option>
    `;
  }
}

function selectMethod(methodId) {
  selectedMethod = methods.find((method) => method.id === methodId);

  if (!selectedMethod) return;

  Utils.setText('#selected-method-name', selectedMethod.name);
  Utils.setText('#selected-method-description', selectedMethod.description);

  startButton.disabled = false;

  document.querySelectorAll('.method-card').forEach((card) => {
    card.classList.toggle('selected', card.dataset.methodId === methodId);
  });
}

function startMethod() {
  if (!selectedMethod) {
    window.alert('Escolha um metodo de estudo.');
    return;
  }

  if (!subjectSelect.value) {
    window.alert('Escolha uma materia antes de iniciar.');
    return;
  }

  const sessionDraft = {
    method: selectedMethod.id,
    subjectId: Number(subjectSelect.value),
    startedAt: new Date().toISOString()
  };

  localStorage.setItem('studySessionDraft', JSON.stringify(sessionDraft));

  window.alert(`Metodo "${selectedMethod.name}" selecionado. Proximo passo: criar a tela de sessao.`);
}

methodsGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.method-card');
  if (!card) return;

  selectMethod(card.dataset.methodId);
});

startButton.addEventListener('click', startMethod);

renderMethods();
loadSubjects();