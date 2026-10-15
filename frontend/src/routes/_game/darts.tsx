import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_game/darts")({
  component: () => <main className="p-8">Darts room</main>,
});
