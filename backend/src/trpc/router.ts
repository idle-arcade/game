import { healthRouter } from "../routers/health.js";
import { router } from "./init.js";

export const appRouter = router({
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
