export const animations = `
  @keyframes cal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes cal-slide-up {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes cal-slide-left {
    from {
      opacity: 0;
      transform: translateX(16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes cal-slide-right {
    from {
      opacity: 0;
      transform: translateX(-16px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .cal-animate-fade { animation: cal-fade-in 150ms cubic-bezier(0.16, 1, 0.3, 1); }
  .cal-animate-slide-up { animation: cal-slide-up 200ms cubic-bezier(0.16, 1, 0.3, 1); }
  .cal-animate-slide-left { animation: cal-slide-left 200ms cubic-bezier(0.16, 1, 0.3, 1); }
  .cal-animate-slide-right { animation: cal-slide-right 200ms cubic-bezier(0.16, 1, 0.3, 1); }

  @keyframes cal-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .cal-skeleton {
    background: linear-gradient(
      90deg,
      hsl(var(--cal-bg-muted)) 25%,
      hsl(var(--cal-hover)) 50%,
      hsl(var(--cal-bg-muted)) 75%
    );
    background-size: 200% 100%;
    animation: cal-shimmer 1.5s infinite ease-in-out;
    border-radius: 999px;
  }

  .cal-skeleton--rect {
    border-radius: var(--cal-radius-sm);
  }
`;
