import { Fragment } from "react";
import { useTranslation } from "react-i18next";

export type LegalDocument = "imprint" | "terms" | "privacy";

const DOCUMENTS: LegalDocument[] = ["imprint", "terms", "privacy"];

type LegalFooterProps = {
  onOpen: (document: LegalDocument) => void;
};

export function LegalFooter({ onOpen }: LegalFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="mt-5 flex flex-wrap items-center justify-center gap-x-2 text-sm text-indigo-100 compact-desktop:mt-2">
      {DOCUMENTS.map((document, index) => (
        <Fragment key={document}>
          {index > 0 && <span aria-hidden="true">•</span>}
          <button
            type="button"
            className="min-h-11 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200"
            onClick={() => onOpen(document)}
          >
            {t(`legal.${document}`)}
          </button>
        </Fragment>
      ))}
    </footer>
  );
}
