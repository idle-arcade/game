import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Credentials } from "@idle-arcade/backend/schemas/auth";
import { trpc } from "../../lib/trpc";
import { authErrorKey, authFailureReason, type AuthErrorKey } from "./authErrors";
import { analytics } from "../analytics/analytics";
import type { AuthAction } from "../analytics/client";
import {
  CREDENTIAL_FIELDS,
  validateLogin,
  validateRegistration,
  type CredentialField,
  type FieldErrors,
} from "./validation";

type PublicUser = { id: string; username: string };

const VALIDATION_REASONS = {
  "validation.required": "required",
  "validation.tooShort": "too_short",
  "validation.tooLong": "too_long",
  "validation.usernameFormat": "invalid_format",
} as const;

/** State and behaviour of the entry screen; the components only render what this returns. */
export function useEntryForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [values, setValues] = useState<Credentials>({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<AuthErrorKey | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSuccess = async (action: AuthAction, user: PublicUser) => {
    analytics.authSuccess(action);
    queryClient.clear(); // never carry cached data over from a previous player
    queryClient.setQueryData(trpc.auth.me.queryKey(), user);
    await navigate({ to: "/darts" });
  };
  const onError = (action: AuthAction, error: unknown) => {
    analytics.authFailure(action, authFailureReason(error));
    setFormError(authErrorKey(error));
  };

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onSuccess: (user) => onSuccess("login", user),
      onError: (error) => onError("login", error),
    }),
  );
  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onSuccess: (user) => onSuccess("register", user),
      onError: (error) => onError("register", error),
    }),
  );
  const pending = login.isPending || register.isPending;

  function setValue(field: CredentialField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(action: AuthAction) {
    if (pending) return;
    setFormError(null);
    const errors = action === "login" ? validateLogin(values) : validateRegistration(values);
    setFieldErrors(errors);

    const firstInvalid = CREDENTIAL_FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      analytics.authFailure(action, "validation_failed", {
        username: errors.username && VALIDATION_REASONS[errors.username.key],
        password: errors.password && VALIDATION_REASONS[errors.password.key],
      });
      (firstInvalid === "username" ? usernameRef : passwordRef).current?.focus();
      return;
    }
    (action === "login" ? login : register).mutate(values);
  }

  return {
    values,
    fieldErrors,
    formError,
    pending,
    usernameRef,
    passwordRef,
    setValue,
    login: () => submit("login"),
    register: () => submit("register"),
  };
}
