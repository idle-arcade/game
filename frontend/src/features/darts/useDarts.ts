import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { TRPCClientError } from "@trpc/client";
import {
  maxDarts as maxDartsFor,
  reloadMs as reloadMsFor,
  targetScale,
  ZERO,
  ZERO_LEVELS,
  type Amount,
  type Levels,
  type UpgradeId,
} from "@idle-arcade/backend/shared";
import { trpcClient } from "../../lib/trpc";
import { analytics } from "../analytics/analytics";
import { useCurrentUser } from "../auth/useCurrentUser";
import {
  createDartsEngine,
  TransportRejectedError,
  type DartsEngine,
  type DartsTransport,
  type EngineSnapshot,
} from "./sync/engine";

const TARGET_COUNT = 4;
const BOARD_RADIUS = 170;
const BASE_TARGET_RADIUS = 12;
const REQUEST_TIMEOUT_MS = 10_000;
const LOAD_ATTEMPTS = 3;
const LOAD_RETRY_BASE_MS = 1000;
const LOGOUT_FLUSH_TIMEOUT_MS = 3000;

export type Target = { id: number; x: number; y: number };

export type DartsGame = {
  status: "loading" | EngineSnapshot["status"];
  stopReason?: EngineSnapshot["stopReason"];
  resyncedAt?: number;
  balance: Amount;
  levels: Levels;
  dartsLeft: number;
  maxDarts: number;
  reloading: boolean;
  reloadMs: number;
  targets: Target[];
  targetRadius: number;
  throwDart(targetId?: number): void;
  buy(id: UpgradeId, count: 1 | 10): void;
};

let nextTargetId = 0;
function randomTarget(): Target {
  const r = Math.sqrt(Math.random()) * (BOARD_RADIUS - 20);
  const a = Math.random() * Math.PI * 2;
  return { id: nextTargetId++, x: r * Math.cos(a), y: r * Math.sin(a) };
}

// 4xx responses won't succeed on retry (408/429 might).
function classify(error: unknown): never {
  const status = error instanceof TRPCClientError ? error.data?.httpStatus : undefined;
  if (typeof status === "number" && status >= 400 && status < 500 && ![408, 429].includes(status)) {
    throw new TransportRejectedError(error);
  }
  throw error;
}

const transport: DartsTransport = {
  sync: (batch) =>
    trpcClient.darts.sync
      .mutate(batch, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      .catch(classify),
  state: (epoch) =>
    trpcClient.darts.state
      .mutate({ epoch }, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
      .catch(classify),
};

// Safe to repeat: each load starts a new sync session and the last one wins.
async function loadRoom() {
  for (let attempt = 1; ; attempt++) {
    try {
      return await trpcClient.darts.load
        .mutate(undefined, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
        .catch(classify);
    } catch (error) {
      if (error instanceof TransportRejectedError || attempt >= LOAD_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, LOAD_RETRY_BASE_MS * 2 ** (attempt - 1)));
    }
  }
}

// One engine per user and page load, so leaving the Darts page doesn't drop unsent actions.
let session: { userId: string; engine: Promise<DartsEngine> } | null = null;

function engineFor(userId: string) {
  if (session?.userId !== userId) {
    endDartsSession();
    const engine = loadRoom().then((initial) => createDartsEngine(initial, transport));
    session = { userId, engine };
    engine.catch(() => {
      if (session?.engine === engine) session = null;
    });
  }
  return session!.engine;
}

/** Call before logout, while requests are still authorized. Gives up after a few seconds. */
export async function flushDartsSession() {
  const engine = session?.engine;
  if (!engine) return;
  await Promise.race([
    engine.then(
      (created) => created.drain(),
      () => {},
    ),
    new Promise((resolve) => setTimeout(resolve, LOGOUT_FLUSH_TIMEOUT_MS)),
  ]);
}

/** Call on logout. */
export function endDartsSession() {
  void session?.engine.then(
    (engine) => engine.dispose(),
    () => {},
  );
  session = null;
}

const noopSubscribe = () => () => {};

export function useDarts(): DartsGame {
  const userId = useCurrentUser()?.id;
  const [engine, setEngine] = useState<DartsEngine | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [dartsLeft, setDartsLeft] = useState<number | null>(null);
  const [reloadStartedAt, setReloadStartedAt] = useState<number | null>(null);
  const [targets, setTargets] = useState<Target[]>(() =>
    Array.from({ length: TARGET_COUNT }, randomTarget),
  );

  useEffect(() => {
    if (!userId) return;
    let active = true;
    engineFor(userId).then(
      (created) => active && setEngine(created),
      () => active && setLoadFailed(true),
    );
    return () => {
      active = false;
    };
  }, [userId]);

  const snapshot = useSyncExternalStore(
    engine?.subscribe ?? noopSubscribe,
    () => engine?.getSnapshot() ?? null,
  );

  const levels = snapshot?.state.levels ?? ZERO_LEVELS;
  const maxDarts = maxDartsFor(levels);
  const reloadMs = reloadMsFor(levels);
  const darts = dartsLeft ?? maxDarts;
  const reloading = reloadStartedAt !== null;

  // Measured from the reload's start, so buying Less cooldown mid-reload shortens it.
  useEffect(() => {
    if (reloadStartedAt === null) return;
    const timer = setTimeout(
      () => {
        setDartsLeft(maxDarts);
        setReloadStartedAt(null);
      },
      Math.max(0, reloadStartedAt + reloadMs - performance.now()),
    );
    return () => clearTimeout(timer);
  }, [reloadStartedAt, reloadMs, maxDarts]);

  const throwDart = useCallback(
    (targetId?: number) => {
      if (!engine || reloading || darts <= 0) return;
      const result = targetId === undefined ? "board" : "target";
      if (!engine.dispatch({ type: "throw", result })) return;
      if (darts > 1) setDartsLeft(darts - 1);
      else if (reloadMs === 0) setDartsLeft(maxDarts);
      else {
        setDartsLeft(0);
        setReloadStartedAt(performance.now());
      }
      if (targetId !== undefined) {
        setTargets((ts) => ts.map((t) => (t.id === targetId ? randomTarget() : t)));
      }
    },
    [engine, reloading, darts, reloadMs, maxDarts],
  );

  const buy = useCallback(
    (id: UpgradeId, count: 1 | 10) => {
      if (!engine) return;
      let bought = 0;
      while (bought < count && engine.dispatch({ type: "buy", upgrade: id })) bought++;
      if (bought > 0) {
        analytics.upgradePurchased(id, bought, engine.getSnapshot().state.levels[id]);
      }
    },
    [engine],
  );

  const scale = targetScale(levels);
  return {
    status: loadFailed ? "stopped" : (snapshot?.status ?? "loading"),
    stopReason: loadFailed ? "resync_failed" : snapshot?.stopReason,
    resyncedAt: snapshot?.resyncedAt,
    balance: snapshot?.state.balance ?? ZERO,
    levels,
    dartsLeft: darts,
    maxDarts,
    reloading,
    reloadMs,
    targets,
    targetRadius: (BASE_TARGET_RADIUS * scale.num) / scale.den,
    throwDart,
    buy,
  };
}
