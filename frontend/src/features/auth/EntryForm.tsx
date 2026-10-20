import type { FormEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import type { Credentials } from "@idle-arcade/backend/schemas/auth";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import type { AuthErrorKey } from "./authErrors";
import type { CredentialField, FieldError, FieldErrors } from "./validation";
import { AnalyticsOptIn } from "../analytics/AnalyticsOptIn";

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
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <TextField
        ref={usernameRef}
        label={t("entry.username")}
        name="username"
        autoComplete="username"
        value={values.username}
        error={message(fieldErrors.username)}
        onChange={(event) => onChange("username", event.target.value)}
      />
      <TextField
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
        <p role="alert" className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {t(formError)}
        </p>
      )}

      <AnalyticsOptIn />
      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" disabled={pending} onClick={onRegister}>
          {t("entry.register")}
        </Button>
        <Button type="submit" className="flex-1" disabled={pending}>
          {t("entry.login")}
        </Button>
      </div>
    </form>
  );
}
