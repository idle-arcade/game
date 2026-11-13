import { z } from "zod";
import { amount, type Amount } from "./amount.js";

// JSON has no bigint.
export const amountDtoSchema = z.object({
  digits: z.string().regex(/^\d+$/),
  zeros: z.int().nonnegative(),
});

export type AmountDto = z.infer<typeof amountDtoSchema>;

export const toAmountDto = (a: Amount): AmountDto => ({
  digits: a.digits.toString(),
  zeros: a.zeros,
});

export const fromAmountDto = (d: AmountDto): Amount => amount(d.digits, d.zeros);
