import { useQuery } from "@tanstack/react-query";
import {
  buildBoard,
  fromAmountDto,
  type BoardRow,
  type HighscoreRoom,
} from "@idle-arcade/backend/shared";
import { trpc } from "../../lib/trpc";
import { useCurrentUser } from "../auth/useCurrentUser";
import { useLiveBalance } from "./liveBalance";

/** How often an open highscores dropdown refreshes. The server caches top lists for 8 s. */
export const HIGHSCORES_POLL_MS = 10_000;

export type Highscores = {
  status: "loading" | "error" | "ready";
  rows: BoardRow[];
  ownBelow: BoardRow | null;
  /** The last refresh failed; the rows shown are older. */
  stale: boolean;
  refreshing: boolean;
  retry: () => void;
};

/**
 * The room's leaderboard while `open`: fetched on open and every HIGHSCORES_POLL_MS while the
 * document is visible, refetched when it becomes visible again. The player's own row uses the
 * room's live balance when its game is running. Queries are keyed by room, and logout clears the
 * query cache, so no other room's or account's rows can show.
 */
export function useHighscores(room: HighscoreRoom, open: boolean): Highscores {
  const user = useCurrentUser();
  const live = useLiveBalance(room);
  const options = {
    enabled: open,
    staleTime: 0,
    refetchInterval: open ? HIGHSCORES_POLL_MS : (false as const),
    refetchIntervalInBackground: false,
  };
  const top = useQuery(trpc.highscores.top.queryOptions({ room }, options));
  const me = useQuery(trpc.highscores.me.queryOptions({ room }, options));

  const retry = () => {
    void top.refetch();
    void me.refetch();
  };

  if (!top.data) {
    return {
      status: top.isError ? "error" : "loading",
      rows: [],
      ownBelow: null,
      stale: false,
      refreshing: false,
      retry,
    };
  }

  const entries = top.data.entries.map((e) => ({
    userId: e.userId,
    name: e.name,
    amount: fromAmountDto(e.amount),
  }));
  // Until `me` answers, a listed player is still recognized by their top-list row.
  const listedIndex = user ? entries.findIndex((e) => e.userId === user.id) : -1;
  const stored = me.data ? fromAmountDto(me.data.amount) : entries[listedIndex]?.amount;
  const own =
    user && (live ?? stored)
      ? {
          userId: user.id,
          name: user.username,
          amount: (live ?? stored)!,
          serverRank: me.data ? me.data.rank : listedIndex >= 0 ? listedIndex + 1 : null,
        }
      : null;
  const board = buildBoard(entries, own);

  return {
    status: "ready",
    ...board,
    stale: top.isError || me.isError,
    refreshing: top.isFetching || me.isFetching,
    retry,
  };
}
