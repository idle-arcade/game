import { authRouter } from "../routers/auth.js";
import { currencyRouter } from "../routers/currency.js";
import { dartsRouter } from "../routers/darts.js";
import { healthRouter } from "../routers/health.js";
import { highscoresRouter } from "../routers/highscores.js";
import { router } from "./init.js";

export const appRouter = router({
  auth: authRouter,
  currency: currencyRouter,
  darts: dartsRouter,
  health: healthRouter,
  highscores: highscoresRouter,
});

export type AppRouter = typeof appRouter;
