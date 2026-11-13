import { z } from "zod";
import { loadRoom, roomState, syncRoom } from "../darts/room.js";
import { dartsBatchSchema } from "../shared/index.js";
import { protectedProcedure, router } from "../trpc/init.js";

export const dartsRouter = router({
  /** Starts a new sync session, which outdates other tabs. */
  load: protectedProcedure.mutation(({ ctx }) => loadRoom(ctx.user.id)),
  /** A mutation because it advances the room time. */
  state: protectedProcedure
    .input(z.object({ epoch: z.string().min(1).max(64) }))
    .mutation(({ ctx, input }) => roomState(ctx.user.id, input.epoch)),
  sync: protectedProcedure
    .input(dartsBatchSchema)
    .mutation(({ ctx, input }) => syncRoom(ctx.user.id, input)),
});
