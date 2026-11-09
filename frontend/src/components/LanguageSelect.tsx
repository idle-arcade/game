import { useId } from "react";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type Language } from "../i18n";

type LanguageSelectProps = {
  className?: string;
  /** Hide the visible label on small screens; it stays available to screen readers. */
  compact?: boolean;
  appearance?: "default" | "arcade";
};

/** Labelled language dropdown; i18next persists the choice in localStorage. */
export function LanguageSelect({
  className,
  compact = false,
  appearance = "default",
}: LanguageSelectProps) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const current = (i18n.resolvedLanguage ?? "en") as Language;

  if (appearance === "arcade") {
    return (
      <fieldset
        className={`inline-flex select-none gap-1 rounded-2xl border border-cyan-200/35 bg-[#111735]/95 p-1 shadow-[0_4px_16px_#0005,inset_0_1px_0_#ffffff15] backdrop-blur-sm ${className ?? ""}`}
      >
        <legend className="sr-only">{t("language.label")}</legend>
        {SUPPORTED_LANGUAGES.map((language) => (
          <label key={language} className="relative cursor-pointer">
            <input
              type="radio"
              name={`language-${id}`}
              value={language}
              checked={current === language}
              onChange={() => void i18n.changeLanguage(language)}
              className="peer sr-only"
            />
            <span
              lang={language}
              className="flex min-h-10 items-center rounded-xl px-3 text-sm font-semibold text-indigo-200 transition-[color,background-color,box-shadow] hover:bg-white/10 hover:text-white peer-checked:bg-linear-to-b peer-checked:from-[#34548b] peer-checked:to-[#22335d] peer-checked:text-white peer-checked:shadow-[inset_0_1px_0_#a5edff70,0_0_10px_#1dbfff25] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-200 motion-reduce:transition-none"
            >
              {t(`language.${language}`)}
            </span>
          </label>
        ))}
      </fieldset>
    );
  }

  return (
    <div className={`flex select-none items-center gap-2 text-sm ${className ?? ""}`}>
      <label htmlFor={id} className={compact ? "max-sm:sr-only" : undefined}>
        {t("language.label")}
      </label>
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
