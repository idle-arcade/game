import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // process.env instead of env() so `prisma generate` works without a database URL (e.g. in Docker builds).
  datasource: { url: process.env["DATABASE_URL"] },
});
