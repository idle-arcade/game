import type { ReactNode } from "react";
import { GameHeader } from "./GameHeader";
import { RoomNav } from "./RoomNav";

type GameShellProps = {
  /** The current room. */
  children: ReactNode;
};

/** Shared layout of all rooms (mockup: "Darts Game"): header, room navigation, room content. */
export function GameShell({ children }: GameShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="border-b border-neutral-200">
        <GameHeader />
        <RoomNav />
      </div>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
