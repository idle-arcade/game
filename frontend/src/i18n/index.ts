import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import de from "./locales/de.json";
import en from "./locales/en.json";

export const SUPPORTED_LANGUAGES = ["en", "de"] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const resources = {
  en: { translation: en },
  // `satisfies` makes a key missing from de.json a type error.
  de: { translation: de satisfies typeof en },
} as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    // Only a language the player picked is restored; first visits are always English.
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "idle-arcade.language",
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false }, // React already escapes output
  });

const syncDocumentLanguage = (language: string) => {
  document.documentElement.lang = language;
};
syncDocumentLanguage(i18n.resolvedLanguage ?? "en");
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
