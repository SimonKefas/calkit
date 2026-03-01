/**
 * Shared base class for all calendar web components.
 * Provides Shadow DOM setup, style injection, render lifecycle, and helpers.
 */
export class CalendarBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._initialized = false;
  }

  /** Override in subclass — return array of CSSStyleSheet or CSS strings. */
  static get styles() {
    return [];
  }

  connectedCallback() {
    if (!this._initialized) {
      this._adoptStyles();
      this._initialized = true;
    }
    this.render();
  }

  _adoptStyles() {
    const sheets = this.constructor.styles;
    if (!sheets.length) return;

    // Try constructable stylesheets first
    if ('adoptedStyleSheets' in this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = sheets.map((s) => {
        if (s instanceof CSSStyleSheet) return s;
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(s);
        return sheet;
      });
    } else {
      // Fallback: inject <style> tags
      for (const s of sheets) {
        const el = document.createElement('style');
        el.textContent = s instanceof CSSStyleSheet ? '' : s;
        this.shadowRoot.prepend(el);
      }
    }
  }

  /** Subclasses override to update Shadow DOM. */
  render() {}

  /** Reset selection state. Subclasses should override with specific logic. */
  clear() {}

  /** Dispatch a composed, bubbling custom event. */
  emit(name, detail = {}) {
    this.dispatchEvent(
      new CustomEvent(name, { detail, bubbles: true, composed: true })
    );
  }

  /** Show an inline status banner. */
  showStatus(type, message, opts = {}) {
    if (!this._store) return;
    const { autoDismiss, dismissible = true } = opts;
    clearTimeout(this._statusTimer);
    this._store.set({ statusType: type, statusMessage: message, statusDismissible: dismissible });
    this.emit('cal:status', { type, message });
    if (autoDismiss && autoDismiss > 0) {
      this._statusTimer = setTimeout(() => this.clearStatus(), autoDismiss);
    }
  }

  /** Clear the status banner. */
  clearStatus() {
    if (!this._store) return;
    clearTimeout(this._statusTimer);
    this._store.set({ statusType: null, statusMessage: null, statusDismissible: true });
    this.emit('cal:status', { type: null, message: null });
  }

  /** Query within shadow root. */
  $(selector) {
    return this.shadowRoot.querySelector(selector);
  }

  $$(selector) {
    return this.shadowRoot.querySelectorAll(selector);
  }
}
