/**
 * Scheduler data utilities — event filtering, availability engine.
 */

import { timeToMinutes, minutesToTime } from '../../core/times.js';
import { addDays, today } from '../../core/dates.js';
import { getEventsForDate } from '../../core/scheduler-utils.js';

/**
 * Get events for a specific resource on a specific date.
 * @param {Event[]} events
 * @param {string} resourceId
 * @param {string} dateStr
 * @returns {Event[]}
 */
export function getResourceDayEvents(events, resourceId, dateStr) {
  return getEventsForDate(events, dateStr).filter(
    (ev) => ev.resourceId === resourceId
  );
}

/**
 * Check if a time slot is available for a resource on a date.
 * @param {Event[]} events
 * @param {string} resourceId
 * @param {string} dateStr
 * @param {string} startTime - "HH:MM"
 * @param {string} endTime - "HH:MM"
 * @returns {boolean}
 */
export function isSlotAvailable(events, resourceId, dateStr, startTime, endTime) {
  const dayEvents = getResourceDayEvents(events, resourceId, dateStr);
  const slotStart = timeToMinutes(startTime);
  const slotEnd = timeToMinutes(endTime);

  for (const ev of dayEvents) {
    // Skip all-day events in time-slot checks
    if (!ev.startTime || !ev.endTime) continue;
    const evStart = timeToMinutes(ev.startTime);
    const evEnd = timeToMinutes(ev.endTime);
    if (slotStart < evEnd && slotEnd > evStart) {
      return false;
    }
  }
  return true;
}

/**
 * Find the first available slot matching criteria.
 * Searches up to 14 days from opts.date (or today).
 * @param {object} opts
 * @param {string} [opts.date] - start searching from this date
 * @param {number} opts.duration - required duration in minutes
 * @param {string} [opts.resourceId] - specific resource, or search all
 * @param {number} [opts.minCapacity] - minimum resource capacity
 * @param {Resource[]} resources
 * @param {Event[]} events
 * @param {number} interval - slot interval in minutes
 * @param {string} [dayStart='08:00'] - day grid start
 * @param {string} [dayEnd='18:00'] - day grid end
 * @returns {{ resourceId: string, date: string, startTime: string, endTime: string } | null}
 */
export function findAvailableSlot(opts, resources, events, interval, dayStart = '08:00', dayEnd = '18:00') {
  const { duration, resourceId, minCapacity } = opts;
  const startDate = opts.date || today();
  const searchDays = 14;

  // Filter resources
  let candidateResources = resources;
  if (resourceId) {
    candidateResources = resources.filter((r) => r.id === resourceId);
  }
  if (minCapacity) {
    candidateResources = candidateResources.filter(
      (r) => r.capacity && r.capacity >= minCapacity
    );
  }

  const dayStartMin = timeToMinutes(dayStart);
  const dayEndMin = timeToMinutes(dayEnd);

  for (let d = 0; d < searchDays; d++) {
    const dateStr = addDays(startDate, d);

    for (const resource of candidateResources) {
      // Try each slot
      for (let m = dayStartMin; m + duration <= dayEndMin; m += interval) {
        const slotStart = minutesToTime(m);
        const slotEnd = minutesToTime(m + duration);

        if (isSlotAvailable(events, resource.id, dateStr, slotStart, slotEnd)) {
          return {
            resourceId: resource.id,
            date: dateStr,
            startTime: slotStart,
            endTime: slotEnd,
          };
        }
      }
    }
  }

  return null;
}
