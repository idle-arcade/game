import { createRouter } from "@tanstack/react-router";
import { queryClient, trpc } from "./lib/trpc";
import { routeTree } from "./routeTree.gen";

export type RouterContext = { queryClient: typeof queryClient; trpc: typeof trpc };

export const router = createRouter({
  routeTree,
  context: { queryClient, trpc },
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
