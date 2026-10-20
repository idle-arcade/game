import { useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { LegalModal } from "../auth/LegalModal";
import { analytics } from "./analytics";

export function AnalyticsOptIn() {
  const { t } = useTranslation();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  if (!analytics.available || choice === "accepted") return null;
  return (
    <div className="flex flex-col gap-2 text-sm text-neutral-700">
      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          className="mt-1"
          checked={false}
          onChange={(event) => analytics.choose(event.target.checked ? "accepted" : "rejected")}
        />
        <span>{t("analytics.optIn")}</span>
      </label>
      <p>{t("analytics.optional")}</p>
      <button type="button" className="self-start underline" onClick={() => setPrivacyOpen(true)}>
        {t("legal.privacy")}
      </button>
      {privacyOpen && <LegalModal document="privacy" onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
