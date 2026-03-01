/**
 * CalScheduler — Flexible resource scheduling calendar view.
 */

import { CalendarBase } from '../../core/base-component.js';
import { createStore } from '../../core/state.js';
import { today, addDays, parseDate, toDateString, addMonths } from '../../core/dates.js';
import { timeToMinutes } from '../../core/times.js';
import { getWeekDates, getViewTitle } from '../../core/scheduler-utils.js';
import { findAvailableSlot, isSlotAvailable as _isSlotAvailable } from './scheduler-data.js';
import { mergeCustomColors } from '../booking/booking-data.js';
import { tokens } from '../../styles/tokens.js';
import { reset } from '../../styles/reset.js';
import { animations } from '../../styles/animations.js';
import { renderSchedulerNav, schedulerNavStyles } from './scheduler-nav.js';
import { timeAxisStyles } from './time-axis.js';
import { resourceHeaderStyles } from './resource-header.js';
import { eventBlockStyles } from './event-block.js';
import { renderDayView, dayViewStyles } from './day-view.js';
import { renderWeekView, weekViewStyles } from './week-view.js';
import { renderMonthView, monthViewStyles } from './month-view.js';
import { renderSchedulerGridSkeleton, renderSchedulerMonthSkeleton, schedulerSkeletonStyles } from './scheduler-skeleton.js';
import { renderStatusMessage, statusMessageStyles } from '../shared/status-message.js';
import { renderEventDetail, eventDetailStyles } from './event-detail.js';
import { renderResourceTabs, resourceTabsStyles } from './resource-tabs.js';
import { slotPromptStyles } from './slot-prompt.js';
import { renderFab, fabStyles } from './fab-button.js';
import { createDragManager, dragStyles } from './drag-manager.js';

const componentStyles = `
  .cal-sched {
    background: hsl(var(--cal-bg));
    border-radius: var(--cal-radius);
    user-select: none;
    font-size: 14px;
  }

  .cal-sched__body {
    position: relative;
  }
`;

export class CalScheduler extends CalendarBase {
  static get styles() {
    return [
      tokens, reset, animations,
      schedulerNavStyles, timeAxisStyles, resourceHeaderStyles, eventBlockStyles,
      dayViewStyles, weekViewStyles, monthViewStyles,
      schedulerSkeletonStyles, statusMessageStyles, eventDetailStyles,
      resourceTabsStyles, slotPromptStyles, fabStyles, dragStyles,
      componentStyles,
    ];
  }

  static get observedAttributes() {
    return [
      'theme', 'view', 'layout', 'date', 'start-time', 'end-time',
      'interval', 'format', 'first-day', 'loading', 'slot-height',
      'resource-mode', 'show-event-time', 'show-fab', 'draggable-events',
      'snap-interval', 'min-duration', 'max-duration', 'locale',
    ];
  }

  constructor() {
    super();

    this._store = createStore({
      view: 'week',
      anchorDate: today(),
      layout: 'vertical',
      selectedResourceId: null,
      // Slot selection
      selectedSlot: null,
      // Event detail
      detailEvent: null,
      detailResource: null,
      // Status
      statusType: null,
      statusMessage: null,
      statusDismissible: true,
      // All-day collapse
      allDayCollapsed: false,
    });

    this._resources = [];
    this._events = [];
    this._eventActions = [];
    this._eventContent = null;
    this._colors = null;
    this._customColorMap = null;
    this._unsubscribe = null;
    this._rendering = false;
    this._nowTimer = null;
    this._dragManager = null;
  }

  // -- Attribute getters --
  get view() { return this.getAttribute('view') || this._store.get('view'); }
  get layout() { return this.getAttribute('layout') || this._store.get('layout'); }
  get startTime() { return this.getAttribute('start-time') || '08:00'; }
  get endTime() { return this.getAttribute('end-time') || '18:00'; }
  get interval() { return parseInt(this.getAttribute('interval') || '30', 10); }
  get format() { return this.getAttribute('format') || '24h'; }
  get firstDay() { return parseInt(this.getAttribute('first-day') || '0', 10); }
  get slotHeight() { return parseInt(this.getAttribute('slot-height') || '48', 10); }
  get resourceMode() { return this.getAttribute('resource-mode') || 'tabs'; }
  get loading() { return this.hasAttribute('loading'); }
  set loading(val) { val ? this.setAttribute('loading', '') : this.removeAttribute('loading'); }
  get showEventTime() { return this.getAttribute('show-event-time') !== 'false'; }
  get showFab() { return this.hasAttribute('show-fab'); }
  get draggableEvents() { return this.hasAttribute('draggable-events'); }
  get snapInterval() { const v = this.getAttribute('snap-interval'); return v ? parseInt(v, 10) : null; }
  get minDuration() { const v = this.getAttribute('min-duration'); return v ? parseInt(v, 10) : null; }
  get maxDuration() { const v = this.getAttribute('max-duration'); return v ? parseInt(v, 10) : null; }
  get locale() { return this.getAttribute('locale') || undefined; }

