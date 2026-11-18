import { randomUUID } from "node:crypto";
import { trace } from "@opentelemetry/api";
import { changeBalance, getBalance } from "../currency/balances.js";
import { prisma } from "../db.js";
import type { Prisma } from "../generated/prisma/client.js";
import { Currency, Room } from "../generated/prisma/enums.js";
import {
  CLOCK_TOLERANCE_MS,
  compare,
  fromAmountDto,
  MAX_THROWS_PER_SECOND,
  NO_PLAYERS,
  PLAYER_IDS,
  replay,
  RULES_VERSION,
  settleIdle,
  SimRejectError,
  THROW_BURST,
  toAmountDto,
  UPGRADE_IDS,
  ZERO_LEVELS,
  type Amount,
  type DartsBatch,
  type DartsFailReason,
  type DartsRoomStateDto,
  type DartsSimState,
  type DartsStateResponse,
  type DartsSyncResponse,
  type Levels,
  type Players,
} from "../shared/index.js";

// Lock order: room_sync row, then balance row. darts_room is only read and written under the
// room_sync lock.

type Tx = Prisma.TransactionClient;
type SyncRow = { t: number; epoch: string; lastSeq: number };

const syncKey = (userId: string) => ({ userId_room: { userId, room: Room.darts } });

async function lockSync(tx: Tx, userId: string, now: number): Promise<SyncRow> {
  // Takes the exclusive lock right away, like changeBalance.
  await tx.$executeRaw`INSERT INTO room_sync (userId, room, t, epoch, lastSeq)
    VALUES (${userId}, ${Room.darts}, ${now}, ${""}, 0) ON DUPLICATE KEY UPDATE lastSeq = lastSeq`;
  // $queryRaw returns integer columns as bigint.
  const [row] = await tx.$queryRaw<{ t: bigint; epoch: string; lastSeq: bigint | number }[]>`
    SELECT t, epoch, lastSeq FROM room_sync
    WHERE userId = ${userId} AND room = ${Room.darts} FOR UPDATE`;
  if (!row) throw new Error(`Darts sync row ${userId} vanished`);
  return { epoch: row.epoch, t: Number(row.t), lastSeq: Number(row.lastSeq) };
}

type Progress = { levels: Levels; players: Players };

async function loadProgress(tx: Tx, userId: string): Promise<Progress> {
  const row = await tx.dartsRoom.findUnique({ where: { userId } });
  const levels = { ...ZERO_LEVELS };
  const players = { ...NO_PLAYERS };
  if (row) {
    for (const id of UPGRADE_IDS) levels[id] = row[id];
    for (const id of PLAYER_IDS) players[id] = row[id];
  }
  return { levels, players };
}

