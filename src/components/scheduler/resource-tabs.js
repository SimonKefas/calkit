/**
 * Resource tabs renderer — shared tab bar for filtering by resource across all views.
 */

/**
 * Render the resource tab bar.
 * @param {object} options
 * @param {object[]} options.resources - resource objects with id, name, color
 * @param {string|null} options.selectedResourceId - currently active filter (null = "All")
 * @param {function} options.onResourceFilter - called with resourceId or null
 * @returns {HTMLElement}
 */
export function renderResourceTabs({ resources, selectedResourceId, onResourceFilter }) {
  const tabBar = document.createElement('div');
  tabBar.classList.add('cal-sched-res-tabs');

  const allTab = document.createElement('button');
  allTab.classList.add('cal-sched-res-tabs__tab');
  if (!selectedResourceId) allTab.classList.add('cal-sched-res-tabs__tab--active');
  allTab.textContent = 'All';
  allTab.addEventListener('click', () => onResourceFilter?.(null));
  tabBar.appendChild(allTab);

  for (const r of resources) {
    const tab = document.createElement('button');
    tab.classList.add('cal-sched-res-tabs__tab');
    if (selectedResourceId === r.id) tab.classList.add('cal-sched-res-tabs__tab--active');

    const dot = document.createElement('span');
    dot.classList.add('cal-sched-res-tabs__dot');
    dot.style.background = `hsl(var(--cal-booking-${r.color || 'blue'}-fg))`;
    tab.appendChild(dot);
    tab.appendChild(document.createTextNode(r.name));
    tab.addEventListener('click', () => onResourceFilter?.(r.id));
    tabBar.appendChild(tab);
  }

  return tabBar;
}

export const resourceTabsStyles = `
  .cal-sched-res-tabs {
    display: flex;
    gap: 4px;
    padding: 8px 12px;
    border-bottom: 1px solid hsl(var(--cal-sched-grid-line));
    background: hsl(var(--cal-sched-header-bg));
    flex-wrap: wrap;
  }

  .cal-sched-res-tabs__tab {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 500;
    color: hsl(var(--cal-fg-muted));
    padding: 4px 10px;
    border-radius: var(--cal-radius-sm);
    border: 1px solid hsl(var(--cal-border));
    transition: all var(--cal-transition);
  }

  .cal-sched-res-tabs__tab:hover {
    background: hsl(var(--cal-hover));
    color: hsl(var(--cal-fg));
  }

  .cal-sched-res-tabs__tab--active {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    border-color: hsl(var(--cal-accent));
  }

  .cal-sched-res-tabs__tab--active:hover {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
  }

  .cal-sched-res-tabs__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
`;
