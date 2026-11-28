import { z } from "zod";

/** Rooms with a leaderboard; ids match the frontend's room ids. */
export const HIGHSCORE_ROOMS = ["darts", "scratchCards", "fishing", "gacha"] as const;

export type HighscoreRoom = (typeof HIGHSCORE_ROOMS)[number];

export const highscoreRoomSchema = z.enum(HIGHSCORE_ROOMS);

/** Each room ranks by its own currency (stable ids of the backend's `Currency` enum). */
export const ROOM_CURRENCY = {
  darts: "beers",
  scratchCards: "shamrocks",
  fishing: "fish",
  gacha: "coins",
} as const satisfies Record<HighscoreRoom, string>;

/** Entries in a room's top list. */
export const HIGHSCORE_TOP_SIZE = 10;
