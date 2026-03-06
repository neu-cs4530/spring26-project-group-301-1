/**
 * The base type for all game moves. Every move is either a normal game move
 * or a forfeit, which ends the game early.
 */
export interface GameMove {
  type: "move" | "forfeit";
}
