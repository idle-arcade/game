import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { analytics } from "../analytics/analytics";

type OnboardingModalProps = {
  onClose: () => void;
  returnFocusRef: RefObject<HTMLHeadingElement | null>;
};

const STEPS = ["welcome", "darts", "progression"] as const;

export function OnboardingModal({ onClose, returnFocusRef }: OnboardingModalProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex] ?? STEPS[0];
  const isLastStep = stepIndex === STEPS.length - 1;
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const heading = returnFocusRef.current;
    dialog?.showModal();

    return () => {
      dialog?.close();
      if (heading?.isConnected) heading.focus();
    };
  }, [returnFocusRef]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [stepIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        analytics.onboarding("skipped", step);
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose, step]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        analytics.onboarding("skipped", step);
        onClose();
      }}
      onClose={(event) => {
        // Strict Mode can reopen the dialog before a cleanup close event arrives.
        if (!event.currentTarget.open) onClose();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg bg-white p-6 text-neutral-900 shadow-lg backdrop:bg-black/50"
    >
      <div className="flex flex-col gap-6">
        <p className="text-center text-sm text-neutral-600">
          {t("onboarding.step", { current: stepIndex + 1, total: STEPS.length })}
        </p>
        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="text-center text-2xl font-bold focus:outline-none"
        >
          {t(`onboarding.steps.${step}.title`)}
        </h2>
        <p id={descriptionId}>{t(`onboarding.steps.${step}.description`)}</p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              analytics.onboarding("skipped", step);
              onClose();
            }}
          >
            {t("onboarding.skip")}
          </Button>
          <Button
            onClick={() => {
              if (isLastStep) {
                analytics.onboarding("completed", step);
                onClose();
              } else setStepIndex(stepIndex + 1);
            }}
          >
            {t(isLastStep ? "onboarding.startPlaying" : "onboarding.continue")}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
