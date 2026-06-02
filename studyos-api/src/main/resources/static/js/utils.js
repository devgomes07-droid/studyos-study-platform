const Utils = {
  $(selector) {
    return document.querySelector(selector);
  },

  $all(selector) {
    return [...document.querySelectorAll(selector)];
  },

  getUser() {
    return JSON.parse(localStorage.getItem('user') || '{}');
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('token'));
  },

  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = '../index.html';
    }
  },

  logout() {
    Api.clearSession();
    window.location.href = '../index.html';
  },

  setText(selector, value) {
    const element = this.$(selector);
    if (element) element.textContent = value;
  },

  showMessage(selector, message, type = 'error') {
    const element = this.$(selector);
    if (!element) return;

    element.textContent = message;
    element.className = `form-message ${type}`;
  },

  clearMessage(selector) {
    const element = this.$(selector);
    if (!element) return;

    element.textContent = '';
    element.className = 'form-message';
  },

  formatHours(value = 0) {
    const hours = Number(value) || 0;
    return `${hours.toFixed(1)}h`;
  },

  escapeHtml(value = '') {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  /**
   * initSidebar()
   * Inicializa a lógica de colapsar/expandir (desktop) e
   * abrir/fechar drawer (mobile) da sidebar.
   *
   * Chame Utils.initSidebar() em qualquer página que tenha sidebar,
   * depois que o DOM estiver pronto (no final do <body> ou em DOMContentLoaded).
   *
   * IDs esperados no HTML:
   *   #sidebar              — o <aside>
   *   #sidebar-overlay      — o div de overlay
   *   #menu-toggle          — botão hambúrguer (mobile)
   *   #sidebar-close-btn    — botão "✕" dentro da sidebar (mobile)
   *   #sidebar-collapse-btn — botão "◀ / ▶" dentro da sidebar (desktop)
   *
   * Classe CSS usada:
   *   body.sidebar-collapsed — aplicada quando colapsada no desktop
   */
  initSidebar() {
    const COLLAPSED_KEY = 'studyos-sidebar-collapsed';

    const sidebar     = document.getElementById('sidebar');
    const overlay     = document.getElementById('sidebar-overlay');
    const menuToggle  = document.getElementById('menu-toggle');
    const closeBtn    = document.getElementById('sidebar-close-btn');
    const collapseBtn = document.getElementById('sidebar-collapse-btn');

    if (!sidebar) return; // página sem sidebar, ignora

    /* ── Desktop: colapsar / expandir ── */
    function isCollapsed() {
      return localStorage.getItem(COLLAPSED_KEY) === 'true';
    }

    function applyCollapsed(collapsed) {
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      if (collapseBtn) {
        collapseBtn.textContent = collapsed ? '▶' : '◀';
        collapseBtn.title       = collapsed ? 'Expandir menu' : 'Recolher menu';
      }
      localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    }

    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => applyCollapsed(!isCollapsed()));
    }

    // Restaura estado salvo
    applyCollapsed(isCollapsed());

    /* ── Mobile: abrir / fechar drawer ── */
    function openSidebar() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (menuToggle) menuToggle.addEventListener('click', openSidebar);
    if (closeBtn)   closeBtn.addEventListener('click', closeSidebar);
    if (overlay)    overlay.addEventListener('click', closeSidebar);

    // Fecha ao clicar em link da sidebar no mobile
    sidebar.querySelectorAll('nav a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 860) closeSidebar();
      });
    });
  }
};