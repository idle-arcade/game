import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { OnboardingModal } from "../../features/shell/OnboardingModal";
import { persistentStorage } from "../../lib/storage";
import { DartBoard } from "../../features/darts/DartBoard";
import { UpgradesTable } from "../../features/darts/UpgradesTable";
import { LockedPanel } from "../../features/darts/LockedPanel";
import { SyncStoppedModal } from "../../features/darts/SyncStoppedModal";
import { useDarts } from "../../features/darts/useDarts";
import { formatAmount } from "@idle-arcade/backend/shared";

const ONBOARDING_DISMISSED_KEY = "idle-arcade.onboarding-dismissed";

export const Route = createFileRoute("/_game/darts")({
  component: DartsRoom,
});

function DartsRoom() {
  const { t } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const game = useDarts();
  const [showOnboarding, setShowOnboarding] = useState(
    () => persistentStorage.getItem(ONBOARDING_DISMISSED_KEY) !== "true",
  );

  function closeOnboarding() {
    setShowOnboarding(false);
    persistentStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        {t("rooms.darts")}
      </h1>

      <div className="grid flex-1 grid-cols-1 divide-y md:grid-cols-[18rem_1fr_20rem] md:divide-x md:divide-y-0">
        <section aria-label={t("rooms.darts")} className="flex flex-col gap-4 p-4">
          <p className="text-center text-lg font-semibold">
            <span aria-hidden="true">🍺 </span>
            <span className="sr-only">{t("darts.balance")}: </span>
            {game.status === "loading" ? t("darts.loading") : formatAmount(game.balance)}
          </p>
          <ResyncNotice at={game.resyncedAt} />
          <DartBoard game={game} />
          <UpgradesTable game={game} />
        </section>
        <LockedPanel />
        <LockedPanel />
      </div>

      {game.status === "stopped" && <SyncStoppedModal reason={game.stopReason} />}
      {showOnboarding && game.status !== "stopped" && (
        <OnboardingModal onClose={closeOnboarding} returnFocusRef={headingRef} />
      )}
    </>
  );
}

const RESYNC_NOTICE_MS = 3000;

function ResyncNotice({ at }: { at?: number }) {
  const { t } = useTranslation();
  const [expiredAt, setExpiredAt] = useState<number>();

  useEffect(() => {
    if (at === undefined) return;
    const timer = setTimeout(() => setExpiredAt(at), RESYNC_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [at]);

  return (
    <p className="min-h-4 text-center text-xs text-amber-400" aria-live="polite">
      {at !== undefined && at !== expiredAt && t("darts.resynced")}
    </p>
  );
}
