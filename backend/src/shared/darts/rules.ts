import { amount, multiplyRatio, type Amount } from "../currency/amount.js";

/** Bump on any rule or simulation change, so outdated clients stop instead of desyncing. */
export const RULES_VERSION = "darts-2";

export const UPGRADE_IDS = ["betterDarts", "moreDarts", "lessCooldown", "biggerTargets"] as const;
export type UpgradeId = (typeof UPGRADE_IDS)[number];
export type Levels = Record<UpgradeId, number>;

export const ZERO_LEVELS: Levels = Object.freeze({
  betterDarts: 0,
  moreDarts: 0,
  lessCooldown: 0,
  biggerTargets: 0,
});

export type ThrowResult = "board" | "target";

/** `maxLevel: null` means the upgrade has no limit. */
type UpgradeDef = {
  maxLevel: number | null;
  baseCost: Amount;
  growthNum: bigint;
  growthDen: bigint;
};

// Values from docs/balancing.ods.
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  betterDarts: { maxLevel: null, baseCost: amount(8), growthNum: 141n, growthDen: 100n },
  moreDarts: { maxLevel: null, baseCost: amount(20), growthNum: 3n, growthDen: 2n },
  lessCooldown: { maxLevel: 50, baseCost: amount(75), growthNum: 7n, growthDen: 5n },
  biggerTargets: { maxLevel: 10, baseCost: amount(40), growthNum: 5n, growthDen: 1n },
};

const BASE_REWARD: Record<ThrowResult, Amount> = { board: amount(1), target: amount(10) };
/** Each Better Darts level multiplies rewards by 5/4. */
const REWARD_GROWTH_NUM = 5n;
const REWARD_GROWTH_DEN = 4n;
const BASE_DARTS = 3;

const BASE_RELOAD_MS = 5000;
const RELOAD_MS_PER_LEVEL = 100;

export function isMaxLevel(id: UpgradeId, level: number) {
  const { maxLevel } = UPGRADES[id];
  return maxLevel !== null && level >= maxLevel;
}

/** Price of going from `level` to `level + 1`. */
export function upgradeCost(id: UpgradeId, level: number): Amount {
  const def = UPGRADES[id];
  if (!Number.isInteger(level) || level < 0 || isMaxLevel(id, level)) {
    throw new RangeError(`${id} has no level after ${level}`);
  }
  const n = BigInt(level);
  return multiplyRatio(def.baseCost, def.growthNum ** n, def.growthDen ** n);
}

export function rewardFor(result: ThrowResult, levels: Levels): Amount {
  const n = BigInt(levels.betterDarts);
  return multiplyRatio(BASE_REWARD[result], REWARD_GROWTH_NUM ** n, REWARD_GROWTH_DEN ** n);
}

export const maxDarts = (levels: Levels) => BASE_DARTS + levels.moreDarts;

export const reloadMs = (levels: Levels) =>
  BASE_RELOAD_MS - RELOAD_MS_PER_LEVEL * levels.lessCooldown;

/** Client-side only: the server doesn't check hits. */
export const targetScale = (levels: Levels) => ({ num: 10 + levels.biggerTargets, den: 10 });
