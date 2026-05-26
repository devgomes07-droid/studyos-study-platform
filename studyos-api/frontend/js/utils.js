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
  }
};