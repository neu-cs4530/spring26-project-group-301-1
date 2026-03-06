import { z, ZodNumber } from "zod";
import { type GameMove } from "./games.types.ts";

/**
 * The internal state of the guessing game is both the number (a secret that
 * everyone is trying to guess), and a list of all the guesses that have
 * been made so far.
 */
export interface GuessState {
  secret: number;
  guesses: (number | null)[];
  forfeits: boolean[];
}

/**
 * Before a game has finished, it's only possible to see your own guess
 * (if you're playing and you've made a guess) and whether other players have
 * also guessed.
 */
export type UnfinishedGuesView = {
  finished: false;
  guesses: boolean[];
  myGuess?: number;
  forfeits: boolean[];
};

/**
 * After a game has finished, the secret and everyone's guesses are all
 * visible to everyone.
 */
export type FinishedGuessView = {
  finished: true;
  secret: number;
  guesses: number[];
  forfeits: boolean[];
};

/**
 * The player's view of a guessing game depends on whether the game has
 * finished (whether all players have guessed) or not.
 */
export type GuessView = UnfinishedGuesView | FinishedGuessView;

/**
 * A move in the guessing game is either a forfeit or a normal move. A normal
 * move is an integer between 1 and 100, representing the player's guess.
 */
export interface GuessMove extends GameMove {
  guess?: number;
}
export const zGuessMove = z.object({
  type: z.enum(["move", "forfeit"]),
  guess: (z.int().gte(1).lte(100) as ZodNumber).optional(),
});
