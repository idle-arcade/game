import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/.cache/**",
      "**/node_modules/**",
      "backend/src/generated/**",
      "frontend/src/routeTree.gen.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["**/*.{js,ts}"], languageOptions: { globals: globals.node } },
  {
    files: ["frontend/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // Shared code must compute identical results on server and client.
    files: ["backend/src/shared/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?!\\.|zod$)",
              message: "Shared code may only import relative files and zod.",
            },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        { name: "Date", message: "Time is an input to shared code, never read from a clock." },
        {
          name: "performance",
          message: "Time is an input to shared code, never read from a clock.",
        },
        { name: "parseFloat", message: "Shared game math is integer-only." },
        { name: "process", message: "Shared code must not depend on the environment." },
        { name: "window", message: "Shared code must not depend on the environment." },
      ],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random", message: "Shared code must be deterministic." },
        { object: "Math", property: "pow", message: "Use bigint ** for exact powers." },
        { object: "Number", property: "parseFloat", message: "Shared game math is integer-only." },
      ],
    },
  },
);
