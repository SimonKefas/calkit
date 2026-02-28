/**
 * Slot selection prompt — small floating card anchored to a selected slot.
 */

import { parseTime, formatTime } from '../../core/times.js';

/**
 * Render the slot prompt card.
 * @param {object} options
 * @param {string} options.date - ISO date string
 * @param {string} [options.startTime] - slot start time (null for month view)
 * @param {string} [options.endTime] - slot end time (null for month view)
 * @param {string} [options.resourceName] - resource label to display
 * @param {'12h'|'24h'} [options.format] - time format
 * @param {function} options.onCreate - called when "+" button is clicked
 * @returns {HTMLElement}
 */
export function renderSlotPrompt({ date, startTime, endTime, resourceName, format, onCreate }) {
  const card = document.createElement('div');
  card.classList.add('cal-sched-slot-prompt', 'cal-animate-fade');

  const info = document.createElement('div');
  info.classList.add('cal-sched-slot-prompt__info');

  // Time range (day/week views)
  if (startTime && endTime) {
    const startP = parseTime(startTime);
    const endP = parseTime(endTime);
    const timeEl = document.createElement('div');
    timeEl.classList.add('cal-sched-slot-prompt__time');
    if (startP && endP) {
      timeEl.textContent = `${formatTime(startP.hours, startP.minutes, format)}\u2013${formatTime(endP.hours, endP.minutes, format)}`;
    }
    info.appendChild(timeEl);
  } else {
    // Month view — show date
    const dateEl = document.createElement('div');
    dateEl.classList.add('cal-sched-slot-prompt__time');
    dateEl.textContent = date;
    info.appendChild(dateEl);
  }

  // Resource name
  if (resourceName) {
    const resEl = document.createElement('div');
    resEl.classList.add('cal-sched-slot-prompt__resource');
    resEl.textContent = resourceName;
    info.appendChild(resEl);
  }

  card.appendChild(info);

  // Create button
  const btn = document.createElement('button');
  btn.classList.add('cal-sched-slot-prompt__btn');
  btn.setAttribute('aria-label', 'Create event');
  btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3v8M3 7h8"/></svg>`;
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    onCreate?.();
  });
  card.appendChild(btn);

  // Prevent click-through
  card.addEventListener('click', (e) => e.stopPropagation());

  return card;
}

export const slotPromptStyles = `
  .cal-sched-slot-prompt {
    position: absolute;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 8px;
    background: hsl(var(--cal-bg));
    border: 1px solid hsl(var(--cal-border));
    border-radius: var(--cal-radius);
    box-shadow: 0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 1px 4px -1px rgba(0, 0, 0, 0.06);
    padding: 6px 8px 6px 12px;
    font-size: 12px;
    color: hsl(var(--cal-fg));
    white-space: nowrap;
    pointer-events: auto;
  }

  .cal-sched-slot-prompt__info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .cal-sched-slot-prompt__time {
    font-weight: 600;
    font-size: 12px;
  }

  .cal-sched-slot-prompt__resource {
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
  }

  .cal-sched-slot-prompt__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    border-radius: var(--cal-radius-sm);
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    flex-shrink: 0;
    transition: opacity var(--cal-transition);
  }

  .cal-sched-slot-prompt__btn:hover {
    opacity: 0.85;
  }

  /* Selected slot highlight */
  .cal-sched-week__slot--selected,
  .cal-sched-day__slot--selected {
    background: hsl(var(--cal-accent-subtle));
    box-shadow: inset 0 0 0 1.5px hsl(var(--cal-accent));
    z-index: 1;
    position: relative;
  }

  .cal-sched-month__cell--selected {
    background: hsl(var(--cal-accent-subtle));
    box-shadow: inset 0 0 0 1.5px hsl(var(--cal-accent));
  }
`;
