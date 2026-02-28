/**
 * Loading skeleton renderers for the scheduler component.
 */

/**
 * Render a day/week view skeleton with time slots.
 * @param {object} options
 * @param {number} options.columns - number of day/resource columns
 * @param {number} options.rows - number of time slot rows
 * @param {number} options.slotHeight - pixel height per slot
 * @returns {HTMLElement}
 */
export function renderSchedulerGridSkeleton({ columns = 3, rows = 10, slotHeight = 48 } = {}) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-label', 'Loading...');
  wrapper.classList.add('cal-sched-skeleton-grid');

  // Header row
  const header = document.createElement('div');
  header.classList.add('cal-sched-skeleton-grid__header');
  const headerSpacer = document.createElement('div');
  headerSpacer.classList.add('cal-sched-skeleton-grid__spacer');
  header.appendChild(headerSpacer);
  for (let c = 0; c < columns; c++) {
    const col = document.createElement('div');
    col.classList.add('cal-skeleton', 'cal-sched-skeleton-grid__col-header');
    header.appendChild(col);
  }
  wrapper.appendChild(header);

  // Grid body
  const body = document.createElement('div');
  body.classList.add('cal-sched-skeleton-grid__body');

  for (let r = 0; r < rows; r++) {
    const row = document.createElement('div');
    row.classList.add('cal-sched-skeleton-grid__row');
    row.style.height = `${slotHeight}px`;

    // Time label
    const timeLabel = document.createElement('div');
    timeLabel.classList.add('cal-skeleton', 'cal-sched-skeleton-grid__time');
    row.appendChild(timeLabel);

    // Slot cells
    for (let c = 0; c < columns; c++) {
      const cell = document.createElement('div');
      cell.classList.add('cal-sched-skeleton-grid__cell');

      // Randomly add fake event blocks
      if (Math.random() < 0.15) {
        const ev = document.createElement('div');
        ev.classList.add('cal-skeleton', 'cal-skeleton--rect', 'cal-sched-skeleton-grid__event');
        ev.style.height = `${slotHeight * (1 + Math.floor(Math.random() * 2))}px`;
        cell.appendChild(ev);
      }

      row.appendChild(cell);
    }

    body.appendChild(row);
  }

  wrapper.appendChild(body);
  return wrapper;
}

/**
 * Render a month view skeleton.
 * @returns {HTMLElement}
 */
export function renderSchedulerMonthSkeleton() {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-label', 'Loading...');
  wrapper.classList.add('cal-sched-skeleton-month');

  // Weekday header
  const weekdays = document.createElement('div');
  weekdays.classList.add('cal-sched-skeleton-month__weekdays');
  for (let i = 0; i < 7; i++) {
    const label = document.createElement('div');
    label.classList.add('cal-skeleton', 'cal-sched-skeleton-month__weekday');
    weekdays.appendChild(label);
  }
  wrapper.appendChild(weekdays);

  // Grid cells (5 rows x 7 cols)
  const grid = document.createElement('div');
  grid.classList.add('cal-sched-skeleton-month__grid');
  for (let i = 0; i < 35; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cal-sched-skeleton-month__cell');

    const num = document.createElement('div');
    num.classList.add('cal-skeleton', 'cal-sched-skeleton-month__num');
    cell.appendChild(num);

    // Random event chips
    const chipCount = Math.floor(Math.random() * 3);
    for (let c = 0; c < chipCount; c++) {
      const chip = document.createElement('div');
      chip.classList.add('cal-skeleton', 'cal-skeleton--rect', 'cal-sched-skeleton-month__chip');
      cell.appendChild(chip);
    }

    grid.appendChild(cell);
  }
  wrapper.appendChild(grid);

  return wrapper;
}

export const schedulerSkeletonStyles = `
  .cal-sched-skeleton-grid {
    border: 1px solid hsl(var(--cal-sched-grid-line));
    border-radius: var(--cal-radius);
    overflow: hidden;
  }

  .cal-sched-skeleton-grid__header {
    display: flex;
    background: hsl(var(--cal-sched-header-bg));
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    padding: 12px 0;
  }

  .cal-sched-skeleton-grid__spacer {
    width: 56px;
    flex-shrink: 0;
  }

  .cal-sched-skeleton-grid__col-header {
    flex: 1;
    height: 20px;
    margin: 0 12px;
  }

  .cal-sched-skeleton-grid__body {
    display: flex;
    flex-direction: column;
  }

  .cal-sched-skeleton-grid__row {
    display: flex;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-skeleton-grid__time {
    width: 36px;
    height: 12px;
    margin: 4px 10px;
    flex-shrink: 0;
  }

  .cal-sched-skeleton-grid__cell {
    flex: 1;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    position: relative;
    padding: 2px;
  }

  .cal-sched-skeleton-grid__cell:last-child {
    border-right: none;
  }

  .cal-sched-skeleton-grid__event {
    width: 80%;
    min-height: 24px;
  }

  .cal-sched-skeleton-month {
    border: 1px solid hsl(var(--cal-sched-grid-line));
    border-radius: var(--cal-radius);
    overflow: hidden;
  }

  .cal-sched-skeleton-month__weekdays {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
    padding: 12px;
    background: hsl(var(--cal-sched-header-bg));
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-skeleton-month__weekday {
    height: 14px;
  }

  .cal-sched-skeleton-month__grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
  }

  .cal-sched-skeleton-month__cell {
    min-height: 80px;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    padding: 6px;
  }

  .cal-sched-skeleton-month__cell:nth-child(7n) {
    border-right: none;
  }

  .cal-sched-skeleton-month__num {
    width: 20px;
    height: 14px;
    margin-bottom: 6px;
  }

  .cal-sched-skeleton-month__chip {
    height: 16px;
    margin-bottom: 2px;
    width: 85%;
  }
`;
