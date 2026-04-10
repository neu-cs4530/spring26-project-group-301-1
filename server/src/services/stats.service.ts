import { UserStatsRepo } from "../repository.ts";
import { type UserStatsRecord } from "../models.ts";
import {
  type GameKey,
  type LeaderboardEntry,
  type LeaderboardOptions,
  type GameOutcome,
} from "@gamenite/shared";
import { safeUserFromUsername } from "./user.service.ts";

/**
 * Records the result of a game for a player.
 * NOTE: Call this function when a game ends for each player
 * @param username the player's username
 * @param gameType the type of game played
 * @param outcome the result from this player's perspective
 */
export async function recordGameResult(
  username: string,
  gameType: GameKey,
  outcome: GameOutcome,
): Promise<void> {
  const key = `${username}:${gameType}`;
  const existingLeaderboardEntry = await UserStatsRepo.find(key);

  const baseLeaderboardEntry: UserStatsRecord = existingLeaderboardEntry ?? {
    username,
    gameType,
    wins: 0,
    losses: 0,
    draws: 0,
    gamesPlayed: 0,
    lastPlayedAt: new Date().toISOString(),
  };

  await UserStatsRepo.set(key, {
    ...baseLeaderboardEntry,
    wins: baseLeaderboardEntry.wins + (outcome === "win" ? 1 : 0),
    losses: baseLeaderboardEntry.losses + (outcome === "loss" ? 1 : 0),
    draws: baseLeaderboardEntry.draws + (outcome === "draw" ? 1 : 0),
    gamesPlayed: baseLeaderboardEntry.gamesPlayed + 1,
    lastPlayedAt: new Date().toISOString(),
  });
}

/**
 * Returns stats for a single user across all game types.
 * @param username the user to look up
 */
export async function getUserStats(username: string): Promise<UserStatsRecord[]> {
  const keys = await UserStatsRepo.getAllKeys();
  const results: UserStatsRecord[] = [];
  for (const key of keys) {
    if (key.startsWith(`${username}:`)) {
      results.push(await UserStatsRepo.get(key));
    }
  }
  return results;
}

/**
 * Returns a ranked leaderboard, sorted by wins descending.
 * @param opts.gameType filter to a specific game type; omit for all game types aggregated (will be labeled undefined in the result)
 * @param opts.entryLimit max number of entries to return; omit to return all entries
 *
 */
export async function getLeaderboard(
  opts: LeaderboardOptions = {},
): Promise<{ gameType: GameKey | undefined; entries: LeaderboardEntry[]; generatedAt: Date }> {
  const { gameType, entryLimit } = opts;
  const keys = await UserStatsRepo.getAllKeys();

  const gameStatsRecords: UserStatsRecord[] = [];
  for (const key of keys) {
    const record = await UserStatsRepo.get(key);
    if (!gameType || record.gameType === gameType) {
      gameStatsRecords.push(record);
    }
  }

  let ranked: Array<{
    username: string;
    wins: number;
    losses: number;
    draws: number;
    gamesPlayed: number;
  }>;

  if (gameType) {
    ranked = gameStatsRecords.map((record) => ({
      username: record.username,
      wins: record.wins,
      losses: record.losses,
      draws: record.draws,
      gamesPlayed: record.gamesPlayed,
    }));
  } else {
    const map = new Map<
      string,
      { wins: number; losses: number; draws: number; gamesPlayed: number }
    >();
    for (const record of gameStatsRecords) {
      const prev = map.get(record.username) ?? { wins: 0, losses: 0, draws: 0, gamesPlayed: 0 };
      map.set(record.username, {
        wins: prev.wins + record.wins,
        losses: prev.losses + record.losses,
        draws: prev.draws + record.draws,
        gamesPlayed: prev.gamesPlayed + record.gamesPlayed,
      });
    }
    ranked = [...map.entries()].map(([username, stats]) => ({ username, ...stats }));
  }

  ranked.sort((a, b) => b.wins - a.wins);
  const top = entryLimit === undefined ? ranked : ranked.slice(0, entryLimit);

  const entries: LeaderboardEntry[] = await Promise.all(
    top.map(async (r, i) => ({
      rank: i + 1,
      user: await safeUserFromUsername(r.username),
      wins: r.wins,
      losses: r.losses,
      draws: r.draws,
      gamesPlayed: r.gamesPlayed,
      winRate: r.gamesPlayed > 0 ? r.wins / r.gamesPlayed : 0,
    })),
  );

  return { gameType, entries, generatedAt: new Date() };
}
