import { amount, multiplyRatio, type Amount } from "../currency/amount.js";

/** Bump on any rule or simulation change, so outdated clients stop instead of desyncing. */
export const RULES_VERSION = "darts-1";

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

type UpgradeDef = { maxLevel: number; baseCost: Amount; growthNum: bigint; growthDen: bigint };

// PLACEHOLDER until #104, except the max levels of lessCooldown and biggerTargets.
export const UPGRADES: Record<UpgradeId, UpgradeDef> = {
  betterDarts: { maxLevel: 100, baseCost: amount(100), growthNum: 3n, growthDen: 2n },
  moreDarts: { maxLevel: 20, baseCost: amount(2000), growthNum: 3n, growthDen: 2n },
  lessCooldown: { maxLevel: 50, baseCost: amount(50), growthNum: 11n, growthDen: 10n },
  biggerTargets: { maxLevel: 10, baseCost: amount(500), growthNum: 2n, growthDen: 1n },
};

// PLACEHOLDER until #104.
const BASE_REWARD: Record<ThrowResult, Amount> = { board: amount(1), target: amount(10) };
const BASE_DARTS = 3;

const BASE_RELOAD_MS = 5000;
const RELOAD_MS_PER_LEVEL = 100;

/** Price of going from `level` to `level + 1`. */
export function upgradeCost(id: UpgradeId, level: number): Amount {
  const def = UPGRADES[id];
  if (!Number.isInteger(level) || level < 0 || level >= def.maxLevel) {
    throw new RangeError(`${id} has no level after ${level}`);
  }
  const n = BigInt(level);
  return multiplyRatio(def.baseCost, def.growthNum ** n, def.growthDen ** n);
}

export function rewardFor(result: ThrowResult, levels: Levels): Amount {
  return multiplyRatio(BASE_REWARD[result], BigInt(1 + levels.betterDarts), 1n);
}

export const maxDarts = (levels: Levels) => BASE_DARTS + levels.moreDarts;

export const reloadMs = (levels: Levels) =>
  BASE_RELOAD_MS - RELOAD_MS_PER_LEVEL * levels.lessCooldown;

/** Client-side only: the server doesn't check hits. */
export const targetScale = (levels: Levels) => ({ num: 10 + levels.biggerTargets, den: 10 });

/** Tolerates stored levels from older or newer rules. */
export function sanitizeLevels(raw: unknown): Levels {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const levels = { ...ZERO_LEVELS };
  for (const id of UPGRADE_IDS) {
    const value = source[id];
    if (typeof value === "number" && Number.isInteger(value)) {
      levels[id] = Math.min(Math.max(value, 0), UPGRADES[id].maxLevel);
    }
  }
  return levels;
}
