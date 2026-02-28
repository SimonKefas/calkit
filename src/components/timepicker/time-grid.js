/**
 * Time slot grid renderer — pill-shaped slot buttons in a responsive grid.
 */
import { formatTime, parseTime, isTimeInRange } from '../../core/times.js';

/**
 * @param {object} options
 * @param {Array<{time: string, label?: string, available?: boolean}>} options.slots
 * @param {string} options.mode - single|multi|range
 * @param {string|null} options.format - '12h'|'24h'
 * @param {string|string[]|{start,end}|null} options.selected
 * @param {string|null} options.hoverTime - for range preview
 * @param {string|null} options.rangeStart - for range mode in-progress
 * @param {string[]} options.unavailableTimes
 * @param {function} options.onSelect
 * @param {function} options.onHover
 * @returns {HTMLElement}
 */
export function renderTimeGrid(options) {
  const {
    slots = [], mode = 'single', format = '24h',
    selected, hoverTime, rangeStart,
    unavailableTimes = [],
    onSelect, onHover,
    durationLabels = false,
  } = options;

  const grid = document.createElement('div');
  grid.classList.add('cal-time-grid');
  if (durationLabels) grid.classList.add('cal-time-grid--duration');
  grid.setAttribute('role', 'listbox');
  if (mode === 'multi') grid.setAttribute('aria-multiselectable', 'true');

  for (const slot of slots) {
    const btn = document.createElement('button');
    btn.classList.add('cal-time-slot');
    btn.setAttribute('role', 'option');
    btn.dataset.time = slot.time;

    // Format display text — slot.displayText takes priority
    const parsed = parseTime(slot.time);
    const displayTime = slot.displayText
      ? slot.displayText
      : (parsed ? formatTime(parsed.hours, parsed.minutes, format) : slot.time);

    const timeSpan = document.createElement('span');
    timeSpan.classList.add('cal-time-slot__time');
    timeSpan.textContent = displayTime;
    btn.appendChild(timeSpan);

    if (slot.label) {
      const labelSpan = document.createElement('span');
      labelSpan.classList.add('cal-time-slot__label');
      labelSpan.textContent = slot.label;
      btn.appendChild(labelSpan);
    }

    // Available/unavailable
    const isUnavailable = slot.available === false || unavailableTimes.includes(slot.time);
    if (isUnavailable) {
      btn.classList.add('cal-time-slot--unavailable');
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
    }

    // Selected state
    const isSelected = isSlotSelected(slot.time, selected, mode);
    if (isSelected) {
      btn.classList.add('cal-time-slot--selected');
      btn.setAttribute('aria-selected', 'true');
    } else {
      btn.setAttribute('aria-selected', 'false');
    }

    // Range in-progress preview
    if (mode === 'range' && rangeStart && !isRangeComplete(selected) && hoverTime) {
      const inRange = isTimeInRange(slot.time, rangeStart, hoverTime);
      const isStart = slot.time === rangeStart;
      const isEnd = slot.time === hoverTime;
      if (inRange && !isStart && !isEnd) {
        btn.classList.add('cal-time-slot--in-range');
      }
      if (isStart) btn.classList.add('cal-time-slot--range-start');
      if (isEnd) btn.classList.add('cal-time-slot--range-end');
    } else if (mode === 'range' && selected && typeof selected === 'object' && selected.start && selected.end) {
      // Completed range
      const inRange = isTimeInRange(slot.time, selected.start, selected.end);
      const isStart = slot.time === selected.start;
      const isEnd = slot.time === selected.end;
      if (isStart) btn.classList.add('cal-time-slot--range-start', 'cal-time-slot--selected');
      if (isEnd) btn.classList.add('cal-time-slot--range-end', 'cal-time-slot--selected');
      if (inRange && !isStart && !isEnd) btn.classList.add('cal-time-slot--in-range');
    }

    // Events
    if (!isUnavailable) {
      btn.addEventListener('click', () => onSelect?.(slot.time));
      btn.addEventListener('mouseenter', () => onHover?.(slot.time));
    }

    grid.appendChild(btn);
  }

  grid.addEventListener('mouseleave', () => onHover?.(null));

  return grid;
}

function isSlotSelected(time, selected, mode) {
  if (!selected) return false;
  if (mode === 'single') return selected === time;
  if (mode === 'multi') return Array.isArray(selected) && selected.includes(time);
  if (mode === 'range') {
    if (typeof selected === 'object' && selected.start && selected.end) {
      return selected.start === time || selected.end === time;
    }
  }
  return false;
}

function isRangeComplete(selected) {
  return selected && typeof selected === 'object' && selected.start && selected.end;
}

export const timeGridStyles = `
  .cal-time-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
    max-height: 280px;
    overflow-y: auto;
    padding: 4px;
  }

  .cal-time-grid::-webkit-scrollbar {
    width: 6px;
  }

  .cal-time-grid::-webkit-scrollbar-track {
    background: transparent;
  }

  .cal-time-grid::-webkit-scrollbar-thumb {
    background: hsl(var(--cal-border));
    border-radius: 3px;
  }

  .cal-time-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 40px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 13px;
    background: hsl(var(--cal-bg-muted));
    color: hsl(var(--cal-fg));
    transition: background var(--cal-transition), color var(--cal-transition);
    gap: 1px;
  }

  .cal-time-slot:not(.cal-time-slot--unavailable):not(.cal-time-slot--selected):hover {
    background: hsl(var(--cal-hover));
  }

  .cal-time-slot__time {
    font-weight: 500;
    line-height: 1;
  }

  .cal-time-slot__label {
    font-size: 9px;
    opacity: 0.7;
    line-height: 1;
  }

  .cal-time-slot--selected {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    font-weight: 600;
  }

  .cal-time-slot--in-range {
    background: hsl(var(--cal-accent-subtle));
  }

  .cal-time-slot--range-start,
  .cal-time-slot--range-end {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    font-weight: 600;
  }

  .cal-time-slot--unavailable {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .cal-time-grid--duration {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .cal-time-grid--duration .cal-time-slot {
    font-size: 12px;
  }
`;
