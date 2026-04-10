import { type SafeUserInfo } from "./user.types.ts";
import { type GameKey } from "./game.types.ts";

/**
 * Options for generating a leaderboard.
 * gameType: if specified, only include stats for this game type; otherwise aggregate across all game types.
 * entryLimit: max number of entries to return; omit to return all
 */
export interface LeaderboardOptions {
  gameType?: GameKey;
  entryLimit?: number;
}

/**
 * Represents a user's stats for the leaderboard.
 * - `rank`: the user's rank on the leaderboard (1-based)
 * - `username`: the user's info for display
 * - `wins`: number of wins
 * - `losses`: number of losses
 * - `draws`: number of draws
 * - `gamesPlayed`: total number of games played
 */
export interface LeaderboardEntry {
  rank: number;
  user: SafeUserInfo;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winRate: number;
}

/**
 * Relevant information sent to clients when the leaderboard is updated.
 * - `gameType`: the game type this leaderboard is for (undefined if leaderboard for all game types)
 * - `entries`: the ranked entries for the leaderboard
 * - `generatedAt`: when the leaderboard was generated
 */
export interface LeaderboardPayload {
  gameType: GameKey | undefined;
  entries: LeaderboardEntry[];
  generatedAt: Date;
}

export type GameOutcome = "win" | "loss" | "draw";
