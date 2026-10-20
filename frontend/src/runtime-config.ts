type RybbitConfig = { enabled: boolean; endpoint: string; siteId: string };

export let rybbitConfig: RybbitConfig = { enabled: false, endpoint: "", siteId: "" };

export async function loadRuntimeConfig() {
  try {
    const response = await fetch("/runtime-config.json", {
      cache: "no-store",
      credentials: "omit",
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) return;
    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || !("rybbit" in value)) return;
    const config = value.rybbit;
    if (
      config &&
      typeof config === "object" &&
      "enabled" in config &&
      typeof config.enabled === "boolean" &&
      "endpoint" in config &&
      typeof config.endpoint === "string" &&
      "siteId" in config &&
      typeof config.siteId === "string"
    ) {
      rybbitConfig = { enabled: config.enabled, endpoint: config.endpoint, siteId: config.siteId };
    }
  } catch {
    // Missing, unavailable or malformed configuration must not prevent playing.
  }
}
