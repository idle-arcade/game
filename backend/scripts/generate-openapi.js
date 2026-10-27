import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { generateOpenAPIDocument } from "@trpc/openapi";
import { tsImport } from "tsx/esm/api";
import { z } from "zod";

const cacheDirectory = new URL("../.cache/", import.meta.url);
const target = new URL("openapi.json", cacheDirectory);
const temporary = new URL(`openapi.${process.pid}.tmp`, cacheDirectory);

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

// Importing the router constructs auth/Prisma but does not execute procedures.
// Docs-only defaults let Docker builds run without runtime configuration.
process.env.DATABASE_URL ??= "mysql://docs:docs@127.0.0.1:3306/docs";
process.env.BETTER_AUTH_SECRET ??= "docs-generation-only-not-a-runtime-secret";
process.env.BETTER_AUTH_URL ??= "http://localhost:3000";
const { appRouter } = await tsImport("../src/trpc/router.ts", import.meta.url);
for (const [path, procedure] of Object.entries(appRouter._def.procedures)) {
  const { inputs, output, type } = procedure._def;
  if (type === "subscription") continue;
  const operation = document.paths[`/${path}`][type === "query" ? "get" : "post"];
  if (inputs.length) {
    const input = inputs.reduce((left, right) => z.intersection(left, right));
    const schema = z.toJSONSchema(input, { io: "input" });
    delete schema.$schema;
    const target =
      type === "query"
        ? operation.parameters.find((parameter) => parameter.name === "input")
        : operation.requestBody;
    target.content["application/json"].schema = schema;
  }
  if (output) {
    const schema = z.toJSONSchema(output, { io: "output" });
    delete schema.$schema;
    operation.responses["200"].content[
      "application/json"
    ].schema.properties.result.properties.data = schema;
  }
}

await mkdir(cacheDirectory, { recursive: true });
try {
  await writeFile(temporary, JSON.stringify(document, null, 2) + "\n");
  await rename(temporary, target);
} finally {
  await rm(temporary, { force: true });
}
console.log("Generated .cache/openapi.json");
