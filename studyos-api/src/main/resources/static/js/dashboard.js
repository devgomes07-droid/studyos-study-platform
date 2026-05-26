Utils.requireAuth();

const user = Utils.getUser();

Utils.setText('#username', user.name || 'Estudante');
Utils.setText('#xp', user.xp ?? 0);
Utils.setText('#level', user.level ?? 1);

const userInfo = Utils.$('#user-info');
if (userInfo) {
  userInfo.innerHTML = `
    <strong>${Utils.escapeHtml(user.name || 'Estudante')}</strong>
    <span>${user.xp ?? 0} XP - Nivel ${user.level ?? 1}</span>
  `;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

Utils.setText('#greeting', getGreeting());

async function loadSubjects() {
  const list = Utils.$('#subjects-list');

  try {
    const subjects = await Api.getSubjects();

    Utils.setText('#subjects-count', subjects.length);

    if (!subjects.length) {
      list.innerHTML = `
        <div class="empty-state">
          Nenhuma materia cadastrada ainda.
        </div>
      `;
      return;
    }

    list.innerHTML = subjects.map((subject) => {
      const name = Utils.escapeHtml(subject.name);
      const icon = Utils.escapeHtml(subject.icon || '📚');
      const color = subject.color || '#4f46e5';
      const hours = Utils.formatHours(subject.totalHoursStudied);

      return `
        <article class="subject-card" style="border-left-color: ${color}">
          <div>
            <h3>${icon} ${name}</h3>
            <p>${hours} estudadas</p>
          </div>
          <span class="subject-chip">Ativa</span>
        </article>
      `;
    }).join('');
  } catch (error) {
    list.innerHTML = `
      <div class="empty-state">
        Nao foi possivel carregar suas materias agora.
      </div>
    `;
  }
}

function logout() {
  Utils.logout();
}

loadSubjects();