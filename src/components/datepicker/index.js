import { CalendarBase } from '../../core/base-component.js';
import { createStore } from '../../core/state.js';
import {
  today, parseDate, toDateString, isSameDay, addMonths, getMonthNames, getShortMonthNames,
} from '../../core/dates.js';
import { tokens } from '../../styles/tokens.js';
import { reset } from '../../styles/reset.js';
import { animations } from '../../styles/animations.js';
import { renderCalendarGrid, calendarGridStyles } from './calendar-grid.js';
import { renderNavigation, navigationStyles } from './navigation.js';
import { renderMonthYearPicker, monthYearPickerStyles } from './month-year-picker.js';
import { renderPresets, presetsStyles } from './presets.js';
import { createPopover, popoverStyles } from './popover.js';
import { renderCalendarGridSkeleton, loadingSkeletonStyles } from '../shared/loading-skeleton.js';
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
`;

export class CalDatepicker extends CalendarBase {
  static get styles() {
    return [tokens, reset, animations, calendarGridStyles, navigationStyles, monthYearPickerStyles, presetsStyles, popoverStyles, loadingSkeletonStyles, statusMessageStyles, componentStyles];
  }

  static get observedAttributes() {
    return ['mode', 'display', 'theme', 'value', 'min-date', 'max-date', 'disabled-dates', 'first-day', 'locale', 'presets', 'placeholder', 'loading'];
  }

  constructor() {
    super();

    const now = new Date();
    this._store = createStore({
      viewYear: now.getFullYear(),
      viewMonth: now.getMonth(),
      selectedDates: [],
      rangeStart: null,
      rangeEnd: null,
      hoverDate: null,
      isOpen: false,
      focusedDate: today(),
      navDirection: null,
      pickingMonth: false,
      pickerYear: now.getFullYear(),
      statusType: null,
      statusMessage: null,
      statusDismissible: true,
    });

    this._popover = null;
    this._unsubscribe = null;
    this._rendering = false;
  }

  // -- Attribute getters --
  get mode() { return this.getAttribute('mode') || 'single'; }
  get display() { return this.getAttribute('display') || 'inline'; }
  get placeholder() { return this.getAttribute('placeholder') || 'Select date'; }
  get firstDay() { return parseInt(this.getAttribute('first-day') || '0', 10); }
  get minDate() { return this.getAttribute('min-date') || null; }
  get maxDate() { return this.getAttribute('max-date') || null; }
  get locale() { return this.getAttribute('locale') || undefined; }

  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }

  get disabledDates() {
    const attr = this.getAttribute('disabled-dates');
    return attr ? attr.split(',').map((d) => d.trim()) : [];
  }

  get presetKeys() {
    const attr = this.getAttribute('presets');
    return attr ? attr.split(',').map((k) => k.trim()) : [];
  }

  // -- Value property --
  get value() {
    const state = this._store.getState();
    if (this.mode === 'range') {
      return state.rangeStart && state.rangeEnd
        ? { start: state.rangeStart, end: state.rangeEnd }
        : null;
    }
    if (this.mode === 'multi') {
      return [...state.selectedDates];
    }
    return state.selectedDates[0] || null;
  }

  set value(val) {
    if (this.mode === 'range' && val && typeof val === 'object') {
      const start = typeof val.start === 'string' ? val.start : toDateString(val.start);
      const end = typeof val.end === 'string' ? val.end : toDateString(val.end);
      this._store.set({
        rangeStart: start,
        rangeEnd: end,
        selectedDates: [start, end],
      });
      this._navigateToDate(start);
    } else if (this.mode === 'multi' && Array.isArray(val)) {
      this._store.set({ selectedDates: val });
      if (val.length) this._navigateToDate(val[0]);
    } else if (typeof val === 'string') {
      this._store.set({ selectedDates: [val], rangeStart: null, rangeEnd: null });
      this._navigateToDate(val);
    } else {
      this._store.set({ selectedDates: [], rangeStart: null, rangeEnd: null });
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
      // Hover-only change → toggle range classes without DOM rebuild
      const hoverOnly = state.hoverDate !== prev.hoverDate
        && state.viewYear === prev.viewYear && state.viewMonth === prev.viewMonth
        && state.selectedDates === prev.selectedDates
        && state.rangeStart === prev.rangeStart && state.rangeEnd === prev.rangeEnd
        && state.isOpen === prev.isOpen && state.navDirection === prev.navDirection
        && state.pickingMonth === prev.pickingMonth && state.pickerYear === prev.pickerYear;
      hoverOnly ? this._updateGridHighlight(state) : this.render();
    });

    // Parse initial value attribute
    const valueAttr = this.getAttribute('value');
    if (valueAttr) {
      if (this.mode === 'range' && valueAttr.includes('/')) {
        const [start, end] = valueAttr.split('/');
        this.value = { start, end };
      } else if (this.mode === 'multi' && valueAttr.includes(',')) {
        this.value = valueAttr.split(',').map((d) => d.trim());
      } else {
        this.value = valueAttr;
      }
    }
  }

  disconnectedCallback() {
    this._unsubscribe?.();
    this._popover?.destroy();
    clearTimeout(this._statusTimer);
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'value' && this._initialized) {
      // Re-parse value
      if (this.mode === 'range' && newVal && newVal.includes('/')) {
        const [start, end] = newVal.split('/');
        this.value = { start, end };
      } else if (this.mode === 'multi' && newVal && newVal.includes(',')) {
        this.value = newVal.split(',').map((d) => d.trim());
      } else {
        this.value = newVal;
      }
    }
    if (this._initialized) this.render();
  }

  // -- Selection logic --
  _handleSelect(dateStr) {
    const state = this._store.getState();

    if (this.mode === 'single') {
      this._store.set({
        selectedDates: [dateStr],
        focusedDate: dateStr,
      });
      this.emit('cal:change', { value: dateStr });
      if (this.display === 'popover') this.close();
    } else if (this.mode === 'range') {
      if (!state.rangeStart || state.rangeEnd) {
        // Start new range
        this._store.set({
          rangeStart: dateStr,
          rangeEnd: null,
          selectedDates: [dateStr],
          focusedDate: dateStr,
        });
      } else {
        // Complete range — ensure start <= end
        let start = state.rangeStart;
        let end = dateStr;
        if (start > end) [start, end] = [end, start];
        this._store.set({
          rangeStart: start,
          rangeEnd: end,
          selectedDates: [start, end],
          hoverDate: null,
          focusedDate: end,
        });
        this.emit('cal:change', { value: { start, end } });
        if (this.display === 'popover') this.close();
      }
    } else if (this.mode === 'multi') {
      const dates = [...state.selectedDates];
      const idx = dates.findIndex((d) => isSameDay(d, dateStr));
      if (idx >= 0) {
        dates.splice(idx, 1);
      } else {
        dates.push(dateStr);
      }
      dates.sort();
      this._store.set({ selectedDates: dates, focusedDate: dateStr });
      this.emit('cal:change', { value: dates });
    }
  }

  _handleHover(dateStr) {
    if (this.mode === 'range') {
      this._store.set({ hoverDate: dateStr });
    }
  }

  _handlePresetSelect({ start, end }) {
    this._store.set({
      rangeStart: start,
      rangeEnd: end,
      selectedDates: [start, end],
      hoverDate: null,
    });
    this._navigateToDate(start);
    this.emit('cal:change', { value: { start, end } });
    if (this.display === 'popover') this.close();
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
    // Close month picker on Escape before anything else
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
        newDate = new Date(focused);
        newDate.setDate(focused.getDate() - 1);
        break;
      case 'ArrowRight':
        newDate = new Date(focused);
        newDate.setDate(focused.getDate() + 1);
        break;
      case 'ArrowUp':
        newDate = new Date(focused);
        newDate.setDate(focused.getDate() - 7);
        break;
      case 'ArrowDown':
        newDate = new Date(focused);
        newDate.setDate(focused.getDate() + 7);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this._handleSelect(state.focusedDate);
        return;
      case 'Escape':
        if (this.display === 'popover') this.close();
        return;
      default:
        return;
    }

    if (newDate) {
      e.preventDefault();
      const dateStr = toDateString(newDate);

      // If navigating out of current view month, advance
      if (newDate.getMonth() !== state.viewMonth || newDate.getFullYear() !== state.viewYear) {
        this._store.set({
          viewYear: newDate.getFullYear(),
          viewMonth: newDate.getMonth(),
          focusedDate: dateStr,
          navDirection: newDate > focused ? 'next' : 'prev',
        });
      } else {
        this._store.set({ focusedDate: dateStr });
      }

      // Focus the new cell after render
      requestAnimationFrame(() => {
        const cell = this.$(`[data-date="${dateStr}"]`);
        cell?.focus();
      });
    }
  }

  // -- Lightweight hover highlight (no DOM rebuild) --
  _updateGridHighlight(state) {
    const buttons = this.$$('.cal-day');
    const { rangeStart, hoverDate } = state;
    const effectiveEnd = rangeStart && !state.rangeEnd && hoverDate ? hoverDate : state.rangeEnd;

    for (const btn of buttons) {
      const dateStr = btn.dataset.date;
      if (!dateStr || btn.classList.contains('cal-day--disabled')) continue;

      const isStart = dateStr === rangeStart;
      const isEnd = dateStr === effectiveEnd;

      let inRange = false;
      if (rangeStart && effectiveEnd) {
        const lo = rangeStart < effectiveEnd ? rangeStart : effectiveEnd;
        const hi = rangeStart < effectiveEnd ? effectiveEnd : rangeStart;
        inRange = dateStr >= lo && dateStr <= hi && !isStart && !isEnd;
      }

      btn.classList.toggle('cal-day--range-start', isStart && !!effectiveEnd);
      btn.classList.toggle('cal-day--range-end', isEnd && !!effectiveEnd);
      btn.classList.toggle('cal-day--in-range', inRange);
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
      selectedDates: [],
      rangeStart: null,
      rangeEnd: null,
      hoverDate: null,
    });
    this.emit('cal:change', { value: null });
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
      container.addEventListener('keydown', (e) => this._handleKeydown(e));
      return container;
    }

    const monthsWrapper = document.createElement('div');
    monthsWrapper.classList.add('cal-months');

    // Determine if we show dual months (range mode with enough space)
    const showDual = this.mode === 'range' && this.hasAttribute('dual');
    const monthCount = showDual ? 2 : 1;

    for (let i = 0; i < monthCount; i++) {
      const { year, month } = i === 0
        ? { year: state.viewYear, month: state.viewMonth }
        : addMonths(state.viewYear, state.viewMonth, 1);

      const monthEl = document.createElement('div');
      monthEl.classList.add('cal-month');

      // Navigation only on first month (or single)
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
          selectedDates: state.selectedDates,
          rangeStart: state.rangeStart,
          rangeEnd: state.rangeEnd,
          hoverDate: state.hoverDate,
          minDate: this.minDate,
          maxDate: this.maxDate,
          disabledDates: this.disabledDates,
          mode: this.mode,
          focusedDate: state.focusedDate,
          onSelect: (d) => this._handleSelect(d),
          onHover: (d) => this._handleHover(d),
          locale: this.locale,
        });

        if (animClass) grid.classList.add(animClass);
        monthEl.appendChild(grid);
      }
      monthsWrapper.appendChild(monthEl);
    }

    container.appendChild(monthsWrapper);

    // Presets
    if (this.mode === 'range' && this.presetKeys.length) {
      container.appendChild(renderPresets({
        presetKeys: this.presetKeys,
        onSelect: (range) => this._handlePresetSelect(range),
        locale: this.locale,
      }));
    }

    // Keyboard
    container.addEventListener('keydown', (e) => this._handleKeydown(e));

    return container;
  }

  _formatTriggerText() {
    const state = this._store.getState();
    if (this.mode === 'range' && state.rangeStart && state.rangeEnd) {
      return `${this._formatShortDate(state.rangeStart)} – ${this._formatShortDate(state.rangeEnd)}`;
    }
    if (state.selectedDates.length) {
      if (this.mode === 'multi') {
        return `${state.selectedDates.length} dates selected`;
      }
      return this._formatShortDate(state.selectedDates[0]);
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

    // Clean up old popover
    this._popover?.destroy();
    this._popover = null;

    if (this.display === 'popover') {
      const wrapper = document.createElement('div');
      wrapper.classList.add('cal-popover-wrapper');

      // Trigger button
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

      // Popover content
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

      // If already open (re-render while open), stay open
      if (this._store.get('isOpen')) {
        popover.open();
      }
    } else {
      // Inline
      root.appendChild(this._renderCalendarContent());
    }

    // Clear navDirection after render so animation doesn't repeat
    this._store.set({ navDirection: null });

    this._rendering = false;
  }
}
