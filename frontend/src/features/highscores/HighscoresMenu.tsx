import { useEffect, useId, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { BoardRow } from "@idle-arcade/backend/shared";
import { ChevronDownIcon } from "../../components/icons";
import { Button } from "../../components/ui/Button";
import { analytics } from "../analytics/analytics";
import { ROOMS } from "../shell/rooms";
import { useHighscores } from "./useHighscores";

/** Highscores dropdown (mockup "Highscores"): the active room's top 10 plus the player's own row. */
export function HighscoresMenu() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const room = (ROOMS.find((r) => pathname.startsWith(r.to)) ?? ROOMS[0]).id;
  const board = useHighscores(room, open);

  // Schließen per Klick außerhalb oder Escape
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      rootRef.current?.querySelector("button")?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-1 text-sm"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          if (!open) analytics.highscoresViewed();
          setOpen(!open);
        }}
      >
        {t("shell.highscores")}
        <span className={`inline-flex transition-transform ${open ? "rotate-180" : ""}`}>
          <ChevronDownIcon />
        </span>
      </Button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-neutral-200 bg-white p-3 text-neutral-900 shadow-lg"
        >
          {board.status === "loading" && (
            <p className="py-2 text-center text-sm text-neutral-500">{t("highscores.loading")}</p>
          )}
          {board.status === "error" && (
            <div className="flex flex-col items-center gap-2 py-2 text-sm">
              <p role="alert">{t("highscores.error")}</p>
              <Button variant="ghost" className="text-sm" onClick={board.retry}>
                {t("highscores.retry")}
              </Button>
            </div>
          )}
          {board.status === "ready" && board.rows.length === 0 && !board.ownBelow && (
            <p className="py-2 text-center text-sm text-neutral-500">{t("highscores.empty")}</p>
          )}
          {board.status === "ready" && (board.rows.length > 0 || board.ownBelow) && (
            <table
              className={`w-full text-sm transition-opacity ${board.refreshing ? "opacity-80" : ""}`}
            >
              <caption className="sr-only">
                {t("highscores.title")}: {t(`rooms.${room}`)}
              </caption>
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th scope="col" className="w-8 py-1 font-normal">
                    #
                  </th>
                  <th scope="col" className="py-1 font-normal">
                    {t("highscores.name")}
                  </th>
                  <th scope="col" className="py-1 text-right font-normal">
                    {t("highscores.score")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {board.rows.map((row) => (
                  <ScoreRow key={row.userId} row={row} />
                ))}
              </tbody>
              {board.ownBelow && (
                <tbody className="border-t border-neutral-300">
                  <ScoreRow row={board.ownBelow} />
                </tbody>
              )}
            </table>
          )}
          {board.stale && (
            <p className="mt-2 text-center text-xs text-neutral-500">{t("highscores.stale")}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ row }: { row: BoardRow }) {
  return (
    <tr
      aria-current={row.own ? "true" : undefined}
      className={row.own ? "bg-amber-50 outline-1 outline-amber-400" : ""}
    >
      <td className="px-1 py-0.5">{row.rank}</td>
      <td className="max-w-36 truncate py-0.5">{row.name}</td>
      <td className="px-1 py-0.5 text-right tabular-nums">{row.formatted}</td>
    </tr>
  );
}
