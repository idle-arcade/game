import { TRPCError } from "@trpc/server";
import { APIError } from "better-auth/api";
import type { Response } from "express";

/** Better Auth requires an email; we only use usernames. Reserved TLD, never mailed or shown. */
export function placeholderEmail(username: string) {
  return `${username.toLowerCase()}@users.idle-arcade.invalid`;
}

/** Copy Better Auth's Set-Cookie headers onto the Express response. */
export function forwardAuthHeaders(res: Response, headers: Headers) {
  for (const cookie of headers.getSetCookie()) res.append("Set-Cookie", cookie);
}

const INVALID_CREDENTIALS = ["INVALID_USERNAME_OR_PASSWORD", "INVALID_EMAIL_OR_PASSWORD"];
const TAKEN = [
  "USERNAME_IS_ALREADY_TAKEN",
  "USER_ALREADY_EXISTS",
  "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL",
];

/** Map Better Auth errors to tRPC errors. Credential failures share one message. */
export function toTRPCError(error: unknown): TRPCError {
  if (!(error instanceof APIError)) {
    return new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
  }
  const code = String(error.body?.code ?? "");
  if (INVALID_CREDENTIALS.includes(code) || error.status === "UNAUTHORIZED") {
    return new TRPCError({ code: "UNAUTHORIZED", message: "Invalid username or password" });
  }
  if (TAKEN.includes(code)) {
    return new TRPCError({ code: "CONFLICT", message: "Username is already taken" });
  }
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return new TRPCError({ code: "BAD_REQUEST", message: error.body?.message ?? error.message });
  }
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
}
