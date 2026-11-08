import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelect } from "../../components/LanguageSelect";
import { EntryForm } from "./EntryForm";
import { LegalFooter, type LegalDocument } from "./LegalFooter";
import { LegalModal } from "./LegalModal";
import { useEntryForm } from "./useEntryForm";
import titleImage from "../../assets/entry/idle-arcade-title.webp";
import backgroundImage from "../../assets/entry/arcade-background.webp";

/** Combined login/register entry screen (mockup: "Combined Login and Register Screen"). */
export function EntryScreen() {
  const { t } = useTranslation();
  const form = useEntryForm();
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);
  const [titleUnavailable, setTitleUnavailable] = useState(false);
  const [backgroundUnavailable, setBackgroundUnavailable] = useState(false);

  return (
    <div className="relative isolate flex min-h-svh flex-col items-center bg-[#080f30] px-4 pt-20 pb-8 text-violet-50">
      {!backgroundUnavailable && (
        <img
          src={backgroundImage}
          alt=""
          className="pointer-events-none fixed inset-0 -z-20 h-full w-full object-cover object-center max-sm:object-[48%_center]"
          onError={() => setBackgroundUnavailable(true)}
        />
      )}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-linear-to-b from-[#05091f]/10 to-[#05091f]/35" />
      <LanguageSelect appearance="arcade" className="absolute top-4 right-4" />
      <main className="my-auto flex w-full max-w-4xl flex-col items-center gap-5 sm:gap-7">
        <h1 className="m-0 w-full max-w-[52rem] text-center leading-none">
          <span
            className={
              titleUnavailable
                ? "block py-4 text-[clamp(2.5rem,7vw,4rem)] font-black text-amber-300 drop-shadow-lg"
                : "sr-only"
            }
          >
            {t("app.title")}
          </span>
          {!titleUnavailable && (
            <img
              src={titleImage}
              alt=""
              width={1774}
              height={887}
              className="block h-auto w-full drop-shadow-[0_0.5rem_1.5rem_#030519a6]"
              fetchPriority="high"
              onError={() => setTitleUnavailable(true)}
            />
          )}
        </h1>
        <div className="w-full max-w-[40rem] rounded-[1.75rem] bg-linear-to-br from-cyan-300 via-blue-500 to-violet-500 p-0.5 shadow-[0_0_1.25rem_#21c8ff3b,0_1rem_3rem_#02051a99] max-sm:rounded-3xl">
          <div className="rounded-[calc(1.75rem-2px)] bg-linear-to-br from-[#171a3b] to-[#10132e] px-[clamp(1.25rem,6vw,4rem)] pt-[clamp(1.75rem,5vw,3rem)] pb-[clamp(1.25rem,4vw,2.25rem)] max-sm:rounded-[calc(1.5rem-2px)]">
            <EntryForm
              values={form.values}
              fieldErrors={form.fieldErrors}
              formError={form.formError}
              pending={form.pending}
              usernameRef={form.usernameRef}
              passwordRef={form.passwordRef}
              onChange={form.setValue}
              onLogin={form.login}
              onRegister={form.register}
            />
            <LegalFooter onOpen={setLegalDocument} />
          </div>
        </div>
      </main>
      {legalDocument && (
        <LegalModal document={legalDocument} onClose={() => setLegalDocument(null)} />
      )}
    </div>
  );
}
