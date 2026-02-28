# cal-booking

A booking calendar web component that displays existing reservations as colored overlays and lets users select date ranges. Supports half-day rendering (checkout/checkin on same day), overlap validation, custom day labels, and optional time slot selection for a complete date-then-time booking flow.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `"light"` \| `"dark"` \| `"auto"` | `"light"` | Color theme |
| `display` | `"inline"` \| `"popover"` | `"inline"` | Render mode |
| `min-date` | `string` | — | Earliest selectable date (`"YYYY-MM-DD"`) |
| `max-date` | `string` | — | Latest selectable date (`"YYYY-MM-DD"`) |
| `first-day` | `number` | `0` | First day of week (0 = Sunday) |
| `placeholder` | `string` | `"Select dates"` | Popover trigger text |
| `dual` | boolean attribute | absent | Show two months side-by-side |
| `show-labels-on-hover` | boolean attribute | absent | Show booking labels only when hovering over day cells |
| `time-slots` | boolean attribute | absent | Enable time slot selection after date range is chosen |
| `time-start` | `string` | `"09:00"` | Time grid start time (requires `time-slots`) |
| `time-end` | `string` | `"17:00"` | Time grid end time |
| `time-interval` | `number` | `60` | Minutes between time slots |
| `time-format` | `"12h"` \| `"24h"` | `"24h"` | Time display format |
| `duration-labels` | boolean attribute | absent | Show duration labels on time slots |
| `loading` | boolean attribute | absent | Show skeleton loading state |

## JS Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | `{start: string, end: string, startTime?: string, endTime?: string} \| null` | Read/write. The selected date range, optionally with times if `time-slots` is enabled |
| `bookings` | `Booking[]` | Array of existing bookings to display. Default: `[]` |
| `dayData` | `Record<string, {label?: string, status?: string}>` | Static per-date metadata for labels and status. Default: `{}` |
| `labelFormula` | `((dateStr: string) => {label?: string, status?: string} \| null) \| null` | Dynamic label function. Highest priority. Default: `null` |
| `timeSlots` | `Array<{time: string, label?: string, available?: boolean}> \| null` | Custom time slot definitions. Overrides auto-generation. Default: `null` |
| `loading` | `boolean` | Read/write, reflects attribute |

## Booking Object Shape

```js
{
  id: string,              // Unique identifier
  start: string,           // "YYYY-MM-DD" — first day of booking
  end: string,             // "YYYY-MM-DD" — checkout/last day of booking
  label: string,           // Optional label displayed on cells
  color: string,           // "blue" | "green" | "red" | "orange" | "gray" (default: "blue")
}
```

### Booking Colors

Five built-in color palettes, each with background, foreground, and hover variants:

| Color | Description |
|-------|-------------|
| `"blue"` | Default. Soft blue tones |
| `"green"` | Green tones |
| `"red"` | Red tones |
| `"orange"` | Orange tones |
| `"gray"` | Neutral gray tones |

Colors adapt automatically between light and dark themes.

## Cell Status Resolution

Each calendar day resolves its visual status through three layers (highest priority first):

1. **`labelFormula(dateStr)`** — Called for every date. If it returns `{status, label}`, those values override everything below.
2. **`dayData[dateStr]`** — Static map. If an entry exists with `status` or `label`, those values apply.
3. **Derived from `bookings`** — The component automatically computes:

| Status | Condition |
|--------|-----------|
| `"available"` | No bookings touch this date |
| `"booked"` | A booking spans this date (start < date < end) |
| `"half-day"` | One booking ends and another begins on this date |
| `"checkin-only"` | A booking starts on this date (no checkout) |
| `"checkout-only"` | A booking ends on this date (no checkin) |

## Overlap Validation

When a user completes a range selection, the component validates against existing bookings:

- If `selectionStart < booking.end && selectionEnd > booking.start`, the selection is invalid.
- On invalid selection:
  1. `cal:selection-invalid` event fires with `{start, end}`
  2. Selection is cleared
  3. Error banner shows "Selection overlaps an existing booking" (auto-dismiss 4 seconds)

## Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | — | `void` | Open popover |
| `close()` | — | `void` | Close popover |
| `goToMonth(month, year)` | `month: number` (0-11), `year: number` | `void` | Navigate to month |
| `showStatus(type, message, opts?)` | `type: "error"\|"warning"\|"info"\|"success"`, `message: string`, `opts?: {autoDismiss?: number, dismissible?: boolean}` | `void` | Show status banner |
| `clearStatus()` | — | `void` | Clear status banner |

## Events

| Event | `detail` shape | Fires when |
|-------|---------------|------------|
| `cal:change` | `{value: {start: string, end: string, startTime?: string, endTime?: string}}` | Range selection completes (and time selection if `time-slots` enabled) |
| `cal:selection-invalid` | `{start: string, end: string}` | User's selection overlaps an existing booking |
| `cal:month-change` | `{year: number, month: number}` | Calendar navigates to new month |
| `cal:open` | `{}` | Popover opens |
| `cal:close` | `{}` | Popover closes |
| `cal:status` | `{type: string\|null, message: string\|null}` | Status banner changes |

## Value Formats

### Without `time-slots`

| Context | Format |
|---------|--------|
| JS property (get) | `{start: "2026-03-10", end: "2026-03-15"}` or `null` |
| JS property (set) | `el.value = {start: "2026-03-10", end: "2026-03-15"}` |
| Event detail | `{value: {start: "2026-03-10", end: "2026-03-15"}}` |

### With `time-slots`

| Context | Format |
|---------|--------|
| JS property (get) | `{start: "2026-03-10", end: "2026-03-15", startTime: "14:00", endTime: "11:00"}` or `null` |
| JS property (set) | `el.value = {start: "2026-03-10", end: "2026-03-15", startTime: "14:00", endTime: "11:00"}` |
| Event detail | `{value: {start: "2026-03-10", end: "2026-03-15", startTime: "14:00", endTime: "11:00"}}` |

When `time-slots` is enabled, after the user selects a date range, a time grid appears below. The user first picks a check-in time, then a check-out time. `cal:change` fires only after both times are selected.

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Left/Right | Previous/next day |
| Arrow Up/Down | Previous/next week |
| Enter / Space | Select focused date |
| Escape | Close popover or month picker |

## Full Examples

### Booking Calendar with Colored Reservations

```html
<cal-booking theme="light" dual show-labels-on-hover></cal-booking>

<script>
  const booking = document.querySelector('cal-booking');

  booking.bookings = [
    { id: '1', start: '2026-03-05', end: '2026-03-10', label: 'Alice', color: 'blue' },
    { id: '2', start: '2026-03-10', end: '2026-03-15', label: 'Bob', color: 'green' },
    { id: '3', start: '2026-03-20', end: '2026-03-25', label: 'Carol', color: 'orange' },
  ];

  booking.addEventListener('cal:change', (e) => {
    const { start, end } = e.detail.value;
    console.log(`Booked: ${start} to ${end}`);
  });

  booking.addEventListener('cal:selection-invalid', (e) => {
    console.log('Overlap detected:', e.detail.start, e.detail.end);
  });
</script>
```

### Price Labels with Label Formula

```html
<cal-booking theme="light"></cal-booking>

<script>
  const booking = document.querySelector('cal-booking');

  booking.bookings = [
    { id: '1', start: '2026-03-10', end: '2026-03-15', label: 'Reserved', color: 'red' },
  ];

  // Dynamic pricing labels
  booking.labelFormula = (date) => {
    const d = new Date(date);
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    return { label: isWeekend ? '$150' : '$100' };
  };

  // Static per-date overrides
  booking.dayData = {
    '2026-03-25': { label: 'Holiday', status: 'booked' },
  };

  booking.addEventListener('cal:change', (e) => {
    console.log(e.detail.value);
  });
</script>
```

### Date + Time Booking Flow

```html
<cal-booking
  time-slots
  time-start="14:00"
  time-end="22:00"
  time-interval="30"
  time-format="12h"
  duration-labels
  theme="auto"
></cal-booking>

<script>
  const booking = document.querySelector('cal-booking');

  booking.bookings = [
    { id: '1', start: '2026-03-10', end: '2026-03-12', label: 'Alice', color: 'blue' },
  ];

  booking.addEventListener('cal:change', (e) => {
    const { start, end, startTime, endTime } = e.detail.value;
    console.log(`Check-in: ${start} at ${startTime}`);
    console.log(`Check-out: ${end} at ${endTime}`);
  });
</script>
```
