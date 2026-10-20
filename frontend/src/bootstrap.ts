import { loadRuntimeConfig } from "./runtime-config";

// Import the app only after configuration is loaded, before analytics initializes.
void loadRuntimeConfig().then(() => import("./main"));
