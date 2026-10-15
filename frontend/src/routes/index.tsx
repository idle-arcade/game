// Placeholder entry screen; the mockup design is implemented in #45.
import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(context.trpc.auth.me.queryOptions());
    if (me) throw redirect({ to: "/darts" });
  },
  component: EntryPage,
});

function EntryPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onSuccess = async (user: { id: string; username: string }) => {
    queryClient.setQueryData(trpc.auth.me.queryKey(), user);
    await navigate({ to: "/darts" });
  };
  const login = useMutation(trpc.auth.login.mutationOptions({ onSuccess }));
  const register = useMutation(trpc.auth.register.mutationOptions({ onSuccess }));
  const error = login.error ?? register.error;
  const pending = login.isPending || register.isPending;

  return (
    <main className="mx-auto flex max-w-sm flex-col gap-3 p-8">
      <h1 className="text-2xl font-bold">IDLE Arcade</h1>
      <input
        className="rounded border p-2"
        placeholder="Display name"
        autoComplete="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        className="rounded border p-2"
        type="password"
        placeholder="Password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <div className="flex gap-2">
        <button
          className="flex-1 rounded border p-2"
          disabled={pending}
          onClick={() => login.mutate({ username, password })}
        >
          Login
        </button>
        <button
          className="flex-1 rounded border p-2"
          disabled={pending}
          onClick={() => register.mutate({ username, password })}
        >
          Register
        </button>
      </div>
    </main>
  );
}
