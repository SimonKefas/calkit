// Type definitions for CalKit 0.2.0
// Project: https://github.com/SimonKefas/calkit

// --- Shared Types ---

export interface CalStatusEvent {
  type: 'error' | 'warning' | 'info' | 'success' | null;
  message: string | null;
}

export interface CustomColor {
  name: string;
  bg: string;
  fg: string;
  hover?: string;
}

// --- CalDatepicker ---

export interface CalDatepickerRangeValue {
  start: string;
  end: string;
}

export interface CalDatepickerChangeDetail {
  value: string | string[] | CalDatepickerRangeValue | null;
}

export interface CalDatepickerMonthChangeDetail {
  year: number;
  month: number;
}

export class CalDatepicker extends HTMLElement {
  // Attributes
  mode: 'single' | 'range' | 'multi';
  display: 'inline' | 'popover';
  theme: string;
  placeholder: string;
  firstDay: number;
  minDate: string | null;
  maxDate: string | null;
  locale: string | undefined;
  loading: boolean;
  disabledDates: string[];
  presetKeys: string[];

  // Properties
  value: string | string[] | CalDatepickerRangeValue | null;

  // Methods
  open(): void;
  close(): void;
  clear(): void;
  goToMonth(month: number, year: number): void;
  showStatus(type: string, message: string, opts?: { autoDismiss?: number; dismissible?: boolean }): void;
  clearStatus(): void;
}

// --- CalTimepicker ---

export interface CalTimepickerRangeValue {
  start: string;
  end: string;
}

export interface CalTimepickerChangeDetail {
  value: string | string[] | CalTimepickerRangeValue | null;
}

export interface CalTimepickerSlot {
  time: string;
  displayText?: string;
  available?: boolean;
}

export class CalTimepicker extends HTMLElement {
  // Attributes
  mode: 'single' | 'range' | 'multi';
  display: 'inline' | 'popover';
  theme: string;
  placeholder: string;
  startTime: string;
  endTime: string;
  interval: number;
  format: '12h' | '24h';
  durationLabels: boolean;
  loading: boolean;
  locale: string | undefined;
  minTime: string | null;

  // Properties
  value: string | string[] | CalTimepickerRangeValue | null;
  slots: CalTimepickerSlot[] | null;
  unavailableTimes: string[];

  // Methods
  open(): void;
  close(): void;
  clear(): void;
  showStatus(type: string, message: string, opts?: { autoDismiss?: number; dismissible?: boolean }): void;
  clearStatus(): void;
}

// --- CalBooking ---

export interface Booking {
  id: string | number;
  start: string;
  end: string;
  label?: string;
  color?: string;
}

export interface BookingDayData {
  [dateStr: string]: {
    label?: string;
    status?: string;
  };
}

export interface CalBookingValue {
  start: string;
  end: string;
  startTime?: string;
  endTime?: string;
}

export interface CalBookingChangeDetail {
  value: CalBookingValue | null;
}

export interface CalBookingSelectionInvalidDetail {
  start: string;
  end: string;
}

export class CalBooking extends HTMLElement {
  // Attributes
  display: 'inline' | 'popover';
  theme: string;
  placeholder: string;
  firstDay: number;
  minDate: string | null;
  maxDate: string | null;
  locale: string | undefined;
  showLabelsOnHover: boolean;
  timeSlotsEnabled: boolean;
  timeStartTime: string;
  timeEndTime: string;
  timeInterval: number;
  timeFormat: '12h' | '24h';
  durationLabels: boolean;
  loading: boolean;

  // Properties
  value: CalBookingValue | null;
  bookings: Booking[];
  dayData: BookingDayData;
  labelFormula: ((dateStr: string) => { label?: string; status?: string } | null) | null;
  timeSlots: CalTimepickerSlot[] | null;
  colors: CustomColor[] | null;

  // Methods
  open(): void;
  close(): void;
  clear(): void;
  goToMonth(month: number, year: number): void;
  showStatus(type: string, message: string, opts?: { autoDismiss?: number; dismissible?: boolean }): void;
  clearStatus(): void;
}

// --- CalScheduler ---

export interface SchedulerResource {
  id: string;
  name: string;
  capacity?: number;
  color?: string;
}

