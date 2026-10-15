import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type Language } from "../i18n";

type LanguageSelectProps = {
  className?: string;
};

/** Labelled language dropdown; i18next persists the choice in localStorage. */
export function LanguageSelect({ className }: LanguageSelectProps) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const current = (i18n.resolvedLanguage ?? "en") as Language;

  return (
    <div className={`flex items-center gap-2 text-sm ${className ?? ""}`}>
      <label htmlFor={id}>{t("language.label")}</label>
      <select
        id={id}
        className="rounded border border-neutral-300 bg-white px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        value={current}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language} value={language}>
            {t(`language.${language}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
