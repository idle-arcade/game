export type AnalyticsChoice = "unset" | "accepted" | "rejected";
export const CHOICE_KEY = "idle-arcade.analytics.v1";
export const CHOICE_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

type Config = { enabled: boolean; endpoint: string; siteId: string };
type Dependencies = {
  storage: Pick<Storage, "getItem" | "setItem">;
  fetch: typeof fetch;
  hostname: string;
  now: () => number;
};

// Deliberately allow only public routes and fixed events, never arbitrary URLs or properties.
const PATHS = new Set(["/", "/darts"]);
export type OnboardingOutcome = "completed" | "skipped";
export type OnboardingStep = "welcome" | "darts" | "progression";

export function createAnalytics(config: Config, dependencies: Dependencies) {
  const listeners = new Set<() => void>();
  const pending = new Set<AbortController>();
  let lastPath: string | undefined;
  let memoryChoice: { choice: AnalyticsChoice; expires: number } | undefined;
  let endpoint = "";
  try {
    const url = new URL(config.endpoint);
    if (url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash) {
      endpoint = url.href;
    }
  } catch {
    // Missing or invalid configuration disables analytics without affecting the game.
  }
  const available = config.enabled && !!endpoint && /^[a-zA-Z0-9_-]+$/.test(config.siteId);

  function getChoice(): AnalyticsChoice {
    if (memoryChoice)
      return memoryChoice.expires > dependencies.now() ? memoryChoice.choice : "unset";
    try {
      const stored: unknown = JSON.parse(dependencies.storage.getItem(CHOICE_KEY) ?? "null");
      if (stored && typeof stored === "object" && "choice" in stored && "expires" in stored) {
        const { choice, expires } = stored;
        if (
          (choice === "accepted" || choice === "rejected") &&
          typeof expires === "number" &&
          expires > dependencies.now() &&
          expires <= dependencies.now() + CHOICE_MAX_AGE
        )
          return choice;
      }
      return "unset";
    } catch {
      return "unset";
    }
  }

  function stop() {
    for (const controller of pending) controller.abort();
    pending.clear();
    lastPath = undefined;
  }

  function sync(fromStorage = false) {
    if (fromStorage) memoryChoice = undefined;
    if (getChoice() !== "accepted") stop();
    for (const listener of listeners) listener();
  }

  function choose(choice: "accepted" | "rejected") {
    if (getChoice() !== "accepted") lastPath = undefined;
    memoryChoice = { choice, expires: dependencies.now() + CHOICE_MAX_AGE };
    try {
      dependencies.storage.setItem(CHOICE_KEY, JSON.stringify(memoryChoice));
    } catch {
      // The choice remains effective in this tab if browser storage is blocked.
    }
    sync();
  }

  function send(pathname: string, extra: Record<string, string>) {
    if (!available || getChoice() !== "accepted" || !PATHS.has(pathname)) return;
    const controller = new AbortController();
    pending.add(controller);
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      void dependencies
        .fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "omit",
          referrerPolicy: "no-referrer",
          signal: controller.signal,
          body: JSON.stringify({
            site_id: config.siteId,
            hostname: dependencies.hostname,
            pathname,
            ...extra,
          }),
        })
        .catch(() => undefined)
        .finally(() => {
          clearTimeout(timeout);
          pending.delete(controller);
        });
    } catch {
      clearTimeout(timeout);
      pending.delete(controller);
    }
  }

  return {
    available,
    getChoice,
    choose,
    sync,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    pageview(pathname: string) {
      if (!available || getChoice() !== "accepted" || !PATHS.has(pathname) || pathname === lastPath)
        return;
      lastPath = pathname;
      send(pathname, { type: "pageview" });
    },
    onboarding(outcome: OnboardingOutcome, step: OnboardingStep) {
      // Runtime checks also protect callers outside TypeScript.
      if (
        !["completed", "skipped"].includes(outcome) ||
        !["welcome", "darts", "progression"].includes(step)
      )
        return;
      send("/darts", {
        type: "custom_event",
        event_name: `onboarding_${outcome}`,
        properties: JSON.stringify({ step }),
      });
    },
  };
}
