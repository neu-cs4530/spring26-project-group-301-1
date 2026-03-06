import {
  zGuessMove,
  type GuessView,
  type GuessState,
  type UnfinishedGuesView,
  type GuessMove,
} from "@gamenite/shared";
import { GameService } from "./gameServiceManager.ts";
import { type GameLogic } from "./gameLogic.ts";

function allMoved(guesses: (number | null)[], forfeits: boolean[]): guesses is number[] {
  const zipped = Array.from({ length: guesses.length }, (_, i) => [guesses[i], forfeits[i]]);
  return zipped.every(([guess, forfeit]) => guess || forfeit);
}

export const guessLogic: GameLogic<GuessState, GuessView> = {
  minPlayers: 2,
  maxPlayers: null,
  start: (numPlayers) => ({
    secret: Math.round(Math.random() * 100) + 1,
    guesses: Array.from({ length: numPlayers }).map(() => null),
    forfeits: Array.from({ length: numPlayers }).map(() => false),
  }),
  update: ({ secret, guesses: oldGuesses, forfeits: oldForfeits }, payload, playerIndex) => {
    const move = zGuessMove.safeParse(payload);
    if (oldGuesses[playerIndex] !== null) return null;
    if (move.error) return null;

    const moveData: GuessMove = move.data;
    if (moveData.type === "forfeit") {
      const newForfeits = [...oldForfeits];
      newForfeits[playerIndex] = true;
      const newGuesses = [...oldGuesses];
      return {
        secret,
        guesses: newGuesses,
        forfeits: newForfeits,
      };
    }
    if (moveData.guess === undefined) {
      return null;
    }

    // do not allow a guess after a forfeit
    if (oldForfeits[playerIndex] === true) return null;

    const newGuesses = [...oldGuesses];
    const newForfeits = [...oldForfeits];
    newGuesses[playerIndex] = moveData.guess;
    return {
      secret,
      guesses: newGuesses,
      forfeits: newForfeits,
    };
  },
  isDone: ({ guesses, forfeits }) => {
    const zipped = Array.from({ length: guesses.length }, (_, i) => [guesses[i], forfeits[i]]);
    return zipped.every(([guess, forfeit]) => guess || forfeit);
  },
  viewAs: ({ secret, guesses, forfeits: oldForfeits }, playerIndex) => {
    if (allMoved(guesses, oldForfeits)) {
      return { finished: true, secret, guesses, forfeits: [...oldForfeits] };
    }
    // If the game is not done, we only show the player their own guess
    // everyone can see *who* has guessed
    const view: UnfinishedGuesView = {
      finished: false,
      guesses: guesses.map((value) => value !== null),
      forfeits: [...oldForfeits],
    };
    if (playerIndex !== -1 && guesses[playerIndex] !== null) {
      view.myGuess = guesses[playerIndex];
    }
    return view;
  },
  tagView: (view) => ({ type: "guess", view }),
  describeMove: (_prevState, newState, payload) => {
    const move = zGuessMove.parse(payload);
    // guards against case of forfeit being last move
    let moveValue: string = `guessed ${move.guess}`;
    if (move.type === "forfeit") {
      moveValue = `forfeited`;
    }
    if (allMoved(newState.guesses, newState.forfeits)) {
      return ` ${moveValue} — the secret was ${newState.secret}!`;
    }
    if (move.type === "forfeit") {
      return ` forfeited`;
    }
    return ` made a guess`;
  },
};

export const guessGameService = new GameService<GuessState, GuessView>(guessLogic);
