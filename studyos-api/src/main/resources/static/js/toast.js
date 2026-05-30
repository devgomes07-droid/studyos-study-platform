/* ═══════════════════════════════════════════════
   StudyOS — toast.js
   Sistema de notificações + confirm customizado.
   Inclua ANTES do JS específico de cada página.
═══════════════════════════════════════════════ */

const Toast = (() => {

  /* ── CSS injetado automaticamente ─────────── */
  const css = `
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 300px;
      max-width: 380px;
      padding: 14px 16px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      pointer-events: all;
      animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      transition: background 180ms ease, border-color 180ms ease;
    }

    .toast.hiding {
      animation: toastOut 0.25s ease forwards;
    }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .toast-body { flex: 1; min-width: 0; }

    .toast-title {
      font-weight: 800;
      font-size: 14px;
      color: var(--text);
      margin: 0 0 2px;
    }

    .toast-message {
      font-size: 13px;
      color: var(--soft-text);
      margin: 0;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      color: var(--soft-text);
      font-size: 16px;
      padding: 0;
      line-height: 1;
      flex-shrink: 0;
    }

    .toast-close:hover { color: var(--text); }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      border-radius: 0 0 14px 14px;
      background: currentColor;
      opacity: 0.35;
      animation: toastProgress linear forwards;
    }

    .toast { position: relative; overflow: hidden; }

    .toast-success { border-left: 4px solid #22c55e; }
    .toast-success .toast-progress { color: #22c55e; }

    .toast-error   { border-left: 4px solid var(--danger); }
    .toast-error   .toast-progress { color: var(--danger); }

    .toast-warning { border-left: 4px solid #f59e0b; }
    .toast-warning .toast-progress { color: #f59e0b; }

    .toast-info    { border-left: 4px solid var(--primary); }
    .toast-info    .toast-progress { color: var(--primary); }

    @keyframes toastIn {
      from { opacity: 0; transform: translateX(60px) scale(0.9); }
      to   { opacity: 1; transform: translateX(0)    scale(1);   }
    }

    @keyframes toastOut {
      from { opacity: 1; transform: translateX(0)    scale(1);   }
      to   { opacity: 0; transform: translateX(60px) scale(0.9); }
    }

    @keyframes toastProgress {
      from { width: 100%; }
      to   { width: 0%;   }
    }

    /* ── Confirm dialog ───────────────────── */
    .confirm-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9998;
      display: grid;
      place-items: center;
      padding: 24px;
      animation: confirmFadeIn 0.2s ease;
    }

    .confirm-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 28px;
      width: min(400px, 100%);
      box-shadow: 0 24px 60px rgba(0,0,0,0.25);
      animation: confirmPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      transition: background 180ms ease;
    }

    .confirm-icon {
      font-size: 36px;
      text-align: center;
      margin-bottom: 14px;
    }

    .confirm-title {
      margin: 0 0 8px;
      font-size: 18px;
      font-weight: 900;
      color: var(--text);
      text-align: center;
    }

    .confirm-message {
      margin: 0 0 22px;
      font-size: 14px;
      color: var(--soft-text);
      text-align: center;
      line-height: 1.5;
    }

    .confirm-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .confirm-actions .btn { width: 100%; justify-content: center; }

    @keyframes confirmFadeIn {
      from { background: rgba(0,0,0,0); }
      to   { background: rgba(0,0,0,0.5); }
    }

    @keyframes confirmPop {
      from { transform: scale(0.85); opacity: 0; }
      to   { transform: scale(1);    opacity: 1; }
    }

    /* ── Finish screen ────────────────────── */
    .finish-screen {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 9997;
      display: grid;
      place-items: center;
      padding: 24px;
      animation: confirmFadeIn 0.3s ease;
    }

    .finish-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 36px;
      width: min(480px, 100%);
      text-align: center;
      box-shadow: 0 24px 70px rgba(0,0,0,0.3);
      animation: confirmPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .finish-emoji {
      font-size: 52px;
      margin-bottom: 10px;
      animation: finishBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
    }

    .finish-title {
      margin: 0 0 6px;
      font-size: 26px;
      font-weight: 900;
      color: var(--text);
    }

    .finish-subtitle {
      margin: 0 0 28px;
      color: var(--soft-text);
      font-size: 14px;
    }

    .finish-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }

    .finish-stat {
      padding: 16px 10px;
      background: var(--muted);
      border-radius: 14px;
      transition: background 180ms ease;
    }

    .finish-stat-value {
      display: block;
      font-size: 26px;
      font-weight: 900;
      color: var(--text);
      line-height: 1;
      margin-bottom: 4px;
    }

    .finish-stat-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--soft-text);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .finish-stat.highlight .finish-stat-value { color: var(--primary); }
    .finish-stat.success   .finish-stat-value { color: #22c55e; }
    .finish-stat.danger    .finish-stat-value { color: var(--danger); }

    .finish-actions {
      display: grid;
      gap: 10px;
    }

    .finish-actions .btn { width: 100%; padding: 14px; font-size: 15px; }

    @keyframes finishBounce {
      from { transform: scale(0) rotate(-15deg); opacity: 0; }
      to   { transform: scale(1) rotate(0deg);   opacity: 1; }
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ── Container ─────────────────────────── */
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  const ICONS = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️'
  };

  const TITLES = {
    success: 'Sucesso',
    error:   'Erro',
    warning: 'Atenção',
    info:    'Aviso'
  };

  /* ── Show toast ────────────────────────── */
  function show(message, type = 'info', duration = 4000) {
    const c     = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${ICONS[type]}</span>
      <div class="toast-body">
        <p class="toast-title">${TITLES[type]}</p>
        <p class="toast-message">${message}</p>
      </div>
      <button class="toast-close" aria-label="Fechar">✕</button>
      <div class="toast-progress" style="animation-duration:${duration}ms"></div>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => dismiss(toast));
    c.appendChild(toast);

    setTimeout(() => dismiss(toast), duration);
    return toast;
  }

  function dismiss(toast) {
    if (!toast.parentNode) return;
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 280);
  }

  /* ── Custom confirm ────────────────────── */
  function confirm(message, icon = '🤔', confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', danger = false) {
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'confirm-backdrop';
      backdrop.innerHTML = `
        <div class="confirm-box">
          <div class="confirm-icon">${icon}</div>
          <h3 class="confirm-title">${message}</h3>
          <div class="confirm-actions">
            <button class="btn btn-secondary" id="confirm-cancel">${cancelLabel}</button>
            <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${confirmLabel}</button>
          </div>
        </div>
      `;

      backdrop.querySelector('#confirm-cancel').addEventListener('click', () => {
        backdrop.remove();
        resolve(false);
      });

      backdrop.querySelector('#confirm-ok').addEventListener('click', () => {
        backdrop.remove();
        resolve(true);
      });

      document.body.appendChild(backdrop);
      backdrop.querySelector('#confirm-ok').focus();
    });
  }

  /* ── Finish screen ─────────────────────── */
  function showFinish({ xp, minutes, focusScore, cycles, method, onDashboard }) {
    const focusColor = focusScore >= 80 ? 'success' : focusScore >= 50 ? '' : 'danger';
    const cyclesStat = cycles != null ? `
      <div class="finish-stat highlight">
        <span class="finish-stat-value">${cycles}</span>
        <span class="finish-stat-label">Ciclos 🍅</span>
      </div>
    ` : '';

    const overlay = document.createElement('div');
    overlay.className = 'finish-screen';
    overlay.innerHTML = `
      <div class="finish-box">
        <div class="finish-emoji">🎉</div>
        <h2 class="finish-title">Sessao finalizada!</h2>
        <p class="finish-subtitle">Excelente trabalho. Confira seu desempenho.</p>

        <div class="finish-stats" style="grid-template-columns:repeat(${cycles != null ? 4 : 3},1fr)">
          <div class="finish-stat highlight">
            <span class="finish-stat-value">+${xp}</span>
            <span class="finish-stat-label">XP ganho</span>
          </div>
          <div class="finish-stat">
            <span class="finish-stat-value">${minutes}min</span>
            <span class="finish-stat-label">Estudado</span>
          </div>
          <div class="finish-stat ${focusColor}">
            <span class="finish-stat-value">${focusScore}%</span>
            <span class="finish-stat-label">Focus Score</span>
          </div>
          ${cyclesStat}
        </div>

        <div class="finish-actions">
          <button class="btn btn-primary" id="finish-to-dashboard">
            Ver dashboard →
          </button>
        </div>
      </div>
    `;

    overlay.querySelector('#finish-to-dashboard').addEventListener('click', () => {
      overlay.remove();
      if (onDashboard) onDashboard();
    });

    document.body.appendChild(overlay);
  }

  return {
    show,
    success: (msg, dur)  => show(msg, 'success', dur),
    error:   (msg, dur)  => show(msg, 'error',   dur),
    warning: (msg, dur)  => show(msg, 'warning',  dur),
    info:    (msg, dur)  => show(msg, 'info',     dur),
    confirm,
    showFinish
  };

})();