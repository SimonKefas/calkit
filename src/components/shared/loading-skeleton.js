/**
 * Loading skeleton renderers for shimmer placeholders.
 */

/**
 * Render a skeleton matching the time grid layout.
 * @param {object} options
 * @param {number} options.columns - grid columns (default 3)
 * @param {number} options.rows - number of rows (default 4)
 * @param {boolean} options.durationLabels - wider pills for duration labels
 * @returns {HTMLElement}
 */
export function renderTimeGridSkeleton({ columns = 3, rows = 4, durationLabels = false } = {}) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-label', 'Loading...');
  wrapper.classList.add('cal-skeleton-time-grid');
  if (durationLabels) wrapper.classList.add('cal-skeleton-time-grid--duration');

  const count = columns * rows;
  for (let i = 0; i < count; i++) {
    const pill = document.createElement('div');
    pill.classList.add('cal-skeleton');
    wrapper.appendChild(pill);
  }
  return wrapper;
}

/**
 * Render a skeleton matching the calendar day grid layout.
 * @param {object} options
 * @param {number} options.rows - number of week rows (default 5)
 * @returns {HTMLElement}
 */
export function renderCalendarGridSkeleton({ rows = 5 } = {}) {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('role', 'status');
  wrapper.setAttribute('aria-label', 'Loading...');
  wrapper.classList.add('cal-skeleton-calendar-grid');

  // Header row (7 day labels)
  for (let i = 0; i < 7; i++) {
    const label = document.createElement('div');
    label.classList.add('cal-skeleton', 'cal-skeleton-calendar-grid__header');
    wrapper.appendChild(label);
  }

  // Day cells
  const count = 7 * rows;
  for (let i = 0; i < count; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cal-skeleton', 'cal-skeleton-calendar-grid__day');
    wrapper.appendChild(cell);
  }
  return wrapper;
}

export const loadingSkeletonStyles = `
  .cal-skeleton-time-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
    padding: 4px;
  }

  .cal-skeleton-time-grid--duration {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .cal-skeleton-time-grid .cal-skeleton {
    height: 40px;
  }

  .cal-skeleton-calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    padding: 4px;
  }

  .cal-skeleton-calendar-grid__header {
    height: 20px;
    margin-bottom: 4px;
  }

  .cal-skeleton-calendar-grid__day {
    height: var(--cal-cell-size, 36px);
    aspect-ratio: 1;
    border-radius: var(--cal-radius-sm) !important;
  }
`;
