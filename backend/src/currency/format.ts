// Shared with the frontend: keep this module free of server-only imports.
//
// Display format: 1-3 integer digits plus up to 2 truncated fractional digits without trailing
// zeros, and a suffix per factor of 1,000: "", k, M, B, T, then AA..ZZ, AAA..ZZZ, and so on.
// Examples: 1, 100, 1k, 1.1k, 123.24k, 999.99k, 1M. Only bigint math is used.

import { isZero, type Amount } from "./amount.js";

const NAMED_SUFFIXES = ["", "k", "M", "B", "T"];
const LETTERS = 26n;
const A_CODE = "A".charCodeAt(0);

/** Suffix for 1000^group. */
export function suffix(group: bigint): string {
  if (group < BigInt(NAMED_SUFFIXES.length)) return NAMED_SUFFIXES[Number(group)]!;
  // Letter sequences in length-first, alphabetical order, starting at length 2.
  let index = group - BigInt(NAMED_SUFFIXES.length);
  let length = 2n;
  while (index >= LETTERS ** length) {
    index -= LETTERS ** length;
    length += 1n;
  }
  let letters = "";
  for (let i = 0n; i < length; i++) {
    letters = String.fromCharCode(A_CODE + Number(index % LETTERS)) + letters;
    index /= LETTERS;
  }
  return letters;
}

export function formatAmount(a: Amount): string {
  if (isZero(a)) return "0";
  const top = BigInt(a.zeros) + BigInt(a.digits.toString().length) - 1n;
  const group = top / 3n;
  if (group === 0n) return (a.digits * 10n ** BigInt(a.zeros)).toString();

  // The value truncated to two digits below the group's unit, e.g. 123_240 -> 12_324.
  const shift = BigInt(a.zeros) - (group * 3n - 2n);
  const scaled = shift >= 0n ? a.digits * 10n ** shift : a.digits / 10n ** -shift;
  const fraction = (scaled % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return `${scaled / 100n}${fraction ? `.${fraction}` : ""}${suffix(group)}`;
}
