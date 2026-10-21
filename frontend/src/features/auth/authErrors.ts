import { TRPCClientError } from "@trpc/client";
import type { AuthFailureReason } from "../analytics/client";

export type AuthErrorKey =
  | "auth.errors.invalidCredentials"
  | "auth.errors.usernameTaken"
  | "auth.errors.tooManyAttempts"
  | "auth.errors.invalidInput"
  | "auth.errors.unknown";

/** Fixed categories only; never pass error messages, causes or response bodies to analytics. */
export function authFailureReason(error: unknown): AuthFailureReason {
  if (!(error instanceof TRPCClientError)) return "unknown";
  const code = (error.data as { code?: string } | undefined)?.code;
  switch (code) {
    case "UNAUTHORIZED":
      return "invalid_credentials";
    case "CONFLICT":
      return "username_taken";
    case "TOO_MANY_REQUESTS":
      return "rate_limited";
    case "BAD_REQUEST":
      return "invalid_input";
    case "INTERNAL_SERVER_ERROR":
    case "BAD_GATEWAY":
    case "SERVICE_UNAVAILABLE":
    case "GATEWAY_TIMEOUT":
      return "server_error";
    default:
      // Includes transport failures and responses that could not be decoded as tRPC.
      return code ? "unknown" : "request_failed";
  }
}

/** Maps a failed auth call to a translatable message. The backend's own messages are English. */
export function authErrorKey(error: unknown): AuthErrorKey {
  switch (authFailureReason(error)) {
    case "invalid_credentials":
      return "auth.errors.invalidCredentials";
    case "username_taken":
      return "auth.errors.usernameTaken";
    case "rate_limited":
      return "auth.errors.tooManyAttempts";
    case "invalid_input":
      return "auth.errors.invalidInput";
    default:
      return "auth.errors.unknown";
  }
}
