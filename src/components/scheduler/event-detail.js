/**
 * Event detail popover — shows event info when clicking an event block.
 */

import { parseTime, formatTime } from '../../core/times.js';
import { getDayName, parseDate, MONTH_NAMES } from '../../core/dates.js';

/**
 * Render an event detail popover card.
 * @param {object} options
 * @param {object} options.event
 * @param {object} [options.resource]
 * @param {'12h'|'24h'} options.format
 * @param {function} options.onClose
 * @returns {HTMLElement}
 */
export function renderEventDetail({ event, resource, format, onClose, actions, onAction }) {
  // Backdrop
  const backdrop = document.createElement('div');
  backdrop.classList.add('cal-sched-detail-backdrop');
  backdrop.addEventListener('click', onClose);

  // Card
  const card = document.createElement('div');
  card.classList.add('cal-sched-detail', 'cal-animate-fade');
  card.addEventListener('click', (e) => e.stopPropagation());

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.classList.add('cal-sched-detail__close');
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 4l6 6M10 4l-6 6"/></svg>`;
  closeBtn.addEventListener('click', onClose);
  card.appendChild(closeBtn);

  // Color accent
  const color = event.color || 'blue';
  const accent = document.createElement('div');
  accent.classList.add('cal-sched-detail__accent');
  accent.style.background = `hsl(var(--cal-booking-${color}-fg))`;
  card.appendChild(accent);

  // Title
  const title = document.createElement('div');
  title.classList.add('cal-sched-detail__title');
  title.textContent = event.title || 'Untitled';
  card.appendChild(title);

  // Time row
  if (event.startTime && event.endTime) {
    const timeRow = document.createElement('div');
    timeRow.classList.add('cal-sched-detail__row');

    const icon = document.createElement('span');
    icon.classList.add('cal-sched-detail__icon');
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3.5l2.5 1.5"/></svg>`;
    timeRow.appendChild(icon);

    const startP = parseTime(event.startTime);
    const endP = parseTime(event.endTime);
    const timeText = document.createElement('span');
    if (startP && endP) {
      timeText.textContent = `${formatTime(startP.hours, startP.minutes, format)}\u2013${formatTime(endP.hours, endP.minutes, format)}`;
    }
    timeRow.appendChild(timeText);
    card.appendChild(timeRow);
  }

  // Date row
  if (event.start) {
    const dateRow = document.createElement('div');
    dateRow.classList.add('cal-sched-detail__row');

    const icon = document.createElement('span');
    icon.classList.add('cal-sched-detail__icon');
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1.5" y="2.5" width="11" height="9.5" rx="1.5"/><path d="M4.5 1v2.5M9.5 1v2.5M1.5 5.5h11"/></svg>`;
    dateRow.appendChild(icon);

    const d = parseDate(event.start);
    const dateText = document.createElement('span');
    if (d) {
      let text = `${getDayName(event.start, 'long')}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
      if (event.end && event.end !== event.start) {
        const de = parseDate(event.end);
        if (de) {
          text += ` \u2013 ${MONTH_NAMES[de.getMonth()]} ${de.getDate()}`;
        }
      }
      dateText.textContent = text;
    }
    dateRow.appendChild(dateText);
    card.appendChild(dateRow);
  }

  // Resource row
  if (resource && resource.name) {
    const resRow = document.createElement('div');
    resRow.classList.add('cal-sched-detail__row');

    const dot = document.createElement('span');
    dot.classList.add('cal-sched-detail__res-dot');
    dot.style.background = `hsl(var(--cal-booking-${resource.color || 'blue'}-fg))`;
    resRow.appendChild(dot);

    const resText = document.createElement('span');
    resText.textContent = resource.name;
    if (resource.capacity) {
      resText.textContent += ` (capacity: ${resource.capacity})`;
    }
    resRow.appendChild(resText);
    card.appendChild(resRow);
  }

  // Metadata
  if (event.metadata && typeof event.metadata === 'object') {
    const entries = Object.entries(event.metadata);
    if (entries.length > 0) {
      const metaSection = document.createElement('div');
      metaSection.classList.add('cal-sched-detail__meta');
      for (const [key, value] of entries) {
        const row = document.createElement('div');
        row.classList.add('cal-sched-detail__meta-row');
        const label = document.createElement('span');
        label.classList.add('cal-sched-detail__meta-label');
        label.textContent = key;
        const val = document.createElement('span');
        val.textContent = String(value);
        row.appendChild(label);
        row.appendChild(val);
        metaSection.appendChild(row);
      }
      card.appendChild(metaSection);
    }
  }

  // Action buttons
  if (actions && actions.length > 0) {
    const actionsRow = document.createElement('div');
    actionsRow.classList.add('cal-sched-detail__actions');
    for (const action of actions) {
      const btn = document.createElement('button');
      btn.classList.add('cal-sched-detail__action');
      if (action.type === 'danger') btn.classList.add('cal-sched-detail__action--danger');
      btn.textContent = action.label;
      btn.addEventListener('click', () => {
        onAction?.(action.label);
      });
      actionsRow.appendChild(btn);
    }
    card.appendChild(actionsRow);
  }

  backdrop.appendChild(card);

  // Escape key
  const handleKey = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };
  backdrop.addEventListener('keydown', handleKey);
  requestAnimationFrame(() => closeBtn.focus());

  return backdrop;
}

export const eventDetailStyles = `
  .cal-sched-detail-backdrop {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 80px;
    background: rgba(0, 0, 0, 0.06);
  }

  .cal-sched-detail {
    position: relative;
    background: hsl(var(--cal-bg));
    border: 1px solid hsl(var(--cal-border));
    border-radius: var(--cal-radius);
    box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.12), 0 2px 8px -2px rgba(0, 0, 0, 0.06);
    padding: 16px 20px;
    min-width: 260px;
    max-width: 340px;
    font-size: 13px;
    color: hsl(var(--cal-fg));
    user-select: text;
  }

  .cal-sched-detail__close {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: var(--cal-radius-sm);
    color: hsl(var(--cal-fg-muted));
    transition: background var(--cal-transition), color var(--cal-transition);
  }

  .cal-sched-detail__close:hover {
    background: hsl(var(--cal-hover));
    color: hsl(var(--cal-fg));
  }

  .cal-sched-detail__accent {
    width: 32px;
    height: 4px;
    border-radius: 2px;
    margin-bottom: 10px;
  }

  .cal-sched-detail__title {
    font-size: 15px;
    font-weight: 600;
    margin-bottom: 12px;
    padding-right: 24px;
  }

  .cal-sched-detail__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    color: hsl(var(--cal-fg-muted));
    font-size: 13px;
  }

  .cal-sched-detail__icon {
    display: flex;
    flex-shrink: 0;
    color: hsl(var(--cal-fg-muted));
  }

  .cal-sched-detail__res-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-left: 3px;
    margin-right: 3px;
  }

  .cal-sched-detail__meta {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid hsl(var(--cal-border));
  }

  .cal-sched-detail__meta-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    font-size: 12px;
    color: hsl(var(--cal-fg-muted));
  }

  .cal-sched-detail__meta-label {
    font-weight: 500;
    text-transform: capitalize;
  }

  .cal-sched-detail__actions {
    display: flex;
    gap: 6px;
    margin-top: 14px;
    padding-top: 12px;
    border-top: 1px solid hsl(var(--cal-border));
  }

  .cal-sched-detail__action {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border-radius: var(--cal-radius-sm);
    border: 1px solid hsl(var(--cal-border));
    color: hsl(var(--cal-fg));
    background: hsl(var(--cal-bg));
    transition: background var(--cal-transition);
    cursor: pointer;
  }

  .cal-sched-detail__action:hover {
    background: hsl(var(--cal-hover));
  }

  .cal-sched-detail__action--danger {
    color: hsl(var(--cal-status-error-fg));
    border-color: hsl(var(--cal-status-error-border));
  }

  .cal-sched-detail__action--danger:hover {
    background: hsl(var(--cal-status-error-bg));
  }
`;
