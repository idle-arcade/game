import { useSuspenseQuery } from "@tanstack/react-query";
import { trpc } from "../../lib/trpc";

/**
 * The logged-in player. Only use below the `_game` route, whose guard guarantees a session;
 * returns null for the brief moment during logout.
 */
export function useCurrentUser() {
  return useSuspenseQuery(trpc.auth.me.queryOptions()).data;
}
