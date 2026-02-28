export const tokens = `
  :host {
    /* Light theme (default) */
    --cal-bg: 0 0% 100%;
    --cal-bg-muted: 240 5% 96%;
    --cal-fg: 240 6% 10%;
    --cal-fg-muted: 240 4% 46%;
    --cal-border: 240 6% 90%;
    --cal-accent: 240 6% 10%;
    --cal-accent-fg: 0 0% 100%;
    --cal-accent-subtle: 240 5% 96%;
    --cal-hover: 240 5% 93%;
    --cal-ring: 240 6% 10%;
    --cal-radius: 8px;
    --cal-radius-sm: 6px;
    --cal-cell-size: 36px;
    --cal-transition: 150ms ease;

    /* Booking color palette (softer / less saturated) */
    --cal-booking-blue-bg: 217 55% 94%;
    --cal-booking-blue-fg: 217 60% 35%;
    --cal-booking-green-bg: 152 45% 93%;
    --cal-booking-green-fg: 152 55% 28%;
    --cal-booking-red-bg: 4 50% 94%;
    --cal-booking-red-fg: 4 55% 40%;
    --cal-booking-orange-bg: 30 55% 93%;
    --cal-booking-orange-fg: 30 60% 35%;
    --cal-booking-gray-bg: 240 8% 94%;
    --cal-booking-gray-fg: 240 8% 38%;

    /* Booking hover tokens */
    --cal-booking-blue-hover: 217 55% 88%;
    --cal-booking-green-hover: 152 45% 87%;
    --cal-booking-red-hover: 4 50% 88%;
    --cal-booking-orange-hover: 30 55% 87%;
    --cal-booking-gray-hover: 240 8% 88%;

    /* Scheduler tokens */
    --cal-sched-grid-line: 240 6% 94%;
    --cal-sched-now-line: 4 70% 55%;
    --cal-sched-slot-hover: 240 5% 97%;
    --cal-sched-header-bg: 240 5% 98%;

    /* Status tokens */
    --cal-status-error-bg: 4 50% 95%;
    --cal-status-error-fg: 4 55% 40%;
    --cal-status-error-border: 4 50% 85%;
    --cal-status-warning-bg: 40 55% 95%;
    --cal-status-warning-fg: 40 60% 35%;
    --cal-status-warning-border: 40 50% 85%;
    --cal-status-info-bg: 217 55% 95%;
    --cal-status-info-fg: 217 60% 35%;
    --cal-status-info-border: 217 50% 85%;
    --cal-status-success-bg: 152 45% 95%;
    --cal-status-success-fg: 152 55% 28%;
    --cal-status-success-border: 152 45% 85%;
  }

  :host([theme="dark"]) {
    --cal-bg: 240 6% 10%;
    --cal-bg-muted: 240 4% 16%;
    --cal-fg: 0 0% 98%;
    --cal-fg-muted: 240 4% 54%;
    --cal-border: 240 4% 20%;
    --cal-accent: 0 0% 98%;
    --cal-accent-fg: 240 6% 10%;
    --cal-accent-subtle: 240 4% 16%;
    --cal-hover: 240 4% 20%;
    --cal-ring: 0 0% 98%;

    --cal-booking-blue-bg: 217 50% 25%;
    --cal-booking-blue-fg: 217 80% 75%;
    --cal-booking-green-bg: 142 40% 22%;
    --cal-booking-green-fg: 142 70% 70%;
    --cal-booking-red-bg: 4 45% 25%;
    --cal-booking-red-fg: 4 70% 75%;
    --cal-booking-orange-bg: 30 45% 25%;
    --cal-booking-orange-fg: 30 80% 75%;
    --cal-booking-gray-bg: 240 5% 22%;
    --cal-booking-gray-fg: 240 5% 65%;

    --cal-booking-blue-hover: 217 50% 30%;
    --cal-booking-green-hover: 142 40% 27%;
    --cal-booking-red-hover: 4 45% 30%;
    --cal-booking-orange-hover: 30 45% 30%;
    --cal-booking-gray-hover: 240 5% 27%;

    --cal-sched-grid-line: 240 4% 18%;
    --cal-sched-now-line: 4 55% 55%;
    --cal-sched-slot-hover: 240 4% 14%;
    --cal-sched-header-bg: 240 5% 12%;

    --cal-status-error-bg: 4 45% 20%;
    --cal-status-error-fg: 4 70% 75%;
    --cal-status-error-border: 4 45% 30%;
    --cal-status-warning-bg: 40 45% 20%;
    --cal-status-warning-fg: 40 80% 75%;
    --cal-status-warning-border: 40 45% 30%;
    --cal-status-info-bg: 217 50% 20%;
    --cal-status-info-fg: 217 80% 75%;
    --cal-status-info-border: 217 50% 30%;
    --cal-status-success-bg: 152 40% 18%;
    --cal-status-success-fg: 152 70% 70%;
    --cal-status-success-border: 152 40% 28%;
  }

  :host([theme="auto"]) {
    --cal-bg: 0 0% 100%;
    --cal-bg-muted: 240 5% 96%;
    --cal-fg: 240 6% 10%;
    --cal-fg-muted: 240 4% 46%;
    --cal-border: 240 6% 90%;
    --cal-accent: 240 6% 10%;
    --cal-accent-fg: 0 0% 100%;
    --cal-accent-subtle: 240 5% 96%;
    --cal-hover: 240 5% 93%;
    --cal-ring: 240 6% 10%;
  }

  @media (prefers-color-scheme: dark) {
    :host([theme="auto"]) {
      --cal-bg: 240 6% 10%;
      --cal-bg-muted: 240 4% 16%;
      --cal-fg: 0 0% 98%;
      --cal-fg-muted: 240 4% 54%;
      --cal-border: 240 4% 20%;
      --cal-accent: 0 0% 98%;
      --cal-accent-fg: 240 6% 10%;
      --cal-accent-subtle: 240 4% 16%;
      --cal-hover: 240 4% 20%;
      --cal-ring: 0 0% 98%;

      --cal-booking-blue-bg: 217 50% 25%;
      --cal-booking-blue-fg: 217 80% 75%;
      --cal-booking-green-bg: 142 40% 22%;
      --cal-booking-green-fg: 142 70% 70%;
      --cal-booking-red-bg: 4 45% 25%;
      --cal-booking-red-fg: 4 70% 75%;
      --cal-booking-orange-bg: 30 45% 25%;
      --cal-booking-orange-fg: 30 80% 75%;
      --cal-booking-gray-bg: 240 5% 22%;
      --cal-booking-gray-fg: 240 5% 65%;

      --cal-booking-blue-hover: 217 50% 30%;
      --cal-booking-green-hover: 142 40% 27%;
      --cal-booking-red-hover: 4 45% 30%;
      --cal-booking-orange-hover: 30 45% 30%;
      --cal-booking-gray-hover: 240 5% 27%;

      --cal-sched-grid-line: 240 4% 18%;
      --cal-sched-now-line: 4 55% 55%;
      --cal-sched-slot-hover: 240 4% 14%;
      --cal-sched-header-bg: 240 5% 12%;

      --cal-status-error-bg: 4 45% 20%;
      --cal-status-error-fg: 4 70% 75%;
      --cal-status-error-border: 4 45% 30%;
      --cal-status-warning-bg: 40 45% 20%;
      --cal-status-warning-fg: 40 80% 75%;
      --cal-status-warning-border: 40 45% 30%;
      --cal-status-info-bg: 217 50% 20%;
      --cal-status-info-fg: 217 80% 75%;
      --cal-status-info-border: 217 50% 30%;
      --cal-status-success-bg: 152 40% 18%;
      --cal-status-success-fg: 152 70% 70%;
      --cal-status-success-border: 152 40% 28%;
    }
  }
`;
