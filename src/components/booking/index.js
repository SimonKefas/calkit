import { CalendarBase } from '../../core/base-component.js';
import { createStore } from '../../core/state.js';
import {
  today, parseDate, toDateString, isSameDay, addMonths, getMonthNames, getShortMonthNames,
} from '../../core/dates.js';
import { generateSlots, generateDurationSlots } from '../../core/times.js';
import { tokens } from '../../styles/tokens.js';
import { reset } from '../../styles/reset.js';
import { animations } from '../../styles/animations.js';
import { renderNavigation, navigationStyles } from '../datepicker/navigation.js';
import { renderMonthYearPicker, monthYearPickerStyles } from '../datepicker/month-year-picker.js';
import { createPopover, popoverStyles } from '../datepicker/popover.js';
import { renderCalendarGrid, calendarGridStyles } from '../datepicker/calendar-grid.js';
import { renderTimeGrid, timeGridStyles } from '../timepicker/time-grid.js';
import { isSelectionValid, mergeCustomColors } from './booking-data.js';
import { renderTimeGridSkeleton, renderCalendarGridSkeleton, loadingSkeletonStyles } from '../shared/loading-skeleton.js';
import { renderStatusMessage, statusMessageStyles } from '../shared/status-message.js';

const calendarIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="12" height="11" rx="2"/><path d="M5 1v3M11 1v3M2 7h12"/></svg>`;

const componentStyles = `
  .cal-picker {
    background: hsl(var(--cal-bg));
    border-radius: var(--cal-radius);
    user-select: none;
  }

  :host([display="inline"]) .cal-picker {
    border: 1px solid hsl(var(--cal-border));
    padding: 12px;
  }

  .cal-months {
    display: flex;
    gap: 16px;
  }

  .cal-month {
    flex: 0 0 auto;
  }

  /* Time section */
  .cal-booking-time-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid hsl(var(--cal-border));
  }

  .cal-booking-time-header {
    font-size: 13px;
    font-weight: 600;
    color: hsl(var(--cal-fg));
    margin-bottom: 8px;
  }
