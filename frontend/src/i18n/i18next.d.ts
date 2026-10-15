import "i18next";
import type { resources } from "./index";

// Type-checks translation keys against the English resources: t("entry.titel") is an error.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: (typeof resources)["en"];
  }
}
