import { CalDatepicker } from '../components/datepicker/index.js';

if (!customElements.get('cal-datepicker')) {
  customElements.define('cal-datepicker', CalDatepicker);
}

export { CalDatepicker };
