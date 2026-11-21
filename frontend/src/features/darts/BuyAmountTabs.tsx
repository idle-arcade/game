import { useTranslation } from "react-i18next";
import { BUY_AMOUNTS, type BuyAmount } from "./bulk";

type Props = { value: BuyAmount; onChange(value: BuyAmount): void };

/** How many to buy per click: 1x, 10x, 100x or as many as affordable. */
export function BuyAmountTabs({ value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div role="group" aria-label={t("darts.buyAmount.label")} className="flex gap-1 text-sm">
      {BUY_AMOUNTS.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
          className="rounded border border-transparent px-2 py-0.5 aria-pressed:border-sky-300 aria-pressed:bg-sky-300/20"
        >
          {option === "max" ? t("darts.buyAmount.max") : `${option}x`}
        </button>
      ))}
    </div>
  );
}
