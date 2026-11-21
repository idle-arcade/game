import { amount, formatAmount, type Ratio } from "@idle-arcade/backend/shared";

/** A fraction like a rate: up to 2 truncated decimals below 1,000, else the amount format. */
export function formatRatio({ num, den }: Ratio): string {
  const whole = num / den;
  if (whole >= 1000n) return formatAmount(amount(whole));
  const hundredths = ((num * 100n) / den) % 100n;
  const fraction = hundredths.toString().padStart(2, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

/** A share as a truncated whole percentage, e.g. 1/3 -> "33". */
export const formatPercent = ({ num, den }: Ratio) => ((num * 100n) / den).toString();
