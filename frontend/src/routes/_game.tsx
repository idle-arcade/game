// Auth guard + placeholder shell for all rooms; the real header/navigation is #46.
import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logout = useMutation(
    trpc.auth.logout.mutationOptions({
      onSettled: async () => {
        queryClient.setQueryData(trpc.auth.me.queryKey(), null);
        await navigate({ to: "/" });
      },
    }),
  );

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
        <button className="rounded border px-2" onClick={() => logout.mutate()}>
          Logout
        </button>
      </header>
      <Outlet />
    </div>
  );
}
