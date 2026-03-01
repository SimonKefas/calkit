/**
 * Time utility functions for the time picker component.
 */

/**
 * Parse a time string into { hours, minutes }.
 * Handles "09:00", "9:00 AM", "14:30", "2:30 PM".
 */
export function parseTime(str) {
  if (!str || typeof str !== 'string') return null;
  const trimmed = str.trim().toUpperCase();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
    return { hours, minutes };
  }
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return { hours: parseInt(match24[1], 10), minutes: parseInt(match24[2], 10) };
  }
  return null;
}

/**
 * Format hours/minutes into a display string.
 * @param {number} hours
 * @param {number} minutes
 * @param {'12h'|'24h'} format
 */
export function formatTime(hours, minutes, format = '24h') {
  const mm = String(minutes).padStart(2, '0');
  if (format === '12h') {
    const period = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${mm} ${period}`;
  }
  return `${String(hours).padStart(2, '0')}:${mm}`;
}

/** Convert a time string (HH:MM or h:MM AM/PM) to minutes since midnight. */
export function timeToMinutes(str) {
  const t = parseTime(str);
  if (!t) return 0;
  return t.hours * 60 + t.minutes;
}

/** Convert minutes since midnight back to "HH:MM". */
export function minutesToTime(n) {
  const hours = Math.floor(n / 60) % 24;
  const minutes = n % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Generate time slots between start and end times.
 * Supports wrapping past midnight (e.g. start="22:00", end="02:00").
 * @param {string} startTime - e.g. "09:00"
 * @param {string} endTime - e.g. "17:00"
 * @param {number} intervalMinutes - e.g. 30
 * @returns {string[]} - e.g. ["09:00", "09:30", "10:00", ...]
 */
export function generateSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  // Wrap past midnight
  if (endMin <= startMin) endMin += 1440;
  for (let m = startMin; m <= endMin; m += intervalMinutes) {
    slots.push(minutesToTime(m % 1440));
  }
  return slots;
}

/**
 * Generate time slots with duration labels (e.g. "09:00–09:30").
 * Supports wrapping past midnight.
 * @param {string} startTime - e.g. "09:00"
 * @param {string} endTime - e.g. "17:00"
 * @param {number} intervalMinutes - e.g. 30
 * @param {'12h'|'24h'} format
 * @returns {Array<{time: string, displayText: string}>}
 */
export function generateDurationSlots(startTime, endTime, intervalMinutes, format = '24h') {
  const slots = [];
  const startMin = timeToMinutes(startTime);
  let endMin = timeToMinutes(endTime);
  // Wrap past midnight
  if (endMin <= startMin) endMin += 1440;
  for (let m = startMin; m <= endMin; m += intervalMinutes) {
    const time = minutesToTime(m % 1440);
    const nextMin = m + intervalMinutes;
    const endSlotTime = minutesToTime(Math.min(nextMin, endMin + intervalMinutes) % 1440);
    const parsed = parseTime(time);
    const parsedEnd = parseTime(endSlotTime);
    const fromText = parsed ? formatTime(parsed.hours, parsed.minutes, format) : time;
    const toText = parsedEnd ? formatTime(parsedEnd.hours, parsedEnd.minutes, format) : endSlotTime;
    slots.push({ time, displayText: `${fromText}\u2013${toText}` });
  }
  return slots;
}

/** Returns true if time A is strictly before time B. */
export function isTimeBefore(a, b) {
  return timeToMinutes(a) < timeToMinutes(b);
}

/**
 * Check if two time ranges overlap (exclusive boundaries).
 * Supports wrapping past midnight for either range.
 * @param {string} startA - "HH:MM"
 * @param {string} endA - "HH:MM"
 * @param {string} startB - "HH:MM"
 * @param {string} endB - "HH:MM"
 * @returns {boolean}
 */
export function timeRangesOverlap(startA, endA, startB, endB) {
  let a0 = timeToMinutes(startA);
  let a1 = timeToMinutes(endA);
  let b0 = timeToMinutes(startB);
  let b1 = timeToMinutes(endB);
  if (a1 <= a0) a1 += 1440;
  if (b1 <= b0) b1 += 1440;
  return a0 < b1 && a1 > b0;
}

/**
 * Get the current time as "HH:MM".
 * @returns {string}
 */
export function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Returns true if time is within [start, end] inclusive.
 * Supports wrapping past midnight (e.g. start=22:00, end=02:00).
 */
export function isTimeInRange(time, start, end) {
  const t = timeToMinutes(time);
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (e >= s) {
    // Normal range
    return t >= s && t <= e;
  }
  // Wrapped range: e.g. 22:00–02:00
  return t >= s || t <= e;
}
