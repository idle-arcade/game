import { getBalance } from "../currency/balances.js";
import { prisma } from "../db.js";
import type { Currency } from "../generated/prisma/enums.js";
import {
  amount,
  formatAmount,
  HIGHSCORE_TOP_SIZE,
  isZero,
  rankKey,
  ROOM_CURRENCY,
  toAmountDto,
  type Amount,
  type AmountDto,
  type HighscoreRoom,
} from "../shared/index.js";

// Rankings read the ranking key that changeBalance stores next to each balance, through the index
// (currency, magnitude DESC, mantissa DESC, userId). Score = current balance; zero balances are not
// ranked. Equal scores rank by user id ascending.

/** How long a room's top list is served from memory before the next request reloads it. */
export const HIGHSCORE_CACHE_TTL_MS = 8000;

// Fails to compile if the shared room map names a currency the database doesn't know.
export const roomCurrency = (room: HighscoreRoom): Currency =>
  (ROOM_CURRENCY satisfies Record<HighscoreRoom, Currency>)[room];

export type HighscoreEntry = {
  rank: number;
  userId: string;
  name: string;
  amount: AmountDto;
  formatted: string;
};

/** The top list straight from the database; use the cache in the router for requests. */
export async function loadTop(currency: Currency): Promise<HighscoreEntry[]> {
  const rows = await prisma.currencyBalance.findMany({
    where: { currency, mantissa: { gt: 0 } },
    orderBy: [{ magnitude: "desc" }, { mantissa: "desc" }, { userId: "asc" }],
    take: HIGHSCORE_TOP_SIZE,
    select: { userId: true, digits: true, zeros: true, user: { select: { name: true } } },
  });
  return rows.map((row, i) => {
    const value = amount(row.digits, row.zeros);
    return {
      rank: i + 1,
      userId: row.userId,
      name: row.user.name,
      amount: toAmountDto(value),
      formatted: formatAmount(value),
    };
  });
}

/** The player's stored balance and rank (1-based), or rank null while the balance is zero. */
export async function getOwnRank(
  userId: string,
  currency: Currency,
): Promise<{ rank: number | null; amount: Amount }> {
  const balance = await getBalance(userId, currency);
  if (isZero(balance)) return { rank: null, amount: balance };
  const { magnitude, mantissa } = rankKey(balance);
  const ahead = await prisma.currencyBalance.count({
    where: {
      currency,
      mantissa: { gt: 0 },
      OR: [
        { magnitude: { gt: magnitude } },
        { magnitude, mantissa: { gt: mantissa } },
        { magnitude, mantissa, userId: { lt: userId } },
      ],
    },
  });
  return { rank: ahead + 1, amount: balance };
}
