import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { LegalFooter, type LegalDocument } from "../auth/LegalFooter";
import { LegalModal } from "../auth/LegalModal";
import { analytics } from "./analytics";

export function AnalyticsControls() {
  const { t } = useTranslation();
  const pathname = useLocation({ select: (location) => location.pathname });
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [oldEnough, setOldEnough] = useState(false);
  const visible = analytics.available && settingsOpen;

  useEffect(() => {
    analytics.pageview(pathname);
  }, [pathname, choice]);

  useEffect(() => {
    // Update the UI after consent expires, even if the page stays open.
    const timer = setInterval(() => analytics.sync(), 60_000);
    return () => clearInterval(timer);
  }, []);

  function choose(accepted: boolean) {
    analytics.choose(accepted ? "accepted" : "rejected");
    setSettingsOpen(false);
    setOldEnough(false);
  }

  return (
    <div className="border-t border-neutral-200 bg-neutral-100 p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <LegalFooter onOpen={setLegalDocument} />
        {analytics.available && (
          <button
            type="button"
            className="self-center text-sm underline"
            onClick={() => setSettingsOpen(!settingsOpen)}
          >
            {t("analytics.settings")}
          </button>
        )}
        {visible && (
          <section
            aria-labelledby="analytics-title"
            className="flex flex-col gap-3 rounded-lg border border-neutral-300 bg-white p-4 text-sm"
          >
            <h2 id="analytics-title" className="text-lg font-semibold">
              {t("analytics.title")}
            </h2>
            <p>{t("analytics.description")}</p>
            <button
              type="button"
              className="self-start underline"
              onClick={() => setLegalDocument("privacy")}
            >
              {t("legal.privacy")}
            </button>
            <p>{t(choice === "accepted" ? "analytics.active" : "analytics.inactive")}</p>
            {choice !== "accepted" && (
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={oldEnough}
                  onChange={(event) => setOldEnough(event.target.checked)}
                />
                {t("analytics.age")}
              </label>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => choose(false)}>
                {t(choice === "accepted" ? "analytics.withdraw" : "analytics.reject")}
              </Button>
              {choice !== "accepted" && (
                <Button
                  variant="secondary"
                  className="flex-1"
                  disabled={!oldEnough}
                  onClick={() => choose(true)}
                >
                  {t("analytics.accept")}
                </Button>
              )}
            </div>
          </section>
        )}
        {legalDocument && (
          <LegalModal document={legalDocument} onClose={() => setLegalDocument(null)} />
        )}
      </div>
    </div>
  );
}
