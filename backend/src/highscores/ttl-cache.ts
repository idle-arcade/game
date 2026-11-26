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
