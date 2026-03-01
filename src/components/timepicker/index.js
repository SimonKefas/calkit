import { CalendarBase } from '../../core/base-component.js';
import { createStore } from '../../core/state.js';
import { generateSlots, generateDurationSlots, timeToMinutes } from '../../core/times.js';
import { tokens } from '../../styles/tokens.js';
import { reset } from '../../styles/reset.js';
import { animations } from '../../styles/animations.js';
import { createPopover, popoverStyles } from '../datepicker/popover.js';
import { renderTimeGrid, timeGridStyles } from './time-grid.js';
import { renderTimeGridSkeleton, loadingSkeletonStyles } from '../shared/loading-skeleton.js';
import { renderStatusMessage, statusMessageStyles } from '../shared/status-message.js';

const clockIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.5V8l2.5 1.5"/></svg>`;

const componentStyles = `
  .cal-timepicker {
    background: hsl(var(--cal-bg));
    border-radius: var(--cal-radius);
    user-select: none;
    min-width: 200px;
  }

  :host([display="inline"]) .cal-timepicker {
    border: 1px solid hsl(var(--cal-border));
    padding: 12px;
  }

  .cal-timepicker__header {
    font-size: 14px;
    font-weight: 600;
    color: hsl(var(--cal-fg));
    margin-bottom: 8px;
    padding: 0 4px;
  }
`;

export class CalTimepicker extends CalendarBase {
  static get styles() {
    return [tokens, reset, animations, timeGridStyles, popoverStyles, loadingSkeletonStyles, statusMessageStyles, componentStyles];
  }

  static get observedAttributes() {
    return ['mode', 'display', 'theme', 'start-time', 'end-time', 'interval', 'format', 'placeholder', 'value', 'duration-labels', 'loading', 'locale', 'min-time'];
  }

  constructor() {
    super();

    this._store = createStore({
      selected: null,     // string | string[] | {start, end}
      rangeStart: null,   // for range mode in-progress
      hoverTime: null,
      isOpen: false,
      statusType: null,
      statusMessage: null,
      statusDismissible: true,
    });

    this._slots = null;          // explicit slots (highest priority)
    this._unavailableTimes = [];
    this._popover = null;
    this._unsubscribe = null;
    this._rendering = false;
  }

  // -- Attribute getters --
  get mode() { return this.getAttribute('mode') || 'single'; }
  get display() { return this.getAttribute('display') || 'inline'; }
  get placeholder() { return this.getAttribute('placeholder') || 'Select time'; }
  get startTime() { return this.getAttribute('start-time') || '09:00'; }
  get endTime() { return this.getAttribute('end-time') || '17:00'; }
  get interval() { return parseInt(this.getAttribute('interval') || '30', 10); }
  get format() { return this.getAttribute('format') || '24h'; }
  get durationLabels() { return this.hasAttribute('duration-labels'); }
  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
  get locale() { return this.getAttribute('locale') || undefined; }
  get minTime() { return this.getAttribute('min-time') || null; }

  // -- Properties --
  get slots() { return this._slots; }
  set slots(val) {
    this._slots = Array.isArray(val) ? val : null;
    if (this._initialized) this.render();
  }

  get unavailableTimes() { return this._unavailableTimes; }
  set unavailableTimes(val) {
    this._unavailableTimes = Array.isArray(val) ? val : [];
    if (this._initialized) this.render();
  }

  get value() {
    const state = this._store.getState();
    return state.selected;
  }

  set value(val) {
    if (this.mode === 'single' && typeof val === 'string') {
      this._store.set({ selected: val, rangeStart: null });
    } else if (this.mode === 'multi' && Array.isArray(val)) {
      this._store.set({ selected: [...val].sort((a, b) => timeToMinutes(a) - timeToMinutes(b)), rangeStart: null });
    } else if (this.mode === 'range' && val && typeof val === 'object') {
      this._store.set({ selected: { start: val.start, end: val.end }, rangeStart: null });
    } else {
      this._store.set({ selected: null, rangeStart: null });
    }
  }

