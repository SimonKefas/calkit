/**
 * Week view renderer — 7 day columns, each subdivided by resources.
 */

import { generateSlots, timeToMinutes, currentTime, formatTime, parseTime } from '../../core/times.js';
import { today, isSameDay, getDayName, parseDate } from '../../core/dates.js';
import {
  getWeekDates, getEventsForDate, resolveEventOverlaps, timeToPixelOffset,
} from '../../core/scheduler-utils.js';
import { renderTimeAxis, timeAxisStyles } from './time-axis.js';
import { renderEventBlock, renderAllDayChip, eventBlockStyles } from './event-block.js';
import { renderSlotPrompt } from './slot-prompt.js';

const MAX_ALLDAY_CHIPS = 3;
const MAX_ALLDAY_DOTS = 5;

/**
 * Render the week view.
 */
export function renderWeekView({
  date, firstDay, resources, events, startTime, endTime, interval, slotHeight, format, layout,
  resourceMode, selectedSlot,
  eventContent, showTime = true, draggable,
  allDayCollapsed, onToggleAllDay,
  onSlotClick, onEventClick, onSlotCreate,
}) {
  const container = document.createElement('div');
  container.classList.add('cal-sched-week');
  if (layout === 'horizontal') container.classList.add('cal-sched-week--horizontal');

  const weekDates = getWeekDates(date, firstDay);
  const isTabsMode = resourceMode === 'tabs';
  // Show sub-lanes only in columns mode with multiple resources
  const showResources = resources.length > 1 && !isTabsMode;
  const slots = generateSlots(startTime, endTime, interval);
  const todayStr = today();

  // All-day row
  const allDayByDate = {};
  for (const d of weekDates) {
    const dayEvts = getEventsForDate(events, d).filter((ev) => !ev.startTime || !ev.endTime);
    if (dayEvts.length) allDayByDate[d] = dayEvts;
  }

  const hasAllDay = Object.keys(allDayByDate).length > 0;

  if (hasAllDay) {
    const allDayRow = document.createElement('div');
    allDayRow.classList.add('cal-sched-week__allday');
    if (allDayCollapsed) allDayRow.classList.add('cal-sched-week__allday--collapsed');

    const spacer = document.createElement('div');
    spacer.classList.add('cal-sched-week__allday-spacer');

    const spacerLabel = document.createElement('span');
    spacerLabel.textContent = 'All day';
    spacer.appendChild(spacerLabel);

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.classList.add('cal-sched-week__allday-toggle');
    toggleBtn.setAttribute('aria-label', allDayCollapsed ? 'Expand all-day events' : 'Collapse all-day events');
    toggleBtn.innerHTML = allDayCollapsed
      ? `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5l3 3 3-3"/></svg>`
      : `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7l3-3 3 3"/></svg>`;
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onToggleAllDay?.();
    });
    spacer.appendChild(toggleBtn);

    allDayRow.appendChild(spacer);

    for (const d of weekDates) {
      const cell = document.createElement('div');
      cell.classList.add('cal-sched-week__allday-cell');

      const dayAllDay = allDayByDate[d] || [];

      if (allDayCollapsed) {
        // Collapsed: show colored dots
        if (dayAllDay.length > 0) {
          const dotsWrapper = document.createElement('div');
          dotsWrapper.classList.add('cal-sched-week__allday-dots');

          const visibleDots = dayAllDay.slice(0, MAX_ALLDAY_DOTS);
          for (const ev of visibleDots) {
            const dot = document.createElement('span');
            dot.classList.add('cal-sched-week__allday-dot');
            const color = ev.color || 'blue';
            dot.style.background = `hsl(var(--cal-booking-${color}-fg))`;
            dotsWrapper.appendChild(dot);
          }

          if (dayAllDay.length > MAX_ALLDAY_DOTS) {
            const badge = document.createElement('span');
            badge.classList.add('cal-sched-week__allday-overflow');
            badge.textContent = `+${dayAllDay.length - MAX_ALLDAY_DOTS}`;
            dotsWrapper.appendChild(badge);
          }

          cell.appendChild(dotsWrapper);
        }
      } else {
        // Expanded: show chips with overflow
        const visibleChips = dayAllDay.slice(0, MAX_ALLDAY_CHIPS);
        for (const ev of visibleChips) {
          const resource = resources.find((r) => r.id === ev.resourceId);
          cell.appendChild(renderAllDayChip({
            event: ev,
            onClick: (event) => onEventClick?.(event, ev.resourceId, resource),
            eventContent,
            resource,
          }));
        }

        if (dayAllDay.length > MAX_ALLDAY_CHIPS) {
          const badge = document.createElement('span');
          badge.classList.add('cal-sched-week__allday-overflow');
          badge.textContent = `+${dayAllDay.length - MAX_ALLDAY_CHIPS}`;
          cell.appendChild(badge);
        }
      }
      allDayRow.appendChild(cell);
    }
    container.appendChild(allDayRow);
  }

  // Day headers
  const headerRow = document.createElement('div');
  headerRow.classList.add('cal-sched-week__header');

  const headerSpacer = document.createElement('div');
  headerSpacer.classList.add('cal-sched-week__header-spacer');
  headerRow.appendChild(headerSpacer);

  for (const d of weekDates) {
    const parsed = parseDate(d);
    const dayHeader = document.createElement('div');
    dayHeader.classList.add('cal-sched-week__day-header');
    if (isSameDay(d, todayStr)) dayHeader.classList.add('cal-sched-week__day-header--today');

    const dayName = document.createElement('span');
    dayName.classList.add('cal-sched-week__day-name');
    dayName.textContent = getDayName(d);

    const dayNum = document.createElement('span');
    dayNum.classList.add('cal-sched-week__day-num');
    if (isSameDay(d, todayStr)) dayNum.classList.add('cal-sched-week__day-num--today');
    dayNum.textContent = parsed ? parsed.getDate() : '';

    dayHeader.appendChild(dayName);
    dayHeader.appendChild(dayNum);

    // Sub-resource headers
    if (showResources) {
      const resRow = document.createElement('div');
      resRow.classList.add('cal-sched-week__res-row');
      for (const r of resources) {
        const resLabel = document.createElement('span');
        resLabel.classList.add('cal-sched-week__res-label');
        const dot = document.createElement('span');
        dot.classList.add('cal-sched-week__res-dot');
        dot.style.background = `hsl(var(--cal-booking-${r.color || 'blue'}-fg))`;
        resLabel.appendChild(dot);
        resLabel.appendChild(document.createTextNode(r.name));
        resRow.appendChild(resLabel);
      }
      dayHeader.appendChild(resRow);
    }

    headerRow.appendChild(dayHeader);
  }
  container.appendChild(headerRow);

  // Grid area
  const gridArea = document.createElement('div');
  gridArea.classList.add('cal-sched-week__grid-area');

  // Time axis
  gridArea.appendChild(renderTimeAxis({ startTime, endTime, interval, slotHeight, format }));

  // Day columns
  const colsWrapper = document.createElement('div');
  colsWrapper.classList.add('cal-sched-week__cols');

  for (const d of weekDates) {
    const dayCol = document.createElement('div');
    dayCol.classList.add('cal-sched-week__day-col');
    dayCol.dataset.date = d;
    if (isSameDay(d, todayStr)) dayCol.classList.add('cal-sched-week__day-col--today');

    const dayTimedEvents = getEventsForDate(events, d).filter((ev) => ev.startTime && ev.endTime);

    if (showResources) {
      // Sub-lanes per resource (columns mode)
      for (const resource of resources) {
        const lane = document.createElement('div');
        lane.classList.add('cal-sched-week__lane');
        lane.dataset.resourceId = resource.id;

        for (let i = 0; i < slots.length; i++) {
          const slotEl = document.createElement('div');
          slotEl.classList.add('cal-sched-week__slot');
          slotEl.style.height = `${slotHeight}px`;
          slotEl.dataset.time = slots[i];

          const slotEnd = i < slots.length - 1 ? slots[i + 1] : endTime;

          // Slot selection highlight
          if (selectedSlot && selectedSlot.date === d && selectedSlot.startTime === slots[i] && selectedSlot.resourceId === resource.id) {
            slotEl.classList.add('cal-sched-week__slot--selected');
            slotEl.appendChild(renderSlotPrompt({
              date: d,
              startTime: slots[i],
              endTime: slotEnd,
              resourceName: resource.name,
              format,
              onCreate: () => onSlotCreate?.(d, slots[i], slotEnd, resource.id, resource),
            }));
          }

          slotEl.addEventListener('click', () => {
            onSlotClick?.(d, slots[i], slotEnd, resource.id, resource);
          });

          lane.appendChild(slotEl);
        }

        const resEvents = dayTimedEvents.filter((ev) => ev.resourceId === resource.id);
        const resolved = resolveEventOverlaps(resEvents);
        for (const ev of resolved) {
          lane.appendChild(renderEventBlock({
            event: ev,
            gridStartTime: startTime,
            slotHeight,
            interval,
            format,
            onClick: (event) => onEventClick?.(event, resource.id, resource),
            eventContent,
            showTime,
            resource,
            draggable,
          }));
        }

        dayCol.appendChild(lane);
      }
    } else {
      // Single-lane: single resource OR tabs mode (all resources overlaid)
      const lane = document.createElement('div');
      lane.classList.add('cal-sched-week__lane', 'cal-sched-week__lane--full');

      // In tabs mode, determine the effective resource for slot clicks
      const defaultResource = resources.length === 1 ? resources[0] : null;
      if (defaultResource) lane.dataset.resourceId = defaultResource.id;

      for (let i = 0; i < slots.length; i++) {
        const slotEl = document.createElement('div');
        slotEl.classList.add('cal-sched-week__slot');
        slotEl.style.height = `${slotHeight}px`;
        slotEl.dataset.time = slots[i];

        const slotEnd = i < slots.length - 1 ? slots[i + 1] : endTime;
        const slotResId = defaultResource?.id || null;

        // Slot selection highlight
        if (selectedSlot && selectedSlot.date === d && selectedSlot.startTime === slots[i]
            && (selectedSlot.resourceId === slotResId || (!selectedSlot.resourceId && !slotResId))) {
          slotEl.classList.add('cal-sched-week__slot--selected');
          slotEl.appendChild(renderSlotPrompt({
            date: d,
            startTime: slots[i],
            endTime: slotEnd,
            resourceName: defaultResource?.name || null,
            format,
            onCreate: () => onSlotCreate?.(d, slots[i], slotEnd, slotResId, defaultResource),
          }));
        }

        slotEl.addEventListener('click', () => {
          onSlotClick?.(d, slots[i], slotEnd, slotResId, defaultResource);
        });

        lane.appendChild(slotEl);
      }

      // All events in single lane, overlapped
      const resolved = resolveEventOverlaps(dayTimedEvents);
      for (const ev of resolved) {
        const resource = resources.find((r) => r.id === ev.resourceId) || resources[0];
        lane.appendChild(renderEventBlock({
          event: ev,
          gridStartTime: startTime,
          slotHeight,
          interval,
          format,
          onClick: (event) => onEventClick?.(event, ev.resourceId, resource),
          eventContent,
          showTime,
          resource,
          draggable,
        }));
      }

      dayCol.appendChild(lane);
    }

    colsWrapper.appendChild(dayCol);
  }

  // Now line (across today's column)
  if (weekDates.includes(todayStr)) {
    const now = currentTime();
    const nowMins = timeToMinutes(now);
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);
    if (nowMins >= startMins && nowMins <= endMins) {
      const todayIdx = weekDates.indexOf(todayStr);
      const top = timeToPixelOffset(now, startTime, slotHeight, interval);
      // Now line is placed in the cols wrapper
      const nowLine = document.createElement('div');
      nowLine.classList.add('cal-sched-now-line', 'cal-sched-now-line--week');
      nowLine.style.top = `${top}px`;
      const colPercent = 100 / 7;
      nowLine.style.left = `${todayIdx * colPercent}%`;
      nowLine.style.width = `${colPercent}%`;

      const dot = document.createElement('div');
      dot.classList.add('cal-sched-now-line__dot');
      nowLine.appendChild(dot);

      colsWrapper.appendChild(nowLine);
    }
  }

  gridArea.appendChild(colsWrapper);
  container.appendChild(gridArea);

  return container;
}

