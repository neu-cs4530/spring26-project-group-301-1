import type {
  TicTacEntry,
  TicTacToeMove,
  TicTacToeState,
  TicTacToeOpponentType,
} from "@gamenite/shared";

type Board = TicTacToeState["board"];

const WIN_LINES: [number, number][][] = [
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

export function symbolForPlayer(player: number): TicTacEntry {
  return player === 1 ? "X" : "O";
}

export function getWinner(board: Board): TicTacEntry {
  for (const line of WIN_LINES) {
    const [[r1, c1], [r2, c2], [r3, c3]] = line;
    const v = board[r1][c1];
    if (v && v === board[r2][c2] && v === board[r3][c3]) return v;
  }
  return null;
}

export function getAvailableMoves(board: Board): TicTacToeMove[] {
  const out: TicTacToeMove[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[r][c] === null) out.push([r, c]);
    }
  }
  return out;
}

function cloneBoard(board: Board): Board {
  return board.map((row) => [...row]) as Board;
}

function minimax(board: Board, current: TicTacEntry, ai: TicTacEntry, depth: number): number {
  const winner = getWinner(board);
  if (winner === ai) return 10 - depth;
  if (winner && winner !== ai) return depth - 10;

  const moves = getAvailableMoves(board);
  if (moves.length === 0) return 0;

  const isMax = current === ai;
  let best = isMax ? -Infinity : Infinity;

  for (const [r, c] of moves) {
    const next = cloneBoard(board);
    next[r][c] = current;
    const score = minimax(next, current === "X" ? "O" : "X", ai, depth + 1);
    best = isMax ? Math.max(best, score) : Math.min(best, score);
  }
  return best;
}

export function chooseAutomatedMove(state: TicTacToeState): TicTacToeMove | null {
  const difficulty: TicTacToeOpponentType = state.opponentType ?? "human";
  if (difficulty === "human") return null;

  const moves = getAvailableMoves(state.board);
  if (moves.length === 0) return null;

  if (difficulty === "random") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // minimax
  const autoPlayer = state.autoPlayer ?? 0;
  const autoSymbol = symbolForPlayer(autoPlayer);
  let bestScore = -Infinity;
  let bestMove: TicTacToeMove = moves[0];

  for (const [r, c] of moves) {
    const next = cloneBoard(state.board);
    next[r][c] = autoSymbol;
    const score = minimax(next, autoSymbol === "X" ? "O" : "X", autoSymbol, 0);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }

  return bestMove;
}
