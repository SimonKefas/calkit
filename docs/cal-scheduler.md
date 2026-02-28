# cal-scheduler

A full-featured resource scheduling calendar with day, week, and month views. Supports drag-to-move, drag-to-resize, drag-to-create, resource tabs and columns, all-day events, custom event rendering, event actions, and a floating action button.

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | `"light"` \| `"dark"` \| `"auto"` | `"light"` | Color theme |
| `view` | `"day"` \| `"week"` \| `"month"` | `"week"` | Current calendar view |
| `layout` | `"vertical"` | `"vertical"` | Grid layout direction |
| `date` | `string` | today | Anchor date (`"YYYY-MM-DD"`). Controls which day/week/month is shown |
| `start-time` | `string` | `"08:00"` | Day grid start time (`"HH:MM"`) |
| `end-time` | `string` | `"18:00"` | Day grid end time |
| `interval` | `number` | `30` | Time slot interval in minutes |
| `format` | `"12h"` \| `"24h"` | `"24h"` | Time display format |
| `first-day` | `number` | `0` | First day of week (0 = Sunday) |
| `slot-height` | `number` | `48` | Pixel height per time slot |
| `resource-mode` | `"tabs"` \| `"columns"` | `"tabs"` | How resources are displayed |
| `show-event-time` | `"true"` \| `"false"` | `"true"` | Show time row in default event block rendering |
| `show-fab` | boolean attribute | absent | Show floating action button (bottom-right) |
| `draggable-events` | boolean attribute | absent | Enable drag-to-move, drag-to-resize, and drag-to-create |
| `snap-interval` | `number` | — | Drag snap granularity in minutes. Falls back to `interval` if not set |
| `min-duration` | `number` | — | Minimum event duration in minutes for drag operations. Falls back to snap interval |
| `max-duration` | `number` | — | Maximum event duration in minutes for drag operations. No limit if not set |
| `loading` | boolean attribute | absent | Show skeleton loading state |

## JS Properties

| Property | Type | Description |
|----------|------|-------------|
| `resources` | `Resource[]` | Array of resource objects. Default: `[]` |
| `events` | `Event[]` | Array of event objects. Default: `[]` |
| `eventActions` | `EventAction[]` | Action buttons shown in event detail popover. Default: `[]` |
| `eventContent` | `((event: Event, resource: Resource) => HTMLElement \| string) \| null` | Custom event content renderer. Replaces default title + time rendering. Default: `null` |
| `value` | `object \| null` | Read-only. Last slot selected via `cal:slot-select` |
| `loading` | `boolean` | Read/write, reflects attribute |

## Event Object Shape

```js
{
  id: string,                    // Unique identifier (required)
  title: string,                 // Display title
  start: string,                 // "YYYY-MM-DD" — event date
  end: string,                   // "YYYY-MM-DD" — optional, for multi-day events
  startTime: string,             // "HH:MM" — omit for all-day events
  endTime: string,               // "HH:MM" — omit for all-day events
  resourceId: string,            // Links to Resource.id
  color: string,                 // "blue" | "green" | "red" | "orange" | "gray" (default: "blue")
  locked: boolean,               // true prevents drag move/resize (default: false)
  metadata: {                    // Key-value pairs shown in detail popover
    [key: string]: string | number
  }
}
```

**All-day events**: Omit `startTime` and `endTime`. Rendered in a collapsible all-day row (week view) or as chips (month view).

**Locked events**: Set `locked: true` to prevent drag operations. A lock icon appears on the event block.

## Resource Object Shape

```js
{
  id: string,                    // Unique identifier (required)
  name: string,                  // Display name
  capacity: number,              // Optional capacity (shown in detail, used by findAvailableSlot)
  color: string,                 // "blue" | "green" | "red" | "orange" | "gray"
}
```

## EventAction Object Shape

```js
{
  label: string,                 // Button text, also serves as action identifier in events
  type: string,                  // Optional. "danger" applies red/destructive styling
}
```

## Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `goToDate(dateStr)` | `dateStr: string` | `void` | Navigate to date. Emits `cal:date-change` |
| `setView(view)` | `view: "day"\|"week"\|"month"` | `void` | Switch view. Emits `cal:view-change` |
| `today()` | — | `void` | Navigate to today |
| `next()` | — | `void` | Advance by 1 day/week/month (depends on current view) |
| `prev()` | — | `void` | Go back by 1 day/week/month |
| `findAvailableSlot(opts)` | See below | `{resourceId, date, startTime, endTime} \| null` | Find first available slot |
| `isSlotAvailable(date, startTime, endTime, resourceId)` | All `string` | `boolean` | Check if specific slot is free |
| `showStatus(type, message, opts?)` | `type: "error"\|"warning"\|"info"\|"success"`, `message: string`, `opts?: {autoDismiss?, dismissible?}` | `void` | Show status banner |
| `clearStatus()` | — | `void` | Clear status banner |

### findAvailableSlot(opts)

Searches up to 14 days from the given date (or today) for the first available slot.

```js
const slot = scheduler.findAvailableSlot({
  date: '2026-03-02',       // Optional. Start searching from this date (default: today)
  duration: 60,              // Required. Duration in minutes
  resourceId: 'room-a',     // Optional. Specific resource (default: search all)
  minCapacity: 10,           // Optional. Minimum resource capacity
});

// Returns: { resourceId: 'room-a', date: '2026-03-02', startTime: '10:00', endTime: '11:00' }
// Or null if nothing found in 14 days
```

### isSlotAvailable(date, startTime, endTime, resourceId)

Checks if a specific time slot has no overlapping events for the given resource.

```js
const free = scheduler.isSlotAvailable('2026-03-02', '10:00', '11:00', 'room-a');
// true if no events overlap 10:00-11:00 on that date for room-a
```

## Events

| Event | `detail` shape | Fires when |
|-------|---------------|------------|
| `cal:slot-select` | `{date, startTime, endTime, resourceId, resource}` | Empty time slot is clicked |
| `cal:slot-create` | `{date, startTime, endTime, resourceId, resource}` | Drag-to-create completes |
| `cal:event-click` | `{event, resourceId, resource}` | Event block is clicked (opens detail) |
| `cal:event-move` | `{event, from: {date, startTime, endTime, resourceId}, to: {date, startTime, endTime, resourceId}}` | Drag-to-move completes |
| `cal:event-resize` | `{event, from: {endTime}, to: {endTime}}` | Drag-to-resize completes |
| `cal:event-action` | `{action, event, resourceId, resource}` | Action button clicked in detail |
| `cal:fab-create` | `{date, view}` | FAB button clicked |
| `cal:date-change` | `{date, view}` | Navigation changes date |
| `cal:view-change` | `{view, date}` | View type changes |
| `cal:status` | `{type, message}` | Status banner changes |

**Important**: Drag events (`cal:event-move`, `cal:event-resize`, `cal:slot-create`) are informational only. The component does **not** mutate its own `events` array. You must update `scheduler.events` in your event handler to persist changes.

### Event Detail: cal:slot-select

In month view, `startTime`, `endTime`, and `resourceId` are `null`.

### Event Detail: cal:event-move

```js
{
  event: Event,              // The original event object
  from: {
    date: string,            // Original date
    startTime: string,       // Original start time
    endTime: string,         // Original end time
    resourceId: string       // Original resource
  },
  to: {
    date: string,            // New date
    startTime: string,       // New start time
    endTime: string,         // New end time (duration preserved)
    resourceId: string       // New resource (if moved across columns)
  }
}
```

### Event Detail: cal:event-resize

```js
{
  event: Event,
  from: { endTime: string },
  to: { endTime: string }
}
```

Only bottom-edge resize is supported. Start time does not change.

## Resource Modes

### `resource-mode="tabs"`