async function saveProgress(tx: Tx, userId: string, { levels, players }: Progress) {
  const data = { ...levels, ...players };
  await tx.dartsRoom.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

/** The stored state; idle income is paid up to the room time `t`. */
async function loadState(tx: Tx, userId: string, t: number): Promise<DartsSimState> {
  const progress = await loadProgress(tx, userId);
  const balance = await getBalance(userId, Currency.beers, tx);
  return { balance, ...progress, t, paidT: t };
}

/** Pays the idle income since the room time `row.t` (e.g. while away) and moves it to `now`. */
async function settleRoom(tx: Tx, userId: string, row: SyncRow, now: number) {
  const progress = await loadProgress(tx, userId);
  // A batch may end slightly ahead of the server clock; time never goes back.
  const t = Math.max(row.t, now);
  const balance = await changeBalance(
    userId,
    Currency.beers,
    (current) => settleIdle({ balance: current, ...progress, t: row.t, paidT: row.t }, t).balance,
    tx,
  );
  return { balance, ...progress, t, paidT: t };
}

const stateDto = (
  row: { epoch: string; lastSeq: number },
  state: DartsSimState,
): DartsRoomStateDto => ({
  epoch: row.epoch,
  serverNow: Date.now(),
  rulesVersion: RULES_VERSION,
  t: state.t,
  lastSeq: row.lastSeq,
  balance: toAmountDto(state.balance),
  levels: state.levels,
  players: state.players,
});

const record = (attributes: Record<string, string | number>) =>
  trace.getActiveSpan()?.setAttributes(attributes);

/** Starts a new sync session, which outdates other tabs. */
export function loadRoom(userId: string): Promise<DartsRoomStateDto> {
  return prisma.$transaction(async (tx) => {
    const now = Date.now();
    const row = await lockSync(tx, userId, now);
    const state = await settleRoom(tx, userId, row, now);
    const epoch = randomUUID();
    await tx.roomSync.update({ where: syncKey(userId), data: { epoch, lastSeq: 0, t: state.t } });
    record({ "darts.epoch": epoch });
    return stateDto({ epoch, lastSeq: 0 }, state);
  });
}

export function roomState(userId: string, epoch: string): Promise<DartsStateResponse> {
  return prisma.$transaction(async (tx) => {
    const now = Date.now();
    const row = await lockSync(tx, userId, now);
    if (row.epoch !== epoch) {
      record({ "darts.state.outcome": "stale_epoch" });
      return { ok: false, reason: "stale_epoch" } as const;
    }
    // The client restarts its clock at serverNow; its next actions must not precede `t`.
    const state = await settleRoom(tx, userId, row, now);
    await tx.roomSync.update({ where: syncKey(userId), data: { t: state.t } });
    record({ "darts.state.outcome": "ok" });
    return { ok: true, state: stateDto(row, state) } as const;
  });
}

function plausibleTime(batch: DartsBatch, roomT: number, now: number) {
  let last = roomT;
  for (const action of batch.actions) {
    if (action.t < last) return false;
    last = action.t;
  }
  return batch.endT >= last && batch.endT <= now + CLOCK_TOLERANCE_MS;
}

/** Reload times are not checked; this only stops throw rates no player can reach. */
function plausibleRate(batch: DartsBatch, roomT: number) {
  const throws = batch.actions.filter((action) => action.type === "throw").length;
  return (throws - THROW_BURST) * 1000 <= MAX_THROWS_PER_SECOND * (batch.endT - roomT);
}

const traceAmount = (a: Amount) => `${a.digits}e${a.zeros}`;

class BatchFailed extends Error {
  constructor(readonly response: DartsSyncResponse) {
    super("Darts batch failed");
  }
}

export async function syncRoom(userId: string, batch: DartsBatch): Promise<DartsSyncResponse> {
  const { seq } = batch;
  const fail = (reason: DartsFailReason) => new BatchFailed({ ok: false, seq, reason });
  record({ "darts.sync.seq": seq, "darts.sync.actions": batch.actions.length });
  try {
    const response = await prisma.$transaction(async (tx) => {
      const row = await lockSync(tx, userId, Date.now());
      if (row.epoch !== batch.epoch) throw fail("stale_epoch");
      if (batch.rulesVersion !== RULES_VERSION) throw fail("rules_version");
      if (seq === row.lastSeq) {
        // A retry of the batch applied last, whose response got lost: answer with the state it
        // led to instead of applying it again.
        record({ "darts.sync.outcome": "retry" });
        return { ok: true, seq, state: stateDto(row, await loadState(tx, userId, row.t)) } as const;
      }
      if (seq !== row.lastSeq + 1) throw fail("out_of_order");
      const roomT = row.t;
      if (!plausibleTime(batch, roomT, Date.now())) throw fail("implausible_time");
      if (!plausibleRate(batch, roomT)) throw fail("implausible_rate");

      const before = await loadProgress(tx, userId);
      let after = before;
      const balance = await changeBalance(
        userId,
        Currency.beers,
        (current) => {
          const start = { balance: current, ...before, t: roomT, paidT: roomT };
          const result = replay(start, batch.actions, batch.endT);
          after = { levels: result.levels, players: result.players };
          return result.balance;
        },
        tx,
      );
      // The sim returns new objects only for actual purchases.
      if (after.levels !== before.levels || after.players !== before.players) {
        await saveProgress(tx, userId, after);
      }
      await tx.roomSync.update({
        where: syncKey(userId),
        data: { t: batch.endT, lastSeq: seq },
      });

      const predicted = fromAmountDto(batch.predicted);
      record(
        compare(predicted, balance) === 0
          ? { "darts.sync.outcome": "ok" }
          : {
              "darts.sync.outcome": "mismatch",
              "darts.sync.predicted": traceAmount(predicted),
              "darts.sync.actual": traceAmount(balance),
            },
      );
      return {
        ok: true,
        seq,
        state: stateDto(
          { epoch: row.epoch, lastSeq: seq },
          { balance, ...after, t: batch.endT, paidT: batch.endT },
        ),
      } as const;
    });
    return response;
  } catch (error) {
    if (error instanceof SimRejectError) {
      record({ "darts.sync.outcome": "rejected", "darts.sync.reject_reason": error.reason });
      return { ok: false, seq, reason: "rejected" };
    }
    if (error instanceof BatchFailed) {
      if (error.response.ok === false) record({ "darts.sync.outcome": error.response.reason });
      return error.response;
    }
    throw error;
  }
}
