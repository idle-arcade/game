import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { generateOpenAPIDocument } from "@trpc/openapi";

const cacheDirectory = new URL("../.cache/", import.meta.url);
const target = new URL("openapi.json", cacheDirectory);
const temporary = new URL(`openapi.${process.pid}.tmp`, cacheDirectory);

// Run without native TS loading: the alpha generator otherwise tries to import
// the router for descriptions, which could initialize the database and auth.
const document = await generateOpenAPIDocument(
  fileURLToPath(new URL("../src/trpc/router.ts", import.meta.url)),
  {
    exportName: "AppRouter",
    title: "Idle Arcade API",
    version: "1.0.0",
    servers: [{ url: "/trpc" }],
  },
);

if (Object.keys(document.paths ?? {}).length === 0) {
  throw new Error("OpenAPI generation found no procedures; keeping the previous specification.");
}

await mkdir(cacheDirectory, { recursive: true });
try {
  await writeFile(temporary, JSON.stringify(document, null, 2) + "\n");
  await rename(temporary, target);
} finally {
  await rm(temporary, { force: true });
}
console.log("Generated .cache/openapi.json");
