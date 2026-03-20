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

export function checkWinByEntry(board: TicTacToeBoard, entry: TicTacEntry) {
  for (let i = 0; i < WINNING_COORDS.length; i += 1) {
    const [a, b, c] = WINNING_COORDS[i];
    if (checkCoordsForEquality(board, a, b, c, entry)) return true;
  }
  return false;
}

export function isBoardFull(board: TicTacToeBoard) {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i].some((v) => v === null)) return false;
  }
  return true;
}

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

export function isGameDone(state: TicTacToeState) {
  return (
    state.forfeited === true ||
    checkWinByEntry(state.board, "X") ||
    checkWinByEntry(state.board, "O") ||
    isBoardFull(state.board)
  );
}
