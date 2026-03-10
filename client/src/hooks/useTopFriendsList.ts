import type { ErrorMsg, GameInfo, FriendInfo, SafeUserInfo } from "@gamenite/shared";
import { useEffect, useState } from "react";
import { getFriends } from "../services/friendsService";
import { gameList } from "../services/gameService";

/**
 * Custom hook to get a list of the most-played with friends for a given user.
 *
 * @param username the username to fetch top friends for
 * @returns an error message for fetching games, an error message for fetching friends, and a sorted list of
 * top friends, as well as a function to get the friend's game count
 */
export default function useTopFriendsList(username: string) {
  const [games, setGames] = useState<GameInfo[] | ErrorMsg | null>(null);
  const [friends, setFriends] = useState<FriendInfo[] | ErrorMsg | null>(null);
  const [topFriends, setTopFriends] = useState<FriendInfo[]>([]);
  const [playersPerGame, setPlayersPerGame] = useState<SafeUserInfo[][]>([]);
  const [friendsErr, setFriendsErr] = useState("");
  const [gamesErr, setGamesErr] = useState("");

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

    return countFriendOccurences(friend, playersPerGame);
  }

  useEffect(() => {
    gameList().then(setGames);
  }, []);

  useEffect(() => {
    getFriends(username).then(setFriends);
  }, []);

  useEffect(() => {
    if (games !== null && !("error" in games) && friends !== null && !("error" in friends)) {
      const gamesWithPlayer = games.filter((game) =>
        game.players.some((player) => player.username === username)
      );
      const friendsPerGame = gamesListToFriendUsernames(gamesWithPlayer);
      setPlayersPerGame(friendsPerGame);
      const friendsCopy = [...friends];
      friendsCopy.sort((a, b) => {
        return countFriendOccurences(b, friendsPerGame) - countFriendOccurences(a, friendsPerGame);
      });
      setTopFriends(friendsCopy);
    }
    if (games !== null && "error" in games) {
      setGamesErr(games.error);
    }
    if (friends !== null && "error" in friends) {
      setFriendsErr(friends.error);
    }
  }, [games, friends]);

  return {
    gamesErr,
    friendsErr,
    topFriends,
    getFriendGameCount,
  };
}
