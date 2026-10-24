import { useEffect, useState } from "react";

export const COOLDOWN_MS = 5000;
const BASE_DARTS = 3;
const TARGET_COUNT = 4;
const BOARD_RADIUS = 170;

export type Target = { id: number; x: number; y: number };
export type UpgradeId = "betterDarts" | "moreDarts";

export const UPGRADES: { id: UpgradeId; baseCost: number }[] = [
  { id: "betterDarts", baseCost: 100 },
  { id: "moreDarts", baseCost: 2000 },
];

let nextId = 0;
function randomTarget(): Target {
  const r = Math.sqrt(Math.random()) * (BOARD_RADIUS - 20);
  const a = Math.random() * Math.PI * 2;
  return { id: nextId++, x: r * Math.cos(a), y: r * Math.sin(a) };
}

export function upgradeCost(id: UpgradeId, level: number) {
  const base = UPGRADES.find((u) => u.id === id)!.baseCost;
  return Math.round(base * 1.5 ** level);
}

export function useDartsPrototype() {
  const [coins, setCoins] = useState(0);
  const [dartsLeft, setDartsLeft] = useState(BASE_DARTS);
  const [levels, setLevels] = useState<Record<UpgradeId, number>>({
    betterDarts: 0,
    moreDarts: 0,
  });
  const [targets, setTargets] = useState<Target[]>(() =>
    Array.from({ length: TARGET_COUNT }, randomTarget),
  );

  const maxDarts = BASE_DARTS + levels.moreDarts;
  const multiplier = 1 + levels.betterDarts;
  const reloading = dartsLeft === 0;

  // Wartezeit: Wenn keine Darts mehr da sind, wird nach COOLDOWN_MS aufgefüllt.
  useEffect(() => {
    if (dartsLeft > 0) return;
    const timer = setTimeout(() => setDartsLeft(maxDarts), COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [dartsLeft, maxDarts]);

  function throwDart(hitId?: number) {
    if (dartsLeft <= 0) return;
    setDartsLeft((d) => d - 1);
    if (hitId === undefined) {
      setCoins((c) => c + 1 * multiplier);
    } else {
      setCoins((c) => c + 10 * multiplier);
      setTargets((ts) => ts.map((t) => (t.id === hitId ? randomTarget() : t)));
    }
  }

  function buy(id: UpgradeId, amount: 1 | 10) {
    let budget = coins;
    let level = levels[id];
    let bought = 0;
    for (let i = 0; i < amount; i++) {
      const cost = upgradeCost(id, level);
      if (budget < cost) break;
      budget -= cost;
      level++;
      bought++;
    }
    if (bought === 0) return;
    setCoins(budget);
    setLevels((l) => ({ ...l, [id]: level }));
  }

  return { coins, dartsLeft, maxDarts, reloading, targets, levels, throwDart, buy };
}

export type DartsGame = ReturnType<typeof useDartsPrototype>;
