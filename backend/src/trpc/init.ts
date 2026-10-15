import { initTRPC, TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import { z, ZodError } from "zod";
import { auth } from "../auth.js";
import { env } from "../env.js";
import { forwardAuthHeaders } from "./auth-glue.js";

async function readSession({ req, res }: CreateExpressContextOptions) {
  try {
    const { headers, response } = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
      returnHeaders: true,
    });
    // Better Auth slides the session expiry here; forward its refreshed cookie.
    forwardAuthHeaders(res, headers);
    return response;
  } catch {
    // An unreadable or concurrently deleted session counts as "logged out", never as a 500.
    return null;
  }
}

export async function createContext(opts: CreateExpressContextOptions) {
  const session = await readSession(opts);
  return {
    req: opts.req,
    res: opts.res,
    session: session?.session ?? null,
    user: session?.user ?? null,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    const hideInternals = env.NODE_ENV === "production" && error.code === "INTERNAL_SERVER_ERROR";
    return {
      ...shape,
      message: hideInternals ? "Internal server error" : shape.message,
      data: {
        ...shape.data,
        fieldErrors:
          error.cause instanceof ZodError ? z.flattenError(error.cause).fieldErrors : null,
      },
    };
  },
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { ...ctx, session: ctx.session, user: ctx.user } });
});
