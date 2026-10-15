import { credentialsSchema, type Credentials } from "@idle-arcade/backend/schemas/auth";

export type CredentialField = keyof Credentials;

/** A translatable validation message: an i18n key plus its interpolation values. */
export type FieldError =
  | { key: "validation.required" }
  | { key: "validation.tooShort"; values: { min: number } }
  | { key: "validation.tooLong"; values: { max: number } }
  | { key: "validation.usernameFormat" };

export type FieldErrors = Partial<Record<CredentialField, FieldError>>;

export const CREDENTIAL_FIELDS = ["username", "password"] as const satisfies CredentialField[];

function requiredErrors(values: Credentials): FieldErrors {
  const errors: FieldErrors = {};
  for (const field of CREDENTIAL_FIELDS) {
    if (!values[field].trim()) errors[field] = { key: "validation.required" };
  }
  return errors;
}

/** Login only needs both fields filled; everything else is the server's "invalid credentials". */
export function validateLogin(values: Credentials): FieldErrors {
  return requiredErrors(values);
}

/** Registration uses the backend's schema, so client and server rules cannot drift apart. */
export function validateRegistration(values: Credentials): FieldErrors {
  const errors = requiredErrors(values);
  const result = credentialsSchema.safeParse(values);
  if (result.success) return errors;

  for (const issue of result.error.issues) {
    const field = issue.path[0] as CredentialField;
    if (errors[field]) continue; // keep the first message per field
    if (issue.code === "too_small") {
      errors[field] = { key: "validation.tooShort", values: { min: Number(issue.minimum) } };
    } else if (issue.code === "too_big") {
      errors[field] = { key: "validation.tooLong", values: { max: Number(issue.maximum) } };
    } else if (issue.code === "invalid_format" && field === "username") {
      errors[field] = { key: "validation.usernameFormat" };
    }
  }
  return errors;
}