- Tabs appear above the grid
- First tab is "All" (shows all events), followed by one tab per resource
- Selecting a tab filters events to that resource and shows a single column
- Default mode when multiple resources exist

### `resource-mode="columns"`

- Each resource renders as a side-by-side column in day view
- Week view with columns shows resources within each day column

## Drag System

Enabled by the `draggable-events` attribute. Uses pointer events.

### Drag-to-Move

1. Pointer down on an event block initiates potential drag
2. After 4px movement threshold, a ghost clone appears at the cursor
3. Original event dims (opacity 0.3)
4. Drop target highlighted based on cursor position over date/time/resource grid cells
5. On pointer up, `cal:event-move` fires with `from` and `to` positions
6. Event duration is preserved during moves

### Drag-to-Resize

1. Pointer down on the resize handle (bottom edge of event block) initiates resize
2. Dragging up/down changes event end time
3. A floating time label follows the cursor showing the new end time
4. Snaps to `snap-interval` (or `interval`)
5. Respects `min-duration` and `max-duration` bounds
6. Clamped to grid end time
7. On pointer up, `cal:event-resize` fires

### Drag-to-Create

1. Pointer down on an empty slot area (not on an event)
2. After 4px threshold, a dashed preview block appears
3. Dragging down extends the new event's end time
4. Snaps to `snap-interval`
5. Respects `min-duration` and `max-duration`
6. On pointer up, `cal:slot-create` fires with `{date, startTime, endTime, resourceId}`

### Locked Events

Events with `locked: true` cannot be moved or resized. They display a lock icon and use `cursor: default` instead of `cursor: grab`.

## Views

### Day View

- Single day with time axis
- `resource-mode="columns"` shows resources side-by-side
- `resource-mode="tabs"` shows tab bar for resource filtering

### Week View

- 7-day grid with time axis
- All-day row at top (collapsible, with dot indicators when collapsed)
- Current time indicator (red line, updates every 60s)
- Resource filtering via tabs

### Month View

- Standard month calendar grid
- Events shown as colored chips
- Click a day to select it (`cal:slot-select` with null times)
- Click an event chip for detail

## Custom Event Content

The `eventContent` property lets you fully control what renders inside event blocks:

```js
scheduler.eventContent = (event, resource) => {
  // Return an HTMLElement
  const el = document.createElement('div');
  el.innerHTML = `
    <strong>${event.title}</strong>
    <small>${resource?.name || ''}</small>
  `;
  return el;

  // Or return a string
  return `${event.title} (${resource?.name})`;
};
```

When `eventContent` is set, the default title + time rendering is replaced. The function is called for every event block, all-day chip, and month chip.

Set to `null` to restore default rendering.

## Full Examples

### Week View with Resources and Event Actions

```html
<cal-scheduler
  view="week"
  resource-mode="tabs"
  start-time="08:00"
  end-time="20:00"
  interval="30"
  format="12h"
  theme="light"
></cal-scheduler>

<script>
  const sched = document.querySelector('cal-scheduler');

  sched.resources = [
    { id: 'room-a', name: 'Conference Room A', capacity: 10 },
    { id: 'room-b', name: 'Conference Room B', capacity: 20 },
    { id: 'room-c', name: 'Board Room', capacity: 8 },
  ];

  sched.events = [
    {
      id: '1', title: 'Team Standup',
      start: '2026-03-02', startTime: '09:00', endTime: '09:30',
      resourceId: 'room-a', color: 'blue',
    },
    {
      id: '2', title: 'All Hands',
      start: '2026-03-03',
      resourceId: 'room-b', color: 'green',
      // No startTime/endTime = all-day event
    },
    {
      id: '3', title: 'Workshop',
      start: '2026-03-04', startTime: '13:00', endTime: '16:00',
      resourceId: 'room-b', color: 'orange',
      metadata: { organizer: 'Jane', department: 'Engineering' },
    },
  ];

  sched.eventActions = [
    { label: 'Edit' },
    { label: 'Duplicate' },
    { label: 'Delete', type: 'danger' },
  ];

  sched.addEventListener('cal:event-action', (e) => {
    const { action, event } = e.detail;
    if (action === 'Delete') {
      sched.events = sched.events.filter(ev => ev.id !== event.id);
    }
  });

  sched.addEventListener('cal:slot-select', (e) => {
    console.log('Empty slot clicked:', e.detail);
  });
</script>
```

