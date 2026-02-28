export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Get the full or short day name for a date string.
 * @param {string} dateStr - ISO date string
 * @param {'long'|'short'} format
 * @returns {string}
 */
export function getDayName(dateStr, format = 'short') {
  const d = parseDate(dateStr);
  if (!d) return '';
  return format === 'long' ? DAY_NAMES[d.getDay()] : SHORT_DAY_NAMES[d.getDay()];
}

/**
 * Returns weekday labels starting from `firstDay` (0 = Sunday).
 */
export function getWeekdayLabels(firstDay = 0) {
  const labels = [];
  for (let i = 0; i < 7; i++) {
    labels.push(SHORT_WEEKDAYS[(firstDay + i) % 7]);
  }
  return labels;
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/** Returns "YYYY-MM-DD" string for a Date or {year, month, day}. */
export function toDateString(date) {
  if (typeof date === 'string') return date;
  const d = date instanceof Date ? date : new Date(date.year, date.month, date.day);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse an ISO date string or Date into a Date object at midnight local. */
export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  return null;
}

export function isSameDay(a, b) {
  if (!a || !b) return false;
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return false;
  return da.getFullYear() === db.getFullYear()
    && da.getMonth() === db.getMonth()
    && da.getDate() === db.getDate();
}

export function isInRange(date, start, end) {
  if (!date || !start || !end) return false;
  const d = parseDate(date);
  const s = parseDate(start);
  const e = parseDate(end);
  if (!d || !s || !e) return false;
  const dt = d.getTime();
  const st = Math.min(s.getTime(), e.getTime());
  const et = Math.max(s.getTime(), e.getTime());
  return dt >= st && dt <= et;
}

export function isBefore(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return false;
  return da.getTime() < db.getTime();
}

export function isAfter(a, b) {
  const da = parseDate(a);
  const db = parseDate(b);
  if (!da || !db) return false;
  return da.getTime() > db.getTime();
}

export function today() {
  return toDateString(new Date());
}

export function addMonths(year, month, delta) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/**
 * Checks if two date ranges overlap.
 * When allowSameDay=true, checkout/checkin on same day is NOT treated as overlap.
 */
export function rangesOverlap(startA, endA, startB, endB, allowSameDay = false) {
  if (!startA || !endA || !startB || !endB) return false;
  if (allowSameDay) {
    return startA < endB && endA > startB;
  }
  return startA <= endB && endA >= startB;
}

/** Returns ISO date string offset by N days. */
export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  if (!d) return dateStr;
  d.setDate(d.getDate() + n);
  return toDateString(d);
}

/** Returns array of all ISO date strings in range (inclusive). */
export function getDateRange(start, end) {
  const result = [];
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e) return result;
  const current = new Date(s);
  while (current <= e) {
    result.push(toDateString(current));
    current.setDate(current.getDate() + 1);
  }
  return result;
}

/**
 * Build a 42-cell (6×7) grid for the given month.
 * Each cell: { year, month, day, dateString, isCurrentMonth, isToday }
 * `firstDay` = 0 (Sun) .. 6 (Sat).
 */
export function buildMonthGrid(year, month, firstDay = 0) {
  const daysInMonth = getDaysInMonth(year, month);
  const rawStartDay = getFirstDayOfMonth(year, month);
  const startOffset = (rawStartDay - firstDay + 7) % 7;
  const cells = [];
  const todayStr = today();

  // Previous month fill
  const prev = addMonths(year, month, -1);
  const daysInPrev = getDaysInMonth(prev.year, prev.month);
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    const dateString = toDateString({ year: prev.year, month: prev.month, day });
    cells.push({ year: prev.year, month: prev.month, day, dateString, isCurrentMonth: false, isToday: dateString === todayStr });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = toDateString({ year, month, day });
    cells.push({ year, month, day, dateString, isCurrentMonth: true, isToday: dateString === todayStr });
  }

  // Next month fill
  const next = addMonths(year, month, 1);
  let i = 1;
  while (cells.length < 42) {
    const dateString = toDateString({ year: next.year, month: next.month, day: i });
    cells.push({ year: next.year, month: next.month, day: i, dateString, isCurrentMonth: false, isToday: dateString === todayStr });
    i++;
  }

  return cells;
}
