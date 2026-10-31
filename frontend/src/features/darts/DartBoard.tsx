import { useTranslation } from "react-i18next";
import { COOLDOWN_MS, type DartsGame } from "./useDartsPrototype";

// Segmentreihenfolge ab 12 Uhr im Uhrzeigersinn (echtes Dartboard)
const NUMBERS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return [r * Math.cos(a), r * Math.sin(a)];
}

function wedge(r1: number, r2: number, i: number) {
  const a0 = -99 + i * 18; // Segment 20 liegt mittig oben
  const a1 = a0 + 18;
  const [x1, y1] = polar(r2, a0);
  const [x2, y2] = polar(r2, a1);
  const [x3, y3] = polar(r1, a1);
  const [x4, y4] = polar(r1, a0);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
}

// [innerRadius, outerRadius, colorEven, colorOdd]
const RINGS: [number, number, string, string][] = [
  [162, 170, "#16a34a", "#dc2626"], // Double
  [107, 162, "#1f2937", "#e5e7eb"], // Single außen
  [99, 107, "#16a34a", "#dc2626"], // Triple
  [16, 99, "#1f2937", "#e5e7eb"], // Single innen
];

export function DartBoard({ game }: { game: DartsGame }) {
  const { t } = useTranslation();
  const { coins, dartsLeft, maxDarts, reloading, targets, throwDart } = game;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-center text-xs leading-tight">
        {t("darts.hintClick")}
        <br />
        {t("darts.hintHit")}
      </p>

      <svg
        viewBox="-180 -180 360 360"
        className={`w-full max-w-60 ${reloading ? "opacity-50" : "cursor-crosshair"}`}
        onClick={() => throwDart()}
        aria-hidden="true"
      >
        <circle r="175" fill="#111" stroke="#9ca3af" />
        {RINGS.map(([r1, r2, even, odd]) =>
          NUMBERS.map((n, i) => (
            <path key={`${r1}-${n}`} d={wedge(r1, r2, i)} fill={i % 2 === 0 ? even : odd} />
          )),
        )}
        <circle r="16" fill="#16a34a" />
        <circle r="6" fill="#dc2626" />
        {targets.map((tg) => (
          <circle
            key={tg.id}
            cx={tg.x}
            cy={tg.y}
            r="12"
            fill="#f87171"
            stroke="#fff"
            strokeWidth="2"
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              throwDart(tg.id);
            }}
          />
        ))}
      </svg>

      {/* Tastatur-/Screenreader-Alternative zum Klick aufs Board */}
      <button type="button" className="sr-only" disabled={reloading} onClick={() => throwDart()}>
        {t("darts.throw")}
      </button>

      <div className="flex items-center gap-2" aria-live="polite">
        <span aria-hidden="true">
          {Array.from({ length: maxDarts }, (_, i) => (i < dartsLeft ? "🎯" : "⚪"))}
        </span>
        <span className="text-sm">
          {dartsLeft}/{maxDarts}
        </span>
      </div>

      {reloading && (
        <div className="w-full">
          <p className="text-xs">{t("darts.reloading")}</p>
          <div className="h-1 w-full overflow-hidden rounded bg-gray-700">
            <div
              className="h-full origin-left bg-amber-400"
              style={{ animation: `darts-reload ${COOLDOWN_MS}ms linear forwards` }}
            />
          </div>
        </div>
      )}

      <p className="text-sm font-medium">🪙 {coins}</p>
    </div>
  );
}
