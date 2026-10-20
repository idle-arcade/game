import { useId, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { LegalModal } from "../auth/LegalModal";
import { analytics } from "./analytics";

export function AnalyticsOptIn() {
  const { t } = useTranslation();
  const labelId = useId();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice);
  // Hidden while earlier consent is valid; decided once so ticking the box doesn't remove it.
  const [consentedBefore] = useState(() => analytics.getChoice() === "accepted");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  if (!analytics.available || consentedBefore) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        className="mt-1"
        aria-labelledby={labelId}
        checked={choice === "accepted"}
        onChange={(event) => analytics.choose(event.target.checked ? "accepted" : "rejected")}
      />
      {/* The text opens the privacy notice, so it can't be the checkbox's <label>. */}
      <button
        type="button"
        id={labelId}
        className="text-left underline"
        onClick={() => setPrivacyOpen(true)}
      >
        {t("analytics.optIn")}
      </button>
      {privacyOpen && <LegalModal document="privacy" onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
