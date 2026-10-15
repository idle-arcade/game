import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { credentialsSchema, loginSchema } from "../schemas/auth.js";
import { forwardAuthHeaders, placeholderEmail, toTRPCError } from "../trpc/auth-glue.js";
import { protectedProcedure, publicProcedure, router } from "../trpc/init.js";

const toPublicUser = (user: { id: string; name: string }) => ({ id: user.id, username: user.name });

export const authRouter = router({
  register: publicProcedure.input(credentialsSchema).mutation(async ({ ctx, input }) => {
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

  login: publicProcedure.input(loginSchema).mutation(async ({ ctx, input }) => {
    try {
      const { headers, response } = await auth.api.signInUsername({
        body: { username: input.username, password: input.password },
        headers: fromNodeHeaders(ctx.req.headers),
        returnHeaders: true,
      });
      forwardAuthHeaders(ctx.res, headers);
      return toPublicUser(response.user);
    } catch (error) {
      throw toTRPCError(error);
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
