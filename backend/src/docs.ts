import { Router } from "express";
import swagger from "swagger-ui-express";
import { fileURLToPath } from "node:url";

const specification = fileURLToPath(new URL("../.cache/openapi.json", import.meta.url));

export function createDocsRouter() {
  const router = Router();
  router.get("/openapi.json", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    res.sendFile(
      specification,
      { dotfiles: "allow" },
      (error: NodeJS.ErrnoException | undefined) => {
        if (!error) return;
        if (error.code === "ENOENT" || error.code === "ENOTDIR") {
          res.status(503).json({ message: "API documentation is not available yet." });
          return;
        }
        next(error);
      },
    );
  });

  router.use(swagger.serve);
  router.get(
    "/",
    swagger.setup(undefined, {
      customSiteTitle: "Idle Arcade API",
      swaggerOptions: { url: "/docs/openapi.json", validatorUrl: null },
    }),
  );
  return router;
}
