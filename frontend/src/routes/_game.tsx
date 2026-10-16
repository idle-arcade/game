import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { GameShell } from "../features/shell/GameShell";

export const Route = createFileRoute("/_game")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(context.trpc.auth.me.queryOptions());
    if (!me) throw redirect({ to: "/" });
  },
  component: () => (
    <GameShell>
      <Outlet />
    </GameShell>
  ),
});
