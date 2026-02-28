/**
 * Event block renderer — absolutely positioned card for timed events.
 */

import { timeToPixelOffset } from '../../core/scheduler-utils.js';
import { parseTime, formatTime } from '../../core/times.js';

/**
 * Render an event block (timed event card).
 * @param {object} options
 * @param {object} options.event - event object
 * @param {string} options.gridStartTime - grid start time
 * @param {number} options.slotHeight - pixels per slot
 * @param {number} options.interval - minutes per slot
 * @param {'12h'|'24h'} options.format
 * @param {function} [options.onClick]
 * @param {function} [options.eventContent] - custom content renderer
 * @param {boolean} [options.showTime] - show time row in default rendering
 * @param {object} [options.resource] - resource object
 * @param {boolean} [options.draggable] - enable drag handles
 * @returns {HTMLElement}
 */
export function renderEventBlock({ event, gridStartTime, slotHeight, interval, format, onClick, eventContent, showTime = true, resource, draggable }) {
  const block = document.createElement('div');
  block.classList.add('cal-sched-event');
  block.setAttribute('role', 'button');
  block.setAttribute('tabindex', '0');
  block.dataset.eventId = event.id;

  const isLocked = !!event.locked;

  if (draggable && !isLocked) {
    block.dataset.draggable = 'true';
  }

  if (isLocked) {
    block.classList.add('cal-sched-event--locked');
  }

  const color = event.color || 'blue';
  block.style.setProperty('--ev-bg', `var(--cal-booking-${color}-bg)`);
  block.style.setProperty('--ev-fg', `var(--cal-booking-${color}-fg)`);

  // Position
  if (event.startTime && event.endTime) {
    const top = timeToPixelOffset(event.startTime, gridStartTime, slotHeight, interval);
    const bottom = timeToPixelOffset(event.endTime, gridStartTime, slotHeight, interval);
    const height = Math.max(bottom - top, slotHeight * 0.5);
    block.style.top = `${top}px`;
    block.style.height = `${height}px`;

    // Overlap columns
    if (event._totalCols > 1) {
      const colWidth = 100 / event._totalCols;
      block.style.left = `${event._col * colWidth}%`;
      block.style.width = `${colWidth}%`;
    }
  }

  // Content
  if (typeof eventContent === 'function') {
    const custom = eventContent(event, resource);
    const wrapper = document.createElement('div');
    wrapper.classList.add('cal-sched-event__custom');
    if (custom instanceof HTMLElement) {
      wrapper.appendChild(custom);
    } else if (custom != null) {
      wrapper.textContent = String(custom);
    }
    block.appendChild(wrapper);
  } else {
    const title = document.createElement('div');
    title.classList.add('cal-sched-event__title');
    title.textContent = event.title || '';
    block.appendChild(title);

    if (showTime && event.startTime && event.endTime) {
      const time = document.createElement('div');
      time.classList.add('cal-sched-event__time');
      const startParsed = parseTime(event.startTime);
      const endParsed = parseTime(event.endTime);
      if (startParsed && endParsed) {
        time.textContent = `${formatTime(startParsed.hours, startParsed.minutes, format)}\u2013${formatTime(endParsed.hours, endParsed.minutes, format)}`;
      }
      block.appendChild(time);
    }
  }

  // Resize handle for draggable events (skip locked)
  if (draggable && !isLocked) {
    const handle = document.createElement('div');
    handle.classList.add('cal-sched-event__resize-handle');
    block.appendChild(handle);
  }

  if (onClick) {
    block.addEventListener('click', (e) => {
      if (block.dataset.wasDragged) {
        delete block.dataset.wasDragged;
        return;
      }
      e.stopPropagation();
      onClick(event);
    });
    block.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onClick(event);
      }
    });
  }

  return block;
}

/**
 * Render an all-day event chip.
 * @param {object} options
 * @param {object} options.event
 * @param {function} [options.onClick]
 * @param {function} [options.eventContent] - custom content renderer
 * @param {object} [options.resource] - resource object
 * @returns {HTMLElement}
 */
export function renderAllDayChip({ event, onClick, eventContent, resource }) {
  const chip = document.createElement('div');
  chip.classList.add('cal-sched-allday-chip');
  chip.dataset.eventId = event.id;

  const color = event.color || 'blue';
  chip.style.setProperty('--ev-bg', `var(--cal-booking-${color}-bg)`);
  chip.style.setProperty('--ev-fg', `var(--cal-booking-${color}-fg)`);

  if (typeof eventContent === 'function') {
    const custom = eventContent(event, resource);
    if (custom instanceof HTMLElement) {
      chip.appendChild(custom);
    } else if (custom != null) {
      chip.textContent = String(custom);
    }
  } else {
    chip.textContent = event.title || '';
  }

  if (onClick) {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(event);
    });
  }

  return chip;
}

