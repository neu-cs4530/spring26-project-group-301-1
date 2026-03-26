import type { TicTacEntry, TicTacToeState } from "./ticTacToe.ts";

export type TicTacToeBoard = [
  [TicTacEntry, TicTacEntry, TicTacEntry],
  [TicTacEntry, TicTacEntry, TicTacEntry],
  [TicTacEntry, TicTacEntry, TicTacEntry],
];

export type Mark = "O" | "X";

export const PLAYER_IDX_TO_ENTRY_MAP: [TicTacEntry, TicTacEntry] = ["O", "X"];

export const WINNING_COORDS: [[number, number], [number, number], [number, number]][] = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
  ],
  [
    [1, 0],
    [1, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
  ],
  [
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  [
    [0, 2],
    [1, 2],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  [
    [0, 2],
    [1, 1],
    [2, 0],
  ],
];

/**
 * Checks the given coordinates to determine if all three are equal to
 * the specified TicTacEntry. Assumes that coordinates given are within range,
 * as this is a private helper function.
 *
 * @param board the board to check for wins
 * @param c1 the first coordinate on the board to check
 * @param c2 the second coordinate on the board to check
 * @param c3 the third coordinate on the board to check
 * @param symbol the specific TicTacEntry being checked
 * @returns true if the three coordinates all have the same entry
 */
export function checkCoordsForEquality(
  board: TicTacToeBoard,
  c1: [number, number],
  c2: [number, number],
  c3: [number, number],
  symbol: TicTacEntry,
) {
  return (
    board[c1[0]][c1[1]] === symbol &&
    board[c2[0]][c2[1]] === symbol &&
    board[c3[0]][c3[1]] === symbol
  );
}

/**
 * Checks the whole board to determine if there is a win for the given entry.
 *
 * @param board the board to check
 * @param entry the entry to compare to
 * @returns true if a win exists for the given entry.
 */
export function checkWinByEntry(board: TicTacToeBoard, entry: TicTacEntry) {
  for (let i = 0; i < WINNING_COORDS.length; i += 1) {
    const [a, b, c] = WINNING_COORDS[i];
    if (checkCoordsForEquality(board, a, b, c, entry)) return true;
  }
  return false;
}

/**
 * Determine if the board is full of entries, or if there are still playable places.
 *
 * @param board the board to check
 * @returns true if full, false if not
 */
export function isBoardFull(board: TicTacToeBoard) {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i].some((v) => v === null)) return false;
  }
  return true;
}

/**
 * Finds a valid winning entry for either player if one exists. Assumes the board is in
 * a valid state (there are not winning entries for both players).
 *
 * @param board the board to check
 * @returns a winning entry if one exists, otherwise null
 */
export function getWinningEntry(board: TicTacToeBoard) {
  for (let i = 0; i < WINNING_COORDS.length; i += 1) {
    const [a, b, c] = WINNING_COORDS[i];
    if (
      checkCoordsForEquality(board, a, b, c, "X") ||
      checkCoordsForEquality(board, a, b, c, "O")
    ) {
      return WINNING_COORDS[i];
    }
  }
  return null;
}

/**
 * Helper function to determine if a game is done.
 *
 * @param board the board representing the current game state
 * @returns true if the game is done, otherwise false
 */
export function isGameDone(state: TicTacToeState) {
  return (
    state.forfeited === true ||
    checkWinByEntry(state.board, "X") ||
    checkWinByEntry(state.board, "O") ||
    isBoardFull(state.board)
  );
}
