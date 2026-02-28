# cal-timepicker

A time slot picker web component for selecting single times, multiple times, or time ranges. Supports auto-generated slots from start/end/interval, custom slot definitions, duration labels, and unavailable time marking.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `"single"` \| `"multi"` \| `"range"` | `"single"` | Selection mode |
| `display` | `"inline"` \| `"popover"` | `"inline"` | `inline` renders grid directly; `popover` renders trigger button with dropdown |
| `theme` | `"light"` \| `"dark"` \| `"auto"` | `"light"` | Color theme |
| `start-time` | `string` | `"09:00"` | First slot time (`"HH:MM"` 24h format) |
| `end-time` | `string` | `"17:00"` | Last slot boundary (`"HH:MM"`) |
| `interval` | `number` | `30` | Minutes between generated slots |
| `format` | `"12h"` \| `"24h"` | `"24h"` | Display format for time labels |
| `value` | `string` | — | Initial value as attribute (see Value Formats) |
| `placeholder` | `string` | `"Select time"` | Popover trigger placeholder text |
| `duration-labels` | boolean attribute | absent | Show cumulative duration labels (e.g., "30 min", "1 hr") alongside each slot |
| `loading` | boolean attribute | absent | Show skeleton loading animation |

## JS Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | Varies by mode (see below) | Read/write current selection |
| `slots` | `Array<{time: string, label?: string, available?: boolean}> \| null` | Custom slot definitions. When set, overrides auto-generation from start-time/end-time/interval. Set to `null` to revert to auto-generation |
| `unavailableTimes` | `string[]` | Array of `"HH:MM"` strings to mark as unavailable in auto-generated slots. Default: `[]` |
| `loading` | `boolean` | Read/write, reflects attribute |
| `mode` | `string` | Read-only |
| `display` | `string` | Read-only |
| `startTime` | `string` | Read-only. Returns `start-time` attribute |
| `endTime` | `string` | Read-only. Returns `end-time` attribute |
| `interval` | `number` | Read-only. Returns parsed `interval` attribute |
| `format` | `string` | Read-only. Returns `format` attribute |
| `durationLabels` | `boolean` | Read-only. Returns whether `duration-labels` attribute is present |

## Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | — | `void` | Opens the popover |
| `close()` | — | `void` | Closes the popover |
| `showStatus(type, message, opts?)` | `type: "error"\|"warning"\|"info"\|"success"`, `message: string`, `opts?: {autoDismiss?: number, dismissible?: boolean}` | `void` | Shows a status banner |
| `clearStatus()` | — | `void` | Removes the status banner |

## Events

| Event | `detail` shape | Fires when |
|-------|---------------|------------|
| `cal:time-change` | Varies by mode (see below) | User selects or changes a time |
| `cal:open` | `{}` | Popover opens |
| `cal:close` | `{}` | Popover closes |
| `cal:status` | `{type: string\|null, message: string\|null}` | Status banner changes |

## Value Formats

### mode="single"

| Context | Format |
|---------|--------|
| HTML attribute | `value="14:30"` |
| JS property (get) | `"14:30"` or `null` |
| JS property (set) | `tp.value = "14:30"` |
| Event detail | `{value: "14:30"}` |

### mode="range"

| Context | Format |
|---------|--------|
| HTML attribute | `value="09:00/12:00"` (slash-separated) |
| JS property (get) | `{start: "09:00", end: "12:00"}` or `null` |
| JS property (set) | `tp.value = {start: "09:00", end: "12:00"}` |
| Event detail | `{value: {start: "09:00", end: "12:00"}}` |

Range selection is two-click: first click sets start, second sets end. Automatically sorted so start < end.

### mode="multi"

| Context | Format |
|---------|--------|
| HTML attribute | `value="09:00,10:30,14:00"` (comma-separated) |
| JS property (get) | `["09:00", "10:30", "14:00"]` (sorted by time) |
| JS property (set) | `tp.value = ["09:00", "14:00"]` |
| Event detail | `{value: ["09:00", "10:30", "14:00"]}` |

Clicking an already-selected time deselects it.

## Slot Generation

Slots are generated in this priority order:

1. **`slots` property** (highest) — custom array of `{time, label?, available?}` objects
2. **Attributes with `duration-labels`** — auto-generated with duration labels (e.g., "30 min", "1 hr")
3. **Attributes only** — auto-generated from `start-time`, `end-time`, `interval`

The `unavailableTimes` property marks specific times as unavailable in auto-generated slots (priority 2 and 3). Has no effect on custom `slots`.

## Full Examples

### Single Selection with Duration Labels

```html
<cal-timepicker
  start-time="09:00"
  end-time="17:00"
  interval="60"
  format="12h"
  duration-labels
  theme="light"
></cal-timepicker>

<script>
  const tp = document.querySelector('cal-timepicker');

  tp.addEventListener('cal:time-change', (e) => {
    console.log('Selected:', e.detail.value); // "14:00"
  });
</script>
```

### Custom Slots with Unavailable Times

```html
<cal-timepicker mode="single" format="12h"></cal-timepicker>

<script>
  const tp = document.querySelector('cal-timepicker');

  tp.slots = [
    { time: '08:00', label: 'Early Bird', available: true },
    { time: '09:00', label: 'Morning', available: true },
    { time: '12:00', label: 'Lunch Break', available: false },
    { time: '14:00', label: 'Afternoon', available: true },
    { time: '17:00', label: 'Evening', available: true },
  ];

  tp.addEventListener('cal:time-change', (e) => {
    console.log('Picked:', e.detail.value);
  });
</script>
```

### Popover Range Selection

```html
<cal-timepicker
  mode="range"
  display="popover"
  start-time="06:00"
  end-time="22:00"
  interval="30"
  format="12h"
  placeholder="Select time range"
></cal-timepicker>

<script>
  const tp = document.querySelector('cal-timepicker');

  // Mark some times as unavailable
  tp.unavailableTimes = ['12:00', '12:30', '13:00'];

  tp.addEventListener('cal:time-change', (e) => {
    const { start, end } = e.detail.value;
    console.log(`Range: ${start} to ${end}`);
  });
</script>
```
