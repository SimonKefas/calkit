/**
 * Resource header renderer — resource names with color dot + optional capacity badge.
 */

/**
 * Render a resource header cell.
 * @param {object} options
 * @param {object} options.resource - { id, name, color?, capacity? }
 * @param {number} [options.width] - optional fixed width
 * @returns {HTMLElement}
 */
export function renderResourceHeader({ resource, width }) {
  const header = document.createElement('div');
  header.classList.add('cal-sched-resource-header');
  if (width) header.style.width = `${width}px`;
  header.style.flex = width ? `0 0 ${width}px` : '1 1 0';

  const dot = document.createElement('span');
  dot.classList.add('cal-sched-resource-header__dot');
  const color = resource.color || 'blue';
  dot.style.background = `hsl(var(--cal-booking-${color}-fg))`;
  header.appendChild(dot);

  const name = document.createElement('span');
  name.classList.add('cal-sched-resource-header__name');
  name.textContent = resource.name;
  header.appendChild(name);

  if (resource.capacity) {
    const badge = document.createElement('span');
    badge.classList.add('cal-sched-resource-header__capacity');
    badge.textContent = resource.capacity;
    badge.setAttribute('title', `Capacity: ${resource.capacity}`);
    header.appendChild(badge);
  }

  return header;
}

/**
 * Render a row of resource headers.
 * @param {object} options
 * @param {object[]} options.resources
 * @returns {HTMLElement}
 */
export function renderResourceHeaderRow({ resources }) {
  const row = document.createElement('div');
  row.classList.add('cal-sched-resource-header-row');

  for (const resource of resources) {
    row.appendChild(renderResourceHeader({ resource }));
  }

  return row;
}

export const resourceHeaderStyles = `
  .cal-sched-resource-header-row {
    display: flex;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    background: hsl(var(--cal-sched-header-bg));
  }

  .cal-sched-resource-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    min-width: 0;
    border-right: 1px solid hsl(var(--cal-sched-grid-line));
  }

  .cal-sched-resource-header:last-child {
    border-right: none;
  }

  .cal-sched-resource-header__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .cal-sched-resource-header__name {
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--cal-fg));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .cal-sched-resource-header__capacity {
    font-size: 11px;
    color: hsl(var(--cal-fg-muted));
    background: hsl(var(--cal-bg-muted));
    padding: 1px 6px;
    border-radius: 999px;
    flex-shrink: 0;
  }
`;
