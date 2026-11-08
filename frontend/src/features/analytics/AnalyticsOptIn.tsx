import { useId, useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { LegalModal } from "../auth/LegalModal";
import { analytics } from "./analytics";
import { CheckIcon } from "../../components/icons";

export function AnalyticsOptIn() {
  const { t } = useTranslation();
  const labelId = useId();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice);
  // Hidden while earlier consent is valid; decided once so ticking the box doesn't remove it.
  const [consentedBefore] = useState(() => analytics.getChoice() === "accepted");
  const [privacyOpen, setPrivacyOpen] = useState(false);
  if (!analytics.available || consentedBefore) return null;
  return (
    <div className="rounded-xl border border-indigo-200/10 bg-white/3 px-3.5 py-3 text-sm leading-relaxed text-indigo-100 compact-desktop:px-3 compact-desktop:py-2 compact-desktop:text-xs compact-desktop:leading-4.5">
      <div className="flex items-start gap-3">
        <span className="relative mt-0.5 flex size-5.5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            aria-labelledby={labelId}
            className="peer size-5.5 cursor-pointer appearance-none rounded-md border-2 border-indigo-300/70 bg-[#252944] transition-[background-color,border-color,box-shadow] checked:border-cyan-200 checked:bg-cyan-300 hover:border-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-cyan-200 motion-reduce:transition-none forced-colors:appearance-auto"
            checked={choice === "accepted"}
            onChange={(event) => analytics.choose(event.target.checked ? "accepted" : "rejected")}
          />
          <CheckIcon className="pointer-events-none absolute size-4 text-[#0d2040] opacity-0 peer-checked:opacity-100 forced-colors:hidden" />
        </span>
        <button
          type="button"
          id={labelId}
          className="rounded-sm text-left underline decoration-indigo-300/40 underline-offset-4 hover:text-cyan-100 hover:decoration-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
          onClick={() => setPrivacyOpen(true)}
        >
          {t("analytics.optIn")}
        </button>
      </div>
      {privacyOpen && <LegalModal document="privacy" onClose={() => setPrivacyOpen(false)} />}
    </div>
  );
}
