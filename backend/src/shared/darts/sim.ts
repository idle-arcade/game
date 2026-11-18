import {
  add,
  amount,
  compare,
  InsufficientFundsError,
  subtract,
  ZERO,
  type Amount,
} from "../currency/amount.js";
import {
  hireCost,
  idleIncome,
  PLAYER_IDS,
  playerLock,
  type PlayerId,
  type Players,
} from "./players.js";
import {
  isMaxLevel,
  rewardFor,
  UPGRADE_IDS,
  upgradeCost,
  type Levels,
  type ThrowResult,
  type UpgradeId,
} from "./rules.js";

export type DartsAction =
  | { type: "throw"; t: number; result: ThrowResult }
  | { type: "buy"; t: number; upgrade: UpgradeId }
  | { type: "hire"; t: number; player: PlayerId };

/**
 * `t`: game time (ms) of the last step, i.e. the player's last activity.
 * `paidT`: game time up to which idle income is in `balance`; never after `t`.
 */
export type DartsSimState = {
  readonly balance: Amount;
  readonly levels: Levels;
  readonly players: Players;
  readonly t: number;
  readonly paidT: number;
};

export type SimRejectReason = "insufficient_funds" | "max_level" | "locked" | "time_order";

export class SimRejectError extends Error {
  constructor(readonly reason: SimRejectReason) {
    super(`Darts action rejected: ${reason}`);
    this.name = "SimRejectError";
  }
}

// Away policy (balancing.ods, Assumptions): players earn full idle income while active and until
// this long after the last activity. After that the player is away and earns a share of it.
export const ACTIVE_WINDOW_MS = 60 * 60 * 1000;
const REDUCED_AWAY_AFTER_MS = 24 * 60 * 60 * 1000;
// Shares as multiples of 1/60: full, 1/15 for the first 24 h away, 1/60 after that.
const SHARE_DEN = 60n;
const FULL_SHARE = 60n;
const AWAY_SHARE = 4n;
const LONG_AWAY_SHARE = 1n;

/** Length of the overlap of [from, to) and [start, end). */
const overlap = (from: number, to: number, start: number, end: number) =>
  BigInt(Math.max(0, Math.min(to, end) - Math.max(from, start)));

/** Idle income for [from, to), with the last activity at `activeT`, truncated once. */
function idleEarnings(players: Players, from: number, to: number, activeT: number): Amount {
  const income = idleIncome(players);
  if (income.num === 0n || to <= from) return ZERO;
  const awayAt = activeT + ACTIVE_WINDOW_MS;
  const longAwayAt = awayAt + REDUCED_AWAY_AFTER_MS;
  const weightedMs =
    FULL_SHARE * overlap(from, to, -Infinity, awayAt) +
    AWAY_SHARE * overlap(from, to, awayAt, longAwayAt) +
    LONG_AWAY_SHARE * overlap(from, to, longAwayAt, Infinity);
  return amount((income.num * weightedMs) / (income.den * 1000n * SHARE_DEN));
}

/**
 * Pays idle income up to `t` and makes `t` the last activity. Called where the exact balance
 * matters: before purchases, at batch ends and when the room is loaded. Each call truncates once,
 * so client and server must settle at the same times.
 */
export function settleIdle(s: DartsSimState, t: number): DartsSimState {
  if (t < s.t) throw new SimRejectError("time_order");
  const earned = idleEarnings(s.players, s.paidT, t, s.t);
  return { ...s, balance: add(s.balance, earned), t, paidT: t };
}

/** Steps to `t`; settles first when the active window has run out since the last activity. */
export function advance(s: DartsSimState, t: number): DartsSimState {
  if (t < s.t) throw new SimRejectError("time_order");
  if (t - s.t > ACTIVE_WINDOW_MS) return settleIdle(s, t);
  return t === s.t ? s : { ...s, t };
}

function pay(balance: Amount, cost: Amount): Amount {
  try {
    return subtract(balance, cost);
  } catch (error) {
    if (error instanceof InsufficientFundsError) throw new SimRejectError("insufficient_funds");
    throw error;
  }
}

function buyUpgrade(s: DartsSimState, upgrade: UpgradeId): DartsSimState {
  const level = s.levels[upgrade];
  if (isMaxLevel(upgrade, level)) throw new SimRejectError("max_level");
  return {
    ...s,
    balance: pay(s.balance, upgradeCost(upgrade, level)),
    levels: { ...s.levels, [upgrade]: level + 1 },
  };
}

function hirePlayer(s: DartsSimState, player: PlayerId): DartsSimState {
  if (playerLock(player, s.players, s.levels)) throw new SimRejectError("locked");
  const owned = s.players[player];
  return {
    ...s,
    balance: pay(s.balance, hireCost(player, owned)),
    players: { ...s.players, [player]: owned + 1 },
  };
}

export function applyAction(s: DartsSimState, action: DartsAction): DartsSimState {
  switch (action.type) {
    case "throw": {
      const at = advance(s, action.t);
      return { ...at, balance: add(at.balance, rewardFor(action.result, at.levels)) };
    }
    // Purchases can spend the idle income earned so far; a new player earns from now on.
    case "buy":
      return buyUpgrade(settleIdle(s, action.t), action.upgrade);
    case "hire":
      return hirePlayer(settleIdle(s, action.t), action.player);
  }
}

export function replay(
  s: DartsSimState,
  actions: readonly DartsAction[],
  endT: number,
): DartsSimState {
  return settleIdle(actions.reduce(applyAction, s), endT);
}

export const sameState = (a: DartsSimState, b: DartsSimState) =>
  compare(a.balance, b.balance) === 0 &&
  UPGRADE_IDS.every((id) => a.levels[id] === b.levels[id]) &&
  PLAYER_IDS.every((id) => a.players[id] === b.players[id]);
