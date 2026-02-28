import { CalScheduler } from '../components/scheduler/index.js';

if (!customElements.get('cal-scheduler')) {
  customElements.define('cal-scheduler', CalScheduler);
}

export { CalScheduler };