export interface SchedulerEvent {
  id: string | number;
  title: string;
  start: string;
  end?: string;
  startTime?: string;
  endTime?: string;
  resourceId?: string;
  color?: string;
  locked?: boolean;
  metadata?: Record<string, unknown>;
}

export interface SchedulerEventAction {
  label: string;
  type?: string;
}

export interface CalSlotSelectDetail {
  date: string;
  startTime: string | null;
  endTime: string | null;
  resourceId: string | null;
  resource: SchedulerResource | null;
}

export interface CalSlotCreateDetail {
  date: string;
  startTime: string | null;
  endTime: string | null;
  resourceId: string | null;
  resource: SchedulerResource | null;
}

export interface CalEventClickDetail {
  event: SchedulerEvent;
  resourceId: string | null;
  resource: SchedulerResource | null;
}

export interface CalEventActionDetail {
  action: string;
  event: SchedulerEvent;
  resourceId: string | null;
  resource: SchedulerResource | null;
}

export interface CalEventMoveDetail {
  event: SchedulerEvent;
  date: string;
  startTime: string;
  endTime: string;
  resourceId: string;
}

export interface CalEventResizeDetail {
  event: SchedulerEvent;
  endTime: string;
}

export interface CalDateChangeDetail {
  date: string;
  view: 'day' | 'week' | 'month';
}

export interface CalViewChangeDetail {
  view: 'day' | 'week' | 'month';
  date: string;
}

export interface CalFabCreateDetail {
  date: string;
  view: 'day' | 'week' | 'month';
}

export interface AvailableSlotResult {
  resourceId: string;
  date: string;
  startTime: string;
  endTime: string;
}

export class CalScheduler extends HTMLElement {
  // Attributes
  view: 'day' | 'week' | 'month';
  layout: 'vertical' | 'horizontal';
  theme: string;
  startTime: string;
  endTime: string;
  interval: number;
  format: '12h' | '24h';
  firstDay: number;
  slotHeight: number;
  resourceMode: 'tabs' | 'columns';
  loading: boolean;
  locale: string | undefined;
  showEventTime: boolean;
  showFab: boolean;
  draggableEvents: boolean;
  snapInterval: number | null;
  minDuration: number | null;
  maxDuration: number | null;

  // Properties
  value: CalSlotSelectDetail | null;
  resources: SchedulerResource[];
  events: SchedulerEvent[];
  eventActions: SchedulerEventAction[];
  eventContent: ((event: SchedulerEvent) => HTMLElement | string | null) | null;
  colors: CustomColor[] | null;

  // Methods
  goToDate(dateStr: string): void;
  setView(view: 'day' | 'week' | 'month'): void;
  today(): void;
  next(): void;
  prev(): void;
  clear(): void;
  findAvailableSlot(opts: {
    date?: string;
    duration: number;
    resourceId?: string;
    minCapacity?: number;
  }): AvailableSlotResult | null;
  isSlotAvailable(date: string, startTime: string, endTime: string, resourceId: string): boolean;
  showStatus(type: string, message: string, opts?: { autoDismiss?: number; dismissible?: boolean }): void;
  clearStatus(): void;
}

// --- Event Maps ---

export interface CalDatepickerEventMap {
  'cal:change': CustomEvent<CalDatepickerChangeDetail>;
  'cal:month-change': CustomEvent<CalDatepickerMonthChangeDetail>;
  'cal:open': CustomEvent<{}>;
  'cal:close': CustomEvent<{}>;
  'cal:status': CustomEvent<CalStatusEvent>;
}

export interface CalTimepickerEventMap {
  'cal:time-change': CustomEvent<CalTimepickerChangeDetail>;
  'cal:open': CustomEvent<{}>;
  'cal:close': CustomEvent<{}>;
  'cal:status': CustomEvent<CalStatusEvent>;
}

export interface CalBookingEventMap {
  'cal:change': CustomEvent<CalBookingChangeDetail>;
  'cal:selection-invalid': CustomEvent<CalBookingSelectionInvalidDetail>;
  'cal:month-change': CustomEvent<CalDatepickerMonthChangeDetail>;
  'cal:open': CustomEvent<{}>;
  'cal:close': CustomEvent<{}>;
  'cal:status': CustomEvent<CalStatusEvent>;
}

