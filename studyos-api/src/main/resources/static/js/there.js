/* ═══════════════════════════════════════════════
   StudyOS — theme.js
   Carregue este script ANTES de qualquer outro,
   no <head>, para evitar flash de tema errado.
═══════════════════════════════════════════════ */

const Theme = (() => {
  const KEY = 'studyos-theme';
  const ROOT = document.documentElement;

  /** Retorna 'dark' | 'light' */
  function getSystemPreference() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  /** Retorna o tema salvo ou o do sistema */
  function getSaved() {
    return localStorage.getItem(KEY) || getSystemPreference();
  }

  /** Aplica o tema no <html> e atualiza todos os toggles */
  function apply(theme) {
    ROOT.setAttribute('data-theme', theme);

    // Atualiza label dos botões de toggle
    document.querySelectorAll('[data-theme-label]').forEach((el) => {
      el.textContent = theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo escuro';
    });
  }

  /** Salva e aplica */
  function set(theme) {
    localStorage.setItem(KEY, theme);
    apply(theme);
  }

  /** Alterna entre dark e light */
  function toggle() {
    const current = ROOT.getAttribute('data-theme') || getSaved();
    set(current === 'dark' ? 'light' : 'dark');
  }

  /** Inicializa — chame no carregamento da página */
  function init() {
    apply(getSaved());

    // Sincroniza com mudança de preferência do SO
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Só aplica se o usuário não tiver feito escolha manual
        if (!localStorage.getItem(KEY)) {
          apply(e.matches ? 'dark' : 'light');
        }
      });
  }

  return { init, toggle, set, getSaved };
})();

// Auto-inicializa assim que o script carrega
Theme.init();