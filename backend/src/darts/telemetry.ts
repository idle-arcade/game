import { metrics, trace, type Attributes, type Span } from "@opentelemetry/api";
import {
  add,
  idleIncome,
  ZERO,
  type Amount,
  type DartsBatch,
  type DartsMilestone,
  type IdleSettlement,
  type Players,
  type Purchase,
  type SimObserver,
} from "../shared/index.js";

// Darts outcomes go on the tRPC span of the request (logs are for application errors only).
// Counters count every call, independently of trace sampling.

const meter = metrics.getMeter("idle-arcade.darts");
const syncOutcomes = meter.createCounter("darts.sync.outcomes", {
  description: "Darts batches by outcome",
});
const hires = meter.createCounter("darts.players.hired", {
  description: "Automatic Darts players hired, by type",
});
const milestones = meter.createCounter("darts.milestones", {
  description: "Darts milestones reached",
});

export const traceAmount = (a: Amount) => `${a.digits}e${a.zeros}`;

export type DartsTelemetry = ReturnType<typeof dartsTelemetry>;

/**
 * Records onto the span active when the request starts. Bound early on purpose: inside a Prisma
 * transaction the active span is Prisma's.
 */
export function dartsTelemetry(span: Span | undefined = trace.getActiveSpan()) {
  const record = (attributes: Attributes) => span?.setAttributes(attributes);
  const addEvent = (name: string, attributes: Attributes) => span?.addEvent(name, attributes);

  return {
    record,

    syncOutcome(outcome: string, attributes: Attributes = {}) {
      record({ "darts.sync.outcome": outcome, ...attributes });
      syncOutcomes.add(1, { "darts.outcome": outcome });
    },

    batch(batch: DartsBatch, roomT: number, now: number) {
      const count = (type: string) => batch.actions.filter((a) => a.type === type).length;
      record({
        "darts.sync.seq": batch.seq,
        "darts.sync.actions": batch.actions.length,
        "darts.sync.throws": count("throw"),
        "darts.sync.buys": count("buy"),
        "darts.sync.hires": count("hire"),
        "darts.sync.covered_ms": batch.endT - roomT,
        "darts.sync.end_ahead_ms": batch.endT - now,
        "darts.sync.client_rules_version": batch.rulesVersion,
      });
    },

    /**
     * Observes a simulation run: purchases become span events right away, idle payouts are
     * summed and recorded by `finish` under `prefix` (e.g. "darts.sync.idle").
     */
    sim() {
      const totals = { activeMs: 0, awayMs: 0, longAwayMs: 0, earned: ZERO, payouts: 0 };
      const observer: SimObserver = {
        settled(settlement: IdleSettlement) {
          totals.activeMs += settlement.activeMs;
          totals.awayMs += settlement.awayMs;
          totals.longAwayMs += settlement.longAwayMs;
          totals.earned = add(totals.earned, settlement.earned);
          totals.payouts += 1;
        },
        purchased(purchase: Purchase) {
          const hire = purchase.type === "hire";
          addEvent("darts.purchase", {
            "darts.purchase.type": purchase.type,
            "darts.purchase.item": hire ? purchase.player : purchase.upgrade,
            "darts.purchase.cost": traceAmount(purchase.cost),
            "darts.purchase.count_after": hire ? purchase.owned : purchase.level,
          });
          if (hire) hires.add(1, { "darts.player": purchase.player });
        },
      };
      const finish = (prefix: string, players: Players) => {
        const income = idleIncome(players);
        record({
          [`${prefix}.payouts`]: totals.payouts,
          [`${prefix}.active_ms`]: totals.activeMs,
          [`${prefix}.away_ms`]: totals.awayMs,
          [`${prefix}.long_away_ms`]: totals.longAwayMs,
          [`${prefix}.earned`]: traceAmount(totals.earned),
          // Approximate on purpose: for reading traces, not for game math.
          "darts.idle.income_per_s": Number(income.num) / Number(income.den),
        });
        return totals;
      };
      return { observer, finish };
    },

    milestones(reached: readonly DartsMilestone[]) {
      for (const milestone of reached) {
        addEvent("darts.milestone", { "darts.milestone": milestone });
        milestones.add(1, { "darts.milestone": milestone });
      }
    },
  };
}
