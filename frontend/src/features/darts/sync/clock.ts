export type GameClock = () => number;

/** Server time plus a monotonic local delta, so changing the system clock has no effect. */
export function createGameClock(serverNow: number): GameClock {
  const anchor = performance.now();
  return () => serverNow + Math.floor(performance.now() - anchor);
}
