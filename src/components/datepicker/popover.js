/**
 * Creates a popover panel anchored to a trigger element.
 * @param {object} options
 * @param {HTMLElement} options.trigger - the element that opens the popover
 * @param {HTMLElement} options.content - the popover body
 * @param {function} options.onClose
 * @returns {{ panel: HTMLElement, open: function, close: function, destroy: function }}
 */
export function createPopover({ trigger, content, onClose }) {
  const panel = document.createElement('div');
  panel.classList.add('cal-popover');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'false');
  panel.style.display = 'none';
  panel.appendChild(content);

  let isOpen = false;

  function position() {
    // Reset position classes
    panel.classList.remove('cal-popover--above');

    const triggerRect = trigger.getBoundingClientRect();
    const panelHeight = panel.offsetHeight;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // Prefer below, flip above if not enough space
    if (spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow) {
      panel.classList.add('cal-popover--above');
      panel.style.top = 'auto';
      panel.style.bottom = '100%';
      panel.style.marginBottom = '4px';
      panel.style.marginTop = '0';
    } else {
      panel.style.top = '100%';
      panel.style.bottom = 'auto';
      panel.style.marginTop = '4px';
      panel.style.marginBottom = '0';
    }
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    panel.style.display = '';
    panel.classList.add('cal-animate-slide-up');
    // Measure after display
    requestAnimationFrame(() => position());
    document.addEventListener('click', outsideClick, true);
    document.addEventListener('keydown', escapeKey, true);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    panel.style.display = 'none';
    panel.classList.remove('cal-animate-slide-up');
    document.removeEventListener('click', outsideClick, true);
    document.removeEventListener('keydown', escapeKey, true);
    onClose?.();
  }

  function outsideClick(e) {
    // Check if click is inside the shadow host that contains our trigger/panel
    const host = trigger.getRootNode()?.host;
    if (host && !host.contains(e.target) && e.target !== host) {
      close();
    }
  }

  function escapeKey(e) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  }

  function destroy() {
    // Teardown without firing onClose (which would mutate store during render)
    if (isOpen) {
      isOpen = false;
      panel.style.display = 'none';
      panel.classList.remove('cal-animate-slide-up');
    }
    document.removeEventListener('click', outsideClick, true);
    document.removeEventListener('keydown', escapeKey, true);
  }

  return { panel, open, close, destroy, get isOpen() { return isOpen; } };
}

export const popoverStyles = `
  .cal-popover-wrapper {
    position: relative;
    display: inline-block;
  }

  .cal-popover {
    position: absolute;
    left: 0;
    z-index: 50;
    background: hsl(var(--cal-bg));
    border: 1px solid hsl(var(--cal-border));
    border-radius: var(--cal-radius);
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -2px rgba(0, 0, 0, 0.04);
    padding: 12px;
  }

  .cal-trigger {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    font-size: 14px;
    border: 1px solid hsl(var(--cal-border));
    border-radius: var(--cal-radius-sm);
    background: hsl(var(--cal-bg));
    color: hsl(var(--cal-fg));
    cursor: pointer;
    transition: border-color var(--cal-transition);
    white-space: nowrap;
  }

  .cal-trigger:hover {
    border-color: hsl(var(--cal-fg-muted));
  }

  .cal-trigger--placeholder {
    color: hsl(var(--cal-fg-muted));
  }

  .cal-trigger__icon {
    display: flex;
    color: hsl(var(--cal-fg-muted));
  }
`;
