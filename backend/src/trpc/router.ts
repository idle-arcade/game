import { authRouter } from "../routers/auth.js";
import { healthRouter } from "../routers/health.js";
import { router } from "./init.js";

export const appRouter = router({
  auth: authRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
