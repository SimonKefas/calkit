/**
 * Month view renderer — month grid with event chips + resource tab filtering.
 */

import { buildMonthGrid, getWeekdayLabels, parseDate, isSameDay, today } from '../../core/dates.js';
import { getEventsForDate } from '../../core/scheduler-utils.js';
import { renderMonthChip, eventBlockStyles } from './event-block.js';
import { renderSlotPrompt } from './slot-prompt.js';

const MAX_VISIBLE_EVENTS = 3;

/**
 * Render the month view.
 * @param {object} options
 * @param {string} options.date - anchor date (YYYY-MM-DD)
 * @param {number} options.firstDay
 * @param {object[]} options.resources
 * @param {object[]} options.events
 * @param {'12h'|'24h'} options.format
 * @param {string|null} options.selectedResourceId - resource filter (null = all)
 * @param {function} options.onSlotClick - (date)
 * @param {function} options.onEventClick - (event, resourceId, resource)
 * @param {function} options.onResourceFilter - (resourceId|null)
 * @returns {HTMLElement}
 */
export function renderMonthView({
  date, firstDay, resources, events, format,
  selectedResourceId, selectedDate, eventContent,
  onSlotClick, onEventClick, onSlotCreate,
}) {
  const container = document.createElement('div');
  container.classList.add('cal-sched-month');

  const d = parseDate(date);
  if (!d) return container;

  const year = d.getFullYear();
  const month = d.getMonth();
  const todayStr = today();

  // Weekday labels
  const weekdayRow = document.createElement('div');
  weekdayRow.classList.add('cal-sched-month__weekdays');
  const labels = getWeekdayLabels(firstDay);
  for (const label of labels) {
    const el = document.createElement('div');
    el.classList.add('cal-sched-month__weekday');
    el.textContent = label;
    weekdayRow.appendChild(el);
  }
  container.appendChild(weekdayRow);

  // Month grid
  const grid = document.createElement('div');
  grid.classList.add('cal-sched-month__grid');

  const cells = buildMonthGrid(year, month, firstDay);

  for (const cell of cells) {
    const cellEl = document.createElement('div');
    cellEl.classList.add('cal-sched-month__cell');
    if (!cell.isCurrentMonth) cellEl.classList.add('cal-sched-month__cell--outside');
    if (cell.isToday) cellEl.classList.add('cal-sched-month__cell--today');
    if (selectedDate && cell.dateString === selectedDate) cellEl.classList.add('cal-sched-month__cell--selected');

    cellEl.addEventListener('click', (e) => {
      // Only fire if not clicking an event chip
      if (e.target.closest('.cal-sched-month-chip')) return;
      onSlotClick?.(cell.dateString);
    });

    // Day number
    const dayNum = document.createElement('div');
    dayNum.classList.add('cal-sched-month__day-num');
    if (cell.isToday) dayNum.classList.add('cal-sched-month__day-num--today');
    dayNum.textContent = cell.day;
    cellEl.appendChild(dayNum);

    // Events for this day
    let dayEvents = getEventsForDate(events, cell.dateString);
    if (selectedResourceId) {
      dayEvents = dayEvents.filter((ev) => ev.resourceId === selectedResourceId);
    }

    // Sort: timed events first (by start time), then all-day
    dayEvents.sort((a, b) => {
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return 0;
    });

    const eventsContainer = document.createElement('div');
    eventsContainer.classList.add('cal-sched-month__events');

    const visible = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
    const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;

    for (const ev of visible) {
      const resource = resources.find((r) => r.id === ev.resourceId);
      eventsContainer.appendChild(renderMonthChip({
        event: ev,
        format,
        onClick: (event) => onEventClick?.(event, ev.resourceId, resource),
        eventContent,
        resource,
      }));
    }

    if (overflow > 0) {
      const more = document.createElement('div');
      more.classList.add('cal-sched-month__more');
      more.textContent = `+${overflow} more`;
      eventsContainer.appendChild(more);
    }

    cellEl.appendChild(eventsContainer);

    // Slot prompt on selected cell
    if (selectedDate && cell.dateString === selectedDate) {
      cellEl.style.position = 'relative';
      cellEl.appendChild(renderSlotPrompt({
        date: cell.dateString,
        startTime: null,
        endTime: null,
        resourceName: null,
        format,
        onCreate: () => onSlotCreate?.(cell.dateString),
      }));
    }

    grid.appendChild(cellEl);
  }

  container.appendChild(grid);
  return container;
}

export const monthViewStyles = `
  .cal-sched-month {
    border: 1px solid hsl(var(--cal-sched-grid-line));
    border-radius: var(--cal-radius);
    overflow: hidden;
  }

  .cal-sched-month__weekdays {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    background: hsl(var(--cal-sched-header-bg));
  }

  .cal-sched-month__weekday {
    font-size: 11px;
    font-weight: 500;
    color: hsl(var(--cal-fg-muted));
    text-align: center;
    padding: 8px 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .cal-sched-month__grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .cal-sched-month__cell {
    min-height: 100px;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    padding: 4px;
    cursor: pointer;
    transition: background var(--cal-transition);
  }

  .cal-sched-month__cell:nth-child(7n) {
    border-right: none;
  }

  .cal-sched-month__cell:hover {
    background: hsl(var(--cal-sched-slot-hover));
  }

  .cal-sched-month__cell--outside {
    opacity: 0.4;
  }

  .cal-sched-month__day-num {
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--cal-fg));
    margin-bottom: 4px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cal-sched-month__day-num--today {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    border-radius: 50%;
  }

  .cal-sched-month__events {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cal-sched-month__more {
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
    padding: 1px 6px;
    cursor: pointer;
  }

  .cal-sched-month__more:hover {
    color: hsl(var(--cal-fg));
  }
`;
