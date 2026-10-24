import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { OnboardingModal } from "../../features/shell/OnboardingModal";
import { DartBoard } from "../../features/darts/DartBoard";
import { UpgradesTable } from "../../features/darts/UpgradesTable";
import { LockedPanel } from "../../features/darts/LockedPanel";
import { useDartsPrototype } from "../../features/darts/useDartsPrototype";

const ONBOARDING_DISMISSED_KEY = "idle-arcade.onboarding-dismissed";

export const Route = createFileRoute("/_game/darts")({
  component: DartsRoom,
});

function DartsRoom() {
  const { t } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const game = useDartsPrototype();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try {
      return sessionStorage.getItem(ONBOARDING_DISMISSED_KEY) !== "true";
    } catch {
      return true;
    }
  });

  function closeOnboarding() {
    setShowOnboarding(false);
    try {
      sessionStorage.setItem(ONBOARDING_DISMISSED_KEY, "true");
    } catch {
      // Dismissal still works when browser storage is unavailable.
    }
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        {t("rooms.darts")}
      </h1>

      <div className="grid flex-1 grid-cols-1 divide-y md:grid-cols-[18rem_1fr_20rem] md:divide-x md:divide-y-0">
        <section aria-label={t("rooms.darts")} className="flex flex-col gap-4 p-4">
          <DartBoard game={game} />
          <UpgradesTable game={game} />
        </section>
        <LockedPanel />
        <LockedPanel />
      </div>

      {showOnboarding && <OnboardingModal onClose={closeOnboarding} returnFocusRef={headingRef} />}
    </>
  );
}
