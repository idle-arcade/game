export type AnalyticsChoice = "unset" | "accepted" | "rejected";
export const CHOICE_KEY = "idle-arcade.analytics.v1";
export const CHOICE_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

type Config = { enabled: boolean; endpoint: string; siteId: string };
export type RybbitApi = { event: (name: string, properties?: Record<string, string>) => void };
type Dependencies = {
  storage: Pick<Storage, "getItem" | "setItem" | "removeItem">;
  now: () => number;
  loadScript: (src: string, siteId: string) => void;
  reload: () => void;
  rybbit: () => RybbitApi | undefined;
};

// Keys the Rybbit script may store after consent (older versions always store the visitor ID).
const RYBBIT_KEYS = ["rybbit-visitor-id", "rybbit-user-id"];

const ONBOARDING_OUTCOMES = ["completed", "skipped"] as const;
export type OnboardingOutcome = (typeof ONBOARDING_OUTCOMES)[number];

const ONBOARDING_STEPS = ["welcome", "darts", "progression"] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

const AUTH_ACTIONS = ["login", "register"] as const;
export type AuthAction = (typeof AUTH_ACTIONS)[number];

const AUTH_FAILURE_REASONS = [
  "validation_failed",
  "invalid_credentials",
  "username_taken",
  "rate_limited",
  "invalid_input",
  "server_error",
  "request_failed",
  "unknown",
] as const;
export type AuthFailureReason = (typeof AUTH_FAILURE_REASONS)[number];

const VALIDATION_REASONS = ["required", "too_short", "too_long", "invalid_format"] as const;
export type AuthValidationReason = (typeof VALIDATION_REASONS)[number];

/** Accepts the API base (https://host/api) or, for older settings, its /track endpoint. */
function scriptUrl(endpoint: string) {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash)
      return "";
    return `${url.origin}${url.pathname.replace(/\/track\/?$/, "").replace(/\/$/, "")}/script.js`;
  } catch {
    // Missing or invalid configuration disables analytics without affecting the game.
    return "";
  }
}

export function createAnalytics(config: Config, dependencies: Dependencies) {
  const listeners = new Set<() => void>();
  let memoryChoice: { choice: AnalyticsChoice; expires: number } | undefined;
  let loaded = false;
  const src = scriptUrl(config.endpoint);
  const available = config.enabled && !!src && /^[a-zA-Z0-9_-]+$/.test(config.siteId);

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

  function sync(fromStorage = false) {
    if (fromStorage) memoryChoice = undefined;
    if (getChoice() === "accepted") {
      // The script tracks the current page on load and later route changes by itself.
      if (available && !loaded) {
        loaded = true;
        dependencies.loadScript(src, config.siteId);
      }
    } else {
      // Also clears what an earlier consent left behind, e.g. after it expired.
      for (const key of RYBBIT_KEYS) {
        try {
          dependencies.storage.removeItem(key);
        } catch {
          // Nothing to remove if browser storage is blocked.
        }
      }
      if (loaded) {
        // A loaded script can't be stopped; reloading is the only reliable way to end tracking.
        dependencies.reload();
        return;
      }
    }
    for (const listener of listeners) listener();
  }

  function choose(choice: "accepted" | "rejected") {
    memoryChoice = { choice, expires: dependencies.now() + CHOICE_MAX_AGE };
    try {
      dependencies.storage.setItem(CHOICE_KEY, JSON.stringify(memoryChoice));
    } catch {
      // The choice remains effective in this tab if browser storage is blocked.
    }
    sync();
  }

  function sendEvent(name: string, properties?: Record<string, string>) {
    if (!available || !loaded || getChoice() !== "accepted") return;
    try {
      dependencies.rybbit()?.event(name, properties);
    } catch {
      // Analytics failures must not interrupt authentication or gameplay.
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
    authSuccess(action: AuthAction) {
      if (!AUTH_ACTIONS.includes(action)) return;
      sendEvent(action);
    },
    authFailure(
      action: AuthAction,
      reason: AuthFailureReason,
      validation?: { username?: AuthValidationReason; password?: AuthValidationReason },
    ) {
      if (!AUTH_ACTIONS.includes(action) || !AUTH_FAILURE_REASONS.includes(reason)) return;
      const properties: Record<string, string> = { reason };
      if (reason === "validation_failed") {
        if (validation?.username && VALIDATION_REASONS.includes(validation.username)) {
          properties.username_error = validation.username;
        }
        if (validation?.password && VALIDATION_REASONS.includes(validation.password)) {
          properties.password_error = validation.password;
        }
      }
      sendEvent(`${action}_failed`, properties);
    },
    onboarding(outcome: OnboardingOutcome, step: OnboardingStep) {
      // Runtime checks also protect callers outside TypeScript.
      if (!loaded || !ONBOARDING_OUTCOMES.includes(outcome) || !ONBOARDING_STEPS.includes(step))
        return;
      sendEvent(`onboarding_${outcome}`, { step });
    },
  };
}
