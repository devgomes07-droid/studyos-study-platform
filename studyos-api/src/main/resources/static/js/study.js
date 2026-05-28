Utils.requireAuth();

let methods = [];
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
  if (!methods.length) {
    methodsGrid.innerHTML = `
      <div class="empty-state">Nenhum metodo disponivel agora.</div>
    `;
    return;
  }

  methodsGrid.innerHTML = methods.map((method) => `
    <article
      class="method-card card"
      data-method-id="${method.id}"
      style="--method-color: ${method.color}"
    >
      <div class="method-top">
        <span class="method-icon">${Utils.escapeHtml(method.icon)}</span>
        <span class="method-dot"></span>
      </div>

      <h2>${Utils.escapeHtml(method.name)}</h2>
      <p>${Utils.escapeHtml(method.description)}</p>

      <div class="method-meta">
        <span>${Utils.escapeHtml(method.duration)}</span>
        <span>${Utils.escapeHtml(method.intensity)}</span>
      </div>

      <button class="btn btn-secondary method-action" type="button">
        Selecionar
      </button>
    </article>
  `).join('');
}

async function loadStudyMethods() {
  try {
    methodsGrid.innerHTML = `
      <div class="empty-state">Carregando metodos...</div>
    `;

    methods = await Api.getStudyMethods();
    renderMethods();
  } catch (error) {
    methodsGrid.innerHTML = `
      <div class="empty-state">
        Nao foi possivel carregar os metodos de estudo.
      </div>
    `;
  }
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

  const selectedSubject = subjectSelect.selectedOptions[0];

  const sessionDraft = {
    method: selectedMethod.id,
    methodName: selectedMethod.name,
    methodDescription: selectedMethod.description,
    duration: selectedMethod.duration,
    intensity: selectedMethod.intensity,
    color: selectedMethod.color,
    subjectId: Number(subjectSelect.value),
    subjectName: selectedSubject.textContent.trim(),
    startedAt: new Date().toISOString()
  };

  localStorage.setItem('studySessionDraft', JSON.stringify(sessionDraft));
  localStorage.removeItem('activeStudySession');

  window.location.href = 'session.html';
}

methodsGrid.addEventListener('click', (event) => {
  const card = event.target.closest('.method-card');
  if (!card) return;

  selectMethod(card.dataset.methodId);
});

startButton.addEventListener('click', startMethod);

loadStudyMethods();
loadSubjects();