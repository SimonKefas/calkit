/**
 * Scheduler navigation renderer — prev/next/today + Day/Week/Month view tabs.
 */

import { chevronLeft, chevronRight } from '../datepicker/navigation.js';

/**
 * Render the scheduler navigation bar.
 * @param {object} options
 * @param {string} options.title - current view title
 * @param {'day'|'week'|'month'} options.view - current view
 * @param {function} options.onPrev
 * @param {function} options.onNext
 * @param {function} options.onToday
 * @param {function} options.onViewChange - called with new view string
 * @param {string} [options.locale] - BCP 47 locale tag
 * @returns {HTMLElement}
 */
export function renderSchedulerNav({ title, view, onPrev, onNext, onToday, onViewChange, locale }) {
  const nav = document.createElement('div');
  nav.classList.add('cal-sched-nav');

  // Left group: prev / next / today / title
  const left = document.createElement('div');
  left.classList.add('cal-sched-nav__left');

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('cal-sched-nav__btn');
  prevBtn.innerHTML = chevronLeft;
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.addEventListener('click', onPrev);

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('cal-sched-nav__btn');
  nextBtn.innerHTML = chevronRight;
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.addEventListener('click', onNext);

  let todayLabel = 'Today';
  if (locale) {
    try {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const parts = rtf.formatToParts(0, 'day');
      const label = parts.map((p) => p.value).join('');
      todayLabel = label.charAt(0).toUpperCase() + label.slice(1);
    } catch (e) { /* keep English */ }
  }

  const todayBtn = document.createElement('button');
  todayBtn.classList.add('cal-sched-nav__today');
  todayBtn.textContent = todayLabel;
  todayBtn.addEventListener('click', onToday);

  const titleEl = document.createElement('span');
  titleEl.classList.add('cal-sched-nav__title');
  titleEl.setAttribute('aria-live', 'polite');
  titleEl.textContent = title;

  left.appendChild(prevBtn);
  left.appendChild(nextBtn);
  left.appendChild(todayBtn);
  left.appendChild(titleEl);

  // Right group: view tabs
  const tabs = document.createElement('div');
  tabs.classList.add('cal-sched-nav__tabs');

  // Localize view tab labels using Intl.DisplayNames for date fields when available
  const viewLabels = { day: 'Day', week: 'Week', month: 'Month' };
  if (locale) {
    try {
      const dtf = new Intl.DisplayNames(locale, { type: 'dateTimeField' });
      for (const key of ['day', 'week', 'month']) {
        const label = dtf.of(key);
        if (label) viewLabels[key] = label.charAt(0).toUpperCase() + label.slice(1);
      }
    } catch (e) { /* keep English */ }
  }

  for (const v of ['day', 'week', 'month']) {
    const tab = document.createElement('button');
    tab.classList.add('cal-sched-nav__tab');
    if (v === view) tab.classList.add('cal-sched-nav__tab--active');
    tab.textContent = viewLabels[v];
    tab.addEventListener('click', () => onViewChange(v));
    tabs.appendChild(tab);
  }

  nav.appendChild(left);
  nav.appendChild(tabs);

  return nav;
}

export const schedulerNavStyles = `
  .cal-sched-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
    gap: 8px;
  }

  .cal-sched-nav__left {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .cal-sched-nav__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--cal-radius-sm);
    color: hsl(var(--cal-fg));
    transition: background var(--cal-transition);
  }

  .cal-sched-nav__btn:hover {
    background: hsl(var(--cal-hover));
  }

  .cal-sched-nav__today {
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--cal-fg));
    padding: 4px 12px;
    border-radius: var(--cal-radius-sm);
    border: 1px solid hsl(var(--cal-border));
    margin-left: 4px;
    margin-right: 8px;
    transition: background var(--cal-transition);
  }

  .cal-sched-nav__today:hover {
    background: hsl(var(--cal-hover));
  }

  .cal-sched-nav__title {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--cal-fg));
    user-select: none;
  }

  .cal-sched-nav__tabs {
    display: flex;
    gap: 0;
    border: 1px solid hsl(var(--cal-border));
    border-radius: var(--cal-radius-sm);
    overflow: hidden;
  }

  .cal-sched-nav__tab {
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--cal-fg-muted));
    padding: 4px 12px;
    transition: all var(--cal-transition);
    border-right: 1px solid hsl(var(--cal-border));
  }

  .cal-sched-nav__tab:last-child {
    border-right: none;
  }

  .cal-sched-nav__tab:hover {
    background: hsl(var(--cal-hover));
    color: hsl(var(--cal-fg));
  }

  .cal-sched-nav__tab--active {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
  }

  .cal-sched-nav__tab--active:hover {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
  }
`;
