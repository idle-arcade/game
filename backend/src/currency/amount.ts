// Shared with the frontend: keep this module free of server-only imports.
//
// A currency amount is `digits * 10^zeros` with at most MAX_DIGITS significant digits. All math is
// done on bigint; amounts never pass through a floating-point number.
//
// Normalized form: `digits` has no trailing zeros (they move into `zeros`), and zero is always
// `{ digits: 0n, zeros: 0 }`. Results with more than MAX_DIGITS significant digits are truncated
// (never rounded up), e.g. 12_345_678_919 -> { digits: 1_234_567_891n, zeros: 1 } = 12_345_678_910.
// The same truncation applies to an exact subtraction result, so spending an amount below the
// balance's precision still removes one unit of its last kept digit: 10^20 - 1 -> 9_999_999_999e10.

export const MAX_DIGITS = 10;

export type Amount = { readonly digits: bigint; readonly zeros: number };

export const ZERO: Amount = Object.freeze({ digits: 0n, zeros: 0 });

export class InsufficientFundsError extends Error {
  constructor() {
    super("Insufficient funds");
    this.name = "InsufficientFundsError";
  }
}

const pow10 = (n: number) => 10n ** BigInt(n);
const digitCount = (digits: bigint) => digits.toString().length;

/** Exponent of the most significant digit; only meaningful for non-zero amounts. */
const topExponent = (a: Amount) => a.zeros + digitCount(a.digits) - 1;

/** Builds a normalized amount from any non-negative integer `digits` and `zeros`. */
export function amount(digits: bigint | number | string, zeros = 0): Amount {
  if (!Number.isSafeInteger(zeros) || zeros < 0) {
    throw new RangeError(`zeros must be a non-negative safe integer, got ${zeros}`);
  }
  if (typeof digits === "number" && !Number.isSafeInteger(digits)) {
    throw new RangeError(`digits must be a safe integer, got ${digits}`);
  }
  if (typeof digits === "string" && !/^\d+$/.test(digits)) {
    throw new RangeError(`digits must be a decimal integer string, got "${digits}"`);
  }
  let d = BigInt(digits);
  if (d < 0n) throw new RangeError(`digits must be non-negative, got ${d}`);
  if (d === 0n) return ZERO;

  let z = zeros;
  const excess = digitCount(d) - MAX_DIGITS;
  if (excess > 0) {
    d /= pow10(excess); // bigint division truncates
    z += excess;
  }
  while (d % 10n === 0n) {
    d /= 10n;
    z += 1;
  }
  if (!Number.isSafeInteger(z)) throw new RangeError("Amount exponent out of range");
  return Object.freeze({ digits: d, zeros: z });
}

export const isZero = (a: Amount) => a.digits === 0n;

/** Returns -1, 0 or 1. Both amounts must be normalized. */
export function compare(a: Amount, b: Amount): -1 | 0 | 1 {
  if (isZero(a) || isZero(b)) return isZero(a) ? (isZero(b) ? 0 : -1) : 1;
  const ta = topExponent(a);
  const tb = topExponent(b);
  if (ta !== tb) return ta < tb ? -1 : 1;
  // Same magnitude: the exponents now differ by fewer than MAX_DIGITS, so aligning is cheap.
  const low = Math.min(a.zeros, b.zeros);
  const da = a.digits * pow10(a.zeros - low);
  const db = b.digits * pow10(b.zeros - low);
  return da === db ? 0 : da < db ? -1 : 1;
}

/**
 * Any positive amount below the last digit `big` can keep yields the same truncated sum or
 * difference, so swap such a tiny amount for a stand-in just below that digit. This keeps the
 * alignment shift at most MAX_DIGITS digits, however far apart the exponents are.
 */
function clampBelowPrecision(big: Amount, small: Amount): Amount {
  const lowestKept = topExponent(big) - (MAX_DIGITS - 1);
  return topExponent(small) < lowestKept ? { digits: 1n, zeros: lowestKept - 1 } : small;
}

function combine(big: Amount, small: Amount, sign: 1n | -1n): Amount {
  const s = clampBelowPrecision(big, small);
  const low = Math.min(big.zeros, s.zeros);
  return amount(big.digits * pow10(big.zeros - low) + sign * s.digits * pow10(s.zeros - low), low);
}

export function add(a: Amount, b: Amount): Amount {
  if (isZero(a)) return b;
  if (isZero(b)) return a;
  return compare(a, b) >= 0 ? combine(a, b, 1n) : combine(b, a, 1n);
}

/** `a - b`; throws InsufficientFundsError when `b > a`, so a balance never goes negative. */
export function subtract(a: Amount, b: Amount): Amount {
  const order = compare(a, b);
  if (order < 0) throw new InsufficientFundsError();
  if (order === 0) return ZERO;
  if (isZero(b)) return a;
  return combine(a, b, -1n);
}

/** Exact decimal string of the represented value, e.g. `{ digits: 12324n, zeros: 1 }` -> "123240". */
export function toDecimalString(a: Amount): string {
  return isZero(a) ? "0" : a.digits.toString() + "0".repeat(a.zeros);
}
