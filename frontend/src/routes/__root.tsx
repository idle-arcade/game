import { lazy, Suspense } from "react";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { RouterContext } from "../router";
import { AnalyticsControls } from "../features/analytics/AnalyticsControls";

// Devtools are only bundled for development.
const Devtools = import.meta.env.DEV ? lazy(() => import("../components/Devtools")) : () => null;

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <AnalyticsControls />
      <Suspense>
        <Devtools />
      </Suspense>
    </>
  ),
});