export interface CalSchedulerEventMap {
  'cal:slot-select': CustomEvent<CalSlotSelectDetail>;
  'cal:slot-create': CustomEvent<CalSlotCreateDetail>;
  'cal:event-click': CustomEvent<CalEventClickDetail>;
  'cal:event-action': CustomEvent<CalEventActionDetail>;
  'cal:event-move': CustomEvent<CalEventMoveDetail>;
  'cal:event-resize': CustomEvent<CalEventResizeDetail>;
  'cal:date-change': CustomEvent<CalDateChangeDetail>;
  'cal:view-change': CustomEvent<CalViewChangeDetail>;
  'cal:fab-create': CustomEvent<CalFabCreateDetail>;
  'cal:status': CustomEvent<CalStatusEvent>;
}

// --- HTMLElementTagNameMap Augmentation ---

declare global {
  interface HTMLElementTagNameMap {
    'cal-datepicker': CalDatepicker;
    'cal-timepicker': CalTimepicker;
    'cal-booking': CalBooking;
    'cal-scheduler': CalScheduler;
  }
}

// --- JSX IntrinsicElements (React / Preact / Solid) ---

type Booleanish = boolean | 'true' | 'false' | '';

interface CalDatepickerAttributes {
  mode?: 'single' | 'range' | 'multi';
  display?: 'inline' | 'popover';
  theme?: 'light' | 'dark' | 'auto' | string;
  value?: string;
  'min-date'?: string;
  'max-date'?: string;
  'disabled-dates'?: string;
  'first-day'?: string | number;
  locale?: string;
  presets?: string;
  placeholder?: string;
  loading?: Booleanish;
  dual?: Booleanish;
  class?: string;
  style?: string | Record<string, string>;
}

interface CalTimepickerAttributes {
  mode?: 'single' | 'range' | 'multi';
  display?: 'inline' | 'popover';
  theme?: 'light' | 'dark' | 'auto' | string;
  'start-time'?: string;
  'end-time'?: string;
  interval?: string | number;
  format?: '12h' | '24h';
  placeholder?: string;
  value?: string;
  'duration-labels'?: Booleanish;
  loading?: Booleanish;
  locale?: string;
  'min-time'?: string;
  class?: string;
  style?: string | Record<string, string>;
}

interface CalBookingAttributes {
  display?: 'inline' | 'popover';
  theme?: 'light' | 'dark' | 'auto' | string;
  'min-date'?: string;
  'max-date'?: string;
  'first-day'?: string | number;
  locale?: string;
  placeholder?: string;
  dual?: Booleanish;
  'show-labels-on-hover'?: Booleanish;
  'time-slots'?: Booleanish;
  'time-start'?: string;
  'time-end'?: string;
  'time-interval'?: string | number;
  'time-format'?: '12h' | '24h';
  'duration-labels'?: Booleanish;
  loading?: Booleanish;
  class?: string;
  style?: string | Record<string, string>;
}

interface CalSchedulerAttributes {
  view?: 'day' | 'week' | 'month';
  layout?: 'vertical' | 'horizontal';
  theme?: 'light' | 'dark' | 'auto' | string;
  date?: string;
  'start-time'?: string;
  'end-time'?: string;
  interval?: string | number;
  format?: '12h' | '24h';
  'first-day'?: string | number;
  'slot-height'?: string | number;
  'resource-mode'?: 'tabs' | 'columns';
  loading?: Booleanish;
  locale?: string;
  'show-event-time'?: Booleanish;
  'show-fab'?: Booleanish;
  'draggable-events'?: Booleanish;
  'snap-interval'?: string | number;
  'min-duration'?: string | number;
  'max-duration'?: string | number;
  class?: string;
  style?: string | Record<string, string>;
}

declare namespace JSX {
  interface IntrinsicElements {
    'cal-datepicker': CalDatepickerAttributes;
    'cal-timepicker': CalTimepickerAttributes;
    'cal-booking': CalBookingAttributes;
    'cal-scheduler': CalSchedulerAttributes;
  }
}
