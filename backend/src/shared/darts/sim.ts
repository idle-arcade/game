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
  /** `actionIndex`: position of the rejected action in a replayed batch. */
  constructor(
    readonly reason: SimRejectReason,
    readonly actionIndex?: number,
  ) {
    super(`Darts action rejected: ${reason}`);
    this.name = "SimRejectError";
  }
}

/** How the time of one idle payout splits by away policy, and what it paid. */
export type IdleSettlement = {
  activeMs: number;
  awayMs: number;
  longAwayMs: number;
  earned: Amount;
};

export type Purchase =
  | { type: "buy"; upgrade: UpgradeId; cost: Amount; level: number }
  | { type: "hire"; player: PlayerId; cost: Amount; owned: number };

/** Receives what happens during a step, e.g. for tracing. Never changes the result. */
export type SimObserver = {
  settled?(settlement: IdleSettlement): void;
  purchased?(purchase: Purchase): void;
};

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
  Math.max(0, Math.min(to, end) - Math.max(from, start));

/** Idle income for [from, to), with the last activity at `activeT`, truncated once. */
function idleSettlement(players: Players, from: number, to: number, activeT: number) {
  const awayAt = activeT + ACTIVE_WINDOW_MS;
  const longAwayAt = awayAt + REDUCED_AWAY_AFTER_MS;
  const activeMs = overlap(from, to, -Infinity, awayAt);
  const awayMs = overlap(from, to, awayAt, longAwayAt);
  const longAwayMs = overlap(from, to, longAwayAt, Infinity);
  const income = idleIncome(players);
  const weightedMs =
    FULL_SHARE * BigInt(activeMs) +
    AWAY_SHARE * BigInt(awayMs) +
    LONG_AWAY_SHARE * BigInt(longAwayMs);
  const earned =
    income.num === 0n ? ZERO : amount((income.num * weightedMs) / (income.den * 1000n * SHARE_DEN));
  return { activeMs, awayMs, longAwayMs, earned };
}

/**
 * Pays idle income up to `t` and makes `t` the last activity. Called where the exact balance
 * matters: before purchases, at batch ends and when the room is loaded. Each call truncates once,
 * so client and server must settle at the same times.
 */
export function settleIdle(s: DartsSimState, t: number, observer?: SimObserver): DartsSimState {
  if (t < s.t) throw new SimRejectError("time_order");
  if (t === s.paidT) return s; // then also t === s.t
  const settlement = idleSettlement(s.players, s.paidT, t, s.t);
  observer?.settled?.(settlement);
  return { ...s, balance: add(s.balance, settlement.earned), t, paidT: t };
}

/** Steps to `t`; settles first when the active window has run out since the last activity. */
export function advance(s: DartsSimState, t: number, observer?: SimObserver): DartsSimState {
  if (t < s.t) throw new SimRejectError("time_order");
  if (t - s.t > ACTIVE_WINDOW_MS) return settleIdle(s, t, observer);
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

function buyUpgrade(s: DartsSimState, upgrade: UpgradeId, observer?: SimObserver): DartsSimState {
  const level = s.levels[upgrade];
  if (isMaxLevel(upgrade, level)) throw new SimRejectError("max_level");
  const cost = upgradeCost(upgrade, level);
  const balance = pay(s.balance, cost);
  observer?.purchased?.({ type: "buy", upgrade, cost, level: level + 1 });
  return { ...s, balance, levels: { ...s.levels, [upgrade]: level + 1 } };
}

function hirePlayer(s: DartsSimState, player: PlayerId, observer?: SimObserver): DartsSimState {
  if (playerLock(player, s.players, s.levels)) throw new SimRejectError("locked");
  const owned = s.players[player];
  const cost = hireCost(player, owned);
  const balance = pay(s.balance, cost);
  observer?.purchased?.({ type: "hire", player, cost, owned: owned + 1 });
  return { ...s, balance, players: { ...s.players, [player]: owned + 1 } };
}

export function applyAction(
  s: DartsSimState,
  action: DartsAction,
  observer?: SimObserver,
): DartsSimState {
  switch (action.type) {
    case "throw": {
      const at = advance(s, action.t, observer);
      return { ...at, balance: add(at.balance, rewardFor(action.result, at.levels)) };
    }
    // Purchases can spend the idle income earned so far; a new player earns from now on.
    case "buy":
      return buyUpgrade(settleIdle(s, action.t, observer), action.upgrade, observer);
    case "hire":
      return hirePlayer(settleIdle(s, action.t, observer), action.player, observer);
  }
}

export function replay(
  s: DartsSimState,
  actions: readonly DartsAction[],
  endT: number,
  observer?: SimObserver,
): DartsSimState {
  let state = s;
  actions.forEach((action, index) => {
    try {
      state = applyAction(state, action, observer);
    } catch (error) {
      if (error instanceof SimRejectError) throw new SimRejectError(error.reason, index);
      throw error;
    }
  });
  return settleIdle(state, endT, observer);
}

export const sameState = (a: DartsSimState, b: DartsSimState) =>
  compare(a.balance, b.balance) === 0 &&
  UPGRADE_IDS.every((id) => a.levels[id] === b.levels[id]) &&
  PLAYER_IDS.every((id) => a.players[id] === b.players[id]);
