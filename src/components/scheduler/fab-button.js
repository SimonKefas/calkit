/**
 * Floating action button (FAB) — circular "+" button anchored to bottom-right.
 */

/**
 * Render the FAB button.
 * @param {object} options
 * @param {function} options.onClick
 * @returns {HTMLElement}
 */
export function renderFab({ onClick }) {
  const btn = document.createElement('button');
  btn.classList.add('cal-sched-fab');
  btn.setAttribute('aria-label', 'Create event');
  btn.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 4v12M4 10h12"/></svg>`;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick?.();
  });

  return btn;
}

export const fabStyles = `
  .cal-sched-fab {
    position: absolute;
    bottom: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    z-index: 8;
    transition: transform var(--cal-transition), box-shadow var(--cal-transition);
  }

  .cal-sched-fab:hover {
    transform: scale(1.08);
    box-shadow: 0 6px 16px -2px rgba(0, 0, 0, 0.25), 0 3px 6px -1px rgba(0, 0, 0, 0.12);
  }

  .cal-sched-fab:active {
    transform: scale(0.96);
  }

  .cal-sched-fab:focus-visible {
    outline: 2px solid hsl(var(--cal-ring));
    outline-offset: 2px;
  }
`;
