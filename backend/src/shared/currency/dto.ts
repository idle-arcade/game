import { z } from "zod";
import { amount, MAX_DIGITS, type Amount } from "./amount.js";

/** Far beyond any balance the game can reach; keeps client-sent amounts cheap to handle. */
export const MAX_DTO_ZEROS = 1_000_000;

// JSON has no bigint.
export const amountDtoSchema = z.object({
  digits: z.string().regex(/^\d+$/).max(MAX_DIGITS),
  zeros: z.int().nonnegative().max(MAX_DTO_ZEROS),
});

export type AmountDto = z.infer<typeof amountDtoSchema>;

export const toAmountDto = (a: Amount): AmountDto => ({
  digits: a.digits.toString(),
  zeros: a.zeros,
});

export const fromAmountDto = (d: AmountDto): Amount => amount(d.digits, d.zeros);
