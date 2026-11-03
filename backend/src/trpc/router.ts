import { authRouter } from "../routers/auth.js";
import { currencyRouter } from "../routers/currency.js";
import { healthRouter } from "../routers/health.js";
import { router } from "./init.js";

export const appRouter = router({
  auth: authRouter,
  currency: currencyRouter,
  health: healthRouter,
});

export type AppRouter = typeof appRouter;
