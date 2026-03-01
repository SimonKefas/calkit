/**
 * Scheduler utility functions — week computation, overlap resolution, time/pixel math.
 */

import { parseDate, toDateString, addDays, today, getMonthNames } from './dates.js';
import { timeToMinutes, minutesToTime } from './times.js';

/**
 * Get the start of the week containing dateStr.
 * @param {string} dateStr - ISO date string
 * @param {number} firstDay - 0=Sun, 1=Mon, etc.
 * @returns {string} ISO date string of week start
 */
export function getWeekStart(dateStr, firstDay = 0) {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  const day = d.getDay();
  const diff = (day - firstDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toDateString(d);
}

/**
 * Get all 7 dates of the week containing dateStr.
 * @param {string} dateStr - ISO date string
 * @param {number} firstDay - 0=Sun, 1=Mon, etc.
 * @returns {string[]} 7 ISO date strings
 */
export function getWeekDates(dateStr, firstDay = 0) {
  const start = getWeekStart(dateStr, firstDay);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDays(start, i));
  }
  return dates;
}

/**
 * Get display title for the current view.
 * @param {'day'|'week'|'month'} view
 * @param {string} anchorDate - ISO date
 * @param {string[]} weekDates - for week view
 * @param {string} [locale] - BCP 47 locale tag
 * @returns {string}
 */
export function getViewTitle(view, anchorDate, weekDates, locale) {
  const d = parseDate(anchorDate);
  if (!d) return '';
  const months = getMonthNames(locale);

  if (view === 'day') {
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  if (view === 'week' && weekDates && weekDates.length === 7) {
    const first = parseDate(weekDates[0]);
    const last = parseDate(weekDates[6]);
    if (!first || !last) return '';
    if (first.getMonth() === last.getMonth()) {
      return `${months[first.getMonth()]} ${first.getDate()}\u2013${last.getDate()}, ${first.getFullYear()}`;
    }
    if (first.getFullYear() === last.getFullYear()) {
      return `${months[first.getMonth()].slice(0, 3)} ${first.getDate()} \u2013 ${months[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${first.getFullYear()}`;
    }
    return `${months[first.getMonth()].slice(0, 3)} ${first.getDate()}, ${first.getFullYear()} \u2013 ${months[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${last.getFullYear()}`;
  }

  if (view === 'month') {
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  return '';
}

/**
 * Filter events that fall on a specific date.
 * @param {Event[]} events
 * @param {string} dateStr - ISO date
 * @returns {Event[]}
 */
export function getEventsForDate(events, dateStr) {
  return events.filter((ev) => {
    if (!ev.start) return false;
    // All-day or multi-day event
    if (ev.end && ev.end !== ev.start) {
      return dateStr >= ev.start && dateStr <= ev.end;
    }
    return ev.start === dateStr;
  });
}

/**
 * Filter events that overlap with a date range.
 * @param {Event[]} events
 * @param {string} startDate
 * @param {string} endDate
 * @returns {Event[]}
 */
export function getEventsForRange(events, startDate, endDate) {
  return events.filter((ev) => {
    if (!ev.start) return false;
    const evEnd = ev.end || ev.start;
    return ev.start <= endDate && evEnd >= startDate;
  });
}

/**
 * Resolve overlapping timed events for side-by-side stacking.
 * Adds _col and _totalCols to each event.
 * @param {Event[]} events - timed events for a single day+resource
 * @returns {Event[]} same events with _col and _totalCols set
 */
export function resolveEventOverlaps(events) {
  if (!events.length) return events;

  // Sort by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const aStart = timeToMinutes(a.startTime || '00:00');
    const bStart = timeToMinutes(b.startTime || '00:00');
    if (aStart !== bStart) return aStart - bStart;
    const aEnd = timeToMinutes(a.endTime || '23:59');
    const bEnd = timeToMinutes(b.endTime || '23:59');
    return (bEnd - bStart) - (aEnd - aStart);
  });

  // Build overlap groups
  const columns = []; // each column tracks the end time of its last event

  for (const ev of sorted) {
    const evStart = timeToMinutes(ev.startTime || '00:00');
    const evEnd = timeToMinutes(ev.endTime || '23:59');

    // Find first column where event fits (no overlap)
    let placed = false;
    for (let c = 0; c < columns.length; c++) {
      if (evStart >= columns[c]) {
        ev._col = c;
        columns[c] = evEnd;
        placed = true;
        break;
      }
    }
    if (!placed) {
      ev._col = columns.length;
      columns.push(evEnd);
    }
  }

  // Calculate total columns for each group of overlapping events
  // Simple approach: for each event, total cols = max columns used by overlapping events
  for (const ev of sorted) {
    const evStart = timeToMinutes(ev.startTime || '00:00');
    const evEnd = timeToMinutes(ev.endTime || '23:59');
    let maxCol = ev._col;
    for (const other of sorted) {
      const oStart = timeToMinutes(other.startTime || '00:00');
      const oEnd = timeToMinutes(other.endTime || '23:59');
      if (oStart < evEnd && oEnd > evStart) {
        maxCol = Math.max(maxCol, other._col);
      }
    }
    ev._totalCols = maxCol + 1;
  }

  return sorted;
}

/**
 * Convert a time string to pixel offset from grid start.
 * @param {string} timeStr - "HH:MM"
 * @param {string} startTime - grid start time
 * @param {number} slotSize - pixels per slot
 * @param {number} interval - minutes per slot
 * @returns {number}
 */
export function timeToPixelOffset(timeStr, startTime, slotSize, interval) {
  const mins = timeToMinutes(timeStr) - timeToMinutes(startTime);
  return (mins / interval) * slotSize;
}

/**
 * Convert pixel offset to time string.
 * @param {number} px - pixel offset
 * @param {string} startTime - grid start time
 * @param {number} slotSize - pixels per slot
 * @param {number} interval - minutes per slot
 * @returns {string} "HH:MM"
 */
export function pixelOffsetToTime(px, startTime, slotSize, interval) {
  const mins = (px / slotSize) * interval;
  const totalMins = timeToMinutes(startTime) + mins;
  return minutesToTime(Math.round(totalMins));
}

/**
 * Snap a time to the nearest slot boundary.
 * @param {string} timeStr - "HH:MM"
 * @param {number} interval - minutes
 * @returns {string} snapped "HH:MM"
 */
export function snapToSlot(timeStr, interval) {
  const mins = timeToMinutes(timeStr);
  const snapped = Math.round(mins / interval) * interval;
  return minutesToTime(snapped);
}
