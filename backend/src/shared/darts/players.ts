import { amount, multiplyRatio, type Amount } from "../currency/amount.js";
import { isEndgame, type Levels } from "./rules.js";

// Automatic players (idle income). Values from docs/balancing.ods, sheet "Darts players".

/** A non-negative fraction; game math never uses floating point. */
export type Ratio = { readonly num: bigint; readonly den: bigint };

export const PLAYER_IDS = [
  "pubPlayer",
  "clubPlayer",
  "leaguePlayer",
  "tournamentPlayer",
  "pro",
  "worldChampion",
] as const;
export type PlayerId = (typeof PLAYER_IDS)[number];
/** Owned players per type. */
export type Players = Record<PlayerId, number>;

export const NO_PLAYERS: Players = Object.freeze({
  pubPlayer: 0,
  clubPlayer: 0,
  leaguePlayer: 0,
  tournamentPlayer: 0,
  pro: 0,
  worldChampion: 0,
});

type PlayerDef = {
  basePrice: Amount;
  throwsPerSecond: Ratio;
  targetShare: Ratio;
  /** Beers per normal hit; a target hit earns TARGET_REWARD_FACTOR times as much. */
  normalReward: bigint;
  /** The previous tier, of which at least one must be owned. */
  requires: PlayerId | null;
  needsEndgame: boolean;
};

export const PLAYERS: Record<PlayerId, PlayerDef> = {
  pubPlayer: {
    basePrice: amount(2000),
    throwsPerSecond: { num: 1n, den: 2n },
    targetShare: { num: 1n, den: 10n },
    normalReward: 8n,
    requires: null,
    needsEndgame: false,
  },
  clubPlayer: {
    basePrice: amount(40_000),
    throwsPerSecond: { num: 3n, den: 5n },
    targetShare: { num: 1n, den: 5n },
    normalReward: 45n,
    requires: "pubPlayer",
    needsEndgame: false,
  },
  leaguePlayer: {
    basePrice: amount(800_000),
    throwsPerSecond: { num: 7n, den: 10n },
    targetShare: { num: 1n, den: 4n },
    normalReward: 338n,
    requires: "clubPlayer",
    needsEndgame: false,
  },
  tournamentPlayer: {
    basePrice: amount(16_000_000),
    throwsPerSecond: { num: 4n, den: 5n },
    targetShare: { num: 3n, den: 10n },
    normalReward: 2550n,
    requires: "leaguePlayer",
    needsEndgame: false,
  },
  pro: {
    basePrice: amount(1, 15),
    throwsPerSecond: { num: 9n, den: 10n },
    targetShare: { num: 1n, den: 3n },
    normalReward: 2_800_000_000_000n,
    requires: "tournamentPlayer",
    needsEndgame: true,
  },
  worldChampion: {
    basePrice: amount(1, 21),
    throwsPerSecond: { num: 1n, den: 1n },
    targetShare: { num: 2n, den: 5n },
    normalReward: 72_500_000_000_000_000n,
    requires: "pro",
    needsEndgame: true,
  },
};

const TARGET_REWARD_FACTOR = 10n;
/** Each owned player of a type raises the price of the next one by this factor. */
const PRICE_GROWTH: Ratio = { num: 23n, den: 20n };

/** Price of the player after the `owned` ones. */
export function hireCost(id: PlayerId, owned: number): Amount {
  if (!Number.isInteger(owned) || owned < 0) throw new RangeError(`Invalid count ${owned}`);
  const n = BigInt(owned);
  return multiplyRatio(PLAYERS[id].basePrice, PRICE_GROWTH.num ** n, PRICE_GROWTH.den ** n);
}

export type PlayerLock = { reason: "player"; requires: PlayerId } | { reason: "endgame" };

/** Why the type can't be hired yet, or null when it can. */
export function playerLock(id: PlayerId, players: Players, levels: Levels): PlayerLock | null {
  const { requires, needsEndgame } = PLAYERS[id];
  if (requires && players[requires] === 0) return { reason: "player", requires };
  if (needsEndgame && !isEndgame(levels)) return { reason: "endgame" };
  return null;
}

/**
 * Expected Beers per second of one player:
 * throws/s x (normal x (1 - share) + 10 x normal x share) = throws/s x normal x (1 + 9 x share).
 */
export function playerIncome(id: PlayerId): Ratio {
  const { throwsPerSecond: rate, targetShare: share, normalReward } = PLAYERS[id];
  return {
    num: rate.num * normalReward * (share.den + (TARGET_REWARD_FACTOR - 1n) * share.num),
    den: rate.den * share.den,
  };
}

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? a : gcd(b, a % b));

/** Beers per second of `count` players of a type, or of all owned players. */
export function idleIncome(players: Partial<Players>): Ratio {
  let num = 0n;
  let den = 1n;
  for (const id of PLAYER_IDS) {
    const count = players[id] ?? 0;
    if (count === 0) continue;
    const income = playerIncome(id);
    num = num * income.den + BigInt(count) * income.num * den;
    den *= income.den;
    const divisor = gcd(num, den);
    num /= divisor;
    den /= divisor;
  }
  return { num, den };
}
