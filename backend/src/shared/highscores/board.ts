import { compare, isZero, type Amount } from "../currency/amount.js";
import { formatAmount } from "../currency/format.js";
import { HIGHSCORE_TOP_SIZE } from "./rooms.js";

export type BoardEntry = { userId: string; name: string; amount: Amount };

export type BoardRow = BoardEntry & { rank: number; formatted: string; own: boolean };

// The database orders user ids with the case-insensitive utf8mb4_unicode_ci collation of
// currency_balance.userId; for the alphanumeric ids Better Auth generates, comparing lowercased
// ids gives the same order.
const idKey = (userId: string) => userId.toLowerCase();

/** Highest score first; equal scores by user id ascending, like the server's ranking. */
const byRank = (a: BoardEntry, b: BoardEntry) => {
  const ka = idKey(a.userId);
  const kb = idKey(b.userId);
  return compare(b.amount, a.amount) || (ka < kb ? -1 : ka > kb ? 1 : 0);
};

/**
 * Merges the player's own live score into the server's top list. The own entry replaces the
 * player's (older) server row and is ranked against the listed players right away; ranks in the
 * list are positions. Only the top list is known, so a full list admits the player only at or
 * above its last entry: below that, an unseen player may be ahead. Outside the list, `ownBelow`
 * carries the server rank, at least the first rank below the list (live spending can drop a
 * listed player out of it). Zero scores get no row.
 */
export function buildBoard(
  top: BoardEntry[],
  own: (BoardEntry & { serverRank: number | null }) | null,
): { rows: BoardRow[]; ownBelow: BoardRow | null } {
  const ownId = own?.userId;
  const entries = top.filter((e) => e.userId !== ownId);
  const last = top.at(-1);
  const qualifies =
    own !== null &&
    !isZero(own.amount) &&
    (top.length < HIGHSCORE_TOP_SIZE ||
      !last ||
      (last.userId === ownId ? compare(own.amount, last.amount) >= 0 : byRank(own, last) < 0));
  if (qualifies) entries.push(own);
  const listed = entries.sort(byRank).slice(0, HIGHSCORE_TOP_SIZE);

  const row = (e: BoardEntry, rank: number): BoardRow => ({
    userId: e.userId,
    name: e.name,
    amount: e.amount,
    rank,
    formatted: formatAmount(e.amount),
    own: e.userId === ownId,
  });
  const rows = listed.map((e, i) => row(e, i + 1));

  const below = HIGHSCORE_TOP_SIZE + 1;
  const ownBelow =
    own && !isZero(own.amount) && !rows.some((r) => r.own)
      ? row(own, Math.max(own.serverRank ?? below, below))
      : null;
  return { rows, ownBelow };
}
