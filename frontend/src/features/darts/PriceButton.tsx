import { formatAmount } from "@idle-arcade/backend/shared";
import type { Quote } from "./bulk";

type Props = { quote: Quote; disabled: boolean; label: string; onBuy(count: number): void };

/** Buy button that shows the price; red when the balance isn't enough. */
export function PriceButton({ quote, disabled, label, onBuy }: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled || !quote.affordable}
      onClick={() => onBuy(quote.count)}
      className="shrink-0 rounded border border-sky-300 bg-sky-300/20 px-2 py-0.5 text-sm whitespace-nowrap enabled:hover:bg-sky-300/40 disabled:border-neutral-500 disabled:bg-transparent"
    >
      {quote.count > 1 && <span className="mr-1 text-xs opacity-70">{quote.count}x</span>}
      <span className={quote.affordable ? "" : "text-red-400"}>{formatAmount(quote.total)}</span>
      <span aria-hidden="true"> 🍺</span>
    </button>
  );
}
