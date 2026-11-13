import { z } from "zod";
import { getBalance } from "../currency/balances.js";
import { Currency } from "../generated/prisma/enums.js";
import { formatAmount, toAmountDto, type Amount } from "../shared/index.js";
import { protectedProcedure, router } from "../trpc/init.js";

/**
 * Balance as sent to clients. `digits` is a string because JSON has no bigint; `formatted` is ready
 * to display, and the raw amount lets clients apply optimistic changes with the shared helpers.
 */
export const toBalanceDto = (currency: Currency, amount: Amount) => ({
  currency,
  amount: toAmountDto(amount),
  formatted: formatAmount(amount),
});

export const currencyRouter = router({
  balance: protectedProcedure
    .input(z.object({ currency: z.enum(Currency) }))
    .query(async ({ ctx, input }) =>
      toBalanceDto(input.currency, await getBalance(ctx.user.id, input.currency)),
    ),
});
