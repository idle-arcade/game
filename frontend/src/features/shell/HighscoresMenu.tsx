import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "../../components/icons";
import { Button } from "../../components/ui/Button";

type Entry = { name: string; score: number; isYou?: boolean };

// Mock-Daten wie im Mockup; echte Daten kommen später vom Backend.
const MOCK_SCORES: Entry[] = [
  { name: "ASH", score: 12840 },
  { name: "NOVA", score: 11200 },
  { name: "PIXEL", score: 9875 },
  { name: "YOU", score: 8450, isYou: true },
  { name: "LUNA", score: 7320 },
  { name: "KAI", score: 6100 },
  { name: "MAX", score: 5480 },
  { name: "ZOE", score: 4250 },
  { name: "REX", score: 3900 },
  { name: "IVY", score: 2760 },
];

/** Highscores dropdown with mock data (prototype). */
export function HighscoresMenu() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const format = new Intl.NumberFormat(i18n.language);

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
        onClick={() => setOpen((o) => !o)}
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
          <table className="w-full text-sm">
            <caption className="sr-only">{t("shell.highscores")}</caption>
            <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th scope="col" className="w-8 py-1 font-normal">#</th>
              <th scope="col" className="py-1 font-normal">{t("highscores.name")}</th>
              <th scope="col" className="py-1 text-right font-normal">{t("highscores.score")}</th>
            </tr>
            </thead>
            <tbody>
            {MOCK_SCORES.map((e, i) => (
              <tr
                key={e.name}
                aria-current={e.isYou ? "true" : undefined}
                className={e.isYou ? "bg-amber-50 outline outline-1 outline-amber-400" : ""}
              >
                <td className="px-1 py-0.5">{i + 1}</td>
                <td className="py-0.5">{e.isYou ? t("highscores.you") : e.name}</td>
                <td className="px-1 py-0.5 text-right tabular-nums">{format.format(e.score)}</td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
