/**
 * Day view renderer — time axis + resource lanes + events + slot grid + all-day row + now-line.
 */

import { generateSlots, timeToMinutes, currentTime, formatTime, parseTime } from '../../core/times.js';
import { today, isSameDay } from '../../core/dates.js';
import { getEventsForDate, resolveEventOverlaps, timeToPixelOffset } from '../../core/scheduler-utils.js';
import { renderTimeAxis, timeAxisStyles } from './time-axis.js';
import { renderResourceHeaderRow, resourceHeaderStyles } from './resource-header.js';
import { renderEventBlock, renderAllDayChip, eventBlockStyles } from './event-block.js';
import { renderSlotPrompt } from './slot-prompt.js';

/**
 * Render the day view.
 */
export function renderDayView({
  date, resources, events, startTime, endTime, interval, slotHeight, format, layout,
  resourceMode, selectedSlot,
  eventContent, showTime = true, draggable,
  onSlotClick, onEventClick, onSlotCreate,
}) {
  const container = document.createElement('div');
  container.classList.add('cal-sched-day');
  if (layout === 'horizontal') container.classList.add('cal-sched-day--horizontal');

  const isTabsMode = resourceMode === 'tabs';
  const showResources = resources.length > 1 && !isTabsMode;
  const dayEvents = getEventsForDate(events, date);
  const allDayEvents = dayEvents.filter((ev) => !ev.startTime || !ev.endTime);
  const timedEvents = dayEvents.filter((ev) => ev.startTime && ev.endTime);
  const slots = generateSlots(startTime, endTime, interval);

  // All-day row
  if (allDayEvents.length > 0) {
    const allDayRow = document.createElement('div');
    allDayRow.classList.add('cal-sched-day__allday');

    const label = document.createElement('div');
    label.classList.add('cal-sched-day__allday-label');
    label.textContent = 'All day';
    allDayRow.appendChild(label);

    const chips = document.createElement('div');
    chips.classList.add('cal-sched-day__allday-chips');

    for (const ev of allDayEvents) {
      const resource = resources.find((r) => r.id === ev.resourceId);
      chips.appendChild(renderAllDayChip({
        event: ev,
        onClick: (event) => onEventClick?.(event, ev.resourceId, resource),
        eventContent,
        resource,
      }));
    }
    allDayRow.appendChild(chips);
    container.appendChild(allDayRow);
  }

  // Resource headers (if multiple)
  if (showResources) {
    const headerRow = document.createElement('div');
    headerRow.classList.add('cal-sched-day__header');

    // Spacer for time axis
    const spacer = document.createElement('div');
    spacer.classList.add('cal-sched-day__header-spacer');
    headerRow.appendChild(spacer);

    headerRow.appendChild(renderResourceHeaderRow({ resources }));
    container.appendChild(headerRow);
  }

  // Grid area: time axis + lanes
  const gridArea = document.createElement('div');
  gridArea.classList.add('cal-sched-day__grid-area');

  // Time axis
  gridArea.appendChild(renderTimeAxis({ startTime, endTime, interval, slotHeight, format }));

  // Lanes wrapper
  const lanesWrapper = document.createElement('div');
  lanesWrapper.classList.add('cal-sched-day__lanes');

  if (showResources) {
    // Columns mode — one lane per resource
    for (const resource of resources) {
      const lane = document.createElement('div');
      lane.classList.add('cal-sched-day__lane');
      lane.style.flex = '1 1 0';
      lane.dataset.resourceId = resource.id;
      lane.dataset.date = date;

      for (let i = 0; i < slots.length; i++) {
        const slotEl = document.createElement('div');
        slotEl.classList.add('cal-sched-day__slot');
        slotEl.style.height = `${slotHeight}px`;
        slotEl.dataset.time = slots[i];
        slotEl.dataset.resourceId = resource.id;

        const slotEnd = i < slots.length - 1 ? slots[i + 1] : endTime;

        // Slot selection highlight
        if (selectedSlot && selectedSlot.date === date && selectedSlot.startTime === slots[i] && selectedSlot.resourceId === resource.id) {
          slotEl.classList.add('cal-sched-day__slot--selected');
          slotEl.appendChild(renderSlotPrompt({
            date,
            startTime: slots[i],
            endTime: slotEnd,
            resourceName: resource.name,
            format,
            onCreate: () => onSlotCreate?.(date, slots[i], slotEnd, resource.id, resource),
          }));
        }

        slotEl.addEventListener('click', () => {
          onSlotClick?.(date, slots[i], slotEnd, resource.id, resource);
        });

        lane.appendChild(slotEl);
      }

      const resTimedEvents = timedEvents.filter((ev) => ev.resourceId === resource.id);
      const resolved = resolveEventOverlaps(resTimedEvents);

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

      lanesWrapper.appendChild(lane);
    }
  } else {
    // Single lane — single resource OR tabs mode (all resources overlaid)
    const lane = document.createElement('div');
    lane.classList.add('cal-sched-day__lane');
    lane.style.flex = '1 1 0';
    lane.dataset.date = date;

    const defaultResource = resources.length === 1 ? resources[0] : null;
    if (defaultResource) lane.dataset.resourceId = defaultResource.id;

    for (let i = 0; i < slots.length; i++) {
      const slotEl = document.createElement('div');
      slotEl.classList.add('cal-sched-day__slot');
      slotEl.style.height = `${slotHeight}px`;
      slotEl.dataset.time = slots[i];

      const slotEnd = i < slots.length - 1 ? slots[i + 1] : endTime;
      const slotResId = defaultResource?.id || null;

      // Slot selection highlight
      if (selectedSlot && selectedSlot.date === date && selectedSlot.startTime === slots[i]
          && (selectedSlot.resourceId === slotResId || (!selectedSlot.resourceId && !slotResId))) {
        slotEl.classList.add('cal-sched-day__slot--selected');
        slotEl.appendChild(renderSlotPrompt({
          date,
          startTime: slots[i],
          endTime: slotEnd,
          resourceName: defaultResource?.name || null,
          format,
          onCreate: () => onSlotCreate?.(date, slots[i], slotEnd, slotResId, defaultResource),
        }));
      }

      slotEl.addEventListener('click', () => {
        onSlotClick?.(date, slots[i], slotEnd, slotResId, defaultResource);
      });

      lane.appendChild(slotEl);
    }

    // All events in single lane
    const resolved = resolveEventOverlaps(timedEvents);
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

    lanesWrapper.appendChild(lane);
  }

  gridArea.appendChild(lanesWrapper);

  // Now line
  const todayStr = today();
  if (isSameDay(date, todayStr)) {
    const now = currentTime();
    const nowMins = timeToMinutes(now);
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (nowMins >= startMins && nowMins <= endMins) {
      const top = timeToPixelOffset(now, startTime, slotHeight, interval);
      const nowLine = document.createElement('div');
      nowLine.classList.add('cal-sched-now-line');
      nowLine.style.top = `${top}px`;

      const dot = document.createElement('div');
      dot.classList.add('cal-sched-now-line__dot');
      nowLine.appendChild(dot);

      lanesWrapper.appendChild(nowLine);
    }
  }

  container.appendChild(gridArea);
  return container;
}

