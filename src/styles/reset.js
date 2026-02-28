export const reset = `
  :host {
    display: inline-block;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
    color: hsl(var(--cal-fg));
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :host([display="inline"]) {
    display: inline-block;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  button:focus-visible {
    outline: 2px solid hsl(var(--cal-ring));
    outline-offset: 2px;
    border-radius: var(--cal-radius-sm);
  }

  [hidden] {
    display: none !important;
  }
`;
