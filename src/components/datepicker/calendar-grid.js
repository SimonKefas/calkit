import { buildMonthGrid, getWeekdayLabels, isSameDay, isInRange } from '../../core/dates.js';
import { resolveCellData, isHoverRangeInvalid } from '../booking/booking-data.js';

/**
 * Renders a 7×6 month grid.
 * Supports both datepicker mode (default) and booking mode (when bookings param is provided).
 *
 * @param {object} options
 * @param {number} options.year
 * @param {number} options.month
 * @param {number} options.firstDay - 0=Sun, 1=Mon
 * @param {string[]} options.selectedDates - ISO date strings
 * @param {string|null} options.rangeStart
 * @param {string|null} options.rangeEnd
 * @param {string|null} options.hoverDate - for range preview
 * @param {string|null} options.minDate
 * @param {string|null} options.maxDate
 * @param {string[]} options.disabledDates
 * @param {string} options.mode - single|range|multi
 * @param {string|null} options.focusedDate - date that should receive tabindex=0
 * @param {function} options.onSelect
 * @param {function} options.onHover
 * @param {Array|null} options.bookings - booking data (enables booking mode)
 * @param {Object|null} options.dayData - map of dateStr → { label, status }
 * @param {Function|null} options.labelFormula - (dateStr) => { label, status }
 * @param {boolean} options.showLabelsOnHover - show booking labels as tooltips
 * @returns {HTMLElement}
 */
