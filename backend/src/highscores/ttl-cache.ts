// In-memory cache whose entries are reloaded on request once they are older than `ttlMs`; nothing
// refreshes in the background. Callers that arrive during a load share it. Failed loads are not
// cached, so the next request tries again. State lives in this process: fine for a single backend
// instance (see trpc/rate-limit.ts); use a shared store if the backend is ever scaled out.

export type CacheSource = "hit" | "miss" | "joined";

type Loaded<V> = { value: V; loadedAt: number };

export function createTtlCache<K, V>(opts: {
  ttlMs: number;
  load: (key: K) => Promise<V>;
  now?: () => number;
}) {
  const now = opts.now ?? Date.now;
  const loaded = new Map<K, Loaded<V>>();
  const pending = new Map<K, Promise<Loaded<V>>>();

  return {
    async get(key: K): Promise<Loaded<V> & { source: CacheSource }> {
      const entry = loaded.get(key);
      if (entry && now() - entry.loadedAt < opts.ttlMs) return { ...entry, source: "hit" };

      const running = pending.get(key);
      if (running) return { ...(await running), source: "joined" };

      const loadedAt = now();
      const promise = opts
        .load(key)
        .then((value) => {
          const next = { value, loadedAt };
          loaded.set(key, next);
          return next;
        })
        .finally(() => pending.delete(key));
      pending.set(key, promise);
      return { ...(await promise), source: "miss" };
    },
  };
}
