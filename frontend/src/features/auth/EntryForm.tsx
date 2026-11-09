import type { FormEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { Credentials } from "@idle-arcade/backend/schemas/auth";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import type { AuthErrorKey } from "./authErrors";
import type { CredentialField, FieldError, FieldErrors } from "./validation";
import { AnalyticsOptIn } from "../analytics/AnalyticsOptIn";
import { AlertCircleIcon } from "../../components/icons";

type EntryFormProps = {
  values: Credentials;
  fieldErrors: FieldErrors;
  formError: AuthErrorKey | null;
  pending: boolean;
  usernameRef: RefObject<HTMLInputElement | null>;
  passwordRef: RefObject<HTMLInputElement | null>;
  onChange: (field: CredentialField, value: string) => void;
  onLogin: () => void;
  onRegister: () => void;
};

/** Combined login/register form. Enter submits as login; Register is a separate action. */
export function EntryForm({
  values,
  fieldErrors,
  formError,
  pending,
  usernameRef,
  passwordRef,
  onChange,
  onLogin,
  onRegister,
}: EntryFormProps) {
  const { t } = useTranslation();
  const message = (error?: FieldError) =>
    error && ("values" in error ? t(error.key, error.values) : t(error.key));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onLogin();
  };

  return (
    <form className="flex flex-col gap-5 compact-desktop:gap-3" onSubmit={handleSubmit} noValidate>
      <TextField
        appearance="arcade"
        ref={usernameRef}
        label={t("entry.username")}
        name="username"
        autoComplete="username"
        value={values.username}
        error={message(fieldErrors.username)}
        onChange={(event) => onChange("username", event.target.value)}
      />
      <TextField
        appearance="arcade"
        ref={passwordRef}
        label={t("entry.password")}
        name="password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={message(fieldErrors.password)}
        onChange={(event) => onChange("password", event.target.value)}
      />

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm leading-relaxed text-rose-100 shadow-[inset_3px_0_0_#fb7185]"
        >
          <AlertCircleIcon className="mt-0.5 size-5 shrink-0 text-rose-300" />
          <p className="min-w-0">{t(formError)}</p>
        </div>
      )}

      <AnalyticsOptIn />
      <div className="mt-2 flex gap-3 sm:gap-4 compact-desktop:mt-0">
        <Button
          variant="arcade-register"
          className="flex-1"
          disabled={pending}
          onClick={onRegister}
        >
          {t("entry.register")}
        </Button>
        <Button variant="arcade-login" type="submit" className="flex-1" disabled={pending}>
          {t("entry.login")}
        </Button>
      </div>
    </form>
  );
}
