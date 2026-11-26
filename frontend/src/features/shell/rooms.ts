import type { HighscoreRoom } from "@idle-arcade/backend/shared";

/** Rooms in navigation order. Locked rooms are still navigable and show an unlock placeholder. */
export const ROOMS = [
  { id: "darts", to: "/darts" },
  { id: "scratchCards", to: "/scratch-cards", unlockPrice: 5000 },
  { id: "fishing", to: "/fishing", unlockPrice: 25000 },
  { id: "gacha", to: "/gacha", unlockPrice: 100000 },
] as const satisfies readonly { id: string; to: string; unlockPrice?: number }[];

export type RoomId = (typeof ROOMS)[number]["id"];

// Every room has a leaderboard; fails to compile when the room lists diverge.
const roomsMatch: [RoomId, HighscoreRoom] extends [HighscoreRoom, RoomId] ? true : never = true;
void roomsMatch;
export type LockableRoomId = Extract<(typeof ROOMS)[number], { unlockPrice: number }>["id"];
export type RoomStatus = "available" | "locked";

export function roomStatus(id: RoomId): RoomStatus {
  return id === "darts" ? "available" : "locked";
}
