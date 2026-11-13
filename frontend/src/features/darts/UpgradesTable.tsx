import { useTranslation } from "react-i18next";
import {
  compare,
  formatAmount,
  UPGRADE_IDS,
  UPGRADES,
  upgradeCost,
} from "@idle-arcade/backend/shared";
import type { DartsGame } from "./useDarts";

export function UpgradesTable({ game }: { game: DartsGame }) {
  const { t } = useTranslation();
  const { status, balance, levels, buy } = game;

  return (
    <div>
      <h2 className="mb-1 text-sm">{t("darts.upgrades")}</h2>
      <table className="w-full border text-sm">
        <tbody>
          {UPGRADE_IDS.map((id) => {
            const level = levels[id];
            const { maxLevel } = UPGRADES[id];
            const maxed = level >= maxLevel;
            const cost = maxed ? null : upgradeCost(id, level);
            const disabled = status !== "running" || !cost || compare(balance, cost) < 0;
            return (
              <tr key={id} className="border-b">
                {([1, 10] as const).map((count) => (
                  <td key={count} className="p-1">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => buy(id, count)}
                      className="rounded border px-1 disabled:opacity-40"
                    >
                      {count}x
                    </button>
                  </td>
                ))}
                <td className="p-1">
                  {t(`darts.upgrade.${id}`)}{" "}
                  <span className="text-xs">{t("darts.level", { level, max: maxLevel })}</span>
                </td>
                <td className="p-1 text-right">
                  {cost ? `🍺 ${formatAmount(cost)}` : t("darts.max")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
