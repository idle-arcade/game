import { CHOICE_KEY, createAnalytics } from "./client";
import { rybbitConfig } from "../../runtime-config";

export const analytics = createAnalytics(rybbitConfig, {
  // Access storage lazily: merely retrieving window.localStorage may throw.
  storage: {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  },
  fetch: (...args) => window.fetch(...args),
  hostname: window.location.hostname,
  now: Date.now,
});

window.addEventListener("storage", (event) => {
  if (event.key === CHOICE_KEY || event.key === null) analytics.sync(true);
});
window.addEventListener("focus", () => analytics.sync());
