import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { analytics } from "../features/analytics/analytics";
import type { AppRouter } from "@idle-arcade/backend/router";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
      headers() {
        const id = analytics.getCorrelationId();
        return id ? { "x-rybbit-correlation-id": id } : {};
      },
    }),
  ],
});

export const trpc = createTRPCOptionsProxy<AppRouter>({ client: trpcClient, queryClient });