### Drag-Enabled Scheduler

```html
<cal-scheduler
  view="week"
  draggable-events
  snap-interval="15"
  min-duration="15"
  max-duration="240"
  resource-mode="columns"
  format="12h"
></cal-scheduler>

<script>
  const sched = document.querySelector('cal-scheduler');

  sched.resources = [
    { id: 'desk-1', name: 'Desk 1' },
    { id: 'desk-2', name: 'Desk 2' },
  ];

  sched.events = [
    {
      id: '1', title: 'Focus Time',
      start: '2026-03-02', startTime: '09:00', endTime: '11:00',
      resourceId: 'desk-1', color: 'blue',
    },
    {
      id: '2', title: 'Locked Meeting',
      start: '2026-03-02', startTime: '14:00', endTime: '15:00',
      resourceId: 'desk-1', color: 'red', locked: true,
    },
  ];

  // Handle moves
  sched.addEventListener('cal:event-move', (e) => {
    const { event, to } = e.detail;
    sched.events = sched.events.map(ev =>
      ev.id === event.id
        ? { ...ev, start: to.date, startTime: to.startTime, endTime: to.endTime, resourceId: to.resourceId }
        : ev
    );
  });

  // Handle resizes
  sched.addEventListener('cal:event-resize', (e) => {
    const { event, to } = e.detail;
    sched.events = sched.events.map(ev =>
      ev.id === event.id ? { ...ev, endTime: to.endTime } : ev
    );
  });

  // Handle drag-to-create
  sched.addEventListener('cal:slot-create', (e) => {
    const { date, startTime, endTime, resourceId } = e.detail;
    sched.events = [...sched.events, {
      id: String(Date.now()),
      title: 'New Event',
      start: date,
      startTime,
      endTime,
      resourceId,
      color: 'orange',
    }];
  });
</script>
```

### Venue Booking with Availability API

```html
<cal-scheduler
  view="day"
  show-fab
  start-time="06:00"
  end-time="22:00"
  interval="60"
  format="12h"
></cal-scheduler>

<script>
  const sched = document.querySelector('cal-scheduler');

  sched.resources = [
    { id: 'court-1', name: 'Tennis Court 1', capacity: 4 },
    { id: 'court-2', name: 'Tennis Court 2', capacity: 4 },
    { id: 'court-3', name: 'Tennis Court 3', capacity: 4 },
  ];

  sched.events = [
    {
      id: '1', title: 'Morning Session',
      start: '2026-03-02', startTime: '08:00', endTime: '10:00',
      resourceId: 'court-1', color: 'blue',
    },
  ];

  // Find first available 90-minute slot
  const slot = sched.findAvailableSlot({
    duration: 90,
    minCapacity: 4,
  });
  if (slot) {
    console.log(`Available: ${slot.resourceId} on ${slot.date} ${slot.startTime}-${slot.endTime}`);
  }

  // Check specific slot
  const available = sched.isSlotAvailable('2026-03-02', '10:00', '12:00', 'court-1');
  console.log('Court 1 10-12 available:', available); // true

  // FAB for quick creation
  sched.addEventListener('cal:fab-create', (e) => {
    const slot = sched.findAvailableSlot({ duration: 60 });
    if (slot) {
      sched.events = [...sched.events, {
        id: String(Date.now()),
        title: 'Quick Booking',
        start: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        resourceId: slot.resourceId,
        color: 'green',
      }];
    } else {
      sched.showStatus('warning', 'No available slots in the next 2 weeks', { autoDismiss: 3000 });
    }
  });
</script>
```
