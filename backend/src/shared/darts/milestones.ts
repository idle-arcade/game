import { PLAYER_IDS, type PlayerId, type Players } from "./players.js";
import {
  isEndgame,
  isMaxLevel,
  UPGRADE_IDS,
  UPGRADES,
  type Levels,
  type UpgradeId,
} from "./rules.js";

// Progress steps of the Darts room. Progress never goes back, so each one is reached once.

export type DartsMilestone =
  | "first_upgrade"
  | "first_player"
  | `player_type:${PlayerId}`
  | `upgrade_maxed:${UpgradeId}`
  | "endgame";

type Progress = { levels: Levels; players: Players };

const total = (counts: Record<string, number>) =>
  Object.values(counts).reduce((sum, n) => sum + n, 0);

/** Every milestone a valid list contains; e.g. to check values from outside TypeScript. */
export const DARTS_MILESTONES: readonly DartsMilestone[] = [
  "first_upgrade",
  "first_player",
  ...PLAYER_IDS.map((id) => `player_type:${id}` as const),
  ...UPGRADE_IDS.filter((id) => UPGRADES[id].maxLevel !== null).map(
    (id) => `upgrade_maxed:${id}` as const,
  ),
  "endgame",
];

/** Milestones reached on the way from `before` to `after`. */
export function reachedMilestones(before: Progress, after: Progress): DartsMilestone[] {
  const reached: DartsMilestone[] = [];
  if (total(before.levels) === 0 && total(after.levels) > 0) reached.push("first_upgrade");
  if (total(before.players) === 0 && total(after.players) > 0) reached.push("first_player");
  for (const id of PLAYER_IDS) {
    if (before.players[id] === 0 && after.players[id] > 0) reached.push(`player_type:${id}`);
  }
  for (const id of UPGRADE_IDS) {
    if (!isMaxLevel(id, before.levels[id]) && isMaxLevel(id, after.levels[id])) {
      reached.push(`upgrade_maxed:${id}`);
    }
  }
  if (!isEndgame(before.levels) && isEndgame(after.levels)) reached.push("endgame");
  return reached;
}
