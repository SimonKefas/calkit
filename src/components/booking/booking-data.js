/**
 * Booking data layer: cell status resolution, validation, and color palette.
 */

/** Color palette mapping from booking color names to CSS token pairs. */
export const BOOKING_COLORS = {
  blue:   { bg: 'var(--cal-booking-blue-bg)',   fg: 'var(--cal-booking-blue-fg)',   hover: 'var(--cal-booking-blue-hover)' },
  green:  { bg: 'var(--cal-booking-green-bg)',  fg: 'var(--cal-booking-green-fg)',  hover: 'var(--cal-booking-green-hover)' },
  red:    { bg: 'var(--cal-booking-red-bg)',    fg: 'var(--cal-booking-red-fg)',    hover: 'var(--cal-booking-red-hover)' },
  orange: { bg: 'var(--cal-booking-orange-bg)', fg: 'var(--cal-booking-orange-fg)', hover: 'var(--cal-booking-orange-hover)' },
  gray:   { bg: 'var(--cal-booking-gray-bg)',   fg: 'var(--cal-booking-gray-fg)',   hover: 'var(--cal-booking-gray-hover)' },
};

const DEFAULT_COLOR = 'blue';

function getColorTokens(colorName) {
  return BOOKING_COLORS[colorName] || BOOKING_COLORS[DEFAULT_COLOR];
}

/**
 * Resolve cell status for a single date given bookings, dayData, and labelFormula.
 *
 * Priority: labelFormula > dayData > derived from bookings.
 *
 * @param {string} dateStr - ISO date string
 * @param {Array} bookings - array of { id, start, end, label, color }
 * @param {Object} dayData - map of dateStr → { label, status }
 * @param {Function|null} labelFormula - (dateStr) => { label, status }
 * @returns {{ status, label, checkoutBooking, checkinBooking, halfDay, colorOut, colorIn, colorFull }}
 */
export function resolveCellData(dateStr, bookings = [], dayData = {}, labelFormula = null) {
  // Find bookings that touch this date
  const checkoutBooking = bookings.find((b) => b.end === dateStr);
  const checkinBooking = bookings.find((b) => b.start === dateStr);
  const spanningBooking = bookings.find(
    (b) => b.start < dateStr && b.end > dateStr
  );

  // Derive base status from bookings
  let status = 'available';
  let label = null;
  let halfDay = false;
  let colorOut = null;
  let colorIn = null;
  let colorFull = null;

  if (checkoutBooking && checkinBooking) {
    // Half-day: one booking ends, another begins
    status = 'half-day';
    halfDay = true;
    colorOut = getColorTokens(checkoutBooking.color || DEFAULT_COLOR);
    colorIn = getColorTokens(checkinBooking.color || DEFAULT_COLOR);
  } else if (spanningBooking) {
    status = 'booked';
    colorFull = getColorTokens(spanningBooking.color || DEFAULT_COLOR);
  } else if (checkinBooking && !checkoutBooking) {
    // First day of a booking — only the incoming triangle is filled
    status = 'checkin-only';
    colorIn = getColorTokens(checkinBooking.color || DEFAULT_COLOR);
  } else if (checkoutBooking && !checkinBooking) {
    // Last day of a booking (checkout day — could be selectable as checkout boundary)
    status = 'checkout-only';
    colorOut = getColorTokens(checkoutBooking.color || DEFAULT_COLOR);
  }

  // Override with dayData (static)
  const staticData = dayData[dateStr];
  if (staticData) {
    if (staticData.status) status = staticData.status;
    if (staticData.label !== undefined) label = staticData.label;
  }

  // Override with labelFormula (highest priority)
  if (labelFormula) {
    const formulaResult = labelFormula(dateStr);
    if (formulaResult) {
      if (formulaResult.status) status = formulaResult.status;
      if (formulaResult.label !== undefined) label = formulaResult.label;
    }
  }

  return { status, label, checkoutBooking, checkinBooking, halfDay, colorOut, colorIn, colorFull };
}

/**
 * Validate if a selection range overlaps any existing booking.
 * Same-day checkout/checkin overlap is allowed.
 *
 * @param {string} start - selection start date
 * @param {string} end - selection end date
 * @param {Array} bookings - existing bookings
 * @returns {boolean} true if selection is valid (no overlap)
 */
export function isSelectionValid(start, end, bookings = []) {
  if (!start || !end) return true;
  const selStart = start < end ? start : end;
  const selEnd = start < end ? end : start;

  for (const booking of bookings) {
    // Same-day boundary is allowed: selection ending on booking start, or starting on booking end
    if (selStart < booking.end && selEnd > booking.start) {
      return false;
    }
  }
  return true;
}

/**
 * Check if a hover preview range would be invalid.
 */
export function isHoverRangeInvalid(rangeStart, hoverDate, bookings = []) {
  if (!rangeStart || !hoverDate) return false;
  return !isSelectionValid(rangeStart, hoverDate, bookings);
}
