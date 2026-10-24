import { CHOICE_KEY, createAnalytics, type RybbitApi } from "./client";
import i18n, { type Language } from "../../i18n";
import { rybbitConfig } from "../../runtime-config";

const currentLanguage = () => (i18n.resolvedLanguage ?? "en") as Language;

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
    // Runs once per page load, also when consent is given later in the session.
    script.addEventListener("load", () => analytics.appLoaded(currentLanguage()));
    document.head.append(script);
  },
  reload: () => window.location.reload(),
  rybbit: () => (window as Window & { rybbit?: RybbitApi }).rybbit,
});

// Load the script right away if consent from an earlier visit is still valid.
analytics.sync();

let language = currentLanguage();
i18n.on("languageChanged", () => {
  const previous = language;
  language = currentLanguage();
  if (language !== previous) analytics.languageChanged(previous, language);
});

window.addEventListener("storage", (event) => {
  if (event.key === CHOICE_KEY || event.key === null) analytics.sync(true);
});
