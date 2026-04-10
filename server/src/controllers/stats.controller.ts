import { zGameKey } from "@gamenite/shared";
import { z } from "zod";
import { type RestAPI } from "../types.ts";
import { getLeaderboard, getUserStats } from "../services/stats.service.ts";

/**
 * GET /api/stats/leaderboard
 */
export const getLeaderboardRoute: RestAPI = async (req, res) => {
  const query = z
    .object({
      gameType: zGameKey.optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .safeParse(req.query);

  if (!query.success) {
    res.status(400).send({ error: "Poorly-formed request" });
    return;
  }

  res.send(await getLeaderboard({ gameType: query.data.gameType, entryLimit: query.data.limit }));
};

/**
 * GET /api/stats/:username
 * Returns per-game-type stats for a single user.
 */
export const getStatsByUsername: RestAPI<unknown, { username: string }> = async (req, res) => {
  res.send(await getUserStats(req.params.username));
};
