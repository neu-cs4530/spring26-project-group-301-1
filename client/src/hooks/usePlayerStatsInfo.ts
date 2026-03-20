import { type ErrorMsg, type LeaderboardEntry, type GameInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { getUserStats } from "../services/statsService.ts";
import { gameList } from "../services/gameService.ts";

/**
 * Custom hook which returns information on gameplay for a given user.
 * @param username the username to get gameplay information for.
 * @returns functions to get the wins and losses, as well as the waiting, active, and completed games
 * for a given user.
 */
export default function usePlayersStatsInfo(username: string) {
  const [leaderboardEntry, setLeaderboardEntry] = useState<LeaderboardEntry[] | null | ErrorMsg>(
    null,
  );
  const [games, setGames] = useState<GameInfo[] | ErrorMsg | null>(null);

  /**
   * Gets the number of wins for a given user
   * @returns the number of wins, or a status message
   */
  function getWins(): string | number {
    if (leaderboardEntry === null) {
      return "loading...";
    }
    if ("error" in leaderboardEntry) {
      return "error!";
    }
    if (leaderboardEntry.length < 1) {
      return "error!";
    }
    return leaderboardEntry[0].wins;
  }

  /**
   * Gets the number of losses for a given user
   * @returns the number of losses, or a status message
   */
  function getLosses(): string | number {
    if (leaderboardEntry === null) {
      return "loading...";
    }
    if ("error" in leaderboardEntry) {
      return "error!";
    }
    if (leaderboardEntry.length < 1) {
      return "error!";
    }
    return leaderboardEntry[0].losses;
  }

  /**
   * Helper to filter list of games by the given username, and to then return games which match
   * a specified game status.
   * @param status the status to filter games by.
   * @returns a list of games the user participated in matching the given status.
   */
  function getGamesWithPlayerAndStatus(status: "waiting" | "active" | "done"): GameInfo[] {
    if (games === null || "error" in games) {
      return [];
    }
    const gamesWithPlayer = games.filter(
      (game) =>
        game.status === status && game.players.some((player) => player.username === username),
    );
    return gamesWithPlayer.sort((a, b) => {
      return Number(new Date(b.createdAt)) - Number(new Date(a.createdAt));
    });
  }

  /**
   * Returns a list of games completed by the player.
   * @returns list of completed games for which the given user was a player.
   */
  function getCompletedGames(): GameInfo[] {
    if (games === null || "error" in games) {
      return [];
    }
    return getGamesWithPlayerAndStatus("done");
  }

  /**
   * Returns a list of games waiting for another player.
   * @returns list of waiting games for which the given user was a player.
   */
  function getWaitingGames(): GameInfo[] {
    if (games === null || "error" in games) {
      return [];
    }
    return getGamesWithPlayerAndStatus("waiting");
  }

  /**
   * Returns a list of active games with the given player.
   * @returns list of active games for which the given user was a player.
   */
  function getActiveGames(): GameInfo[] {
    if (games === null || "error" in games) {
      return [];
    }
    return getGamesWithPlayerAndStatus("active");
  }

  useEffect(() => {
    gameList().then(setGames);
  }, []);

  useEffect(() => {
    getUserStats(username).then(setLeaderboardEntry);
  }, [username]);

  return { getWins, getLosses, getCompletedGames, getWaitingGames, getActiveGames };
}
