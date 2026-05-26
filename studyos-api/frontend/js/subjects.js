Utils.requireAuth();

let subjects = [];
let editingSubjectId = null;

const subjectsGrid = Utils.$('#subjects-grid');
const searchInput = Utils.$('#subject-search');
const modal = Utils.$('#subject-modal');
const form = Utils.$('#subject-form');

const user = Utils.getUser();
const userInfo = Utils.$('#user-info');

if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP - Nivel ${user.level ?? 1}</span>
  `;
}

function logout() {
  Utils.logout();
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getFilteredSubjects() {
  const term = normalizeText(searchInput.value);

  if (!term) return subjects;

  return subjects.filter((subject) => {
    return normalizeText(subject.name).includes(term)
      || normalizeText(subject.description).includes(term);
  });
}

function renderSubjects() {
  const filteredSubjects = getFilteredSubjects();

  Utils.setText('#subjects-total', subjects.length);

  if (!filteredSubjects.length) {
    subjectsGrid.innerHTML = `
      <div class="empty-state">
        Nenhuma materia encontrada.
      </div>
    `;
    return;
  }

  subjectsGrid.innerHTML = filteredSubjects.map((subject) => {
    const id = subject.id;
    const name = Utils.escapeHtml(subject.name);
    const description = Utils.escapeHtml(subject.description || 'Sem descricao cadastrada.');
    const icon = Utils.escapeHtml(subject.icon || '📚');
    const color = subject.color || '#4f46e5';
    const weeklyGoal = subject.weeklyGoalHours ?? 0;
    const totalHours = Number(subject.totalHoursStudied || 0);
    const progress = weeklyGoal > 0 ? Math.min((totalHours / weeklyGoal) * 100, 100) : 0;

    return `
      <article class="subject-management-card card" style="--subject-color: ${color}">
        <div class="subject-card-header">
          <div class="subject-icon">${icon}</div>

          <div class="subject-card-actions">
            <button class="icon-button" onclick="editSubject(${id})" aria-label="Editar materia">
              Editar
            </button>
            <button class="icon-button danger" onclick="removeSubject(${id})" aria-label="Excluir materia">
              Excluir
            </button>
          </div>
        </div>

        <h2>${name}</h2>
        <p>${description}</p>

        <div class="subject-meta">
          <span>${Utils.formatHours(totalHours)} estudadas</span>
          <span>Meta ${weeklyGoal}h/semana</span>
        </div>

        <div class="progress-track" aria-label="Progresso semanal">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </article>
    `;
  }).join('');
}

async function loadSubjects() {
  try {
    subjectsGrid.innerHTML = '<div class="empty-state">Carregando materias...</div>';
    subjects = await Api.getSubjects();
    renderSubjects();
  } catch (error) {
    subjectsGrid.innerHTML = `
      <div class="empty-state">
        Nao foi possivel carregar as materias.
      </div>
    `;
  }
}

function resetForm() {
  editingSubjectId = null;
  form.reset();

  Utils.$('#subject-id').value = '';
  Utils.$('#subject-icon').value = '📚';
  Utils.$('#subject-color').value = '#4f46e5';
  Utils.$('#subject-weekly-goal').value = 5;
  Utils.setText('#modal-title', 'Nova materia');
  Utils.clearMessage('#subject-message');
}

function openSubjectModal(subject = null) {
  resetForm();

  if (subject) {
    editingSubjectId = subject.id;

    Utils.setText('#modal-title', 'Editar materia');
    Utils.$('#subject-id').value = subject.id;
    Utils.$('#subject-name').value = subject.name || '';
    Utils.$('#subject-description').value = subject.description || '';
    Utils.$('#subject-icon').value = subject.icon || '📚';
    Utils.$('#subject-color').value = subject.color || '#4f46e5';
    Utils.$('#subject-weekly-goal').value = subject.weeklyGoalHours || 5;
  }

  modal.classList.add('open');
  Utils.$('#subject-name').focus();
}

function closeSubjectModal() {
  modal.classList.remove('open');
}

function getSubjectPayload() {
  return {
    name: Utils.$('#subject-name').value.trim(),
    description: Utils.$('#subject-description').value.trim(),
    icon: Utils.$('#subject-icon').value.trim() || '📚',
    color: Utils.$('#subject-color').value || '#4f46e5',
    weeklyGoalHours: Number(Utils.$('#subject-weekly-goal').value || 0)
  };
}

function validateSubject(payload) {
  if (!payload.name) {
    return 'Informe o nome da materia.';
  }

  if (payload.weeklyGoalHours < 1) {
    return 'A meta semanal precisa ser de pelo menos 1 hora.';
  }

  return null;
}

async function saveSubject(event) {
  event.preventDefault();

  const payload = getSubjectPayload();
  const validationError = validateSubject(payload);

  if (validationError) {
    Utils.showMessage('#subject-message', validationError);
    return;
  }

  try {
    if (editingSubjectId) {
      await Api.updateSubject(editingSubjectId, payload);
    } else {
      await Api.createSubject(payload);
    }

    closeSubjectModal();
    await loadSubjects();
  } catch (error) {
    Utils.showMessage('#subject-message', error.message || 'Erro ao salvar materia.');
  }
}

function editSubject(id) {
  const subject = subjects.find((item) => item.id === id);
  if (!subject) return;

  openSubjectModal(subject);
}

async function removeSubject(id) {
  const subject = subjects.find((item) => item.id === id);
  if (!subject) return;

  const confirmed = window.confirm(`Excluir a materia "${subject.name}"?`);

  if (!confirmed) return;

  try {
    await Api.deleteSubject(id);
    await loadSubjects();
  } catch (error) {
    window.alert(error.message || 'Erro ao excluir materia.');
  }
}

searchInput.addEventListener('input', renderSubjects);
form.addEventListener('submit', saveSubject);

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeSubjectModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal.classList.contains('open')) {
    closeSubjectModal();
  }
});

loadSubjects();