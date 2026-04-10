import type { APIResponse } from "../util/types.ts";
import { api, exceptionToErrorMsg } from "./api.ts";
import type { ErrorMsg, GameKey, LeaderboardEntry, LeaderboardOptions } from "@gamenite/shared";

export type LeaderboardResponse = {
  gameType: GameKey | undefined;
  entries: LeaderboardEntry[];
  generatedAt: Date;
};

const STATS_API_URL = `/api/stats`;

/**
 * GET /api/stats/leaderboard
 */
export const getLeaderboard = async (
  opts: LeaderboardOptions = {},
): APIResponse<LeaderboardResponse> => {
  const { gameType, entryLimit } = opts;
  const params = new URLSearchParams();
  if (entryLimit !== undefined) params.set("limit", String(entryLimit));
  if (gameType) params.set("gameType", gameType);
  try {
    const res = await api.get<LeaderboardResponse | ErrorMsg>(
      `${STATS_API_URL}/leaderboard?${params}`,
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};

/**
 * GET /api/stats/:username
 */
export const getUserStats = async (username: string): APIResponse<LeaderboardEntry[]> => {
  try {
    const res = await api.get<LeaderboardEntry[] | ErrorMsg>(
      `${STATS_API_URL}/${encodeURIComponent(username)}`,
    );
    return res.data;
  } catch (error) {
    return exceptionToErrorMsg(error);
  }
};