  // -- Properties --
  get resources() { return this._resources; }
  set resources(val) {
    this._resources = Array.isArray(val) ? val : [];
    if (this._initialized) this.render();
  }

  get events() { return this._events; }
  set events(val) {
    this._events = Array.isArray(val) ? val : [];
    if (this._initialized) this.render();
  }

  get eventActions() { return this._eventActions; }
  set eventActions(val) {
    this._eventActions = Array.isArray(val) ? val : [];
    if (this._initialized) this.render();
  }

  get eventContent() { return this._eventContent; }
  set eventContent(val) {
    this._eventContent = typeof val === 'function' ? val : null;
    if (this._initialized) this.render();
  }

  get colors() { return this._colors; }
  set colors(val) {
    this._colors = Array.isArray(val) ? val : null;
    this._customColorMap = mergeCustomColors(this._colors);
    if (this._customColorMap) {
      for (const [name, tokens] of Object.entries(this._customColorMap)) {
        this.style.setProperty(`--cal-booking-${name}-bg`, tokens.bg);
        this.style.setProperty(`--cal-booking-${name}-fg`, tokens.fg);
        this.style.setProperty(`--cal-booking-${name}-hover`, tokens.hover);
      }
    }
    if (this._initialized) this.render();
  }

  get value() { return this._lastSlotValue || null; }

  // -- Lifecycle --
  connectedCallback() {
    // Read date attribute into store
    const dateAttr = this.getAttribute('date');
    if (dateAttr) {
      this._store.set({ anchorDate: dateAttr });
    }
    const viewAttr = this.getAttribute('view');
    if (viewAttr) {
      this._store.set({ view: viewAttr });
    }
    const layoutAttr = this.getAttribute('layout');
    if (layoutAttr) {
      this._store.set({ layout: layoutAttr });
    }

    super.connectedCallback();

    this._unsubscribe = this._store.subscribe(() => {
      if (!this._rendering) this.render();
    });

    // Auto-update now line every 60s
    this._nowTimer = setInterval(() => {
      const view = this._store.get('view');
      if (view === 'day' || view === 'week') {
        this.render();
      }
    }, 60000);

    if (this.draggableEvents) this._initDrag();
  }

