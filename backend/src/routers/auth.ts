import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { credentialsSchema, loginSchema } from "../schemas/auth.js";
import {
  forwardAuthHeaders,
  placeholderEmail,
  toLoginTRPCError,
  toTRPCError,
} from "../trpc/auth-glue.js";
import { protectedProcedure, publicProcedure, router } from "../trpc/init.js";
import { rateLimit } from "../trpc/rate-limit.js";

const toPublicUser = (user: { id: string; name: string }) => ({ id: user.id, username: user.name });

// Per client IP. Applied before input validation so malformed attempts count too.
const registerLimit = rateLimit({ windowMs: 60 * 60_000, max: 5 });
const loginLimit = rateLimit({ windowMs: 5 * 60_000, max: 10 });

export const authRouter = router({
  register: publicProcedure
    .use(registerLimit)
    .input(credentialsSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { headers, response } = await auth.api.signUpEmail({
          body: {
            email: placeholderEmail(input.username),
            password: input.password,
            name: input.username,
            username: input.username,
          },
          headers: fromNodeHeaders(ctx.req.headers),
          returnHeaders: true,
        });
        forwardAuthHeaders(ctx.res, headers);
        return toPublicUser(response.user);
      } catch (error) {
        throw toTRPCError(error);
      }
    }),

  login: publicProcedure
    .use(loginLimit)
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { headers, response } = await auth.api.signInUsername({
          body: { username: input.username, password: input.password },
          headers: fromNodeHeaders(ctx.req.headers),
          returnHeaders: true,
        });
        forwardAuthHeaders(ctx.res, headers);
        return toPublicUser(response.user);
      } catch (error) {
        throw toLoginTRPCError(error);
      }
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const { headers } = await auth.api.signOut({
        headers: fromNodeHeaders(ctx.req.headers),
        returnHeaders: true,
      });
      forwardAuthHeaders(ctx.res, headers);
      return { success: true as const };
    } catch (error) {
      throw toTRPCError(error);
    }
  }),

  me: publicProcedure.query(({ ctx }) => (ctx.user ? toPublicUser(ctx.user) : null)),
});
