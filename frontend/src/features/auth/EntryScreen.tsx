import { useTranslation } from "react-i18next";
import { LanguageSelect } from "../../components/LanguageSelect";
import { EntryForm } from "./EntryForm";
import { useEntryForm } from "./useEntryForm";

/** Combined login/register entry screen (mockup: "Combined Login and Register Screen"). */
export function EntryScreen() {
  const { t } = useTranslation();
  const form = useEntryForm();

  return (
    <div className="relative flex min-h-[calc(100dvh-6rem)] flex-col items-center justify-center gap-6 bg-neutral-100 p-4 pt-16">
      <LanguageSelect className="absolute top-4 right-4" />
      <main className="flex w-full max-w-sm flex-col gap-6 rounded-lg bg-white p-8 shadow">
        <h1 className="text-center text-3xl font-bold">{t("app.title")}</h1>
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
      </main>
    </div>
  );
}
