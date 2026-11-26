import { useEffect, useSyncExternalStore } from "react";
import type { Amount, HighscoreRoom } from "@idle-arcade/backend/shared";

// The live (locally simulated) balance of each room whose game is open, so the highscores
// dropdown can rank the player by it before the next sync. Display only; the server stays the
// authority for balances and ranks.

const balances = new Map<HighscoreRoom, Amount>();
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(room: HighscoreRoom, balance: Amount | null) {
  if (balance === null) balances.delete(room);
  else balances.set(room, balance);
  for (const listener of listeners) listener();
}

/** Shares a room's live balance while the calling component is mounted; null while unknown. */
export function usePublishLiveBalance(room: HighscoreRoom, balance: Amount | null) {
  useEffect(() => {
    publish(room, balance);
  }, [room, balance]);
  useEffect(() => () => publish(room, null), [room]);
}

/** The room's live balance, or null when its game isn't running. */
export function useLiveBalance(room: HighscoreRoom): Amount | null {
  return useSyncExternalStore(subscribe, () => balances.get(room) ?? null);
}