export const weekViewStyles = `
  .cal-sched-week {
    display: flex;
    flex-direction: column;
    border: 1px solid hsl(var(--cal-sched-grid-line));
    border-radius: var(--cal-radius);
    overflow: hidden;
  }

  .cal-sched-week__allday {
    display: flex;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    background: hsl(var(--cal-sched-header-bg));
  }

  .cal-sched-week__allday-spacer {
    width: 56px;
    flex-shrink: 0;
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 4px;
    padding-right: 8px;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-week__allday-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: var(--cal-radius-sm);
    background: transparent;
    color: hsl(var(--cal-fg-muted));
    cursor: pointer;
    transition: background var(--cal-transition), color var(--cal-transition);
  }

  .cal-sched-week__allday-toggle:hover {
    background: hsl(var(--cal-sched-slot-hover));
    color: hsl(var(--cal-fg));
  }

  .cal-sched-week__allday-cell {
    flex: 1;
    display: flex;
    gap: 2px;
    padding: 4px;
    flex-wrap: wrap;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    max-height: 80px;
    overflow: hidden;
    align-items: flex-start;
    align-content: flex-start;
  }

  .cal-sched-week__allday--collapsed .cal-sched-week__allday-cell {
    max-height: 28px;
    align-items: center;
    align-content: center;
  }

  .cal-sched-week__allday-cell:last-child {
    border-right: none;
  }

  .cal-sched-week__allday-overflow {
    font-size: 10px;
    color: hsl(var(--cal-fg-muted));
    padding: 1px 4px;
    white-space: nowrap;
  }

  .cal-sched-week__allday-dots {
    display: flex;
    align-items: center;
    gap: 3px;
  }

  .cal-sched-week__allday-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cal-sched-week__header {
    display: flex;
    background: hsl(var(--cal-sched-header-bg));
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    position: sticky;
    top: 0;
    z-index: 3;
  }

  .cal-sched-week__header-spacer {
    width: 56px;
    flex-shrink: 0;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-week__day-header {
    flex: 1;
    text-align: center;
    padding: 8px 4px;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-week__day-header:last-child {
    border-right: none;
  }

  .cal-sched-week__day-name {
    display: block;
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .cal-sched-week__day-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--cal-fg));
    border-radius: 50%;
  }

  .cal-sched-week__day-num--today {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
  }

  .cal-sched-week__res-row {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 4px;
  }

  .cal-sched-week__res-label {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    color: hsl(var(--cal-fg-muted));
  }

  .cal-sched-week__res-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  .cal-sched-week__grid-area {
    display: flex;
    overflow-y: auto;
    position: relative;
    padding-top: 8px;
  }

  .cal-sched-week__cols {
    display: flex;
    flex: 1;
    position: relative;
  }

  .cal-sched-week__day-col {
    flex: 1;
    display: flex;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    position: relative;
  }

  .cal-sched-week__day-col:last-child {
    border-right: none;
  }

  .cal-sched-week__lane {
    flex: 1;
    position: relative;
    border-right: 1px solid hsl(var(--cal-sched-grid-line) / 0.5);
  }

  .cal-sched-week__lane:last-child {
    border-right: none;
  }

  .cal-sched-week__lane--full {
    border-right: none;
  }

  .cal-sched-week__slot {
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    cursor: pointer;
    transition: background var(--cal-transition);
  }

  .cal-sched-week__slot:hover {
    background: hsl(var(--cal-sched-slot-hover));
  }

  .cal-sched-now-line--week {
    position: absolute;
    height: 2px;
    background: hsl(var(--cal-sched-now-line));
    z-index: 5;
    pointer-events: none;
  }
`;
