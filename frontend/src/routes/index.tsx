import { createFileRoute, redirect } from "@tanstack/react-router";
import { EntryScreen } from "../features/auth/EntryScreen";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(context.trpc.auth.me.queryOptions());
    if (me) throw redirect({ to: "/darts" });
  },
  component: EntryScreen,
});
