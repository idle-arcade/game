import { CHOICE_KEY, createAnalytics, type RybbitApi } from "./client";
import { rybbitConfig } from "../../runtime-config";

export const analytics = createAnalytics(rybbitConfig, {
  // Access storage lazily: merely retrieving window.localStorage may throw.
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  },
  now: Date.now,
  loadScript: (src, siteId) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.dataset.siteId = siteId;
    document.head.append(script);
  },
  reload: () => window.location.reload(),
  rybbit: () => (window as Window & { rybbit?: RybbitApi }).rybbit,
});

// Load the script right away if consent from an earlier visit is still valid.
analytics.sync();

window.addEventListener("storage", (event) => {
  if (event.key === CHOICE_KEY || event.key === null) analytics.sync(true);
});
window.addEventListener("focus", () => analytics.sync());
// Notice expired consent even if the page stays open.
setInterval(() => analytics.sync(), 60_000);
