import { today, toDateString } from '../../core/dates.js';

/** Default English labels for presets. */
const PRESET_LABELS = {
  today: 'Today',
  'this-week': 'This Week',
  'next-7': 'Next 7 Days',
  'next-30': 'Next 30 Days',
};

/**
 * Get a localized preset label using Intl.RelativeTimeFormat when available.
 * Falls back to English.
 * @param {string} key - preset key
 * @param {string} [locale] - BCP 47 locale tag
 * @returns {string}
 */
function getPresetLabel(key, locale) {
  if (!locale) return PRESET_LABELS[key] || key;
  // Use Intl.DisplayNames isn't applicable, so use a simple approach:
  // For "today", use Intl.RelativeTimeFormat. For others, keep English fallback
  // but capitalize per locale conventions.
  try {
    if (key === 'today') {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const parts = rtf.formatToParts(0, 'day');
      const label = parts.map((p) => p.value).join('');
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
  } catch (e) { /* fall through */ }
  return PRESET_LABELS[key] || key;
}

/**
 * Returns an array of built-in preset definitions.
 * @param {string} [locale] - BCP 47 locale tag
 */
export function getBuiltinPresets(locale) {
  return [
    {
      key: 'today',
      label: getPresetLabel('today', locale),
      resolve() {
        const t = today();
        return { start: t, end: t };
      },
    },
    {
      key: 'this-week',
      label: getPresetLabel('this-week', locale),
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
      label: getPresetLabel('next-7', locale),
      resolve() {
        const start = new Date();
        const end = new Date();
        end.setDate(start.getDate() + 6);
        return { start: toDateString(start), end: toDateString(end) };
      },
    },
    {
      key: 'next-30',
      label: getPresetLabel('next-30', locale),
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
 * @param {string} [options.locale] - BCP 47 locale tag
 * @returns {HTMLElement}
 */
export function renderPresets({ presetKeys, onSelect, locale }) {
  const container = document.createElement('div');
  container.classList.add('cal-presets');

  const builtins = getBuiltinPresets(locale);
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
