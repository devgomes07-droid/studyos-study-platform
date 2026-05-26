const API = 'http://localhost:8080/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) window.location.href = '../index.html';

document.getElementById('username').textContent = user.name || 'Estudante';
document.getElementById('xp').textContent = user.xp || 0;
document.getElementById('level').textContent = user.level || 1;
document.getElementById('user-info').innerHTML = `
  <strong>${user.name}</strong><br>
  ⚡ ${user.xp} XP — Nível ${user.level}
`;

async function loadSubjects() {
  const res = await fetch(`${API}/subjects`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const subjects = await res.json();
  document.getElementById('subjects-count').textContent = subjects.length;

  const list = document.getElementById('subjects-list');
  if (subjects.length === 0) {
    list.innerHTML = '<p style="color:#94a3b8">Nenhuma matéria cadastrada ainda.</p>';
    return;
  }

  list.innerHTML = subjects.map(s => `
    <div class="subject-card" style="border-left: 4px solid ${s.color}">
      <div class="subject-name">${s.icon || '📚'} ${s.name}</div>
      <div class="subject-hours">${s.totalHoursStudied.toFixed(1)}h estudadas</div>
    </div>
  `).join('');
}

function logout() {
  localStorage.clear();
  window.location.href = '../index.html';
}

loadSubjects();