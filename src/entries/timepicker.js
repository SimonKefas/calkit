import { CalTimepicker } from '../components/timepicker/index.js';

if (!customElements.get('cal-timepicker')) {
  customElements.define('cal-timepicker', CalTimepicker);
}

export { CalTimepicker };
