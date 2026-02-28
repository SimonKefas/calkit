/**
 * Status message renderer — inline banners with type-specific icons and colors.
 */

const icons = {
  error: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4v3M7 9.5v.01"/></svg>`,
  warning: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M7 1.5L1 12.5h12L7 1.5zM7 6v2.5M7 10.5v.01"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 6.5V10M7 4.5v.01"/></svg>`,
  success: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="6"/><path d="M4.5 7l2 2L9.5 5"/></svg>`,
};

/**
 * Render a status message banner.
 * @param {object} options
 * @param {'error'|'warning'|'info'|'success'} options.type
 * @param {string} options.message
 * @param {boolean} options.dismissible
 * @param {function} options.onDismiss
 * @returns {HTMLElement}
 */
export function renderStatusMessage({ type = 'info', message, dismissible = true, onDismiss }) {
  const banner = document.createElement('div');
  banner.classList.add('cal-status', `cal-status--${type}`, 'cal-animate-slide-up');
  banner.setAttribute('role', type === 'error' ? 'alert' : 'status');
  banner.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

  const icon = document.createElement('span');
  icon.classList.add('cal-status__icon');
  icon.innerHTML = icons[type] || icons.info;
  banner.appendChild(icon);

  const text = document.createElement('span');
  text.classList.add('cal-status__text');
  text.textContent = message;
  banner.appendChild(text);

  if (dismissible) {
    const closeBtn = document.createElement('button');
    closeBtn.classList.add('cal-status__close');
    closeBtn.setAttribute('aria-label', 'Dismiss');
    closeBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M3 3l6 6M9 3l-6 6"/></svg>`;
    closeBtn.addEventListener('click', () => onDismiss?.());
    banner.appendChild(closeBtn);
  }

  return banner;
}

export const statusMessageStyles = `
  .cal-status {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: var(--cal-radius-sm);
    font-size: 12px;
    line-height: 1.4;
    margin-bottom: 8px;
  }

  .cal-status__icon {
    flex-shrink: 0;
    display: flex;
  }

  .cal-status__text {
    flex: 1;
    min-width: 0;
  }

  .cal-status__close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 4px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity var(--cal-transition);
  }

  .cal-status__close:hover {
    opacity: 1;
  }

  .cal-status--error {
    background: hsl(var(--cal-status-error-bg));
    color: hsl(var(--cal-status-error-fg));
    border: 1px solid hsl(var(--cal-status-error-border));
  }

  .cal-status--warning {
    background: hsl(var(--cal-status-warning-bg));
    color: hsl(var(--cal-status-warning-fg));
    border: 1px solid hsl(var(--cal-status-warning-border));
  }

  .cal-status--info {
    background: hsl(var(--cal-status-info-bg));
    color: hsl(var(--cal-status-info-fg));
    border: 1px solid hsl(var(--cal-status-info-border));
  }

  .cal-status--success {
    background: hsl(var(--cal-status-success-bg));
    color: hsl(var(--cal-status-success-fg));
    border: 1px solid hsl(var(--cal-status-success-border));
  }
`;
