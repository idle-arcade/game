import { useTranslation } from "react-i18next";
import type { LegalDocument } from "./LegalFooter";

const SECTIONS = [
  "controller",
  "hosting",
  "account",
  "storage",
  "analytics",
  "retention",
  "contact",
  "rights",
] as const;

function Contact() {
  return (
    <address className="not-italic">
      Bastian Biedermann
      <br />
      Kaiserstraße 29
      <br />
      58119 Hagen
      <br />
      Deutschland
      <br />
      <span>bastian&lt;at&gt;biedermailer.de</span>
      <br />
      <a className="underline" href="tel:+4917655576845">
        +49 176 55576845
      </a>
    </address>
  );
}

export function LegalContent({ document }: { document: LegalDocument }) {
  const { t } = useTranslation();
  if (document === "terms") return null;
  if (document === "imprint")
    return (
      <>
        <p>{t("legal.operator")}</p>
        <Contact />
      </>
    );
  return (
    <div className="flex flex-col gap-5 text-sm leading-relaxed">
      <p>{t("legal.updated")}</p>
      {SECTIONS.map((section) => (
        <section key={section} className="flex flex-col gap-2">
          <h3 className="text-base font-semibold">{t(`legal.privacySections.${section}.title`)}</h3>
          {section === "controller" && <Contact />}
          <p className="whitespace-pre-line">{t(`legal.privacySections.${section}.body`)}</p>
          {section === "rights" && (
            <a
              className="underline"
              href="https://www.ldi.nrw.de/kontakt/ihre-beschwerde"
              target="_blank"
              rel="noreferrer"
            >
              {t("legal.authority")}
            </a>
          )}
        </section>
      ))}
    </div>
  );
}
