import { useTranslation } from "react-i18next";

export function LockedPanel() {
  const { t } = useTranslation();
  return (
    <section className="flex flex-col items-center justify-center gap-2 p-4 opacity-80">
      <span className="text-4xl" aria-hidden="true">
        🔒
      </span>
      <p className="text-lg">{t("darts.locked")}</p>
    </section>
  );
}
