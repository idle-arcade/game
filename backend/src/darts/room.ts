import { randomUUID } from "node:crypto";
import { trace } from "@opentelemetry/api";
import { changeBalance, getBalance } from "../currency/balances.js";
import { prisma } from "../db.js";
import { Prisma } from "../generated/prisma/client.js";
import {
  CLOCK_TOLERANCE_MS,
  fromAmountDto,
  replay,
  RULES_VERSION,
  sanitizeLevels,
  SimRejectError,
  toAmountDto,
  toDecimalString,
  type Amount,
  type DartsBatch,
  type DartsRoomStateDto,
  type DartsStateResponse,
  type DartsSyncResponse,
  type Levels,
} from "../shared/index.js";

// Lock order: room row, then balance row.

type Tx = Prisma.TransactionClient;
type RoomRow = {
  levels: unknown;
  t: number;
  epoch: string;
  lastSeq: number;
  lastResponse: unknown;
};
type RawRoomRow = Omit<RoomRow, "t" | "lastSeq"> & { t: bigint; lastSeq: bigint | number };

async function lockRoom(tx: Tx, userId: string, now: number): Promise<RoomRow> {
  // Takes the exclusive lock right away, like changeBalance.
  await tx.$executeRaw`INSERT INTO darts_room (userId, levels, t, epoch, lastSeq)
    VALUES (${userId}, ${"{}"}, ${now}, ${""}, 0) ON DUPLICATE KEY UPDATE lastSeq = lastSeq`;
  const [row] = await tx.$queryRaw<RawRoomRow[]>`
    SELECT levels, t, epoch, lastSeq, lastResponse FROM darts_room WHERE userId = ${userId} FOR UPDATE`;
  if (!row) throw new Error(`Darts room ${userId} vanished`);
  // $queryRaw returns JSON columns as strings and integer columns as bigint.
  const parse = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);
  return {
    epoch: row.epoch,
    t: Number(row.t),
    lastSeq: Number(row.lastSeq),
    levels: parse(row.levels),
    lastResponse: parse(row.lastResponse),
  };
}

const stateDto = (
  row: { epoch: string; lastSeq: number },
  t: number,
  levels: Levels,
  balance: Amount,
): DartsRoomStateDto => ({
  epoch: row.epoch,
  serverNow: Date.now(),
  rulesVersion: RULES_VERSION,
  t,
  lastSeq: row.lastSeq,
  balance: toAmountDto(balance),
  levels,
});

const record = (attributes: Record<string, string | number>) =>
  trace.getActiveSpan()?.setAttributes(attributes);

/** Starts a new sync session, which outdates other tabs. */
export function loadRoom(userId: string): Promise<DartsRoomStateDto> {
  return prisma.$transaction(async (tx) => {
    const now = Date.now();
    const row = await lockRoom(tx, userId, now);
    const t = Math.max(row.t, now);
    const levels = sanitizeLevels(row.levels);
    const epoch = randomUUID();
    await tx.dartsRoom.update({
      where: { userId },
      data: { epoch, lastSeq: 0, lastResponse: Prisma.DbNull, t, levels },
    });
    record({ "darts.epoch": epoch });
    return stateDto({ epoch, lastSeq: 0 }, t, levels, await getBalance(userId, "beers", tx));
  });
}

export function roomState(userId: string, epoch: string): Promise<DartsStateResponse> {
  return prisma.$transaction(async (tx) => {
    const now = Date.now();
    const row = await lockRoom(tx, userId, now);
    if (row.epoch !== epoch) {
      record({ "darts.state.outcome": "stale_epoch" });
      return { ok: false, reason: "stale_epoch" } as const;
    }
    // The client restarts its clock at serverNow; its next actions must not precede `t`.
    const t = Math.max(row.t, now);
    await tx.dartsRoom.update({ where: { userId }, data: { t } });
    const levels = sanitizeLevels(row.levels);
    record({ "darts.state.outcome": "ok" });
    return {
      ok: true,
      state: stateDto(row, t, levels, await getBalance(userId, "beers", tx)),
    } as const;
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

class BatchFailed extends Error {
  constructor(readonly response: DartsSyncResponse) {
    super("Darts batch failed");
  }
}

export async function syncRoom(userId: string, batch: DartsBatch): Promise<DartsSyncResponse> {
  const { seq } = batch;
  const fail = (reason: Extract<DartsSyncResponse, { ok: false }>["reason"]) =>
    new BatchFailed({ ok: false, seq, reason });
  record({ "darts.sync.seq": seq, "darts.sync.actions": batch.actions.length });
  try {
    const response = await prisma.$transaction(async (tx) => {
      const row = await lockRoom(tx, userId, Date.now());
      if (row.epoch !== batch.epoch) throw fail("stale_epoch");
      if (batch.rulesVersion !== RULES_VERSION) throw fail("rules_version");
      if (seq === row.lastSeq && row.lastResponse) {
        record({ "darts.sync.outcome": "retry" });
        return row.lastResponse as DartsSyncResponse;
      }
      if (seq !== row.lastSeq + 1) throw fail("out_of_order");
      const roomT = row.t;
      if (!plausibleTime(batch, roomT, Date.now())) throw fail("implausible_time");

      let levels = sanitizeLevels(row.levels);
      const balance = await changeBalance(
        userId,
        "beers",
        (current) => {
          const result = replay({ balance: current, levels, t: roomT }, batch.actions, batch.endT);
          levels = result.levels;
          return result.balance;
        },
        tx,
      );
      const response: DartsSyncResponse = {
        ok: true,
        seq,
        state: stateDto({ epoch: row.epoch, lastSeq: seq }, batch.endT, levels, balance),
      };
      await tx.dartsRoom.update({
        where: { userId },
        data: { levels, t: batch.endT, lastSeq: seq, lastResponse: response },
      });

      const predicted = fromAmountDto(batch.predicted);
      const matches = toDecimalString(predicted) === toDecimalString(balance);
      record(
        matches
          ? { "darts.sync.outcome": "ok" }
          : {
              "darts.sync.outcome": "mismatch",
              "darts.sync.predicted": toDecimalString(predicted),
              "darts.sync.actual": toDecimalString(balance),
            },
      );
      return response;
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
