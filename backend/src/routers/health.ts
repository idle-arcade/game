import { prisma } from "../db.js";
import { publicProcedure, router } from "../trpc/init.js";

export const healthRouter = router({
  check: publicProcedure.query(async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok" as const };
  }),
});
