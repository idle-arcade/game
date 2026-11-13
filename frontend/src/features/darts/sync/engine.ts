import {
  applyAction,
  MAX_BATCH_ACTIONS,
  replay,
  RULES_VERSION,
  sameState,
  SimRejectError,
  simStateFromDto,
  toAmountDto,
  type DartsAction,
  type DartsBatch,
  type DartsRoomStateDto,
  type DartsSimState,
  type DartsStateResponse,
  type DartsSyncResponse,
  type ThrowResult,
  type UpgradeId,
} from "@idle-arcade/backend/shared";
import { createGameClock, type GameClock } from "./clock";

/** For requests the server refused (4xx); these are not retried. */
export class TransportRejectedError extends Error {
  constructor(cause: unknown) {
    super("Darts request rejected", { cause });
    this.name = "TransportRejectedError";
  }
}

export type DartsTransport = {
  sync(batch: DartsBatch): Promise<DartsSyncResponse>;
  state(epoch: string): Promise<DartsStateResponse>;
};

export type EngineStatus = "running" | "resyncing" | "stopped";
export type StopReason = "stale_epoch" | "rules_version" | "resync_failed";

export type EngineSnapshot = {
  /** What the server will compute from the same actions. */
  state: DartsSimState;
  status: EngineStatus;
  stopReason?: StopReason;
  resyncedAt?: number;
};

export type DartsCommand =
  { type: "throw"; result: ThrowResult } | { type: "buy"; upgrade: UpgradeId };

export type DartsEngine = {
  getSnapshot(): EngineSnapshot;
  subscribe(listener: () => void): () => void;
  dispatch(command: DartsCommand): boolean;
  /** Sends everything queued; resolves once the server has it or the engine no longer runs. */
  drain(): Promise<void>;
  dispose(): void;
};

const FLUSH_INTERVAL_MS = 5000;
const RETRY_BASE_MS = 1000;
const RETRY_MAX_MS = 10_000;
const MAX_RESYNC_ATTEMPTS = 3;

export function createDartsEngine(
  initial: DartsRoomStateDto,
  transport: DartsTransport,
): DartsEngine {
  const epoch = initial.epoch;
  let clock: GameClock = createGameClock(initial.serverNow);
  let lastSeq = initial.lastSeq;
  // State after the last batch sent; the next batch's prediction starts here.
  let base = simStateFromDto(initial);
  let queue: DartsAction[] = [];
  let inFlight: { batch: DartsBatch; predicted: DartsSimState } | null = null;
  // Bumped on resync so answers to older requests are ignored.
  let generation = 0;
  let disposed = false;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let snapshot: EngineSnapshot = { state: simStateFromDto(initial), status: "running" };
  const listeners = new Set<() => void>();
  let drainWaiters: (() => void)[] = [];

  function settleDrain() {
    const busy =
      !disposed && snapshot.status === "running" && (inFlight !== null || queue.length > 0);
    if (busy) return;
    drainWaiters.forEach((resolve) => resolve());
    drainWaiters = [];
  }

  function update(patch: Partial<EngineSnapshot>) {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach((listener) => listener());
  }

  function stop(stopReason: StopReason) {
    queue = [];
    inFlight = null;
    clearTimeout(retryTimer);
    update({ status: "stopped", stopReason });
    settleDrain();
  }

  function flush() {
    if (disposed || inFlight || snapshot.status !== "running" || queue.length === 0) return;
    // A partial batch ends at its last action: later actions must not precede the server's `t`.
    const actions = queue.slice(0, MAX_BATCH_ACTIONS);
    queue = queue.slice(actions.length);
    const endT = queue.length > 0 ? actions[actions.length - 1]!.t : clock();
    const predicted = replay(base, actions, endT);
    const batch: DartsBatch = {
      epoch,
      seq: lastSeq + 1,
      rulesVersion: RULES_VERSION,
      actions,
      endT,
      predicted: toAmountDto(predicted.balance),
    };
    base = predicted;
    inFlight = { batch, predicted };
    if (queue.length === 0) snapshot = { ...snapshot, state: predicted }; // same values, t = endT
    send(0);
  }

  function send(attempt: number) {
    const sent = inFlight;
    const gen = generation;
    if (!sent) return;
    transport.sync(sent.batch).then(
      (response) => {
        if (gen !== generation || inFlight !== sent || response.seq !== sent.batch.seq) return;
        inFlight = null;
        if (!response.ok) {
          if (response.reason === "stale_epoch" || response.reason === "rules_version") {
            stop(response.reason);
          } else {
            void resync();
          }
          return;
        }
        if (!sameState(simStateFromDto(response.state), sent.predicted)) {
          void resync();
          return;
        }
        lastSeq = response.seq;
        const flushNow =
          drainWaiters.length > 0 ||
          queue.length >= MAX_BATCH_ACTIONS ||
          queue.some((a) => a.type === "buy");
        if (flushNow) flush();
        settleDrain();
      },
      (error) => {
        if (gen !== generation || inFlight !== sent) return;
        if (error instanceof TransportRejectedError) {
          inFlight = null;
          void resync();
          return;
        }
        // Unknown outcome: resend as is; the server answers a repeated seq from its record.
        const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
        retryTimer = setTimeout(() => send(attempt + 1), delay);
      },
    );
  }

  async function resync() {
    generation += 1;
    queue = [];
    inFlight = null;
    clearTimeout(retryTimer);
    update({ status: "resyncing" });
    settleDrain();
    for (let attempt = 0; attempt < MAX_RESYNC_ATTEMPTS && !disposed; attempt++) {
      const gen = generation;
      try {
        const response = await transport.state(epoch);
        if (gen !== generation || disposed) return;
        if (!response.ok) return stop(response.reason);
        lastSeq = response.state.lastSeq;
        clock = createGameClock(response.state.serverNow);
        base = simStateFromDto(response.state);
        update({
          state: base,
          status: "running",
          resyncedAt: performance.now(),
        });
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, RETRY_BASE_MS * 2 ** attempt));
      }
    }
    if (!disposed) stop("resync_failed");
  }

  const interval = setInterval(flush, FLUSH_INTERVAL_MS);
  const onVisibility = () => {
    if (document.visibilityState === "hidden") flush();
  };
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispatch(command) {
      if (disposed || snapshot.status !== "running") return false;
      const action = { ...command, t: clock() } as DartsAction;
      let state: DartsSimState;
      try {
        state = applyAction(snapshot.state, action);
      } catch (error) {
        if (error instanceof SimRejectError) return false;
        throw error;
      }
      queue.push(action);
      update({ state });
      if (action.type === "buy" || queue.length >= MAX_BATCH_ACTIONS) flush();
      return true;
    },
    drain() {
      return new Promise((resolve) => {
        drainWaiters.push(resolve);
        flush();
        settleDrain();
      });
    },
    dispose() {
      disposed = true;
      settleDrain();
      generation += 1;
      clearInterval(interval);
      clearTimeout(retryTimer);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
      listeners.clear();
    },
  };
}
