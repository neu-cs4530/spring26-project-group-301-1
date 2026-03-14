import { z, ZodNumber } from "zod";
import { type GameMove } from "./games.types.ts";

/**
 * The internal state of a Nim game needs to keep track of two facts: who is
 * playing next and how many objects are left.
 */
export interface NimState {
  remaining: number;
  nextPlayer: number;
  forfeited: boolean;
}

/**
 * Nim is a perfect information game; everyone who is playing the game knows
 * everything there is to know about the game. Therefore, the NimView is the
 * same as the NimState.
 *
 * https://en.wikipedia.org/wiki/Perfect_information
 */
export type NimView = NimState;
/**
 * A move in Nim is either a forfeit or a normal move. A normal move is an
 * integer between 1 and 3, representing how many tokens you take. The move
 * is only valid if it is your turn.
 */
export interface NimMove extends GameMove {
  count?: number;
}
export const zNimMove = z.object({
  type: z.enum(["move", "forfeit"]),
  count: (z.int().gte(1).lte(3) as ZodNumber).optional(),
});