/**
 * Render a month-view event chip (small pill).
 * @param {object} options
 * @param {object} options.event
 * @param {'12h'|'24h'} options.format
 * @param {function} [options.onClick]
 * @param {function} [options.eventContent] - custom content renderer
 * @param {object} [options.resource] - resource object
 * @returns {HTMLElement}
 */
export function renderMonthChip({ event, format, onClick, eventContent, resource }) {
  const chip = document.createElement('div');
  chip.classList.add('cal-sched-month-chip');
  chip.dataset.eventId = event.id;

  const color = event.color || 'blue';
  chip.style.setProperty('--ev-bg', `var(--cal-booking-${color}-bg)`);
  chip.style.setProperty('--ev-fg', `var(--cal-booking-${color}-fg)`);

  if (typeof eventContent === 'function') {
    const custom = eventContent(event, resource);
    if (custom instanceof HTMLElement) {
      chip.appendChild(custom);
    } else if (custom != null) {
      chip.textContent = String(custom);
    }
  } else {
    const dot = document.createElement('span');
    dot.classList.add('cal-sched-month-chip__dot');
    dot.style.background = `hsl(var(--cal-booking-${color}-fg))`;
    chip.appendChild(dot);

    const text = document.createElement('span');
    text.classList.add('cal-sched-month-chip__text');
    if (event.startTime) {
      const parsed = parseTime(event.startTime);
      const timeStr = parsed ? formatTime(parsed.hours, parsed.minutes, format) : event.startTime;
      text.textContent = `${timeStr} ${event.title || ''}`;
    } else {
      text.textContent = event.title || '';
    }
    chip.appendChild(text);
  }

  if (onClick) {
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick(event);
    });
  }

  return chip;
}

export const eventBlockStyles = `
  .cal-sched-event {
    position: absolute;
    left: 2px;
    right: 2px;
    background: hsl(var(--ev-bg));
    color: hsl(var(--ev-fg));
    border-left: 3px solid hsl(var(--ev-fg));
    border-radius: var(--cal-radius-sm);
    padding: 2px 6px;
    font-size: 12px;
    line-height: 1.3;
    overflow: hidden;
    cursor: pointer;
    transition: box-shadow var(--cal-transition);
    z-index: 1;
  }

  .cal-sched-event:hover {
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
    z-index: 2;
  }

  .cal-sched-event:focus-visible {
    outline: 2px solid hsl(var(--cal-ring));
    outline-offset: 1px;
  }

  .cal-sched-event__title {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cal-sched-event__time {
    font-size: 11px;
    opacity: 0.8;
    white-space: nowrap;
  }

  .cal-sched-event__custom {
    overflow: hidden;
  }

  .cal-sched-event--locked {
    cursor: default;
    opacity: 0.85;
  }

  .cal-sched-event--locked::after {
    content: '';
    position: absolute;
    top: 3px;
    right: 4px;
    width: 10px;
    height: 10px;
    background: currentColor;
    opacity: 0.25;
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M11 5V4a3 3 0 0 0-6 0v1H4v7h8V5h-1ZM6 4a2 2 0 1 1 4 0v1H6V4Z'/%3E%3C/svg%3E");
    mask-size: contain;
    mask-repeat: no-repeat;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='currentColor'%3E%3Cpath d='M11 5V4a3 3 0 0 0-6 0v1H4v7h8V5h-1ZM6 4a2 2 0 1 1 4 0v1H6V4Z'/%3E%3C/svg%3E");
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
  }

  .cal-sched-allday-chip {
    background: hsl(var(--ev-bg));
    color: hsl(var(--ev-fg));
    border-left: 3px solid hsl(var(--ev-fg));
    border-radius: var(--cal-radius-sm);
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: box-shadow var(--cal-transition);
  }

  .cal-sched-allday-chip:hover {
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
  }

  .cal-sched-month-chip {
    display: flex;
    align-items: center;
    gap: 4px;
    background: hsl(var(--ev-bg));
    color: hsl(var(--ev-fg));
    border-radius: var(--cal-radius-sm);
    padding: 1px 6px;
    font-size: 11px;
    cursor: pointer;
    overflow: hidden;
    transition: box-shadow var(--cal-transition);
  }

  .cal-sched-month-chip:hover {
    box-shadow: 0 2px 8px -2px rgba(0, 0, 0, 0.1);
  }

  .cal-sched-month-chip__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cal-sched-month-chip__text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
