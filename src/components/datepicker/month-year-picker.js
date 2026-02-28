import { chevronLeft, chevronRight } from './navigation.js';

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Renders a month/year quick-select picker (3×4 month grid with year arrows).
 * @param {object} options
 * @param {number} options.pickerYear - Year displayed in the picker
 * @param {number} options.viewMonth - Currently viewed month (0-11)
 * @param {number} options.viewYear - Currently viewed year
 * @param {function} options.onMonthSelect - (month, year) => void
 * @param {function} options.onYearPrev - Go to previous year
 * @param {function} options.onYearNext - Go to next year
 * @param {function} options.onClose - Close the picker
 * @returns {HTMLElement}
 */
export function renderMonthYearPicker({
  pickerYear, viewMonth, viewYear,
  onMonthSelect, onYearPrev, onYearNext, onClose,
}) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('cal-myp', 'cal-animate-fade');

  // Year navigation row
  const yearNav = document.createElement('div');
  yearNav.classList.add('cal-myp__year-nav');

  const prevBtn = document.createElement('button');
  prevBtn.classList.add('cal-nav__btn');
  prevBtn.innerHTML = chevronLeft;
  prevBtn.setAttribute('aria-label', 'Previous year');
  prevBtn.addEventListener('click', onYearPrev);

  const yearLabel = document.createElement('div');
  yearLabel.classList.add('cal-myp__year-label');
  yearLabel.textContent = pickerYear;

  const nextBtn = document.createElement('button');
  nextBtn.classList.add('cal-nav__btn');
  nextBtn.innerHTML = chevronRight;
  nextBtn.setAttribute('aria-label', 'Next year');
  nextBtn.addEventListener('click', onYearNext);

  yearNav.appendChild(prevBtn);
  yearNav.appendChild(yearLabel);
  yearNav.appendChild(nextBtn);
  wrapper.appendChild(yearNav);

  // 3×4 month grid
  const grid = document.createElement('div');
  grid.classList.add('cal-myp__grid');

  const now = new Date();
  const todayMonth = now.getMonth();
  const todayYear = now.getFullYear();

  for (let m = 0; m < 12; m++) {
    const cell = document.createElement('button');
    cell.classList.add('cal-myp__cell');
    cell.textContent = SHORT_MONTHS[m];

    // Currently viewed month
    if (m === viewMonth && pickerYear === viewYear) {
      cell.classList.add('cal-myp__cell--active');
    }

    // Real current month (today)
    if (m === todayMonth && pickerYear === todayYear) {
      cell.classList.add('cal-myp__cell--today');
    }

    cell.addEventListener('click', () => onMonthSelect(m, pickerYear));
    grid.appendChild(cell);
  }

  wrapper.appendChild(grid);

  // Escape key
  wrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  });

  return wrapper;
}

export const monthYearPickerStyles = `
  .cal-myp {
    width: calc(7 * var(--cal-cell-size));
  }

  .cal-myp__year-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px;
    margin-bottom: 8px;
  }

  .cal-myp__year-label {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--cal-fg));
    user-select: none;
  }

  .cal-myp__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }

  .cal-myp__cell {
    display: flex;
    align-items: center;
    justify-content: center;
    height: calc(var(--cal-cell-size) * 1.5);
    font-size: 13px;
    font-weight: 500;
    color: hsl(var(--cal-fg));
    border-radius: var(--cal-radius-sm);
    cursor: pointer;
    transition: background var(--cal-transition);
    user-select: none;
  }

  .cal-myp__cell:hover {
    background: hsl(var(--cal-hover));
  }

  .cal-myp__cell--active {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    font-weight: 600;
  }

  .cal-myp__cell--active:hover {
    background: hsl(var(--cal-accent));
  }

  .cal-myp__cell--today:not(.cal-myp__cell--active) {
    border: 1px solid hsl(var(--cal-border));
    font-weight: 600;
  }
`;
