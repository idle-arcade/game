import { useTranslation } from "react-i18next";
import { UPGRADES, upgradeCost, type DartsGame } from "./useDartsPrototype";

function formatCost(n: number) {
  return n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : String(n);
}

export function UpgradesTable({ game }: { game: DartsGame }) {
  const { t } = useTranslation();
  const { coins, levels, buy } = game;

  return (
    <div>
      <h2 className="mb-1 text-sm">{t("darts.upgrades")}</h2>
      <table className="w-full border text-sm">
        <tbody>
          {UPGRADES.map(({ id }) => {
            const cost = upgradeCost(id, levels[id]);
            return (
              <tr key={id} className="border-b">
                <td className="p-1">
                  <button
                    type="button"
                    disabled={coins < cost}
                    onClick={() => buy(id, 1)}
                    className="rounded border px-1 disabled:opacity-40"
                  >
                    1x
                  </button>
                </td>
                <td className="p-1">
                  <button
                    type="button"
                    onClick={() => buy(id, 10)}
                    className="rounded border px-1 disabled:opacity-40"
                    disabled={coins < cost}
                  >
                    10x
                  </button>
                </td>
                <td className="p-1">
                  {t(`darts.upgrade.${id}`)} <span className="text-xs">Lv {levels[id]}</span>
                </td>
                <td className="p-1 text-right">🪙 {formatCost(cost)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
