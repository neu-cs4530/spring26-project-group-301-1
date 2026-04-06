import { type TicTacEntry, type TicTacToeMove, type TicTacToeState } from "./ticTacToe.ts";

type Coord = [number, number];

const LINES: [Coord, Coord, Coord][] = [
  // Rows
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
  // Cols
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
  // Diags
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

// Deterministic tie-break order: center, corners, edges
const PREFERRED_MOVES: TicTacToeMove[] = [
  { type: "move", coord: [1, 1] },
  { type: "move", coord: [0, 0] },
  { type: "move", coord: [0, 2] },
  { type: "move", coord: [2, 0] },
  { type: "move", coord: [2, 2] },
  { type: "move", coord: [0, 1] },
  { type: "move", coord: [1, 0] },
  { type: "move", coord: [1, 2] },
  { type: "move", coord: [2, 1] },
];

function markForPlayer(player: number): TicTacEntry {
  return player === 1 ? "X" : "O";
}

function cloneBoard(board: TicTacToeState["board"]): TicTacToeState["board"] {
  return [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
  ];
}

function winner(board: TicTacToeState["board"]): TicTacEntry {
  for (const [a, b, c] of LINES) {
    const v = board[a[0]][a[1]];
    if (v && v === board[b[0]][b[1]] && v === board[c[0]][c[1]]) {
      return v;
    }
  }
  return null;
}

function isFull(board: TicTacToeState["board"]): boolean {
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === null) return false;
    }
  }
  return true;
}

function legalMoves(board: TicTacToeState["board"]): TicTacToeMove[] {
  const all: TicTacToeMove[] = [];
  for (const move of PREFERRED_MOVES) {
    if (!("coord" in move) || !move.coord) continue;
    const [r, c] = move.coord;
    if (board[r][c] === null) all.push(move);
  }
  return all;
}

function applyMove(state: TicTacToeState, move: TicTacToeMove): TicTacToeState {
  if (!("coord" in move) || !move.coord) throw new Error("Invalid move: missing coord");
  const [r, c] = move.coord;
  const next = cloneBoard(state.board);
  next[r][c] = markForPlayer(state.nextPlayer);
  return {
    board: next,
    nextPlayer: state.nextPlayer === 1 ? 0 : 1,
    forfeited: false,
  };
}

function terminalScore(
  board: TicTacToeState["board"],
  rootMark: TicTacEntry,
  depth: number,
): number | null {
  const w = winner(board);
  if (w === null) {
    return isFull(board) ? 0 : null;
  }
  // Prefer faster wins, slower losses.
  return w === rootMark ? 10 - depth : depth - 10;
}

function negamax(state: TicTacToeState, rootMark: TicTacEntry, depth: number): number {
  const done = terminalScore(state.board, rootMark, depth);
  if (done !== null) return done;

  let best = -Infinity;
  for (const mv of legalMoves(state.board)) {
    const child = applyMove(state, mv);
    const score = -negamax(child, rootMark, depth + 1);
    if (score > best) best = score;
  }
  return best;
}

/**
 * automated: returns the best move for state.nextPlayer, or null if no legal move exists.
 */
export function automated(state: TicTacToeState): TicTacToeMove | null {
  // No moves allowed once game is over or board is full.
  if (winner(state.board) !== null || isFull(state.board)) return null;

  const rootMark = markForPlayer(state.nextPlayer);
  let bestMove: TicTacToeMove | null = null;
  let bestScore = -Infinity;

  for (const mv of legalMoves(state.board)) {
    const child = applyMove(state, mv);
    const score = -negamax(child, rootMark, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMove = mv;
    }
  }

  return bestMove;
}
