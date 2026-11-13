import { add, compare, InsufficientFundsError, subtract, type Amount } from "../currency/amount.js";
import {
  rewardFor,
  UPGRADE_IDS,
  UPGRADES,
  upgradeCost,
  type Levels,
  type ThrowResult,
  type UpgradeId,
} from "./rules.js";

export type DartsAction =
  | { type: "throw"; t: number; result: ThrowResult }
  | { type: "buy"; t: number; upgrade: UpgradeId };

/** `t`: game time (ms) of the last committed step. */
export type DartsSimState = {
  readonly balance: Amount;
  readonly levels: Levels;
  readonly t: number;
};

export type SimRejectReason = "insufficient_funds" | "max_level" | "time_order";

export class SimRejectError extends Error {
  constructor(readonly reason: SimRejectReason) {
    super(`Darts action rejected: ${reason}`);
    this.name = "SimRejectError";
  }
}

/**
 * Idle income will accrue here. Amounts truncate per step, so both sides must step at the same
 * times: only at action timestamps and batch ends, never per frame.
 */
export function advance(s: DartsSimState, t: number): DartsSimState {
  if (t < s.t) throw new SimRejectError("time_order");
  return t === s.t ? s : { ...s, t };
}

export function applyAction(s: DartsSimState, action: DartsAction): DartsSimState {
  const at = advance(s, action.t);
  if (action.type === "throw") {
    return { ...at, balance: add(at.balance, rewardFor(action.result, at.levels)) };
  }
  const level = at.levels[action.upgrade];
  if (level >= UPGRADES[action.upgrade].maxLevel) throw new SimRejectError("max_level");
  let balance: Amount;
  try {
    balance = subtract(at.balance, upgradeCost(action.upgrade, level));
  } catch (error) {
    if (error instanceof InsufficientFundsError) throw new SimRejectError("insufficient_funds");
    throw error;
  }
  return { ...at, balance, levels: { ...at.levels, [action.upgrade]: level + 1 } };
}

export function replay(
  s: DartsSimState,
  actions: readonly DartsAction[],
  endT: number,
): DartsSimState {
  return advance(actions.reduce(applyAction, s), endT);
}

export const sameState = (a: DartsSimState, b: DartsSimState) =>
  compare(a.balance, b.balance) === 0 && UPGRADE_IDS.every((id) => a.levels[id] === b.levels[id]);
