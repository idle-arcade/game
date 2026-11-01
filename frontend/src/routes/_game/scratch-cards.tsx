import { createFileRoute } from "@tanstack/react-router";
import { LockedRoomPanel } from "../../features/shell/LockedRoomPanel";

export const Route = createFileRoute("/_game/scratch-cards")({
  component: () => <LockedRoomPanel roomId="scratchCards" />,
});