`;

export class CalBooking extends CalendarBase {
  static get styles() {
    return [tokens, reset, animations, calendarGridStyles, timeGridStyles, navigationStyles, monthYearPickerStyles, popoverStyles, loadingSkeletonStyles, statusMessageStyles, componentStyles];
  }

  static get observedAttributes() {
    return [
      'theme', 'display', 'min-date', 'max-date', 'first-day', 'locale',
      'placeholder', 'dual', 'show-labels-on-hover',
      'time-slots', 'time-start', 'time-end', 'time-interval', 'time-format',
      'duration-labels', 'loading',
    ];
  }

  constructor() {
    super();

    const now = new Date();
    this._store = createStore({
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth(),
      rangeStart: null,
      rangeEnd: null,
      hoverDate: null,
      isOpen: false,
      focusedDate: today(),
      navDirection: null,
      pickingMonth: false,
      pickerYear: now.getFullYear(),
      // Time state
      startTime: null,
      endTime: null,
      timeSelectPhase: null, // null | 'start' | 'end'
      // Status
      statusType: null,
      statusMessage: null,
      statusDismissible: true,
    });

    this._bookings = [];
    this._dayData = {};
    this._labelFormula = null;
    this._colors = null;
    this._customColorMap = null;
    this._timeSlots = null; // explicit slot definitions
    this._popover = null;
    this._unsubscribe = null;
    this._rendering = false;
  }

  // -- Attribute getters --
  get display() { return this.getAttribute('display') || 'inline'; }
  get placeholder() { return this.getAttribute('placeholder') || 'Select dates'; }
  get firstDay() { return parseInt(this.getAttribute('first-day') || '0', 10); }
  get minDate() { return this.getAttribute('min-date') || null; }
  get maxDate() { return this.getAttribute('max-date') || null; }
  get locale() { return this.getAttribute('locale') || undefined; }
  get showLabelsOnHover() { return this.hasAttribute('show-labels-on-hover'); }
  get timeSlotsEnabled() { return this.hasAttribute('time-slots'); }
  get timeStartTime() { return this.getAttribute('time-start') || '09:00'; }
  get timeEndTime() { return this.getAttribute('time-end') || '17:00'; }
  get timeInterval() { return parseInt(this.getAttribute('time-interval') || '60', 10); }
  get timeFormat() { return this.getAttribute('time-format') || '24h'; }
  get durationLabels() { return this.hasAttribute('duration-labels'); }
  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  // -- Properties --
  get bookings() { return this._bookings; }
  set bookings(val) {
    this._bookings = Array.isArray(val) ? val : [];
    if (this._initialized) this.render();
  }

  get dayData() { return this._dayData; }
  set dayData(val) {
    this._dayData = val && typeof val === 'object' ? val : {};
    if (this._initialized) this.render();
  }

  get labelFormula() { return this._labelFormula; }
  set labelFormula(fn) {
    this._labelFormula = typeof fn === 'function' ? fn : null;
    if (this._initialized) this.render();
  }

  get timeSlots() { return this._timeSlots; }
  set timeSlots(val) {
    this._timeSlots = Array.isArray(val) ? val : null;
    if (this._initialized) this.render();
  }

  get colors() { return this._colors; }
  set colors(val) {
    this._colors = Array.isArray(val) ? val : null;
    this._customColorMap = mergeCustomColors(this._colors);
    // Inject CSS custom properties for custom colors
    if (this._customColorMap) {
      for (const [name, tokens] of Object.entries(this._customColorMap)) {
        this.style.setProperty(`--cal-booking-${name}-bg`, tokens.bg);
        this.style.setProperty(`--cal-booking-${name}-fg`, tokens.fg);
        this.style.setProperty(`--cal-booking-${name}-hover`, tokens.hover);
      }
    }
    if (this._initialized) this.render();
  }

  get value() {
    const state = this._store.getState();
    if (!state.rangeStart || !state.rangeEnd) return null;
    const val = { start: state.rangeStart, end: state.rangeEnd };
    if (this.timeSlotsEnabled) {
      if (state.startTime) val.startTime = state.startTime;
      if (state.endTime) val.endTime = state.endTime;
    }
    return val;
  }

  set value(val) {
    if (val && typeof val === 'object' && val.start && val.end) {
      const start = typeof val.start === 'string' ? val.start : toDateString(val.start);
      const end = typeof val.end === 'string' ? val.end : toDateString(val.end);
      const updates = { rangeStart: start, rangeEnd: end };
      if (val.startTime) updates.startTime = val.startTime;
      if (val.endTime) updates.endTime = val.endTime;
      this._store.set(updates);
      this._navigateToDate(start);
    } else {
      this._store.set({
        rangeStart: null, rangeEnd: null,
        startTime: null, endTime: null, timeSelectPhase: null,
      });
    }
  }

  _navigateToDate(dateStr) {
    const d = parseDate(dateStr);
    if (d) {
      this._store.set({ viewYear: d.getFullYear(), viewMonth: d.getMonth() });
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = this._store.subscribe((state, prev) => {
      if (this._rendering) return;
      // Hover-only change → lightweight CSS update
      const hoverOnly = state.hoverDate !== prev.hoverDate
        && state.viewYear === prev.viewYear && state.viewMonth === prev.viewMonth
        && state.rangeStart === prev.rangeStart && state.rangeEnd === prev.rangeEnd
        && state.isOpen === prev.isOpen && state.navDirection === prev.navDirection
        && state.pickingMonth === prev.pickingMonth && state.pickerYear === prev.pickerYear
        && state.timeSelectPhase === prev.timeSelectPhase;
      hoverOnly ? this._updateGridHighlight(state) : this.render();
    });

    // Parse bookings from attribute (JSON fallback)
    const bookingsAttr = this.getAttribute('bookings');
    if (bookingsAttr && !this._bookings.length) {
      try { this._bookings = JSON.parse(bookingsAttr); } catch (e) { /* ignore */ }
    }
  }

  disconnectedCallback() {
    this._unsubscribe?.();
    this._popover?.destroy();
    clearTimeout(this._statusTimer);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (this._initialized) this.render();
  }

  // -- Selection --
  _handleSelect(dateStr) {
    const state = this._store.getState();

    if (!state.rangeStart || state.rangeEnd) {
      // Start new range — reset time state
      this._store.set({
        rangeStart: dateStr,
        rangeEnd: null,
        hoverDate: null,
        focusedDate: dateStr,
        startTime: null,
        endTime: null,
        timeSelectPhase: null,
      });
    } else {
      // Complete range
      let start = state.rangeStart;
      let end = dateStr;
      if (start > end) [start, end] = [end, start];

      // Validate against bookings
      if (!isSelectionValid(start, end, this._bookings)) {
        this.emit('cal:selection-invalid', { start, end });
        this._store.set({
          rangeStart: null, rangeEnd: null, hoverDate: null,
          startTime: null, endTime: null, timeSelectPhase: null,
        });
        this.showStatus('error', 'Selection overlaps an existing booking', { autoDismiss: 4000 });
        return;
      }

      if (this.timeSlotsEnabled) {
        // Don't emit change yet — enter time selection phase
        this._store.set({
          rangeStart: start,
          rangeEnd: end,
          hoverDate: null,
          focusedDate: end,
          timeSelectPhase: 'start',
        });
      } else {
        this._store.set({
          rangeStart: start,
          rangeEnd: end,
          hoverDate: null,
          focusedDate: end,
        });
        this.emit('cal:change', { value: { start, end } });
        if (this.display === 'popover') this.close();
      }
    }
  }

  _handleTimeSelect(time) {
    const state = this._store.getState();

    if (state.timeSelectPhase === 'start') {
      this._store.set({ startTime: time, timeSelectPhase: 'end' });
    } else if (state.timeSelectPhase === 'end') {
      this._store.set({ endTime: time, timeSelectPhase: null });
      // Emit full value with times
      const value = {
        start: state.rangeStart,
        end: state.rangeEnd,
        startTime: state.startTime,
        endTime: time,
      };
      this.emit('cal:change', { value });
      if (this.display === 'popover') this.close();
    }
  }

  _handleHover(dateStr) {
    this._store.set({ hoverDate: dateStr });
  }

  // -- Lightweight hover highlight --
  _updateGridHighlight(state) {
    const buttons = this.$$('.cal-day');
    const { rangeStart, hoverDate } = state;
    const effectiveEnd = rangeStart && !state.rangeEnd && hoverDate ? hoverDate : state.rangeEnd;

    // Inline check for invalid hover
    let hoverRangeInvalid = false;
    if (rangeStart && !state.rangeEnd && hoverDate) {
      const lo = rangeStart < hoverDate ? rangeStart : hoverDate;
      const hi = rangeStart < hoverDate ? hoverDate : rangeStart;
      for (const b of this._bookings) {
        if (lo < b.end && hi > b.start) { hoverRangeInvalid = true; break; }
      }
    }

    for (const btn of buttons) {
      const dateStr = btn.dataset.date;
      if (!dateStr) continue;

      const isStart = dateStr === rangeStart && !!effectiveEnd;
      const isEnd = dateStr === effectiveEnd && !!effectiveEnd;

      let inRange = false;
      if (rangeStart && effectiveEnd) {
        const lo = rangeStart < effectiveEnd ? rangeStart : effectiveEnd;
        const hi = rangeStart < effectiveEnd ? effectiveEnd : rangeStart;
        inRange = dateStr >= lo && dateStr <= hi && !isStart && !isEnd;
      }

      const invalidRange = hoverRangeInvalid && rangeStart && !state.rangeEnd && hoverDate
        && (() => {
          const lo = rangeStart < hoverDate ? rangeStart : hoverDate;
          const hi = rangeStart < hoverDate ? hoverDate : rangeStart;
          return dateStr >= lo && dateStr <= hi;
        })();

      btn.classList.toggle('cal-day--range-start', isStart);
      btn.classList.toggle('cal-day--range-end', isEnd);
      btn.classList.toggle('cal-day--in-range', inRange);
      btn.classList.toggle('cal-day--invalid-range', !!invalidRange);
    }
  }

  // -- Navigation --
  _prevMonth() {
    const { viewYear, viewMonth } = this._store.getState();
    const { year, month } = addMonths(viewYear, viewMonth, -1);
    this._store.set({ viewYear: year, viewMonth: month, navDirection: 'prev' });
    this.emit('cal:month-change', { year, month });
  }

  _nextMonth() {
    const { viewYear, viewMonth } = this._store.getState();
    const { year, month } = addMonths(viewYear, viewMonth, 1);
    this._store.set({ viewYear: year, viewMonth: month, navDirection: 'next' });
    this.emit('cal:month-change', { year, month });
  }

  // -- Month picker --
  _toggleMonthPicker() {
    const state = this._store.getState();
    this._store.set({
      pickingMonth: !state.pickingMonth,
      pickerYear: state.viewYear,
    });
  }

  _selectMonthFromPicker(month, year) {
    this._store.set({
      viewYear: year,
      viewMonth: month,
      pickingMonth: false,
    });
    this.emit('cal:month-change', { year, month });
  }

  // -- Keyboard --
  _handleKeydown(e) {
    if (e.key === 'Escape' && this._store.get('pickingMonth')) {
      e.stopPropagation();
      this._store.set({ pickingMonth: false });
      return;
    }

    const state = this._store.getState();
    const focused = parseDate(state.focusedDate);
    if (!focused) return;

    let newDate = null;
    switch (e.key) {
      case 'ArrowLeft':
        newDate = new Date(focused); newDate.setDate(focused.getDate() - 1); break;
      case 'ArrowRight':
        newDate = new Date(focused); newDate.setDate(focused.getDate() + 1); break;
      case 'ArrowUp':
        newDate = new Date(focused); newDate.setDate(focused.getDate() - 7); break;
      case 'ArrowDown':
        newDate = new Date(focused); newDate.setDate(focused.getDate() + 7); break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._handleSelect(state.focusedDate);
        return;
      case 'Escape':
        if (this.display === 'popover') this.close();
        return;
      default: return;
    }

    if (newDate) {
      e.preventDefault();
      const dateStr = toDateString(newDate);
      if (newDate.getMonth() !== state.viewMonth || newDate.getFullYear() !== state.viewYear) {
        this._store.set({
          viewYear: newDate.getFullYear(), viewMonth: newDate.getMonth(),
          focusedDate: dateStr, navDirection: newDate > focused ? 'next' : 'prev',
        });
      } else {
        this._store.set({ focusedDate: dateStr });
      }
      requestAnimationFrame(() => {
        const cell = this.$(`[data-date="${dateStr}"]`);
        cell?.focus();
      });
    }
  }

  // -- Public API --
  open() {
    if (this._popover) {
      this._popover.open();
      this._store.set({ isOpen: true });
      this.emit('cal:open');
    }
  }

  close() {
    if (this._popover) {
      this._popover.close();
      this._store.set({ isOpen: false });
      this.emit('cal:close');
    }
  }

  goToMonth(month, year) {
    this._store.set({ viewYear: year, viewMonth: month });
  }

  clear() {
    this._store.set({
      rangeStart: null,
      rangeEnd: null,
      hoverDate: null,
      startTime: null,
      endTime: null,
      timeSelectPhase: null,
    });
    this.emit('cal:change', { value: null });
  }

  // -- Time slots generation --
  _getTimeSlotArray() {
    if (this._timeSlots) {
      return this._timeSlots;
    }
    // Generate from attributes
    if (this.durationLabels) {
      return generateDurationSlots(this.timeStartTime, this.timeEndTime, this.timeInterval, this.timeFormat)
        .map((slot) => ({ ...slot, available: true }));
    }
    const times = generateSlots(this.timeStartTime, this.timeEndTime, this.timeInterval);
    return times.map((t) => ({ time: t, available: true }));
  }

  // -- Render --
  _renderCalendarContent() {
    const state = this._store.getState();
    const container = document.createElement('div');
    container.classList.add('cal-picker');

    // Status banner
    if (state.statusType && state.statusMessage) {
      container.appendChild(renderStatusMessage({
        type: state.statusType,
        message: state.statusMessage,
        dismissible: state.statusDismissible,
        onDismiss: () => this.clearStatus(),
      }));
    }

    if (this.loading) {
      const monthsWrapper = document.createElement('div');
      monthsWrapper.classList.add('cal-months');
      const monthEl = document.createElement('div');
      monthEl.classList.add('cal-month');
      monthEl.appendChild(renderCalendarGridSkeleton());
      monthsWrapper.appendChild(monthEl);
      container.appendChild(monthsWrapper);
      if (this.timeSlotsEnabled) {
        const timeSection = document.createElement('div');
        timeSection.classList.add('cal-booking-time-section');
        timeSection.appendChild(renderTimeGridSkeleton({ durationLabels: this.durationLabels }));
        container.appendChild(timeSection);
      }
      container.addEventListener('keydown', (e) => this._handleKeydown(e));
      return container;
    }

    const monthsWrapper = document.createElement('div');
    monthsWrapper.classList.add('cal-months');

    const showDual = this.hasAttribute('dual');
    const monthCount = showDual ? 2 : 1;

    for (let i = 0; i < monthCount; i++) {
      const { year, month } = i === 0
        ? { year: state.viewYear, month: state.viewMonth }
        : addMonths(state.viewYear, state.viewMonth, 1);

      const monthEl = document.createElement('div');
      monthEl.classList.add('cal-month');

      if (i === 0) {
        monthEl.appendChild(renderNavigation({
          year, month,
          onPrev: state.pickingMonth ? () => {} : () => this._prevMonth(),
          onNext: state.pickingMonth ? () => {} : () => { if (!showDual) this._nextMonth(); },
          onTitleClick: () => this._toggleMonthPicker(),
          locale: this.locale,
        }));
      }

      if (i === 1) {
        monthEl.appendChild(renderNavigation({
          year, month,
          onPrev: () => {},
          onNext: () => this._nextMonth(),
          locale: this.locale,
        }));
      }

      // Month picker replaces day grid for first panel
      if (state.pickingMonth && i === 0) {
        const picker = renderMonthYearPicker({
          pickerYear: state.pickerYear,
          viewMonth: state.viewMonth,
          viewYear: state.viewYear,
          onMonthSelect: (m, y) => this._selectMonthFromPicker(m, y),
          onYearPrev: () => this._store.set({ pickerYear: state.pickerYear - 1 }),
          onYearNext: () => this._store.set({ pickerYear: state.pickerYear + 1 }),
          onClose: () => this._store.set({ pickingMonth: false }),
          locale: this.locale,
        });
        monthEl.appendChild(picker);
      } else {
        const animClass = state.navDirection === 'next'
          ? 'cal-animate-slide-left'
          : state.navDirection === 'prev'
            ? 'cal-animate-slide-right'
            : '';

        const grid = renderCalendarGrid({
          year, month,
          firstDay: this.firstDay,
          rangeStart: state.rangeStart,
          rangeEnd: state.rangeEnd,
          hoverDate: state.hoverDate,
          minDate: this.minDate,
          maxDate: this.maxDate,
          focusedDate: state.focusedDate,
          mode: 'range',
          onSelect: (d) => this._handleSelect(d),
          onHover: (d) => this._handleHover(d),
          // Booking-specific params
          bookings: this._bookings,
          dayData: this._dayData,
          labelFormula: this._labelFormula,
          showLabelsOnHover: this.showLabelsOnHover,
          locale: this.locale,
          customColors: this._customColorMap,
        });

        if (animClass) grid.classList.add(animClass);
        monthEl.appendChild(grid);
      }
      monthsWrapper.appendChild(monthEl);
    }

    container.appendChild(monthsWrapper);

    // Time section (date-then-time flow) — hidden when month picker is open
    if (this.timeSlotsEnabled && state.timeSelectPhase && !state.pickingMonth) {
      const timeSection = document.createElement('div');
      timeSection.classList.add('cal-booking-time-section');

      const header = document.createElement('div');
      header.classList.add('cal-booking-time-header');
      header.textContent = state.timeSelectPhase === 'start'
        ? 'Select check-in time'
        : 'Select check-out time';
      timeSection.appendChild(header);

      const slots = this._getTimeSlotArray();
      const timeGrid = renderTimeGrid({
        slots,
        mode: 'single',
        format: this.timeFormat,
        selected: state.timeSelectPhase === 'end' ? state.startTime : null,
        onSelect: (t) => this._handleTimeSelect(t),
        onHover: () => {},
        durationLabels: this.durationLabels,
      });
      timeSection.appendChild(timeGrid);

      container.appendChild(timeSection);
    }

    container.addEventListener('keydown', (e) => this._handleKeydown(e));

    return container;
  }

  _formatTriggerText() {
    const state = this._store.getState();
    if (state.rangeStart && state.rangeEnd) {
      let text = `${this._formatShortDate(state.rangeStart)} – ${this._formatShortDate(state.rangeEnd)}`;
      if (state.startTime && state.endTime) {
        text += ` (${state.startTime} – ${state.endTime})`;
      }
      return text;
    }
    return null;
  }

  _formatShortDate(dateStr) {
    const d = parseDate(dateStr);
    if (!d) return dateStr;
    if (this.locale) {
      try {
        return new Intl.DateTimeFormat(this.locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(d);
      } catch (e) { /* fall through */ }
    }
    const months = getShortMonthNames(this.locale);
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  render() {
    if (this._rendering) return;
    this._rendering = true;

    const root = this.shadowRoot;

    // Clear non-style children
    const children = [...root.childNodes];
    for (const child of children) {
      if (child.nodeName !== 'STYLE' && !(child instanceof CSSStyleSheet)) {
        root.removeChild(child);
      }
    }

    this._popover?.destroy();
    this._popover = null;

    if (this.display === 'popover') {
      const wrapper = document.createElement('div');
      wrapper.classList.add('cal-popover-wrapper');

      const trigger = document.createElement('button');
      trigger.classList.add('cal-trigger');

      const icon = document.createElement('span');
      icon.classList.add('cal-trigger__icon');
      icon.innerHTML = calendarIcon;
      trigger.appendChild(icon);

      const text = this._formatTriggerText();
      const label = document.createElement('span');
      if (text) {
        label.textContent = text;
      } else {
        label.textContent = this.placeholder;
        label.classList.add('cal-trigger--placeholder');
      }
      trigger.appendChild(label);
      wrapper.appendChild(trigger);

      const content = this._renderCalendarContent();
      const popover = createPopover({
        trigger,
        content,
        onClose: () => {
          this._store.set({ isOpen: false });
          this.emit('cal:close');
        },
      });

      wrapper.appendChild(popover.panel);
      root.appendChild(wrapper);

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (popover.isOpen) {
          this.close();
        } else {
          this.open();
        }
      });

      this._popover = popover;
      if (this._store.get('isOpen')) {
        popover.open();
      }
    } else {
      root.appendChild(this._renderCalendarContent());
    }

    this._store.set({ navDirection: null });
    this._rendering = false;
  }
}
