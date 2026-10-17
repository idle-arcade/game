import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { OnboardingModal } from "../../features/shell/OnboardingModal";

const ONBOARDING_DISMISSED_KEY = "idle-arcade.onboarding-dismissed";

export const Route = createFileRoute("/_game/darts")({
  component: DartsRoom,
});

// Placeholder; the Darts room itself is built in US02.
function DartsRoom() {
  const { t } = useTranslation();
  const headingRef = useRef<HTMLHeadingElement>(null);
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
      <h1 ref={headingRef} tabIndex={-1} className="text-xl font-semibold">
        {t("rooms.darts")}
      </h1>
      {showOnboarding && <OnboardingModal onClose={closeOnboarding} returnFocusRef={headingRef} />}
    </>
  );
}
