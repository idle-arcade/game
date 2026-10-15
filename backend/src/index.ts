import { createApp } from "./app.js";
import { prisma } from "./db.js";
import { env } from "./env.js";

const server = createApp().listen(env.PORT, () => {
  console.log(`Backend listening on http://localhost:${env.PORT}/trpc`);
});

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
