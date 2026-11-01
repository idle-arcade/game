/** Rooms in navigation order. Locked rooms are still navigable and show an unlock placeholder. */
export const ROOMS = [
  { id: "darts", to: "/darts" },
  { id: "scratchCards", to: "/scratch-cards", unlockPrice: 5000 },
  { id: "fishing", to: "/fishing", unlockPrice: 25000 },
  { id: "gacha", to: "/gacha", unlockPrice: 100000 },
] as const satisfies readonly { id: string; to: string; unlockPrice?: number }[];

export type RoomId = (typeof ROOMS)[number]["id"];
export type LockableRoomId = Extract<(typeof ROOMS)[number], { unlockPrice: number }>["id"];
export type RoomStatus = "available" | "locked";

/**
 * Prototype unlock state: only Darts is open. US02 (#23) replaces this with the player's real
 * progress; components only depend on the status values.
 */
export function roomStatus(id: RoomId): RoomStatus {
  return id === "darts" ? "available" : "locked";
}
