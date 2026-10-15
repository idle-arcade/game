import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { trpc } from "../../lib/trpc";

/** Ends the session and drops all cached player data, then returns to the entry screen. */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation(
    trpc.auth.logout.mutationOptions({
      // Also on error (e.g. an already expired session): the UI must end up logged out.
      onSettled: async () => {
        queryClient.clear();
        queryClient.setQueryData(trpc.auth.me.queryKey(), null);
        await navigate({ to: "/" });
      },
    }),
  );

  return { logout: () => mutation.mutate(), pending: mutation.isPending };
}
