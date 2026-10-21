import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createContext } from "./trpc/init.js";
import { appRouter } from "./trpc/router.js";
import { logger, errorDetails } from "./observability/logger.js";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind the Vite dev proxy / nginx
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError({ error, path }) {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          logger.error(
            { procedure: path, code: error.code, error: errorDetails(error.cause ?? error) },
            "tRPC request failed",
          );
        }
      },
    }),
  );
  return app;
}