export function renderCalendarGrid(options) {
  const {
    year, month, firstDay = 0,
    selectedDates = [], rangeStart, rangeEnd, hoverDate,
    minDate, maxDate, disabledDates = [],
    mode = 'single', focusedDate,
    onSelect, onHover,
    // Booking-specific params
    bookings = null, dayData = null, labelFormula = null,
    showLabelsOnHover = false,
  } = options;

  const isBookingMode = bookings !== null;

  const grid = document.createElement('div');
  grid.setAttribute('role', 'grid');
  grid.classList.add('cal-grid');

  // Weekday header row
  const headerRow = document.createElement('div');
  headerRow.setAttribute('role', 'row');
  headerRow.classList.add('cal-weekdays');
  for (const label of getWeekdayLabels(firstDay)) {
    const cell = document.createElement('div');
    cell.setAttribute('role', 'columnheader');
    cell.setAttribute('aria-label', label);
    cell.classList.add('cal-weekday');
    cell.textContent = label;
    headerRow.appendChild(cell);
  }
  grid.appendChild(headerRow);

  // Day cells
  const cells = buildMonthGrid(year, month, firstDay);
  const effectiveEnd = mode === 'range' && rangeStart && !rangeEnd && hoverDate
    ? hoverDate
    : (isBookingMode && rangeStart && !rangeEnd && hoverDate ? hoverDate : rangeEnd);

  // Booking: detect invalid hover range
  const hoverInvalid = isBookingMode
    ? isHoverRangeInvalid(rangeStart, hoverDate, bookings)
    : false;

  let row;
  cells.forEach((cell, i) => {
    if (i % 7 === 0) {
      row = document.createElement('div');
      row.setAttribute('role', 'row');
      row.classList.add('cal-row');
      grid.appendChild(row);
    }

    const btn = document.createElement('button');
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('part', 'day');
    btn.classList.add('cal-day');

    const dateStr = cell.dateString;
    btn.dataset.date = dateStr;

    // Accessibility label
    const dateObj = new Date(cell.year, cell.month, cell.day);
    btn.setAttribute('aria-label', dateObj.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }));

    // Outside month
    if (!cell.isCurrentMonth) {
      btn.classList.add('cal-day--outside');
    }

    // Today
    if (cell.isToday) {
      btn.classList.add('cal-day--today');
    }

    // --- Booking mode: resolve cell data and apply booking classes ---
    let cellData = null;
    let bookingDisabled = false;

    if (isBookingMode) {
      cellData = resolveCellData(dateStr, bookings, dayData || {}, labelFormula);
      const { status, label, halfDay, colorOut, colorIn, colorFull } = cellData;

      if (status === 'booked') {
        btn.classList.add('cal-day--booked');
        if (colorFull) {
          btn.style.setProperty('--booking-bg', `hsl(${colorFull.bg})`);
          btn.style.setProperty('--booking-fg', `hsl(${colorFull.fg})`);
          btn.style.setProperty('--booking-hover', `hsl(${colorFull.hover})`);
        }
        bookingDisabled = true;
      }

      if (status === 'blocked') {
        btn.classList.add('cal-day--blocked');
        bookingDisabled = true;
      }

      if (halfDay) {
        btn.classList.add('cal-day--half-day');
        if (colorOut) btn.style.setProperty('--half-day-color-out', `hsl(${colorOut.bg})`);
        if (colorIn) btn.style.setProperty('--half-day-color-in', `hsl(${colorIn.bg})`);
        bookingDisabled = true;
      }

      if (status === 'checkout-only') {
        btn.classList.add('cal-day--checkout-only');
        if (colorOut) {
          btn.style.setProperty('--half-day-color-out', `hsl(${colorOut.bg})`);
        }
      }

      if (status === 'checkin-only') {
        btn.classList.add('cal-day--checkin-only');
        if (colorIn) {
          btn.style.setProperty('--half-day-color-in', `hsl(${colorIn.bg})`);
        }
      }

      // Tooltip: show booking label on hover
      if (showLabelsOnHover) {
        let tooltipLabel = null;
        if (halfDay && cellData.checkoutBooking && cellData.checkinBooking) {
          tooltipLabel = `${cellData.checkoutBooking.label || ''} / ${cellData.checkinBooking.label || ''}`;
        } else if (status === 'booked') {
          const spanning = bookings.find((b) => b.start <= dateStr && b.end > dateStr);
          if (spanning) tooltipLabel = spanning.label;
        } else if (status === 'checkout-only' && cellData.checkoutBooking) {
          tooltipLabel = cellData.checkoutBooking.label;
        } else if (status === 'checkin-only' && cellData.checkinBooking) {
          tooltipLabel = cellData.checkinBooking.label;
        }
        if (tooltipLabel) {
          btn.setAttribute('data-booking-label', tooltipLabel);
        }
      }

      // Invalid range preview
      if (hoverInvalid && rangeStart && !rangeEnd && hoverDate) {
        const lo = rangeStart < hoverDate ? rangeStart : hoverDate;
        const hi = rangeStart < hoverDate ? hoverDate : rangeStart;
        if (dateStr >= lo && dateStr <= hi) {
          btn.classList.add('cal-day--invalid-range');
        }
      }
    }

    // --- Selected ---
    if (isBookingMode) {
      // In booking mode, selected means rangeStart or rangeEnd
      const isSelected = rangeStart && rangeEnd
        && (isSameDay(dateStr, rangeStart) || isSameDay(dateStr, rangeEnd));
      if (isSelected) {
        btn.classList.add('cal-day--selected');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.setAttribute('aria-selected', 'false');
      }
    } else {
      const isSelected = selectedDates.some((d) => isSameDay(d, dateStr));
      if (isSelected) {
        btn.classList.add('cal-day--selected');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.setAttribute('aria-selected', 'false');
      }
    }

    // Range highlighting
    if ((mode === 'range' || isBookingMode) && rangeStart && effectiveEnd) {
      const isStart = isSameDay(dateStr, rangeStart);
      const isEnd = isSameDay(dateStr, effectiveEnd);
      const inRange = isInRange(dateStr, rangeStart, effectiveEnd);

      if (isStart) btn.classList.add('cal-day--range-start');
      if (isEnd) btn.classList.add('cal-day--range-end');
      if (inRange && !isStart && !isEnd) btn.classList.add('cal-day--in-range');
    }

    // Disabled
    const isDisabled = isDateDisabled(dateStr, minDate, maxDate, disabledDates);
    const effectiveDisabled = isDisabled || bookingDisabled;
    if (effectiveDisabled) {
      btn.classList.add('cal-day--disabled');
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
    }

    // Focus management
    if (focusedDate && isSameDay(dateStr, focusedDate)) {
      btn.setAttribute('tabindex', '0');
    } else {
      btn.setAttribute('tabindex', '-1');
    }

    // --- Cell content ---
    if (isBookingMode && cellData && cellData.label != null) {
      // Sublabel layout: number + label
      btn.classList.add('cal-day--with-label');
      const numSpan = document.createElement('span');
      numSpan.classList.add('cal-day__number');
      numSpan.textContent = cell.day;
      btn.appendChild(numSpan);

      const labelSpan = document.createElement('span');
      labelSpan.classList.add('cal-day__label');
      labelSpan.textContent = cellData.label;
      btn.appendChild(labelSpan);
    } else {
      btn.textContent = cell.day;
    }

    // Events
    if (!effectiveDisabled) {
      btn.addEventListener('click', () => onSelect?.(dateStr));
      btn.addEventListener('mouseenter', () => onHover?.(dateStr));
    } else if (isBookingMode) {
      // Even disabled booking cells trigger hover for range preview
      btn.addEventListener('mouseenter', () => onHover?.(dateStr));
    }

    row.appendChild(btn);
  });

  grid.addEventListener('mouseleave', () => onHover?.(null));

  return grid;
}

