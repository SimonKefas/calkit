import { getMonthNames } from '../../core/dates.js';

export const chevronLeft = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 12L6 8l4-4"/></svg>`;
export const chevronRight = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4l4 4-4 4"/></svg>`;

/**
 * Renders month/year navigation header.
 * @param {object} options
 * @param {number} options.year
 * @param {number} options.month
 * @param {function} options.onPrev
 * @param {function} options.onNext
 * @param {function} [options.onTitleClick] - If provided, title becomes a clickable button
 * @param {string} [options.locale] - BCP 47 locale tag
 * @returns {HTMLElement}
 */
export function renderNavigation({ year, month, onPrev, onNext, onTitleClick, locale }) {
  const nav = document.createElement('div');
  nav.classList.add('cal-nav');

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('cal-nav__btn', 'cal-nav__btn--prev');
  prevBtn.innerHTML = chevronLeft;
  prevBtn.setAttribute('aria-label', 'Previous month');
  prevBtn.addEventListener('click', onPrev);

  const months = getMonthNames(locale);
  const titleTag = onTitleClick ? 'button' : 'div';
  const title = document.createElement(titleTag);
  title.classList.add('cal-nav__title');
  if (onTitleClick) {
    title.classList.add('cal-nav__title--interactive');
    title.setAttribute('aria-label', `Select month and year, currently ${months[month]} ${year}`);
    title.addEventListener('click', onTitleClick);
  }
  title.setAttribute('aria-live', 'polite');
  title.textContent = `${months[month]} ${year}`;

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('cal-nav__btn', 'cal-nav__btn--next');
  nextBtn.innerHTML = chevronRight;
  nextBtn.setAttribute('aria-label', 'Next month');
  nextBtn.addEventListener('click', onNext);

  nav.appendChild(prevBtn);
  nav.appendChild(title);
  nav.appendChild(nextBtn);

  return nav;
}

export const navigationStyles = `
  .cal-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    margin-bottom: 8px;
  }

  .cal-nav__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: var(--cal-radius-sm);
    color: hsl(var(--cal-fg));
    transition: background var(--cal-transition);
  }

  .cal-nav__btn:hover {
    background: hsl(var(--cal-hover));
  }

  .cal-nav__title {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--cal-fg));
    user-select: none;
  }

  .cal-nav__title--interactive {
    cursor: pointer;
    padding: 2px 8px;
    border-radius: var(--cal-radius-sm);
    transition: background var(--cal-transition);
  }

  .cal-nav__title--interactive:hover {
    background: hsl(var(--cal-hover));
  }
`;
