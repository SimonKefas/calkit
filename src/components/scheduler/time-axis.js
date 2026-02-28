/**
 * Time axis renderer — hour labels along the time axis.
 */

import { generateSlots, parseTime, formatTime } from '../../core/times.js';

/**
 * Render the time axis with hour labels.
 * @param {object} options
 * @param {string} options.startTime - "HH:MM"
 * @param {string} options.endTime - "HH:MM"
 * @param {number} options.interval - minutes per slot
 * @param {number} options.slotHeight - pixels per slot
 * @param {'12h'|'24h'} options.format
 * @returns {HTMLElement}
 */
export function renderTimeAxis({ startTime, endTime, interval, slotHeight, format }) {
  const axis = document.createElement('div');
  axis.classList.add('cal-sched-time-axis');

  const slots = generateSlots(startTime, endTime, interval);
  const slotsPerHour = 60 / interval;

  for (let i = 0; i < slots.length; i++) {
    const time = slots[i];
    const parsed = parseTime(time);
    if (!parsed) continue;

    const slot = document.createElement('div');
    slot.classList.add('cal-sched-time-axis__slot');
    slot.style.height = `${slotHeight}px`;

    // Only show label at hour boundaries
    if (parsed.minutes === 0) {
      const label = document.createElement('span');
      label.classList.add('cal-sched-time-axis__label');
      label.textContent = formatTime(parsed.hours, parsed.minutes, format);
      slot.appendChild(label);
    }

    axis.appendChild(slot);
  }

  return axis;
}

export const timeAxisStyles = `
  .cal-sched-time-axis {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 56px;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-time-axis__slot {
    position: relative;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-right: 8px;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-time-axis__label {
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
    transform: translateY(-7px);
    white-space: nowrap;
    user-select: none;
  }
`;
