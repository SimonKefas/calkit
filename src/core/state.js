/**
 * Minimal pub/sub reactive store.
 * Usage:
 *   const store = createStore({ count: 0 });
 *   store.subscribe((state) => console.log(state.count));
 *   store.set({ count: 1 });
 */
export function createStore(initial) {
  let state = { ...initial };
  const listeners = new Set();

  return {
    get(key) {
      return state[key];
    },

    set(partial) {
      const prev = state;
      state = { ...state, ...partial };
      // Only notify if something actually changed
      let changed = false;
      for (const key of Object.keys(partial)) {
        if (prev[key] !== state[key]) {
          changed = true;
          break;
        }
      }
      if (changed) {
        for (const fn of listeners) fn(state, prev);
      }
    },

    getState() {
      return state;
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
