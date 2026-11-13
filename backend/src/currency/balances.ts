import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { Currency } from "../generated/prisma/enums.js";
import { amount, ZERO, type Amount } from "../shared/index.js";

// A missing row is a zero balance; the first change creates it. Changes lock the row
// (SELECT ... FOR UPDATE) for the rest of their transaction, so concurrent changes to the same
// balance queue up instead of overwriting each other.

type Db = typeof prisma | Prisma.TransactionClient;

const toAmount = (row: { digits: bigint; zeros: number }) => amount(row.digits, Number(row.zeros));

export async function getBalance(userId: string, currency: Currency, db: Db = prisma) {
  const row = await db.currencyBalance.findUnique({
    where: { userId_currency: { userId, currency } },
  });
  return row ? toAmount(row) : ZERO;
}

export async function getBalances(userId: string, db: Db = prisma) {
  const balances = Object.fromEntries(Object.values(Currency).map((c) => [c, ZERO])) as Record<
    Currency,
    Amount
  >;
  for (const row of await db.currencyBalance.findMany({ where: { userId } })) {
    balances[row.currency] = toAmount(row);
  }
  return balances;
}

async function lockedChange(
  tx: Prisma.TransactionClient,
  userId: string,
  currency: Currency,
  change: (current: Amount) => Amount,
) {
  // Creates the row if missing and takes its exclusive lock right away. INSERT IGNORE would take a
  // shared lock on an existing row, and upgrading it in FOR UPDATE deadlocks concurrent changes.
  await tx.$executeRaw`INSERT INTO currency_balance (userId, currency, digits, zeros)
    VALUES (${userId}, ${currency}, 0, 0) ON DUPLICATE KEY UPDATE digits = digits`;
  const [row] = await tx.$queryRaw<{ digits: bigint; zeros: number }[]>`
    SELECT digits, zeros FROM currency_balance
    WHERE userId = ${userId} AND currency = ${currency} FOR UPDATE`;
  if (!row) throw new Error(`Balance row ${userId}/${currency} vanished`); // e.g. user deleted
  const next = change(toAmount(row));
  await tx.currencyBalance.update({
    where: { userId_currency: { userId, currency } },
    data: { digits: next.digits, zeros: next.zeros },
  });
  return next;
}

/**
 * Stores `change(current)` as the new balance and returns it. Errors thrown by `change`, such as
 * InsufficientFundsError from `subtract`, abort the change. Pass `tx` to make the change part of a
 * larger transaction (e.g. paying for an upgrade and raising its level together).
 */
export async function changeBalance(
  userId: string,
  currency: Currency,
  change: (current: Amount) => Amount,
  tx?: Prisma.TransactionClient,
): Promise<Amount> {
  if (tx) return lockedChange(tx, userId, currency, change);
  return prisma.$transaction((t) => lockedChange(t, userId, currency, change));
}
