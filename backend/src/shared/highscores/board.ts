import { compare, isZero, type Amount } from "../currency/amount.js";
import { formatAmount } from "../currency/format.js";
import { HIGHSCORE_TOP_SIZE } from "./rooms.js";

export type BoardEntry = { userId: string; name: string; amount: Amount };

export type BoardRow = BoardEntry & { rank: number; formatted: string; own: boolean };

type OwnEntry = BoardEntry & { serverRank: number | null };

const FIRST_RANK_BELOW = HIGHSCORE_TOP_SIZE + 1;

const idKey = (userId: string) => userId.toLowerCase();

/** Highest score first; equal scores by user id ascending, like the server's ranking. */
const byRank = (a: BoardEntry, b: BoardEntry) => {
  const ka = idKey(a.userId);
  const kb = idKey(b.userId);
  return compare(b.amount, a.amount) || (ka < kb ? -1 : ka > kb ? 1 : 0);
};

/** A full list admits the player only at or above its last entry; unseen players may be ahead. */
function fitsInTop(top: BoardEntry[], own: OwnEntry): boolean {
  const last = top.at(-1);
  if (!last || top.length < HIGHSCORE_TOP_SIZE) return true;
  if (last.userId === own.userId) return compare(own.amount, last.amount) >= 0;
  return byRank(own, last) < 0;
}

/** Outside the list, the rank is at least the first one below it. */
const rankBelow = (serverRank: number | null) =>
  Math.max(serverRank ?? FIRST_RANK_BELOW, FIRST_RANK_BELOW);

function toRow(entry: BoardEntry, rank: number, ownId: string | undefined): BoardRow {
  return {
    userId: entry.userId,
    name: entry.name,
    amount: entry.amount,
    rank,
    formatted: formatAmount(entry.amount),
    own: entry.userId === ownId,
  };
}

/** Ranks the player's live score against the server's top list; zero scores get no row. */
export function buildBoard(
  top: BoardEntry[],
  own: OwnEntry | null,
): { rows: BoardRow[]; ownBelow: BoardRow | null } {
  const ownId = own?.userId;
  const ranked = own && !isZero(own.amount) ? own : null;
  const listed = ranked !== null && fitsInTop(top, ranked);

  const entries = top.filter((e) => e.userId !== ownId);
  if (listed) entries.push(ranked);
  const rows = entries
    .sort(byRank)
    .slice(0, HIGHSCORE_TOP_SIZE)
    .map((e, i) => toRow(e, i + 1, ownId));

  const ownBelow = ranked && !listed ? toRow(ranked, rankBelow(ranked.serverRank), ownId) : null;
  return { rows, ownBelow };
}
