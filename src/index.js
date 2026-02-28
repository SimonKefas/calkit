import { CalDatepicker } from './components/datepicker/index.js';
import { CalBooking } from './components/booking/index.js';
import { CalTimepicker } from './components/timepicker/index.js';
import { CalScheduler } from './components/scheduler/index.js';

// Guard against double-registration
if (!customElements.get('cal-datepicker')) {
  customElements.define('cal-datepicker', CalDatepicker);
}

if (!customElements.get('cal-booking')) {
  customElements.define('cal-booking', CalBooking);
}

if (!customElements.get('cal-timepicker')) {
  customElements.define('cal-timepicker', CalTimepicker);
}

if (!customElements.get('cal-scheduler')) {
  customElements.define('cal-scheduler', CalScheduler);
}

export { CalDatepicker, CalBooking, CalTimepicker, CalScheduler };
