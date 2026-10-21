import { createApp } from "./app.js";
import { prisma } from "./db.js";
import { env } from "./env.js";
import { logger, errorDetails } from "./observability/logger.js";
import { shutdownTelemetry } from "./instrumentation.js";

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "Backend listening");
});

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  logger.info("Backend shutting down");
  // Bound draining and exporter shutdown to Docker's normal termination grace period.
  const timeout = setTimeout(() => process.exit(1), 9000);
  timeout.unref();
  try {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await prisma.$disconnect();
    await shutdownTelemetry();
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) {
    logger.error({ error: errorDetails(error) }, "Backend shutdown failed");
    process.exit(1);
  }
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
