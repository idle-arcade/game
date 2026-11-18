import { useTranslation } from "react-i18next";
import { idleIncome, PLAYER_IDS, PLAYERS, type PlayerId } from "@idle-arcade/backend/shared";
import { formatPercent, formatRatio } from "./format";
import type { DartsGame } from "./useDarts";

const MAX_FIGURES = 10;
const MODULE_SLOTS = 3;
const FLIGHT_MS = { min: 400, max: 4000 };
// Training (US18) and modules aren't implemented yet. aria-disabled keeps the tooltip reachable.
const COMING_SOON = "cursor-not-allowed rounded border opacity-50";

/** Main section: one row per owned player type, then a teaser of the next type. */
export function PlayerRows({ game }: { game: DartsGame }) {
  const { t } = useTranslation();
  const owned = PLAYER_IDS.filter((id) => game.players[id] > 0);
  const hasNext = owned.length < PLAYER_IDS.length;

  return (
    <section aria-labelledby="darts-players" className="flex flex-col gap-2 p-4">
      <h2 id="darts-players" className="sr-only">
        {t("darts.players.title")}
      </h2>
      {owned.length === 0 && <p className="text-center opacity-70">{t("darts.players.empty")}</p>}
      {owned.map((id) => (
        <PlayerRow key={id} id={id} count={game.players[id]} />
      ))}
      {owned.length > 0 && hasNext && (
        <p className="flex items-center justify-center gap-2 rounded border border-dashed p-4 opacity-60">
          <span aria-hidden="true">🔒</span>
          {t("darts.players.next")}
        </p>
      )}
    </section>
  );
}

function PlayerRow({ id, count }: { id: PlayerId; count: number }) {
  const { t } = useTranslation();
  const { throwsPerSecond, targetShare } = PLAYERS[id];
  // One dart flight per throw of the whole row, within readable bounds.
  const flightMs = Math.min(
    FLIGHT_MS.max,
    Math.max(
      FLIGHT_MS.min,
      (1000 * Number(throwsPerSecond.den)) / (Number(throwsPerSecond.num) * count),
    ),
  );

  return (
    <article className="flex flex-col gap-2 border-b border-dashed pb-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm">
        <h3 className="font-medium">
          {t(`darts.players.name.${id}`)} <span className="opacity-70">×{count}</span>
        </h3>
        <p className="flex gap-3 text-xs">
          <span>
            <span aria-hidden="true">🍺 </span>
            {t("darts.perSecond", { amount: formatRatio(idleIncome({ [id]: count })) })}
          </span>
          <span>{t("darts.players.throws", { amount: formatRatio(throwsPerSecond) })}</span>
          <span>{t("darts.players.hits", { percent: formatPercent(targetShare) })}</span>
        </p>
      </header>

      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="text-xl tracking-tighter whitespace-nowrap">
          {"🧍".repeat(Math.min(count, MAX_FIGURES))}
          {count > MAX_FIGURES && <span className="text-xs">+{count - MAX_FIGURES}</span>}
        </span>
        <span className="relative h-px flex-1 border-t border-dashed">
          <span
            className="absolute -top-1.5 text-xs motion-reduce:hidden"
            style={{ animation: `darts-flight ${flightMs}ms linear infinite` }}
          >
            ➤
          </span>
        </span>
        <span className="text-xl">🎯</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1">
          {Array.from({ length: MODULE_SLOTS }, (_, slot) => (
            <button
              key={slot}
              type="button"
              aria-disabled="true"
              title={t("darts.players.modulesSoon")}
              aria-label={t("darts.players.moduleSlot", { slot: slot + 1 })}
              className={`size-7 border-dashed ${COMING_SOON}`}
            >
              +
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-disabled="true"
          title={t("darts.players.trainingSoon")}
          className={`px-2 py-0.5 text-sm ${COMING_SOON}`}
        >
          {t("darts.players.train")}
        </button>
      </div>
    </article>
  );
}
