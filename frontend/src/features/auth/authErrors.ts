import { TRPCClientError } from "@trpc/client";

export type AuthErrorKey =
  | "auth.errors.invalidCredentials"
  | "auth.errors.usernameTaken"
  | "auth.errors.tooManyAttempts"
  | "auth.errors.invalidInput"
  | "auth.errors.unknown";

/** Maps a failed auth call to a translatable message. The backend's own messages are English. */
export function authErrorKey(error: unknown): AuthErrorKey {
  if (!(error instanceof TRPCClientError)) return "auth.errors.unknown";
  const code = (error.data as { code?: string } | undefined)?.code;
  switch (code) {
    case "UNAUTHORIZED":
      return "auth.errors.invalidCredentials";
    case "CONFLICT":
      return "auth.errors.usernameTaken";
    case "TOO_MANY_REQUESTS":
      return "auth.errors.tooManyAttempts";
    case "BAD_REQUEST":
      return "auth.errors.invalidInput";
    default:
      return "auth.errors.unknown";
  }
}
