import type { ErrorMsg, GameInfo, FriendInfo, SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { getFriends } from "../services/friendsService";
import { gameList } from "../services/gameService";

/**
 * Custom hook to get a list of the most-played with friends for a given user.
 *
 * @param username the username to fetch top friends for
 * @returns a list of games the user played in, a list of friends, a function to get the top
 * friends for the given player (sorted in descending order), and a function to get the game count
 */
export default function useTopFriendsList(username: string) {
  const [games, setGames] = useState<GameInfo[] | ErrorMsg | null>(null);
  const [friends, setFriends] = useState<FriendInfo[] | ErrorMsg | null>(null);

  /**
   * Helper function to convert a list of games to a list of lists of players
   * @param gamesList the list of games to get a list of friends for
   * @returns a list of list of players in the form of SafeUserInfo objects
   */
  function gamesListToFriendUsernames(gamesList: GameInfo[]): SafeUserInfo[][] {
    if (friends === null || "error" in friends) {
      return [];
    }

    let listsOfFriends: SafeUserInfo[][] = [];
    for (const game of gamesList) {
      let friendsInGame: SafeUserInfo[] = [];
      for (const player of game.players) {
        if (friends.some((friend) => friend.user.username === player.username)) {
          friendsInGame = [player, ...friendsInGame];
        }
      }
      listsOfFriends = [friendsInGame, ...listsOfFriends];
    }
    return listsOfFriends;
  }

  /**
   * Helper function to count the number of games a given friend played in
   * @param friend the friend to count occurences for
   * @param playersPerGame the list of lists of players for each game
   * @returns the number of games the friend occured in as a player
   */
  function countFriendOccurences(friend: FriendInfo, playersPerGame: SafeUserInfo[][]): number {
    let count = 0;
    for (const playerList of playersPerGame) {
      if (playerList.some((player) => player.username === friend.user.username)) {
        count += 1;
      }
    }
    return count;
  }

  /**
   * Counts the number of games a given friend has occured in with the given player
   * @param friend the friend to get the game count for
   * @returns the count of games the friend has been in (-1 for an error)
   */
  function getFriendGameCount(friend: FriendInfo) {
    if (games === null || "error" in games) return -1;
    const gamesWithPlayer = games.filter((game) =>
      game.players.some((player) => player.username === username),
    );
    return countFriendOccurences(friend, gamesListToFriendUsernames(gamesWithPlayer));
  }

  /**
   * Gets a list of the top friends for the given user, sorted in descending order.
   * @returns a list of FriendInfo, corresponding to most played with friends
   */
  function getTopFriends(numberToReturn = 5): FriendInfo[] {
    if (games === null || "error" in games || friends === null || "error" in friends) return [];

    const gamesWithPlayer = games.filter((game) =>
      game.players.some((player) => player.username === username),
    );
    const friendsPerGame = gamesListToFriendUsernames(gamesWithPlayer);
    const friendsCopy = [...friends];
    friendsCopy.sort((a, b) => {
      return countFriendOccurences(b, friendsPerGame) - countFriendOccurences(a, friendsPerGame);
    });
    if (numberToReturn < 0) {
      return friendsCopy;
    }
    return friendsCopy.slice(0, numberToReturn);
  }

  useEffect(() => {
    gameList().then(setGames);
  }, []);

  useEffect(() => {
    getFriends(username).then(setFriends);
  }, [username]);

  return {
    games,
    friends,
    getTopFriends,
    getFriendGameCount,
  };
}
