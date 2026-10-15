import { TRPCError } from "@trpc/server";
import { middleware } from "./init.js";

type RateLimitOptions = {
  /** Length of the counting window in milliseconds. */
  windowMs: number;
  /** Requests allowed per client within one window. */
  max: number;
};

type Window = { count: number; resetAt: number };

/**
 * Fixed-window rate limit per client IP, as tRPC middleware.
 *
 * We call Better Auth through `auth.api.*`, which bypasses its built-in rate limiter, so auth
 * procedures use this instead. State is in memory: fine for a single backend instance; use a
 * shared store (e.g. the database) if the backend is ever scaled out.
 */
export function rateLimit({ windowMs, max }: RateLimitOptions) {
  const windows = new Map<string, Window>();

  return middleware(({ ctx, next }) => {
    const now = Date.now();
    if (windows.size > 10_000) {
      for (const [key, window] of windows) if (window.resetAt <= now) windows.delete(key);
    }

    // req.ip honours X-Forwarded-For from the one trusted proxy (Vite dev proxy / nginx).
    const key = ctx.req.ip ?? "unknown";
    let window = windows.get(key);
    if (!window || window.resetAt <= now) {
      window = { count: 0, resetAt: now + windowMs };
      windows.set(key, window);
    }
    window.count++;

    if (window.count > max) {
      const retryAfter = Math.ceil((window.resetAt - now) / 1000);
      ctx.res.setHeader("Retry-After", String(retryAfter));
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: `Too many attempts. Try again in ${retryAfter} seconds.`,
      });
    }
    return next();
  });
}