  disconnectedCallback() {
    this._unsubscribe?.();
    clearInterval(this._nowTimer);
    clearTimeout(this._statusTimer);
    this._destroyDrag();
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
      this._escHandler = null;
    }
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (oldVal === newVal) return;
    if (name === 'date' && newVal) {
      this._store.set({ anchorDate: newVal });
      return;
    }
    if (name === 'view' && newVal) {
      this._store.set({ view: newVal });
      return;
    }
    if (name === 'layout' && newVal) {
      this._store.set({ layout: newVal });
      return;
    }
    if (name === 'draggable-events') {
      if (newVal !== null) {
        this._initDrag();
      } else {
        this._destroyDrag();
      }
    }
    if (this._initialized) this.render();
  }

  // -- Public methods --
  goToDate(dateStr) {
    this._store.set({ anchorDate: dateStr });
    this.emit('cal:date-change', { date: dateStr, view: this._store.get('view') });
  }

  setView(view) {
    if (!['day', 'week', 'month'].includes(view)) return;
    this._store.set({ view });
    this.emit('cal:view-change', { view, date: this._store.get('anchorDate') });
  }

  today() {
    this.goToDate(today());
  }

  next() {
    const state = this._store.getState();
    const d = parseDate(state.anchorDate);
    if (!d) return;

    let newDate;
    if (state.view === 'day') {
      newDate = addDays(state.anchorDate, 1);
    } else if (state.view === 'week') {
      newDate = addDays(state.anchorDate, 7);
    } else {
      const { year, month } = addMonths(d.getFullYear(), d.getMonth(), 1);
      newDate = toDateString(new Date(year, month, 1));
    }

    this._store.set({ anchorDate: newDate });
    this.emit('cal:date-change', { date: newDate, view: state.view });
  }

  prev() {
    const state = this._store.getState();
    const d = parseDate(state.anchorDate);
    if (!d) return;

    let newDate;
    if (state.view === 'day') {
      newDate = addDays(state.anchorDate, -1);
    } else if (state.view === 'week') {
      newDate = addDays(state.anchorDate, -7);
    } else {
      const { year, month } = addMonths(d.getFullYear(), d.getMonth(), -1);
      newDate = toDateString(new Date(year, month, 1));
    }

    this._store.set({ anchorDate: newDate });
    this.emit('cal:date-change', { date: newDate, view: state.view });
  }

  findAvailableSlot(opts) {
    return findAvailableSlot(
      opts,
      this._resources,
      this._events,
      this.interval,
      this.startTime,
      this.endTime,
    );
  }

  isSlotAvailable(date, startTime, endTime, resourceId) {
    return _isSlotAvailable(this._events, resourceId, date, startTime, endTime);
  }

  clear() {
    this._store.set({
      selectedSlot: null,
      detailEvent: null,
      detailResource: null,
    });
    this._lastSlotValue = null;
  }

  // -- Event handlers --
  _handleSlotClick(date, startTime, endTime, resourceId, resource) {
    this._lastSlotValue = { date, startTime, endTime, resourceId, resource };
    this._store.set({ selectedSlot: { date, startTime, endTime, resourceId, resource } });
    this.emit('cal:slot-select', { date, startTime, endTime, resourceId, resource });
  }

  _handleSlotCreate(date, startTime, endTime, resourceId, resource) {
    this.emit('cal:slot-create', { date, startTime, endTime, resourceId, resource });
  }

  _dismissSlot() {
    this._store.set({ selectedSlot: null });
  }

  _handleEventClick(event, resourceId, resource) {
    this._dismissSlot();
    this._store.set({ detailEvent: event, detailResource: resource || null });
    this.emit('cal:event-click', { event, resourceId, resource });
  }

  _closeDetail() {
    this._store.set({ detailEvent: null, detailResource: null });
  }

  _handleViewChange(view) {
    this._dismissSlot();
    this.setView(view);
  }

  _handleResourceFilter(resourceId) {
    this._dismissSlot();
    this._store.set({ selectedResourceId: resourceId });
  }

  _handleEventAction(actionLabel) {
    const state = this._store.getState();
    const event = state.detailEvent;
    const resource = state.detailResource;
    this.emit('cal:event-action', {
      action: actionLabel,
      event,
      resourceId: event?.resourceId,
      resource,
    });
  }

  _initDrag() {
    if (this._dragManager) return;
    this._dragManager = createDragManager({
      shadowRoot: this.shadowRoot,
      getConfig: () => ({
        slotHeight: this.slotHeight,
        interval: this.interval,
        startTime: this.startTime,
        endTime: this.endTime,
        format: this.format,
        snapInterval: this.snapInterval,
        minDuration: this.minDuration,
        maxDuration: this.maxDuration,
      }),
      getViewInfo: () => {
        const state = this._store.getState();
        return {
          view: state.view,
          anchorDate: state.anchorDate,
          weekDates: getWeekDates(state.anchorDate, this.firstDay),
          resources: this._resources.length > 0 ? this._resources : [{ id: '__default', name: '' }],
          resourceMode: this.resourceMode,
          selectedResourceId: state.selectedResourceId,
        };
      },
      getEvents: () => this._events,
      onMove: (detail) => {
        this.emit('cal:event-move', detail);
      },
      onResize: (detail) => {
        this.emit('cal:event-resize', detail);
      },
      onCreate: (detail) => {
        const resource = this._resources.find((r) => r.id === detail.resourceId) || null;
        this.emit('cal:slot-create', { ...detail, resource });
      },
    });
    this._dragManager.enable();
  }

  _destroyDrag() {
    if (this._dragManager) {
      this._dragManager.destroy();
      this._dragManager = null;
    }
  }

  _handleFabClick() {
    const state = this._store.getState();
    this.emit('cal:fab-create', { date: state.anchorDate, view: state.view });
  }

  // -- Render --
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

    const state = this._store.getState();
    const wrapper = document.createElement('div');
    wrapper.classList.add('cal-sched');

    // Status banner
    if (state.statusType && state.statusMessage) {
      wrapper.appendChild(renderStatusMessage({
        type: state.statusType,
        message: state.statusMessage,
        dismissible: state.statusDismissible,
        onDismiss: () => this.clearStatus(),
      }));
    }

    const currentView = state.view;
    const anchorDate = state.anchorDate;
    const weekDates = getWeekDates(anchorDate, this.firstDay);
    const title = getViewTitle(currentView, anchorDate, weekDates, this.locale);
    const resourceMode = this.resourceMode;

    // Navigation
    wrapper.appendChild(renderSchedulerNav({
      title,
      view: currentView,
      onPrev: () => this.prev(),
      onNext: () => this.next(),
      onToday: () => this.today(),
      onViewChange: (v) => this._handleViewChange(v),
      locale: this.locale,
    }));

    // Ensure at least one resource
    const resources = this._resources.length > 0
      ? this._resources
      : [{ id: '__default', name: '' }];

    // Resource tabs (shown in tabs mode with multiple resources)
    const showTabs = resourceMode === 'tabs' && resources.length > 1 && resources[0].id !== '__default';
    if (showTabs && !this.loading) {
      wrapper.appendChild(renderResourceTabs({
        resources,
        selectedResourceId: state.selectedResourceId,
        onResourceFilter: (rid) => this._handleResourceFilter(rid),
      }));
    }

    // Filter events by selected resource tab
    let filteredEvents = this._events;
    if (showTabs && state.selectedResourceId) {
      filteredEvents = this._events.filter((ev) => ev.resourceId === state.selectedResourceId);
    }

    // In tabs mode with a specific resource selected, pass just that resource
    let viewResources = resources;
    if (showTabs && state.selectedResourceId) {
      const selected = resources.find((r) => r.id === state.selectedResourceId);
      if (selected) viewResources = [selected];
    }

    // Body
    const body = document.createElement('div');
    body.classList.add('cal-sched__body');

    if (this.loading) {
      if (currentView === 'month') {
        body.appendChild(renderSchedulerMonthSkeleton());
      } else {
        const cols = currentView === 'week' ? 7 : Math.max(this._resources.length, 1);
        body.appendChild(renderSchedulerGridSkeleton({
          columns: cols,
          rows: Math.ceil((timeToMinutes(this.endTime) - timeToMinutes(this.startTime)) / this.interval),
          slotHeight: this.slotHeight,
        }));
      }
    } else {
      if (currentView === 'day') {
        body.appendChild(renderDayView({
          date: anchorDate,
          resources: viewResources,
          events: filteredEvents,
          startTime: this.startTime,
          endTime: this.endTime,
          interval: this.interval,
          slotHeight: this.slotHeight,
          format: this.format,
          layout: state.layout,
          resourceMode,
          selectedSlot: state.selectedSlot,
          eventContent: this._eventContent,
          showTime: this.showEventTime,
          draggable: this.draggableEvents,
          onSlotClick: (d, st, et, rid, r) => this._handleSlotClick(d, st, et, rid, r),
          onEventClick: (ev, rid, r) => this._handleEventClick(ev, rid, r),
          onSlotCreate: (d, st, et, rid, r) => this._handleSlotCreate(d, st, et, rid, r),
        }));
      } else if (currentView === 'week') {
        body.appendChild(renderWeekView({
          date: anchorDate,
          firstDay: this.firstDay,
          resources: viewResources,
          events: filteredEvents,
          startTime: this.startTime,
          endTime: this.endTime,
          interval: this.interval,
          slotHeight: this.slotHeight,
          format: this.format,
          layout: state.layout,
          resourceMode,
          selectedSlot: state.selectedSlot,
          eventContent: this._eventContent,
          showTime: this.showEventTime,
          draggable: this.draggableEvents,
          allDayCollapsed: state.allDayCollapsed,
          onToggleAllDay: () => this._store.set({ allDayCollapsed: !state.allDayCollapsed }),
          onSlotClick: (d, st, et, rid, r) => this._handleSlotClick(d, st, et, rid, r),
          onEventClick: (ev, rid, r) => this._handleEventClick(ev, rid, r),
          onSlotCreate: (d, st, et, rid, r) => this._handleSlotCreate(d, st, et, rid, r),
        }));
      } else if (currentView === 'month') {
        body.appendChild(renderMonthView({
          date: anchorDate,
          firstDay: this.firstDay,
          resources: viewResources,
          events: filteredEvents,
          format: this.format,
          selectedResourceId: state.selectedResourceId,
          selectedDate: state.selectedSlot?.date || null,
          eventContent: this._eventContent,
          onSlotClick: (d) => this._handleSlotClick(d, null, null, null, null),
          onEventClick: (ev, rid, r) => this._handleEventClick(ev, rid, r),
          onSlotCreate: (d) => this._handleSlotCreate(d, null, null, null, null),
        }));
      }
    }

    wrapper.appendChild(body);

    // Event detail popover
    if (state.detailEvent) {
      body.appendChild(renderEventDetail({
        event: state.detailEvent,
        resource: state.detailResource,
        format: this.format,
        onClose: () => this._closeDetail(),
        actions: this._eventActions,
        onAction: (label) => this._handleEventAction(label),
      }));
    }

    // FAB button
    if (this.showFab && !this.loading) {
      body.appendChild(renderFab({
        onClick: () => this._handleFabClick(),
      }));
    }

    root.appendChild(wrapper);

    // Escape key dismisses slot selection
    if (!this._escHandler) {
      this._escHandler = (e) => {
        if (e.key === 'Escape') {
          if (this._store.get('selectedSlot')) {
            this._dismissSlot();
          }
        }
      };
      this.shadowRoot.addEventListener('keydown', this._escHandler);
      // Also listen on the host for non-focusable areas
      document.addEventListener('keydown', this._escHandler);
    }

    this._rendering = false;
  }
}
