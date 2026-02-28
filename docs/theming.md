# Theming

CalKit uses CSS custom properties (design tokens) for all visual styling. Tokens are set on `:host` inside the Shadow DOM and can be overridden from outside using the element selector.

## Theme Attribute

All components accept a `theme` attribute:

| Value | Behavior |
|-------|----------|
| `"light"` | Light color scheme (default) |
| `"dark"` | Dark color scheme |
| `"auto"` | Follows the system `prefers-color-scheme` media query |

```html
<cal-datepicker theme="dark"></cal-datepicker>
<cal-scheduler theme="auto"></cal-scheduler>
```

## HSL Channel Format

All color tokens are raw HSL channels without the `hsl()` wrapper. They are consumed internally as `hsl(var(--cal-token))`.

For example, `--cal-accent: 240 6% 10%` is used as `background: hsl(var(--cal-accent))`.

This format allows alpha channel modifications using the CSS `/` syntax:

```css
background: hsl(var(--cal-accent) / 0.5);  /* 50% opacity accent */
```

Non-color tokens (`--cal-radius`, `--cal-cell-size`, `--cal-transition`) use standard CSS values.

## Token Reference

### Core Tokens

| Token | Light | Dark | Description |
|-------|-------|------|-------------|
| `--cal-bg` | `0 0% 100%` | `240 6% 10%` | Primary background |
| `--cal-bg-muted` | `240 5% 96%` | `240 4% 16%` | Muted/secondary background |
| `--cal-fg` | `240 6% 10%` | `0 0% 98%` | Primary text color |
| `--cal-fg-muted` | `240 4% 46%` | `240 4% 54%` | Secondary/muted text |
| `--cal-border` | `240 6% 90%` | `240 4% 20%` | Border color |
| `--cal-accent` | `240 6% 10%` | `0 0% 98%` | Accent/selected state |
| `--cal-accent-fg` | `0 0% 100%` | `240 6% 10%` | Text on accent background |
| `--cal-accent-subtle` | `240 5% 96%` | `240 4% 16%` | Subtle accent background |
| `--cal-hover` | `240 5% 93%` | `240 4% 20%` | Hover state background |
| `--cal-ring` | `240 6% 10%` | `0 0% 98%` | Focus ring color |

### Dimension Tokens

| Token | Default | Description |
|-------|---------|-------------|
| `--cal-radius` | `8px` | Border radius for containers |
| `--cal-radius-sm` | `6px` | Border radius for small elements (chips, buttons) |
| `--cal-cell-size` | `36px` | Datepicker day cell size |
| `--cal-transition` | `150ms ease` | Transition timing for hover/focus states |

### Booking Color Tokens

Five color palettes for bookings and events. Each has three variants: `-bg` (background), `-fg` (foreground/text), `-hover` (hover state).

| Palette | `-bg` (light) | `-fg` (light) | `-hover` (light) |
|---------|---------------|---------------|------------------|
| `blue` | `217 55% 94%` | `217 60% 35%` | `217 55% 88%` |
| `green` | `152 45% 93%` | `152 55% 28%` | `152 45% 87%` |
| `red` | `4 50% 94%` | `4 55% 40%` | `4 50% 88%` |
| `orange` | `30 55% 93%` | `30 60% 35%` | `30 55% 87%` |
| `gray` | `240 8% 94%` | `240 8% 38%` | `240 8% 88%` |

| Palette | `-bg` (dark) | `-fg` (dark) | `-hover` (dark) |
|---------|--------------|--------------|-----------------|
| `blue` | `217 50% 25%` | `217 80% 75%` | `217 50% 30%` |
| `green` | `142 40% 22%` | `142 70% 70%` | `142 40% 27%` |
| `red` | `4 45% 25%` | `4 70% 75%` | `4 45% 30%` |
| `orange` | `30 45% 25%` | `30 80% 75%` | `30 45% 30%` |
| `gray` | `240 5% 22%` | `240 5% 65%` | `240 5% 27%` |

Token names follow the pattern: `--cal-booking-{color}-{variant}`

Example: `--cal-booking-blue-bg`, `--cal-booking-red-fg`, `--cal-booking-green-hover`

### Scheduler Tokens

| Token | Light | Dark | Description |
|-------|-------|------|-------------|
| `--cal-sched-grid-line` | `240 6% 94%` | `240 4% 18%` | Grid line color |
| `--cal-sched-now-line` | `4 70% 55%` | `4 55% 55%` | Current time indicator line |
| `--cal-sched-slot-hover` | `240 5% 97%` | `240 4% 14%` | Slot hover background |
| `--cal-sched-header-bg` | `240 5% 98%` | `240 5% 12%` | Header/day header background |

### Status Tokens

Four status types, each with three variants: `-bg`, `-fg`, `-border`.

| Type | `-bg` (light) | `-fg` (light) | `-border` (light) |
|------|---------------|---------------|--------------------|
| `error` | `4 50% 95%` | `4 55% 40%` | `4 50% 85%` |
| `warning` | `40 55% 95%` | `40 60% 35%` | `40 50% 85%` |
| `info` | `217 55% 95%` | `217 60% 35%` | `217 50% 85%` |
| `success` | `152 45% 95%` | `152 55% 28%` | `152 45% 85%` |

| Type | `-bg` (dark) | `-fg` (dark) | `-border` (dark) |
|------|--------------|--------------|-------------------|
| `error` | `4 45% 20%` | `4 70% 75%` | `4 45% 30%` |
| `warning` | `40 45% 20%` | `40 80% 75%` | `40 45% 30%` |
| `info` | `217 50% 20%` | `217 80% 75%` | `217 50% 30%` |
| `success` | `152 40% 18%` | `152 70% 70%` | `152 40% 28%` |

Token names follow the pattern: `--cal-status-{type}-{variant}`

Example: `--cal-status-error-bg`, `--cal-status-warning-fg`, `--cal-status-success-border`

## Overriding Tokens

Set custom properties on the component's tag selector from your page CSS. Because tokens are defined on `:host`, your external CSS has higher specificity.

### Custom Accent Color

```css
cal-datepicker,
cal-timepicker,
cal-booking,
cal-scheduler {
  --cal-accent: 220 90% 56%;
  --cal-accent-fg: 0 0% 100%;
}
```

### Custom Border Radius

```css
cal-scheduler {
  --cal-radius: 12px;
  --cal-radius-sm: 8px;
}
```

### Custom Booking Colors

```css
cal-booking {
  --cal-booking-blue-bg: 200 80% 92%;
  --cal-booking-blue-fg: 200 80% 30%;
  --cal-booking-blue-hover: 200 80% 86%;
}
```

### Custom Scheduler Grid

```css
cal-scheduler {
  --cal-sched-grid-line: 0 0% 90%;
  --cal-sched-now-line: 142 70% 45%;
  --cal-sched-header-bg: 220 20% 97%;
}
```

### Full Theme Override (Branded)

```css
cal-scheduler {
  --cal-bg: 222 47% 11%;
  --cal-bg-muted: 217 33% 17%;
  --cal-fg: 210 40% 98%;
  --cal-fg-muted: 215 20% 65%;
  --cal-border: 217 33% 22%;
  --cal-accent: 217 91% 60%;
  --cal-accent-fg: 0 0% 100%;
  --cal-hover: 217 33% 20%;
  --cal-ring: 217 91% 60%;
  --cal-radius: 10px;
}
```