  _getEffectiveSlots() {
    let slots;
    // Priority 1: explicit slots property
    if (this._slots) {
      slots = this._slots;
    } else if (this.durationLabels) {
      // Priority 2: auto-generate from attributes
      const durationSlots = generateDurationSlots(this.startTime, this.endTime, this.interval, this.format);
      slots = durationSlots.map((slot) => ({
        ...slot,
        available: !this._unavailableTimes.includes(slot.time),
      }));
    } else {
      const times = generateSlots(this.startTime, this.endTime, this.interval);
      slots = times.map((time) => ({
        time,
        available: !this._unavailableTimes.includes(time),
      }));
    }
    // Apply min-time constraint
    const mt = this.minTime;
    if (mt) {
      const minMin = timeToMinutes(mt);
      slots = slots.map((slot) => {
        const slotTime = typeof slot === 'string' ? slot : slot.time;
        if (timeToMinutes(slotTime) < minMin) {
          return typeof slot === 'string' ? { time: slot, available: false } : { ...slot, available: false };
        }
        return slot;
      });
    }
    return slots;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = this._store.subscribe((state, prev) => {
      if (this._rendering) return;
      // Hover-only → lightweight update
      const hoverOnly = state.hoverTime !== prev.hoverTime
        && state.selected === prev.selected
        && state.rangeStart === prev.rangeStart
        && state.isOpen === prev.isOpen;
      hoverOnly ? this._updateSlotHighlight(state) : this.render();
    });

    // Parse initial value attribute
    const valueAttr = this.getAttribute('value');
    if (valueAttr) {
      if (this.mode === 'multi' && valueAttr.includes(',')) {
        this.value = valueAttr.split(',').map((t) => t.trim());
      } else if (this.mode === 'range' && valueAttr.includes('/')) {
        const [start, end] = valueAttr.split('/');
        this.value = { start: start.trim(), end: end.trim() };
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
      if (this.mode === 'multi' && newVal && newVal.includes(',')) {
        this.value = newVal.split(',').map((t) => t.trim());
      } else if (this.mode === 'range' && newVal && newVal.includes('/')) {
        const [start, end] = newVal.split('/');
        this.value = { start: start.trim(), end: end.trim() };
      } else {
        this.value = newVal;
      }
    }
    if (this._initialized) this.render();
  }

  // -- Selection --
  _handleSelect(time) {
    const state = this._store.getState();

    if (this.mode === 'single') {
      this._store.set({ selected: time });
      this.emit('cal:time-change', { value: time });
      if (this.display === 'popover') this.close();
    } else if (this.mode === 'multi') {
      const current = Array.isArray(state.selected) ? [...state.selected] : [];
      const idx = current.indexOf(time);
      if (idx >= 0) {
        current.splice(idx, 1);
      } else {
        current.push(time);
      }
      current.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      this._store.set({ selected: current });
      this.emit('cal:time-change', { value: current });
    } else if (this.mode === 'range') {
      if (!state.rangeStart || (state.selected && typeof state.selected === 'object' && state.selected.start && state.selected.end)) {
        // Start new range
        this._store.set({ rangeStart: time, selected: null, hoverTime: null });
      } else {
        // Complete range
        let start = state.rangeStart;
        let end = time;
        if (timeToMinutes(start) > timeToMinutes(end)) [start, end] = [end, start];
        const value = { start, end };
        this._store.set({ selected: value, rangeStart: null, hoverTime: null });
        this.emit('cal:time-change', { value });
        if (this.display === 'popover') this.close();
      }
    }
  }

  _handleHover(time) {
    if (this.mode === 'range') {
      this._store.set({ hoverTime: time });
    }
  }

  // -- Lightweight hover highlight --
  _updateSlotHighlight(state) {
    const buttons = this.$$('.cal-time-slot');
    const { rangeStart, hoverTime, selected } = state;
    const rangeComplete = selected && typeof selected === 'object' && selected.start && selected.end;

    for (const btn of buttons) {
      const time = btn.dataset.time;
      if (!time || btn.disabled) continue;

      if (rangeStart && !rangeComplete && hoverTime) {
        const lo = timeToMinutes(rangeStart) < timeToMinutes(hoverTime) ? rangeStart : hoverTime;
        const hi = timeToMinutes(rangeStart) < timeToMinutes(hoverTime) ? hoverTime : rangeStart;
        const t = timeToMinutes(time);
        const inRange = t > timeToMinutes(lo) && t < timeToMinutes(hi);
        const isStart = time === rangeStart;
        const isEnd = time === hoverTime;

        btn.classList.toggle('cal-time-slot--range-start', isStart);
        btn.classList.toggle('cal-time-slot--range-end', isEnd);
        btn.classList.toggle('cal-time-slot--in-range', inRange);
      } else if (!rangeStart) {
        btn.classList.remove('cal-time-slot--range-start', 'cal-time-slot--range-end', 'cal-time-slot--in-range');
      }
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

  clear() {
    this._store.set({
      selected: null,
      rangeStart: null,
      hoverTime: null,
    });
    this.emit('cal:time-change', { value: null });
  }

  // -- Render --
  _renderTimepickerContent() {
    const state = this._store.getState();
    const container = document.createElement('div');
    container.classList.add('cal-timepicker');

    // Status banner
    if (state.statusType && state.statusMessage) {
      container.appendChild(renderStatusMessage({
        type: state.statusType,
        message: state.statusMessage,
        dismissible: state.statusDismissible,
        onDismiss: () => this.clearStatus(),
      }));
    }

    const header = document.createElement('div');
    header.classList.add('cal-timepicker__header');
    header.textContent = 'Select Time';
    container.appendChild(header);

    if (this.loading) {
      container.appendChild(renderTimeGridSkeleton({ durationLabels: this.durationLabels }));
    } else {
      const slots = this._getEffectiveSlots();
      const grid = renderTimeGrid({
        slots,
        mode: this.mode,
        format: this.format,
        selected: state.selected,
        hoverTime: state.hoverTime,
        rangeStart: state.rangeStart,
        unavailableTimes: this._unavailableTimes,
        onSelect: (t) => this._handleSelect(t),
        onHover: (t) => this._handleHover(t),
        durationLabels: this.durationLabels,
      });
      container.appendChild(grid);
    }

    return container;
  }

  _formatTriggerText() {
    const state = this._store.getState();
    if (!state.selected) return null;
    if (this.mode === 'single' && typeof state.selected === 'string') {
      return state.selected;
    }
    if (this.mode === 'multi' && Array.isArray(state.selected) && state.selected.length) {
      return `${state.selected.length} time${state.selected.length > 1 ? 's' : ''} selected`;
    }
    if (this.mode === 'range' && typeof state.selected === 'object' && state.selected.start) {
      return `${state.selected.start} – ${state.selected.end}`;
    }
    return null;
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
      icon.innerHTML = clockIcon;
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

      const content = this._renderTimepickerContent();
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
      root.appendChild(this._renderTimepickerContent());
    }

    this._rendering = false;
  }
}
