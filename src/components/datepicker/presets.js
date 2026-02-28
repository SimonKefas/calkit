import { today, toDateString } from '../../core/dates.js';

/**
 * Returns an array of built-in preset definitions.
 */
export function getBuiltinPresets() {
  return [
    {
      key: 'today',
      label: 'Today',
      resolve() {
        const t = today();
        return { start: t, end: t };
      },
    },
    {
      key: 'this-week',
      label: 'This Week',
      resolve() {
        const now = new Date();
        const day = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - day);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return { start: toDateString(start), end: toDateString(end) };
      },
    },
    {
      key: 'next-7',
      label: 'Next 7 Days',
      resolve() {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 6);
        return { start: toDateString(start), end: toDateString(end) };
      },
    },
    {
      key: 'next-30',
      label: 'Next 30 Days',
      resolve() {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 29);
        return { start: toDateString(start), end: toDateString(end) };
      },
    },
  ];
}

/**
 * Renders preset pill chips.
 * @param {object} options
 * @param {string[]} options.presetKeys - which presets to show (e.g. ['today', 'next-7'])
 * @param {function} options.onSelect - called with { start, end }
 * @returns {HTMLElement}
 */
export function renderPresets({ presetKeys, onSelect }) {
  const container = document.createElement('div');
  container.classList.add('cal-presets');

  const builtins = getBuiltinPresets();
  const presets = presetKeys
    .map((key) => builtins.find((p) => p.key === key))
    .filter(Boolean);

  for (const preset of presets) {
    const chip = document.createElement('button');
    chip.classList.add('cal-preset');
    chip.textContent = preset.label;
    chip.addEventListener('click', () => {
      onSelect?.(preset.resolve());
    });
    container.appendChild(chip);
  }

  return container;
}

export const presetsStyles = `
  .cal-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 8px 4px;
    border-top: 1px solid hsl(var(--cal-border));
    margin-top: 8px;
  }

  .cal-preset {
    display: inline-flex;
    align-items: center;
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 999px;
    background: hsl(var(--cal-bg-muted));
    color: hsl(var(--cal-fg));
    transition: background var(--cal-transition);
  }

  .cal-preset:hover {
    background: hsl(var(--cal-hover));
  }
`;
