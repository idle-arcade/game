import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  formatAmount,
  hireCost,
  PLAYER_IDS,
  playerIncome,
  playerLock,
  type PlayerId,
  type PlayerLock,
} from "@idle-arcade/backend/shared";
import { BuyAmountTabs } from "./BuyAmountTabs";
import { quote, type BuyAmount } from "./bulk";
import { formatRatio } from "./format";
import { PriceButton } from "./PriceButton";
import type { DartsGame } from "./useDarts";

/** Sidebar: hire automatic players. Shows the unlocked types and a teaser of the next one. */
export function PlayerShop({ game }: { game: DartsGame }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState<BuyAmount>(1);
  const { players, levels } = game;
  const firstLocked = PLAYER_IDS.findIndex((id) => playerLock(id, players, levels));
  const unlocked = firstLocked === -1 ? PLAYER_IDS : PLAYER_IDS.slice(0, firstLocked);
  const next = firstLocked === -1 ? null : PLAYER_IDS[firstLocked]!;

  return (
    <section aria-labelledby="darts-shop" className="flex flex-col gap-2 p-4">
      <h2 id="darts-shop" className="text-lg font-semibold">
        {t("darts.players.shop")}
      </h2>
      <BuyAmountTabs value={amount} onChange={setAmount} />
      <ul className="divide-y border">
        {unlocked.map((id) => (
          <ShopItem key={id} id={id} amount={amount} game={game} />
        ))}
        {next && <LockedItem id={next} lock={playerLock(next, players, levels)!} game={game} />}
      </ul>
    </section>
  );
}

function ShopItem({ id, amount, game }: { id: PlayerId; amount: BuyAmount; game: DartsGame }) {
  const { t } = useTranslation();
  const owned = game.players[id];
  const name = t(`darts.players.name.${id}`);
  const offer = quote((i) => hireCost(id, owned + i), amount, game.balance)!;
  return (
    <li className="flex items-center gap-2 p-2">
      <span className="text-2xl" aria-hidden="true">
        🧍
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate">{name}</p>
        <p className="text-xs opacity-60">
          {t("darts.players.each", { amount: formatRatio(playerIncome(id)) })}
        </p>
        <div className="mt-1">
          <PriceButton
            quote={offer}
            disabled={game.status !== "running"}
            label={t("darts.players.hire", { count: offer.count, name })}
            onBuy={(count) => game.hire(id, count)}
          />
        </div>
      </div>
      <span className="text-3xl opacity-60" aria-hidden="true">
        {owned}
      </span>
      <span className="sr-only">{t("darts.players.owned", { count: owned })}</span>
    </li>
  );
}

function LockedItem({ id, lock, game }: { id: PlayerId; lock: PlayerLock; game: DartsGame }) {
  const { t } = useTranslation();
  const requirement =
    lock.reason === "endgame"
      ? t("darts.players.requiresEndgame")
      : t("darts.players.requiresPlayer", { name: t(`darts.players.name.${lock.requires}`) });
  return (
    <li className="flex items-center gap-2 bg-neutral-500/10 p-2 opacity-70">
      <span className="text-2xl" aria-hidden="true">
        🔒
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <p>{t("darts.players.unknown")}</p>
        <p className="text-xs">{requirement}</p>
        {/* The price is shown; the name stays a surprise. */}
        <p className="text-xs">{formatAmount(hireCost(id, game.players[id]))} 🍺</p>
      </div>
    </li>
  );
}
