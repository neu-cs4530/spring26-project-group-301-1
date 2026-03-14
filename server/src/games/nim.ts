import { GameService } from "./gameServiceManager.ts";
import { type NimState, type NimView, zNimMove } from "@gamenite/shared";
import { type GameLogic } from "./gameLogic.ts";

const START_NIM_OBJECTS = 21;

/** Human-readable token count */
function tokenWord(n: number): string {
  if (n === 1) return "one token";
  if (n === 2) return "two tokens";
  if (n === 3) return "three tokens";
  return `${n} tokens`;
}

export const nimLogic: GameLogic<NimState, NimView> = {
  minPlayers: 2,
  maxPlayers: 2,
  start: () => ({ remaining: START_NIM_OBJECTS, nextPlayer: 0, forfeited: false }),
  update: ({ remaining, nextPlayer, forfeited }, payload, playerIndex) => {
    const move = zNimMove.safeParse(payload);
    if (playerIndex !== nextPlayer) return null;
    if (move.error) return null;

    if (move.data.type === "forfeit") {
      // do not allow multiple forfeited
      if (forfeited === true) return null;
      // do not allow a forfeit after the game has ended
      if (remaining === 0) return null;
      return {
        remaining: remaining,
        nextPlayer: nextPlayer === 0 ? 1 : 0,
        forfeited: true,
      };
    }
    // game is already over
    if (forfeited === true) {
      return null;
    }
    if (move.data.count === undefined) {
      return null;
    }
    if (move.data.count > remaining) return null;
    return {
      remaining: remaining - move.data.count,
      nextPlayer: nextPlayer === 0 ? 1 : 0,
      forfeited: false,
    };
  },
  isDone: ({ remaining, forfeited }) => remaining === 0 || forfeited === true,
  viewAs: (state) => state,
  tagView: (view) => ({ type: "nim", view }),
  describeMove: (_prevState, newState, payload) => {
    const move = zNimMove.parse(payload);
    if (move.type === "forfeit") {
      return ` forfeited the game`;
    }
    if (move.count === undefined) {
      return ` invalid move`;
    }
    const took = tokenWord(move.count);
    if (newState.remaining === 0) {
      return ` took ${took} and lost the game`;
    }
    return ` took ${took}, leaving ${newState.remaining}`;
  },
  getWinner: ({ nextPlayer }, players) => {
    return players[nextPlayer];
  },
};

export const nimGameService = new GameService<NimState, NimView>(nimLogic);