function isDateDisabled(dateStr, minDate, maxDate, disabledDates) {
  if (disabledDates.includes(dateStr)) return true;
  if (minDate && dateStr < minDate) return true;
  if (maxDate && dateStr > maxDate) return true;
  return false;
}

export const calendarGridStyles = `
  .cal-grid {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .cal-weekdays {
    display: grid;
    grid-template-columns: repeat(7, var(--cal-cell-size));
    gap: 0;
    margin-bottom: 4px;
  }

  .cal-weekday {
    display: flex;
    align-items: center;
    justify-content: center;
    height: var(--cal-cell-size);
    font-size: 12px;
    font-weight: 500;
    color: hsl(var(--cal-fg-muted));
    user-select: none;
  }

  .cal-row {
    display: grid;
    grid-template-columns: repeat(7, var(--cal-cell-size));
    gap: 0;
  }

  .cal-day {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--cal-cell-size);
    height: var(--cal-cell-size);
    font-size: 14px;
    border-radius: var(--cal-radius-sm);
    transition: background var(--cal-transition), color var(--cal-transition);
    position: relative;
    user-select: none;
  }

  .cal-day:not(.cal-day--disabled):not(.cal-day--selected):not(.cal-day--booked):not(.cal-day--half-day):not(.cal-day--blocked):not(.cal-day--checkout-only):not(.cal-day--checkin-only):hover {
    background: hsl(var(--cal-hover));
  }

  .cal-day--outside {
    color: hsl(var(--cal-fg-muted));
    opacity: 0.4;
  }

  .cal-day--today:not(.cal-day--selected):not(.cal-day--booked):not(.cal-day--half-day):not(.cal-day--checkout-only):not(.cal-day--checkin-only) {
    border: 1px solid hsl(var(--cal-border));
    font-weight: 600;
  }

  .cal-day--selected {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    font-weight: 600;
  }

  .cal-day--range-start {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    font-weight: 600;
    border-radius: var(--cal-radius-sm) 0 0 var(--cal-radius-sm);
  }

  .cal-day--range-end {
    background: hsl(var(--cal-accent));
    color: hsl(var(--cal-accent-fg));
    font-weight: 600;
    border-radius: 0 var(--cal-radius-sm) var(--cal-radius-sm) 0;
  }

  .cal-day--range-start.cal-day--range-end {
    border-radius: var(--cal-radius-sm);
  }

  .cal-day--in-range {
    background: hsl(var(--cal-accent-subtle));
    border-radius: 0;
  }

  .cal-day--in-range:hover {
    background: hsl(var(--cal-accent-subtle)) !important;
  }

  .cal-day--disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ── Booking-specific styles ── */

  /* Booked (fully occupied) */
  .cal-day--booked {
    background: var(--booking-bg, hsl(var(--cal-booking-blue-bg)));
    color: var(--booking-fg, hsl(var(--cal-booking-blue-fg)));
    cursor: not-allowed;
  }

  .cal-day--booked:hover {
    background: var(--booking-hover, hsl(var(--cal-booking-blue-hover)));
  }

  /* Blocked */
  .cal-day--blocked {
    background: hsl(var(--cal-bg-muted));
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* Half-day diagonal (checkout + checkin on same day) */
  .cal-day--half-day {
    background: linear-gradient(135deg,
      var(--half-day-color-out, hsl(var(--cal-booking-blue-bg))) 49.5%,
      hsl(var(--cal-bg)) 49.5%, hsl(var(--cal-bg)) 50.5%,
      var(--half-day-color-in, hsl(var(--cal-booking-green-bg))) 50.5%);
    cursor: not-allowed;
  }

  /* Checkout-only (last day of a booking — outgoing triangle) */
  .cal-day--checkout-only {
    background: linear-gradient(135deg,
      var(--half-day-color-out, hsl(var(--cal-booking-blue-bg))) 49.5%,
      hsl(var(--cal-bg)) 49.5%);
  }

  /* Checkin-only (first day of a booking — incoming triangle) */
  .cal-day--checkin-only {
    background: linear-gradient(135deg,
      hsl(var(--cal-bg)) 50.5%,
      var(--half-day-color-in, hsl(var(--cal-booking-blue-bg))) 50.5%);
  }

  /* Diagonal cells: standard text color for clean contrast */
  .cal-day--half-day,
  .cal-day--checkout-only,
  .cal-day--checkin-only {
    color: hsl(var(--cal-fg));
  }

  /* ── Diagonal + selection compounds ── */

  /* Checkout-only — range boundary: accent-subtle fill + refined ring */
  .cal-day--checkout-only.cal-day--range-start,
  .cal-day--checkout-only.cal-day--range-end,
  .cal-day--checkout-only.cal-day--selected {
    background: linear-gradient(135deg,
      var(--half-day-color-out, hsl(var(--cal-booking-blue-bg))) 49.5%,
      hsl(var(--cal-accent-subtle)) 50.5%);
    color: hsl(var(--cal-fg));
    box-shadow: inset 0 0 0 1.5px hsl(var(--cal-accent) / 0.3);
  }

  /* Checkout-only — in range: accent-subtle fill */
  .cal-day--checkout-only.cal-day--in-range {
    background: linear-gradient(135deg,
      var(--half-day-color-out, hsl(var(--cal-booking-blue-bg))) 49.5%,
      hsl(var(--cal-accent-subtle)) 50.5%);
  }

  /* Checkin-only — range boundary: accent-subtle fill + refined ring */
  .cal-day--checkin-only.cal-day--range-start,
  .cal-day--checkin-only.cal-day--range-end,
  .cal-day--checkin-only.cal-day--selected {
    background: linear-gradient(135deg,
      hsl(var(--cal-accent-subtle)) 49.5%,
      var(--half-day-color-in, hsl(var(--cal-booking-blue-bg))) 50.5%);
    color: hsl(var(--cal-fg));
    box-shadow: inset 0 0 0 1.5px hsl(var(--cal-accent) / 0.3);
  }

  /* Checkin-only — in range: accent-subtle fill */
  .cal-day--checkin-only.cal-day--in-range {
    background: linear-gradient(135deg,
      hsl(var(--cal-accent-subtle)) 49.5%,
      var(--half-day-color-in, hsl(var(--cal-booking-blue-bg))) 50.5%);
  }

  /* Half-day in range — accent-subtle stripe between booking triangles */
  .cal-day--half-day.cal-day--in-range {
    background: linear-gradient(135deg,
      var(--half-day-color-out, hsl(var(--cal-booking-blue-bg))) 49.5%,
      hsl(var(--cal-accent-subtle)) 49.5%, hsl(var(--cal-accent-subtle)) 50.5%,
      var(--half-day-color-in, hsl(var(--cal-booking-green-bg))) 50.5%);
  }

  /* Invalid range preview (crosses a booking) */
  .cal-day--invalid-range {
    background: hsl(var(--cal-booking-red-bg));
    border-radius: 0;
  }

  /* Booked/half-day/diagonal cells stay opaque even when disabled */
  .cal-day--disabled.cal-day--booked,
  .cal-day--disabled.cal-day--half-day,
  .cal-day--disabled.cal-day--checkout-only,
  .cal-day--disabled.cal-day--checkin-only {
    opacity: 1;
  }

  /* Sublabel spans */
  .cal-day__number {
    font-size: 13px;
    font-weight: 500;
    line-height: 1;
  }

  .cal-day__label {
    font-size: 9px;
    font-weight: 500;
    line-height: 1;
    opacity: 0.8;
  }

  .cal-day--with-label {
    flex-direction: column;
    gap: 1px;
  }

  /* CSS Tooltip */
  .cal-day[data-booking-label] {
    overflow: visible;
  }

  .cal-day[data-booking-label]:hover::after {
    content: attr(data-booking-label);
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
    color: hsl(var(--cal-accent-fg));
    background: hsl(var(--cal-accent));
    border-radius: 4px;
    pointer-events: none;
    z-index: 10;
  }

  .cal-day[data-booking-label]:hover::before {
    content: '';
    position: absolute;
    bottom: calc(100% + 2px);
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: hsl(var(--cal-accent));
    pointer-events: none;
    z-index: 10;
  }
`;
