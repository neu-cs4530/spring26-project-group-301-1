import { GameService } from "./gameServiceManager.ts";
import { type NimState, type NimView, type NimMove, zNimMove } from "@gamenite/shared";
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
  start: () => ({ remaining: START_NIM_OBJECTS, nextPlayer: 0, forfeits: false }),
  update: ({ remaining, nextPlayer, forfeits }, payload, playerIndex) => {
    const move = zNimMove.safeParse(payload);
    if (playerIndex !== nextPlayer) return null;
    if (move.error) return null;

    const moveData: NimMove = move.data;
    if (moveData.type === "forfeit") {
      // do not allow multiple forfeits
      if (forfeits === true) return null;
      // do not allow a forfeit after the game has ended
      if (remaining === 0) return null;
      return {
        remaining: remaining,
        nextPlayer: nextPlayer === 0 ? 1 : 0,
        forfeits: true,
      };
    }
    // game is already over
    if (forfeits === true) {
      return null;
    }
    if (moveData.count === undefined) {
      return null;
    }
    if (moveData.count > remaining) return null;
    return {
      remaining: remaining - moveData.count,
      nextPlayer: nextPlayer === 0 ? 1 : 0,
      forfeits: false,
    };
  },
  isDone: ({ remaining, forfeits }) => remaining === 0 || forfeits === true,
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
  getWinner: ({ nextPlayer }, players) => players[nextPlayer === 0 ? 1 : 0],
};

export const nimGameService = new GameService<NimState, NimView>(nimLogic);
