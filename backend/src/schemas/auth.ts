// Shared with the frontend: keep this module free of server-only imports.
import { z } from "zod";

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN, `At least ${USERNAME_MIN} characters`)
  .max(USERNAME_MAX, `At most ${USERNAME_MAX} characters`)
  .regex(USERNAME_PATTERN, "Only letters, numbers and underscores");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `At least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `At most ${PASSWORD_MAX} characters`);

export const credentialsSchema = z.object({ username: usernameSchema, password: passwordSchema });
export type Credentials = z.infer<typeof credentialsSchema>;

/** Login is lenient so every bad credential gets the same generic UNAUTHORIZED. */
export const loginSchema = z.object({
  username: z.string().trim().min(1).max(USERNAME_MAX),
  password: z.string().min(1).max(PASSWORD_MAX),
});
