import { Fragment } from "react";
import { useTranslation } from "react-i18next";

export type LegalDocument = "imprint" | "terms" | "privacy";

const DOCUMENTS: LegalDocument[] = ["imprint", "terms", "privacy"];

type LegalFooterProps = {
  /** Opens the given document. Until the legal modals exist (#48) the links are disabled. */
  onOpen?: (document: LegalDocument) => void;
};

export function LegalFooter({ onOpen }: LegalFooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="flex flex-wrap justify-center gap-2 text-sm text-neutral-600">
      {DOCUMENTS.map((document, index) => (
        <Fragment key={document}>
          {index > 0 && <span aria-hidden="true">•</span>}
          <button
            type="button"
            className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
            disabled={!onOpen}
            title={onOpen ? undefined : t("common.comingSoon")}
            onClick={() => onOpen?.(document)}
          >
            {t(`legal.${document}`)}
          </button>
        </Fragment>
      ))}
    </footer>
  );
}
