import { CalBooking } from '../components/booking/index.js';

if (!customElements.get('cal-booking')) {
  customElements.define('cal-booking', CalBooking);
}

export { CalBooking };
