import { z } from "zod";
import { amountDtoSchema, fromAmountDto, type AmountDto } from "../currency/dto.js";
import { UPGRADE_IDS, type Levels } from "./rules.js";
import type { DartsSimState } from "./sim.js";

/** How far a batch's `endT` may lie ahead of the server clock. */
export const CLOCK_TOLERANCE_MS = 2000;
export const MAX_BATCH_ACTIONS = 200;
/** Highest average throw rate a batch may have; no player clicks this fast. */
export const MAX_THROWS_PER_SECOND = 20;
/** Throws allowed on top of that rate, so a short batch isn't rejected for one quick click. */
export const THROW_BURST = 5;

const gameTime = z.int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const dartsActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("throw"), t: gameTime, result: z.enum(["board", "target"]) }),
  z.object({ type: z.literal("buy"), t: gameTime, upgrade: z.enum(UPGRADE_IDS) }),
]);

export const dartsBatchSchema = z.object({
  epoch: z.string().min(1).max(64),
  seq: z.int().min(1),
  rulesVersion: z.string().max(64),
  actions: z.array(dartsActionSchema).max(MAX_BATCH_ACTIONS),
  endT: gameTime,
  /** Only recorded on the trace; the client compares the response itself. */
  predicted: amountDtoSchema,
});

export type DartsBatch = z.infer<typeof dartsBatchSchema>;

export type DartsRoomStateDto = {
  /** Sync session; each page load starts a new one, which outdates other tabs. */
  epoch: string;
  serverNow: number;
  rulesVersion: string;
  t: number;
  lastSeq: number;
  balance: AmountDto;
  levels: Levels;
};

export type DartsFailReason =
  | "stale_epoch"
  | "rules_version"
  | "out_of_order"
  | "implausible_time"
  | "implausible_rate"
  | "rejected";

export type DartsSyncResponse =
  | { ok: true; seq: number; state: DartsRoomStateDto }
  | { ok: false; seq: number; reason: DartsFailReason };

export type DartsStateResponse =
  { ok: true; state: DartsRoomStateDto } | { ok: false; reason: "stale_epoch" };

export const simStateFromDto = (d: DartsRoomStateDto): DartsSimState => ({
  balance: fromAmountDto(d.balance),
  levels: d.levels,
  t: d.t,
});
