import { trace } from "@opentelemetry/api";
import { z } from "zod";
import {
  getOwnRank,
  HIGHSCORE_CACHE_TTL_MS,
  loadTop,
  roomCurrency,
} from "../highscores/ranking.js";
import { createTtlCache } from "../highscores/ttl-cache.js";
import { formatAmount, highscoreRoomSchema, toAmountDto } from "../shared/index.js";
import { protectedProcedure, router } from "../trpc/init.js";

// One shared top list per currency: polling clients hit the database at most once per TTL.
const topCache = createTtlCache({ ttlMs: HIGHSCORE_CACHE_TTL_MS, load: loadTop });

const roomInput = z.object({ room: highscoreRoomSchema });

export const highscoresRouter = router({
  /** The room's top list; `generatedAt` is when it was read from the database. */
  top: protectedProcedure.input(roomInput).query(async ({ input }) => {
    const currency = roomCurrency(input.room);
    const { value, loadedAt, source } = await topCache.get(currency);
    trace.getActiveSpan()?.setAttributes({
      "highscores.room": input.room,
      "highscores.cache": source,
      "highscores.cache_age_ms": Date.now() - loadedAt,
      "highscores.entries": value.length,
    });
    return { room: input.room, currency, generatedAt: loadedAt, entries: value };
  }),

  /** The player's own stored score and rank (null while the balance is zero); not cached. */
  me: protectedProcedure.input(roomInput).query(async ({ ctx, input }) => {
    const currency = roomCurrency(input.room);
    const generatedAt = Date.now();
    const { rank, amount } = await getOwnRank(ctx.user.id, currency);
    trace.getActiveSpan()?.setAttributes({
      "highscores.room": input.room,
      "highscores.own_rank": rank ?? -1,
    });
    return {
      room: input.room,
      currency,
      generatedAt,
      rank,
      amount: toAmountDto(amount),
      formatted: formatAmount(amount),
    };
  }),
});
