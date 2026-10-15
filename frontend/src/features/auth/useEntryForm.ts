import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { Credentials } from "@idle-arcade/backend/schemas/auth";
import { trpc } from "../../lib/trpc";
import { authErrorKey, type AuthErrorKey } from "./authErrors";
import {
  CREDENTIAL_FIELDS,
  validateLogin,
  validateRegistration,
  type CredentialField,
  type FieldErrors,
} from "./validation";

type PublicUser = { id: string; username: string };

/** State and behaviour of the entry screen; the components only render what this returns. */
export function useEntryForm() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [values, setValues] = useState<Credentials>({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<AuthErrorKey | null>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const onSuccess = async (user: PublicUser) => {
    queryClient.clear(); // never carry cached data over from a previous player
    queryClient.setQueryData(trpc.auth.me.queryKey(), user);
    await navigate({ to: "/darts" });
  };
  const onError = (error: unknown) => setFormError(authErrorKey(error));

  const login = useMutation(trpc.auth.login.mutationOptions({ onSuccess, onError }));
  const register = useMutation(trpc.auth.register.mutationOptions({ onSuccess, onError }));
  const pending = login.isPending || register.isPending;

  function setValue(field: CredentialField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function submit(action: "login" | "register") {
    if (pending) return;
    setFormError(null);
    const errors = action === "login" ? validateLogin(values) : validateRegistration(values);
    setFieldErrors(errors);

    const firstInvalid = CREDENTIAL_FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
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
