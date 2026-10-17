import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import type { LegalDocument } from "./LegalFooter";

type LegalModalProps = {
  document: LegalDocument;
  onClose: () => void;
};

export function LegalModal({ document: legalDocument, onClose }: LegalModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    dialog?.showModal();

    return () => {
      dialog?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onClose={(event) => {
        // Strict Mode can reopen the dialog before a cleanup close event arrives.
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          event.currentTarget.close();
        }
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg bg-white p-6 text-neutral-900 shadow-lg backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-6">
        <h2 id={titleId} className="text-2xl font-bold">
          {t(`legal.${legalDocument}`)}
        </h2>
        <p id={descriptionId} className="text-sm text-neutral-600">
          {t("legal.placeholder")}
        </p>
        <p>{t(`legal.content.${legalDocument}`)}</p>
        <Button autoFocus className="self-end" onClick={() => dialogRef.current?.close()}>
          {t("legal.close")}
        </Button>
      </div>
    </dialog>
  );
}
