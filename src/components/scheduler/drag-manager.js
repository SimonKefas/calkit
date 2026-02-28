/**
 * Drag manager — pointer-event-based drag system for moving, resizing, and creating events.
 */

import { timeToMinutes, minutesToTime } from '../../core/times.js';
import { pixelOffsetToTime, snapToSlot, timeToPixelOffset } from '../../core/scheduler-utils.js';

const DRAG_THRESHOLD = 4; // pixels before drag initiates

/**
 * Create a drag manager for the scheduler.
 * @param {object} options
 * @param {ShadowRoot} options.shadowRoot
 * @param {function} options.getConfig - () => { slotHeight, interval, startTime, endTime, format, snapInterval, minDuration, maxDuration }
 * @param {function} options.getViewInfo - () => { view, anchorDate, weekDates, resources, resourceMode, selectedResourceId }
 * @param {function} options.getEvents - () => events[]
 * @param {function} options.onMove - ({ event, from, to }) => void
 * @param {function} options.onResize - ({ event, from, to }) => void
 * @param {function} options.onCreate - ({ date, startTime, endTime, resourceId }) => void
 * @returns {{ enable(), disable(), destroy() }}
 */
export function createDragManager({ shadowRoot, getConfig, getViewInfo, getEvents, onMove, onResize, onCreate }) {
  let enabled = false;
  let mode = null; // 'move' | 'resize' | 'create'
  let dragEvent = null;
  let ghost = null;
  let originalBlock = null;
  let grabOffsetX = 0;
  let grabOffsetY = 0;
  let startPointerX = 0;
  let startPointerY = 0;
  let hasMoved = false;
  let originalEndTime = null;
  let originalStartTime = null;
  let originalDate = null;
  let originalResourceId = null;
  let timeLabel = null;
  let dropPreview = null; // unified drop zone overlay element
  let capturedPointerId = null;
  let capturedElement = null;

  // Create mode state
  let createPreview = null;
  let createDate = null;
  let createResourceId = null;
  let createStartTime = null;
  let createGridTop = 0;

  function handlePointerDown(e) {
    if (!enabled) return;
    // Ignore right clicks
    if (e.button !== 0) return;

    const resizeHandle = e.target.closest('.cal-sched-event__resize-handle');
    const eventBlock = e.target.closest('.cal-sched-event[data-draggable="true"]');

    if (eventBlock) {
      // Event drag or resize
      const eventId = eventBlock.dataset.eventId;
      const events = getEvents();
      dragEvent = events.find((ev) => ev.id === eventId);
      if (!dragEvent) return;

      e.preventDefault();
      e.stopPropagation();

      capturedElement = eventBlock;
      capturedPointerId = e.pointerId;
      eventBlock.setPointerCapture(e.pointerId);

      startPointerX = e.clientX;
      startPointerY = e.clientY;
      hasMoved = false;

      originalStartTime = dragEvent.startTime;
      originalEndTime = dragEvent.endTime;
      originalDate = dragEvent.start;
      originalResourceId = dragEvent.resourceId;

      if (resizeHandle) {
        mode = 'resize';
        originalBlock = eventBlock;
        originalBlock.classList.add('cal-sched-event--resizing');
      } else {
        mode = 'move';
        originalBlock = eventBlock;
      }
    } else {
      // Check if clicking on an empty slot for drag-to-create
      const slotEl = e.target.closest('[data-time]');
      if (!slotEl) return;

      // Don't interfere with slot prompts or other interactive elements
      if (e.target.closest('.cal-sched-slot-prompt')) return;

      const target = resolveDropTarget(e.clientX, e.clientY);
      if (!target) return;

      e.preventDefault();

      mode = 'create';
      startPointerX = e.clientX;
      startPointerY = e.clientY;
      hasMoved = false;
      createDate = target.date;
      createResourceId = target.resourceId;
      createStartTime = target.time;

      // Compute grid top for positioning
      const slots = shadowRoot.querySelectorAll('[data-time]');
      if (slots.length > 0) {
        createGridTop = slots[0].getBoundingClientRect().top;
      }

      capturedElement = slotEl;
      capturedPointerId = e.pointerId;
      slotEl.setPointerCapture(e.pointerId);
    }

    shadowRoot.addEventListener('pointermove', handlePointerMove);
    shadowRoot.addEventListener('pointerup', handlePointerUp);
  }

  function handlePointerMove(e) {
    if (!mode) return;

    const dx = e.clientX - startPointerX;
    const dy = e.clientY - startPointerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (!hasMoved && dist < DRAG_THRESHOLD) return;
    hasMoved = true;

    if (mode === 'move') {
      // Lazy-create ghost on first real move
      if (!ghost && originalBlock) {
        const rect = originalBlock.getBoundingClientRect();
        grabOffsetX = startPointerX - rect.left;
        grabOffsetY = startPointerY - rect.top;

        ghost = originalBlock.cloneNode(true);
        ghost.classList.add('cal-sched-event--ghost');
        // Clear the absolute positioning from the event block CSS
        ghost.style.cssText = `
          position: fixed;
          width: ${rect.width}px;
          height: ${rect.height}px;
          left: ${rect.left}px;
          top: ${rect.top}px;
          z-index: 1000;
          pointer-events: none;
          opacity: 0.85;
          box-shadow: 0 8px 24px -4px rgba(0,0,0,0.2);
          background: hsl(var(--ev-bg));
          color: hsl(var(--ev-fg));
          border-left: 3px solid hsl(var(--ev-fg));
          border-radius: var(--cal-radius-sm);
          padding: 2px 6px;
          font-size: 12px;
          line-height: 1.3;
          overflow: hidden;
        `;
        // Copy the CSS custom properties for colors
        ghost.style.setProperty('--ev-bg', originalBlock.style.getPropertyValue('--ev-bg'));
        ghost.style.setProperty('--ev-fg', originalBlock.style.getPropertyValue('--ev-fg'));
        shadowRoot.appendChild(ghost);

        originalBlock.classList.add('cal-sched-event--dragging');
      }

      // Update ghost position
      if (ghost) {
        ghost.style.left = `${e.clientX - grabOffsetX}px`;
        ghost.style.top = `${e.clientY - grabOffsetY}px`;
      }

      // Resolve drop target
      const target = resolveDropTarget(e.clientX, e.clientY);
      if (target) {
        highlightDropTarget(target);
      } else {
        clearDropHighlight();
      }
    } else if (mode === 'resize') {
      const config = getConfig();
      const snap = config.snapInterval || config.interval;
      const pixelsPerSnap = config.slotHeight * (snap / config.interval);
      const deltaY = e.clientY - startPointerY;
      const deltaSnaps = Math.round(deltaY / pixelsPerSnap);
      const deltaMins = deltaSnaps * snap;

      const origEndMins = timeToMinutes(originalEndTime);
      const origStartMins = timeToMinutes(originalStartTime);
      let newEndMins = origEndMins + deltaMins;

      // Enforce minimum duration (default: 1 snap unit)
      const minDuration = config.minDuration || snap;
      const minEndMins = origStartMins + minDuration;
      if (newEndMins < minEndMins) newEndMins = minEndMins;

      // Enforce maximum duration
      if (config.maxDuration) {
        const maxEndMins = origStartMins + config.maxDuration;
        if (newEndMins > maxEndMins) newEndMins = maxEndMins;
      }

      // Enforce grid bounds
      const maxMins = timeToMinutes(config.endTime);
      if (newEndMins > maxMins) newEndMins = maxMins;

      const newEndTime = minutesToTime(newEndMins);

      // Update block height visually
      if (originalBlock) {
        const newTop = timeToPixelOffset(originalStartTime, config.startTime, config.slotHeight, config.interval);
        const newBottom = timeToPixelOffset(newEndTime, config.startTime, config.slotHeight, config.interval);
        originalBlock.style.height = `${Math.max(newBottom - newTop, config.slotHeight * 0.5)}px`;
      }

      // Show floating time label
      showTimeLabel(e.clientX, e.clientY, newEndTime, config.format);
    } else if (mode === 'create') {
      const config = getConfig();
      const snap = config.snapInterval || config.interval;
      const relativeY = e.clientY - createGridTop;
      const rawTime = pixelOffsetToTime(Math.max(0, relativeY), config.startTime, config.slotHeight, config.interval);
      const snappedTime = snapToSlot(rawTime, snap);
      const snappedMins = timeToMinutes(snappedTime);
      const startMins = timeToMinutes(createStartTime);
      const gridEndMins = timeToMinutes(config.endTime);

      // Enforce minimum duration (default: 1 snap unit)
      const minDuration = config.minDuration || snap;
      let endMins = Math.max(snappedMins, startMins + minDuration);

      // Enforce maximum duration
      if (config.maxDuration) {
        const maxEndMins = startMins + config.maxDuration;
        if (endMins > maxEndMins) endMins = maxEndMins;
      }

      if (endMins > gridEndMins) endMins = gridEndMins;
      const currentEndTime = minutesToTime(endMins);

      // Create or update preview block
      if (!createPreview) {
        createPreview = document.createElement('div');
        createPreview.classList.add('cal-sched-create-preview');

        // Find the parent lane to attach the preview
        let parentLane = null;
        if (createResourceId) {
          parentLane = shadowRoot.querySelector(`[data-resource-id="${createResourceId}"][data-date="${createDate}"]`);
          if (!parentLane) {
            parentLane = shadowRoot.querySelector(`[data-date="${createDate}"] [data-resource-id="${createResourceId}"]`);
          }
        }
        if (!parentLane) {
          parentLane = shadowRoot.querySelector(`[data-date="${createDate}"] .cal-sched-week__lane`) ||
                       shadowRoot.querySelector(`[data-date="${createDate}"] .cal-sched-day__lane`) ||
                       shadowRoot.querySelector(`[data-date="${createDate}"]`);
        }
        if (parentLane) {
          parentLane.appendChild(createPreview);
        }
      }

      if (createPreview) {
        const config2 = getConfig();
        const top = timeToPixelOffset(createStartTime, config2.startTime, config2.slotHeight, config2.interval);
        const bottom = timeToPixelOffset(currentEndTime, config2.startTime, config2.slotHeight, config2.interval);
        createPreview.style.top = `${top}px`;
        createPreview.style.height = `${Math.max(bottom - top, config2.slotHeight * 0.5)}px`;

        // Store current end for use on pointerup
        createPreview.dataset.endTime = currentEndTime;
      }

      showTimeLabel(e.clientX, e.clientY, currentEndTime, config.format);
    }
  }

  function handlePointerUp(e) {
    if (!mode) return;

    shadowRoot.removeEventListener('pointermove', handlePointerMove);
    shadowRoot.removeEventListener('pointerup', handlePointerUp);

    if (capturedElement && capturedPointerId != null) {
      try { capturedElement.releasePointerCapture(capturedPointerId); } catch (_) {}
      capturedElement = null;
      capturedPointerId = null;
    }

    if (mode === 'move') {
      clearDropHighlight();

      if (ghost) {
        ghost.remove();
        ghost = null;
      }

      if (originalBlock) {
        originalBlock.classList.remove('cal-sched-event--dragging');
      }

      if (hasMoved) {
        // Mark to prevent click-through to event detail
        if (originalBlock) originalBlock.dataset.wasDragged = 'true';

        const target = resolveDropTarget(e.clientX, e.clientY);
        if (target && dragEvent) {
          const config = getConfig();
          const durationMins = timeToMinutes(originalEndTime) - timeToMinutes(originalStartTime);
          const newStartTime = target.time;
          const newStartMins = timeToMinutes(newStartTime);
          const newEndMins = Math.min(newStartMins + durationMins, timeToMinutes(config.endTime));
          const newEndTime = minutesToTime(newEndMins);

          const from = {
            date: originalDate,
            startTime: originalStartTime,
            endTime: originalEndTime,
            resourceId: originalResourceId,
          };
          const to = {
            date: target.date,
            startTime: newStartTime,
            endTime: newEndTime,
            resourceId: target.resourceId || originalResourceId,
          };

          if (from.date !== to.date || from.startTime !== to.startTime || from.resourceId !== to.resourceId) {
            onMove?.({ event: dragEvent, from, to });
          }
        }
      }
      // If !hasMoved, it was just a click — let it propagate normally for event detail
    } else if (mode === 'resize') {
      if (hasMoved) {
        const config = getConfig();
        const snap = config.snapInterval || config.interval;
        const pixelsPerSnap = config.slotHeight * (snap / config.interval);
        const deltaY = e.clientY - startPointerY;
        const deltaSnaps = Math.round(deltaY / pixelsPerSnap);
        const deltaMins = deltaSnaps * snap;

        const origEndMins = timeToMinutes(originalEndTime);
        const origStartMins = timeToMinutes(originalStartTime);
        let newEndMins = origEndMins + deltaMins;

        const minDuration = config.minDuration || snap;
        const minEndMins = origStartMins + minDuration;
        if (newEndMins < minEndMins) newEndMins = minEndMins;

        if (config.maxDuration) {
          const maxEndMins = origStartMins + config.maxDuration;
          if (newEndMins > maxEndMins) newEndMins = maxEndMins;
        }

        const maxMins = timeToMinutes(config.endTime);
        if (newEndMins > maxMins) newEndMins = maxMins;

        const newEndTime = minutesToTime(newEndMins);

        if (originalBlock) originalBlock.dataset.wasDragged = 'true';

        if (newEndTime !== originalEndTime && dragEvent) {
          onResize?.({
            event: dragEvent,
            from: { endTime: originalEndTime },
            to: { endTime: newEndTime },
          });
        }
      }

      if (originalBlock) {
        originalBlock.classList.remove('cal-sched-event--resizing');
      }

      hideTimeLabel();
    } else if (mode === 'create') {
      hideTimeLabel();

      const endTime = createPreview?.dataset.endTime || null;

      if (createPreview) {
        createPreview.remove();
        createPreview = null;
      }

      if (hasMoved && createDate && createStartTime && endTime) {
        onCreate?.({
          date: createDate,
          startTime: createStartTime,
          endTime,
          resourceId: createResourceId,
        });
      }

      createDate = null;
      createResourceId = null;
      createStartTime = null;
      createGridTop = 0;
    }

    // Reset shared state
    mode = null;
    dragEvent = null;
    originalBlock = null;
    grabOffsetX = 0;
    grabOffsetY = 0;
    startPointerX = 0;
    startPointerY = 0;
    hasMoved = false;
    originalEndTime = null;
    originalStartTime = null;
    originalDate = null;
    originalResourceId = null;
  }

  /**
   * Resolve drop target from cursor position using data attributes on grid elements.
   */
  function resolveDropTarget(clientX, clientY) {
    const config = getConfig();

    // Find date column under cursor
    const dateCols = shadowRoot.querySelectorAll('[data-date]');
    let targetDate = null;
    let targetResourceId = null;

    for (const col of dateCols) {
      const rect = col.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        targetDate = col.dataset.date;

        // Check for resource lane
        if (col.dataset.resourceId) {
          targetResourceId = col.dataset.resourceId;
        } else {
          // Check child lanes for resource
          const lanes = col.querySelectorAll('[data-resource-id]');
          for (const lane of lanes) {
            const laneRect = lane.getBoundingClientRect();
            if (clientX >= laneRect.left && clientX <= laneRect.right) {
              targetResourceId = lane.dataset.resourceId;
              break;
            }
          }
        }
        break;
      }
    }

    if (!targetDate) return null;

    // Resolve time from Y position
    const slots = shadowRoot.querySelectorAll('[data-time]');
    if (slots.length === 0) return null;

    const firstSlot = slots[0];
    const gridTop = firstSlot.getBoundingClientRect().top;
    const relativeY = clientY - gridTop;

    if (relativeY < 0) return null;

    const snap = config.snapInterval || config.interval;
    const rawTime = pixelOffsetToTime(relativeY, config.startTime, config.slotHeight, config.interval);
    const snappedTime = snapToSlot(rawTime, snap);

    // Clamp to grid bounds
    const snappedMins = timeToMinutes(snappedTime);
    const startMins = timeToMinutes(config.startTime);
    const endMins = timeToMinutes(config.endTime);
    if (snappedMins < startMins || snappedMins >= endMins) return null;

    return {
      date: targetDate,
      time: snappedTime,
      resourceId: targetResourceId,
    };
  }

  function highlightDropTarget(target) {
    clearDropHighlight();

    const config = getConfig();

    // Compute event duration
    let durationMins = config.interval;
    if (dragEvent && originalStartTime && originalEndTime) {
      durationMins = timeToMinutes(originalEndTime) - timeToMinutes(originalStartTime);
    }

    const dropStartMins = timeToMinutes(target.time);
    let dropEndMins = dropStartMins + durationMins;

    // Clamp to grid bounds
    const gridEndMins = timeToMinutes(config.endTime);
    if (dropEndMins > gridEndMins) dropEndMins = gridEndMins;

    const dropEndTime = minutesToTime(dropEndMins);

    // Find the lane container
    let lane = findLane(target.date, target.resourceId);
    if (!lane) return;

    // Create unified overlay positioned with timeToPixelOffset
    dropPreview = document.createElement('div');
    dropPreview.classList.add('cal-sched-drop-preview');

    const top = timeToPixelOffset(target.time, config.startTime, config.slotHeight, config.interval);
    const bottom = timeToPixelOffset(dropEndTime, config.startTime, config.slotHeight, config.interval);
    dropPreview.style.top = `${top}px`;
    dropPreview.style.height = `${Math.max(bottom - top, config.slotHeight * 0.5)}px`;

    lane.appendChild(dropPreview);
  }

  function clearDropHighlight() {
    if (dropPreview) {
      dropPreview.remove();
      dropPreview = null;
    }
  }

  function findLane(date, resourceId) {
    if (resourceId) {
      let lane = shadowRoot.querySelector(
        `[data-resource-id="${resourceId}"][data-date="${date}"]`
      );
      if (!lane) {
        lane = shadowRoot.querySelector(
          `[data-date="${date}"] [data-resource-id="${resourceId}"]`
        );
      }
      if (lane) return lane;
    }
    // Fallback: find a lane-like container inside the date column
    const dateCol = shadowRoot.querySelector(`[data-date="${date}"]`);
    if (!dateCol) return null;
    return dateCol.querySelector('.cal-sched-week__lane') ||
           dateCol.querySelector('.cal-sched-day__lane') ||
           dateCol;
  }

  function showTimeLabel(x, y, time, format) {
    if (!timeLabel) {
      timeLabel = document.createElement('div');
      timeLabel.classList.add('cal-sched-drag-time-label');
      shadowRoot.appendChild(timeLabel);
    }
    const { hours, minutes } = parseTimeStr(time);
    const formatted = format === '12h'
      ? formatTime12(hours, minutes)
      : time;
    timeLabel.textContent = formatted;
    timeLabel.style.left = `${x + 12}px`;
    timeLabel.style.top = `${y - 8}px`;
  }

  function hideTimeLabel() {
    if (timeLabel) {
      timeLabel.remove();
      timeLabel = null;
    }
  }

  function parseTimeStr(str) {
    const [h, m] = str.split(':').map(Number);
    return { hours: h, minutes: m };
  }

  function formatTime12(h, m) {
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${period}`;
  }

  function enable() {
    if (enabled) return;
    enabled = true;
    shadowRoot.addEventListener('pointerdown', handlePointerDown);
  }

  function disable() {
    enabled = false;
    shadowRoot.removeEventListener('pointerdown', handlePointerDown);
    shadowRoot.removeEventListener('pointermove', handlePointerMove);
    shadowRoot.removeEventListener('pointerup', handlePointerUp);
    cleanup();
  }

  function cleanup() {
    if (ghost) { ghost.remove(); ghost = null; }
    if (createPreview) { createPreview.remove(); createPreview = null; }
    if (originalBlock) {
      originalBlock.classList.remove('cal-sched-event--dragging', 'cal-sched-event--resizing');
      originalBlock = null;
    }
    clearDropHighlight();
    hideTimeLabel();
    mode = null;
    dragEvent = null;
    hasMoved = false;
  }

  function destroy() {
    disable();
  }

  return { enable, disable, destroy };
}

export const dragStyles = `
  [data-draggable="true"] {
    cursor: grab;
  }

  [data-draggable="true"]:active {
    cursor: grabbing;
  }

  .cal-sched-event--dragging {
    opacity: 0.3;
    pointer-events: none;
  }

  .cal-sched-event--ghost {
    pointer-events: none;
  }

  .cal-sched-event--resizing {
    z-index: 10;
  }

  .cal-sched-event__resize-handle {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    cursor: ns-resize;
    border-radius: 0 0 var(--cal-radius-sm) var(--cal-radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cal-sched-event__resize-handle::after {
    content: '';
    width: 20px;
    height: 2px;
    border-radius: 1px;
    background: currentColor;
    opacity: 0.3;
    transition: opacity var(--cal-transition);
  }

  .cal-sched-event__resize-handle:hover::after {
    opacity: 0.6;
  }

  .cal-sched-drop-preview {
    position: absolute;
    left: 2px;
    right: 2px;
    background: hsl(var(--cal-accent) / 0.12);
    border: 1.5px solid hsl(var(--cal-accent) / 0.5);
    border-radius: var(--cal-radius-sm);
    z-index: 3;
    pointer-events: none;
    transition: top 0.05s ease, height 0.05s ease;
  }

  .cal-sched-create-preview {
    position: absolute;
    left: 2px;
    right: 2px;
    background: hsl(var(--cal-accent) / 0.15);
    border: 1.5px dashed hsl(var(--cal-accent));
    border-radius: var(--cal-radius-sm);
    z-index: 4;
    pointer-events: none;
    transition: height 0.05s ease;
  }

  .cal-sched-drag-time-label {
    position: fixed;
    background: hsl(var(--cal-fg));
    color: hsl(var(--cal-bg));
    font-size: 11px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: var(--cal-radius-sm);
    pointer-events: none;
    z-index: 1001;
    white-space: nowrap;
  }
`;
