// Auth guard + placeholder shell for all rooms; the real header/navigation is #46.
import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LogoutButton } from "../features/auth/LogoutButton";
import { trpc } from "../lib/trpc";

export const Route = createFileRoute("/_game")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(context.trpc.auth.me.queryOptions());
    if (!me) throw redirect({ to: "/" });
  },
  component: GameLayout,
});

function GameLayout() {
  const { data: me } = useSuspenseQuery(trpc.auth.me.queryOptions());

  return (
    <div className="min-h-screen">
      <header className="flex items-center gap-4 border-b p-4">
        <span className="font-bold">IDLE Arcade</span>
        <nav className="flex gap-2">
          <Link to="/darts" className="[&.active]:underline">
            Darts
          </Link>
        </nav>
        <span className="ml-auto">{me?.username}</span>
        <LogoutButton />
      </header>
      <Outlet />
    </div>
  );
}
