import { useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import type { DartsGame } from "./useDarts";

export function SyncStoppedModal({ reason }: { reason: DartsGame["stopReason"] }) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      // Not dismissible: progress made without sync would be lost.
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg bg-white p-6 text-neutral-900 shadow-lg backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-6">
        <h2 id={titleId} className="text-center text-2xl font-bold">
          {t("darts.stopped.title")}
        </h2>
        <p id={descriptionId}>
          {t(reason === "stale_epoch" ? "darts.stopped.elsewhere" : "darts.stopped.generic")}
        </p>
        <div className="flex justify-end">
          <Button onClick={() => window.location.reload()}>{t("darts.stopped.reload")}</Button>
        </div>
      </div>
    </dialog>
  );
}