export const dayViewStyles = `
  .cal-sched-day {
    display: flex;
    flex-direction: column;
    border: 1px solid hsl(var(--cal-sched-grid-line));
    border-radius: var(--cal-radius);
    overflow: hidden;
  }

  .cal-sched-day__allday {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    background: hsl(var(--cal-sched-header-bg));
    flex-wrap: wrap;
  }

  .cal-sched-day__allday-label {
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
    flex-shrink: 0;
    width: 48px;
  }

  .cal-sched-day__allday-chips {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    flex: 1;
  }

  .cal-sched-day__header {
    display: flex;
    background: hsl(var(--cal-sched-header-bg));
    position: sticky;
    top: 0;
    z-index: 3;
  }

  .cal-sched-day__header-spacer {
    width: 56px;
    flex-shrink: 0;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-day__grid-area {
    display: flex;
    overflow-y: auto;
    position: relative;
    padding-top: 8px;
  }

  .cal-sched-day__lanes {
    display: flex;
    flex: 1;
    position: relative;
  }

  .cal-sched-day__lane {
    position: relative;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-day__lane:last-child {
    border-right: none;
  }

  .cal-sched-day__slot {
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    cursor: pointer;
    transition: background var(--cal-transition);
  }

  .cal-sched-day__slot:hover {
    background: hsl(var(--cal-sched-slot-hover));
  }

  /* Now line */
  .cal-sched-now-line {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: hsl(var(--cal-sched-now-line));
    z-index: 5;
    pointer-events: none;
  }

  .cal-sched-now-line__dot {
    position: absolute;
    left: -4px;
    top: -3px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: hsl(var(--cal-sched-now-line));
  }

  /* Horizontal layout */
  .cal-sched-day--horizontal .cal-sched-day__grid-area {
    flex-direction: column;
  }

  .cal-sched-day--horizontal .cal-sched-day__lanes {
    flex-direction: column;
  }

  .cal-sched-day--horizontal .cal-sched-day__lane {
    display: flex;
    border-right: none;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-day--horizontal .cal-sched-day__lane:last-child {
    border-bottom: none;
  }

  .cal-sched-day--horizontal .cal-sched-day__slot {
    border-bottom: none;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    flex: 0 0 auto;
  }

  .cal-sched-day--horizontal .cal-sched-time-axis {
    flex-direction: row;
    width: auto;
    border-right: none;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-day--horizontal .cal-sched-time-axis__slot {
    border-bottom: none;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    align-items: center;
    justify-content: center;
    padding: 4px 0;
  }
`;
