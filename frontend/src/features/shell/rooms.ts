/** Rooms in navigation order. Only rooms with a route can ever be opened. */
export const ROOMS = [
  { id: "darts", to: "/darts" },
  { id: "scratchCards" },
  { id: "fishing" },
  { id: "gatcha" },
] as const satisfies readonly { id: string; to?: string }[];

export type RoomId = (typeof ROOMS)[number]["id"];
export type RoomStatus = "available" | "locked";

/**
 * Prototype unlock state: only Darts is open. US02 (#23) replaces this with the player's real
 * progress; components only depend on the status values.
 */
export function roomStatus(id: RoomId): RoomStatus {
  return id === "darts" ? "available" : "locked";
}
