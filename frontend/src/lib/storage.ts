const memory = new Map<string, string | null>();
const storageNames = ["localStorage", "sessionStorage"] as const;

/** Persistent string storage with session and page-memory fallbacks when storage is blocked. */
export const persistentStorage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = {
  getItem(key) {
    if (memory.has(key)) return memory.get(key) ?? null;

    for (const name of storageNames) {
      try {
        const value = window[name].getItem(key);
        if (value !== null) {
          // Upgrade older session-only preferences when persistent storage is available.
          if (name === "sessionStorage") persistentStorage.setItem(key, value);
          return value;
        }
      } catch {
        // Accessing the storage property itself can throw, so keep it inside the try.
      }
    }
    return null;
  },

  setItem(key, value) {
    memory.set(key, value);
    try {
      window.localStorage.setItem(key, value);
      memory.delete(key);
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // The persistent write succeeded even if the old session value cannot be removed.
      }
      return;
    } catch {
      // Keep the latest value in memory, including when a stale persistent value is readable.
    }
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Page memory still retains the value when both storage APIs are unavailable.
    }
  },

  removeItem(key) {
    // A tombstone prevents failed removals from bringing back an older stored value.
    memory.set(key, null);
    let removed = true;
    for (const name of storageNames) {
      try {
        window[name].removeItem(key);
      } catch {
        removed = false;
      }
    }
    if (removed) memory.delete(key);
  },
};
