import { add, compare, subtract, ZERO, type Amount } from "@idle-arcade/backend/shared";

export const BUY_AMOUNTS = [1, 10, 100, "max"] as const;
export type BuyAmount = (typeof BUY_AMOUNTS)[number];

/** Upper bound for "max", so a huge balance can't stall the page. */
const MAX_BULK = 1000;

export type Quote = { count: number; total: Amount; affordable: boolean };

/**
 * Price of the next purchases of one item. `costAt(i)` is the price of the i-th next one, or null
 * when there is none (max level). A fixed amount is capped at the levels left; "max" buys as many
 * as the balance allows and quotes a single one when none is affordable. Null: nothing to buy.
 *
 * Affordability pays the costs one by one, as the purchases do: each subtraction truncates the
 * balance, so comparing it with the summed costs can promise one purchase too many.
 */
export function quote(
  costAt: (i: number) => Amount | null,
  amount: BuyAmount,
  balance: Amount,
): Quote | null {
  const limit = amount === "max" ? MAX_BULK : amount;
  let count = 0;
  let total = ZERO;
  // Balance left after the purchases so far; null once one of them isn't affordable.
  let left: Amount | null = balance;
  for (; count < limit; count++) {
    const cost = costAt(count);
    if (!cost) break;
    const after: Amount | null = left && compare(left, cost) >= 0 ? subtract(left, cost) : null;
    if (amount === "max" && !after) break;
    left = after;
    total = add(total, cost);
  }
  if (count === 0) {
    const first = costAt(0);
    return first ? { count: 1, total: first, affordable: false } : null;
  }
  return { count, total, affordable: left !== null };
}
