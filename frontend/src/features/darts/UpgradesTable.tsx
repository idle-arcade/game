import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isMaxLevel, UPGRADE_IDS, UPGRADES, upgradeCost } from "@idle-arcade/backend/shared";
import { BuyAmountTabs } from "./BuyAmountTabs";
import { quote, type BuyAmount } from "./bulk";
import { PriceButton } from "./PriceButton";
import type { DartsGame } from "./useDarts";

export function UpgradesTable({ game }: { game: DartsGame }) {
  const { t } = useTranslation();
  const { status, balance, levels, buy } = game;
  const [amount, setAmount] = useState<BuyAmount>(1);

  return (
    <section aria-labelledby="darts-upgrades">
      <div className="flex items-center justify-between gap-2">
        <h2 id="darts-upgrades" className="text-sm">
          {t("darts.upgrades")}
        </h2>
        <BuyAmountTabs value={amount} onChange={setAmount} />
      </div>
      <ul className="mt-1 divide-y border">
        {UPGRADE_IDS.map((id) => {
          const level = levels[id];
          const { maxLevel } = UPGRADES[id];
          const name = t(`darts.upgrade.${id}`);
          const offer = quote(
            (i) => (isMaxLevel(id, level + i) ? null : upgradeCost(id, level + i)),
            amount,
            balance,
          );
          return (
            <li key={id} className="flex items-center justify-between gap-2 p-1.5">
              <div className="leading-tight">
                <p className="text-sm">{name}</p>
                <p className="text-xs opacity-60">
                  {maxLevel === null
                    ? t("darts.levelNoMax", { level })
                    : t("darts.level", { level, max: maxLevel })}
                </p>
              </div>
              {offer ? (
                <PriceButton
                  quote={offer}
                  disabled={status !== "running"}
                  label={t("darts.buyUpgrade", { count: offer.count, name })}
                  onBuy={(count) => buy(id, count)}
                />
              ) : (
                <span className="text-xs opacity-60">{t("darts.max")}</span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
