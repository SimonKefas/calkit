# cal-datepicker

A date picker web component supporting single, multi, and range selection with inline or popover display. Includes keyboard navigation, month/year picker, dual month view, date constraints, and preset ranges.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `mode` | `"single"` \| `"multi"` \| `"range"` | `"single"` | Selection mode |
| `display` | `"inline"` \| `"popover"` | `"inline"` | `inline` renders calendar directly; `popover` renders a trigger button that opens a dropdown |
| `theme` | `"light"` \| `"dark"` \| `"auto"` | `"light"` | Color theme. `auto` follows system `prefers-color-scheme` |
| `value` | `string` | — | Initial value as attribute string. Format depends on `mode` (see Value Formats) |
| `min-date` | `string` | — | Earliest selectable date, `"YYYY-MM-DD"`. Dates before this are disabled |
| `max-date` | `string` | — | Latest selectable date, `"YYYY-MM-DD"`. Dates after this are disabled |
| `disabled-dates` | `string` | — | Comma-separated list of dates to disable: `"2026-03-25,2026-03-26"` |
| `first-day` | `number` | `0` | First day of week. 0 = Sunday, 1 = Monday, ..., 6 = Saturday |
| `locale` | `string` | — | Locale string for formatting |
| `presets` | `string` | — | Comma-separated preset keys for range mode. Available: `"today"`, `"this-week"`, `"next-7"`, `"next-30"` |
| `placeholder` | `string` | `"Select date"` | Text shown in popover trigger when no date is selected |
| `dual` | boolean attribute | absent | When present, shows two months side-by-side. Intended for range mode |
| `loading` | boolean attribute | absent | Shows skeleton loading animation instead of calendar grid |

## JS Properties

| Property | Type | Description |
|----------|------|-------------|
| `value` | Varies by mode (see below) | Read/write. Gets or sets the current selection |
| `loading` | `boolean` | Read/write. Reflects the `loading` attribute |
| `mode` | `string` | Read-only. Returns current mode attribute |
| `display` | `string` | Read-only. Returns current display attribute |
| `minDate` | `string \| null` | Read-only. Returns `min-date` attribute |
| `maxDate` | `string \| null` | Read-only. Returns `max-date` attribute |
| `disabledDates` | `string[]` | Read-only. Returns parsed `disabled-dates` array |
| `firstDay` | `number` | Read-only. Returns parsed `first-day` |
| `placeholder` | `string` | Read-only. Returns `placeholder` attribute |

## Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `open()` | — | `void` | Opens the popover. No-op in inline mode |
| `close()` | — | `void` | Closes the popover |
| `goToMonth(month, year)` | `month: number` (0-11), `year: number` | `void` | Navigates the calendar view to the specified month/year |
| `showStatus(type, message, opts?)` | `type: "error"\|"warning"\|"info"\|"success"`, `message: string`, `opts?: {autoDismiss?: number, dismissible?: boolean}` | `void` | Shows a status banner. `autoDismiss` is milliseconds |
| `clearStatus()` | — | `void` | Removes the status banner |

## Events

| Event | `detail` shape | Fires when |
|-------|---------------|------------|
| `cal:change` | Varies by mode (see below) | User selects or changes a date |
| `cal:month-change` | `{year: number, month: number}` | User navigates to a different month (arrows or month picker) |
| `cal:open` | `{}` | Popover opens |
| `cal:close` | `{}` | Popover closes |
| `cal:status` | `{type: string\|null, message: string\|null}` | Status banner is shown or cleared |

All events are `CustomEvent` with `bubbles: true` and `composed: true`, meaning they cross Shadow DOM boundaries.

## Value Formats

### mode="single"

| Context | Format |
|---------|--------|
| HTML attribute | `value="2026-03-15"` |
| JS property (get) | `"2026-03-15"` or `null` |
| JS property (set) | `picker.value = "2026-03-15"` |
| Event detail | `{value: "2026-03-15"}` |

### mode="range"

| Context | Format |
|---------|--------|
| HTML attribute | `value="2026-03-10/2026-03-15"` (slash-separated) |
| JS property (get) | `{start: "2026-03-10", end: "2026-03-15"}` or `null` |
| JS property (set) | `picker.value = {start: "2026-03-10", end: "2026-03-15"}` |
| Event detail | `{value: {start: "2026-03-10", end: "2026-03-15"}}` |

Range selection is a two-click process: first click sets start, second click sets end. If the second click is before the first, they are automatically swapped.

### mode="multi"

| Context | Format |
|---------|--------|
| HTML attribute | `value="2026-03-10,2026-03-12,2026-03-15"` (comma-separated) |
| JS property (get) | `["2026-03-10", "2026-03-12", "2026-03-15"]` (sorted) |
| JS property (set) | `picker.value = ["2026-03-10", "2026-03-12"]` |
| Event detail | `{value: ["2026-03-10", "2026-03-12", "2026-03-15"]}` |

Clicking an already-selected date deselects it (toggle behavior).

## Presets

Available in range mode via the `presets` attribute. Rendered as pill chips below the calendar grid.

| Key | Label | Range |
|-----|-------|-------|
| `today` | Today | Single day (start = end = today) |
| `this-week` | This Week | Sunday through Saturday of current week |
| `next-7` | Next 7 Days | Today through today + 6 |
| `next-30` | Next 30 Days | Today through today + 29 |

## Keyboard Navigation

| Key | Action |
|-----|--------|
| Arrow Left | Previous day |
| Arrow Right | Next day |
| Arrow Up | Same day, previous week |
| Arrow Down | Same day, next week |
| Enter / Space | Select focused date |
| Escape | Close popover (popover mode) or close month picker |

When the focused date moves outside the current view month, the calendar auto-navigates.

## Full Examples

### Inline Single Date Picker

```html
<cal-datepicker
  mode="single"
  min-date="2026-01-01"
  max-date="2026-12-31"
  first-day="1"
  theme="light"
></cal-datepicker>

<script>
  const picker = document.querySelector('cal-datepicker');

  picker.addEventListener('cal:change', (e) => {
    console.log('Selected:', e.detail.value); // "2026-03-15"
  });

  // Programmatic selection
  picker.value = '2026-06-15';

  // Navigate to a specific month
  picker.goToMonth(5, 2026); // June 2026
</script>
```

### Popover Range with Dual Months and Presets

```html
<cal-datepicker
  mode="range"
  display="popover"
  dual
  presets="today,this-week,next-7,next-30"
  placeholder="Select date range"
  disabled-dates="2026-12-25,2026-12-31"
  theme="auto"
></cal-datepicker>

<script>
  const picker = document.querySelector('cal-datepicker');

  picker.addEventListener('cal:change', (e) => {
    const { start, end } = e.detail.value;
    console.log(`Range: ${start} to ${end}`);
  });

  // Set initial range programmatically
  picker.value = { start: '2026-03-01', end: '2026-03-07' };

  // Open programmatically
  picker.open();
</script>
```

### Multi-Select with Disabled Dates

```html
<cal-datepicker
  mode="multi"
  disabled-dates="2026-03-15,2026-03-22"
  theme="dark"
></cal-datepicker>

<script>
  const picker = document.querySelector('cal-datepicker');

  picker.addEventListener('cal:change', (e) => {
    console.log('Selected dates:', e.detail.value);
    // ["2026-03-10", "2026-03-12", "2026-03-17"]
  });
</script>
```
