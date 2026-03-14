import {
  zTicTacToeMove,
  type TicTacEntry,
  type TicTacToeMove,
  type TicTacToeState,
  type TicTacToeView,
} from "@gamenite/shared";
import type { GameLogic } from "./gameLogic.ts";
import { GameService } from "./gameServiceManager.ts";

// Utility type for a tic tac toe board, used to guarantee board dimensions
// and entries for helper functions. Private to this file.
type TicTacToeBoard = [
  [TicTacEntry, TicTacEntry, TicTacEntry],
  [TicTacEntry, TicTacEntry, TicTacEntry],
  [TicTacEntry, TicTacEntry, TicTacEntry],
];

type Mark = "O" | "X";
type TicTacToeOpponentType = "human" | "random" | "minimax";

export type AutomatedTicTacToeState = TicTacToeState & {
  opponentType?: TicTacToeOpponentType;
  autoPlayer?: number;
};

export type AutomatedTicTacToeView = TicTacToeView;

const NUM_PLAYERS: number = 2;
const HUMAN_PLAYER_INDEX = 0;
const DEFAULT_AUTO_PLAYER_INDEX = 1;

// Player 0 uses O, player 1 uses X.
const PLAYER_IDX_TO_ENTRY_MAP: [TicTacEntry, TicTacEntry] = ["O", "X"];

// List of all possible winning indexes (rows, columns, diagonals) for ease of testing.
const WINNING_COORDS: [[number, number], [number, number], [number, number]][] = [
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

function checkCoordsForEquality(
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

function checkWinByEntry(board: TicTacToeBoard, entry: TicTacEntry) {
  for (let i = 0; i < WINNING_COORDS.length; i += 1) {
    const [a, b, c] = WINNING_COORDS[i];
    if (checkCoordsForEquality(board, a, b, c, entry)) return true;
  }
  return false;
}

function isBoardFull(board: TicTacToeBoard) {
  for (let i = 0; i < board.length; i += 1) {
    if (board[i].some((v) => v === null)) return false;
  }
  return true;
}

function getWinningEntry(board: TicTacToeBoard) {
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

function isGameDone(board: TicTacToeBoard) {
  return checkWinByEntry(board, "X") || checkWinByEntry(board, "O") || isBoardFull(board);
}

function cloneBoard(board: TicTacToeBoard): TicTacToeBoard {
  return [
    [board[0][0], board[0][1], board[0][2]],
    [board[1][0], board[1][1], board[1][2]],
    [board[2][0], board[2][1], board[2][2]],
  ];
}

function getAvailableMoves(board: TicTacToeBoard): TicTacToeMove[] {
  const out: TicTacToeMove[] = [];
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (board[r][c] === null) out.push([r, c]);
    }
  }
  return out;
}

function oppositeMark(mark: Mark): Mark {
  return mark === "X" ? "O" : "X";
}

function minimax(board: TicTacToeBoard, current: Mark, ai: Mark, depth: number): number {
  if (checkWinByEntry(board, ai)) return 10 - depth;
  if (checkWinByEntry(board, oppositeMark(ai))) return depth - 10;
  if (isBoardFull(board)) return 0;

  const moves = getAvailableMoves(board);
  const isMax = current === ai;
  let best = isMax ? -Infinity : Infinity;

  for (const [r, c] of moves) {
    const next = cloneBoard(board);
    next[r][c] = current;
    const score = minimax(next, oppositeMark(current), ai, depth + 1);
    best = isMax ? Math.max(best, score) : Math.min(best, score);
  }

  return best;
}

function chooseAutomatedMove(state: AutomatedTicTacToeState): TicTacToeMove | null {
  const difficulty: TicTacToeOpponentType = state.opponentType ?? "minimax";
  if (difficulty === "human") return null;

  const moves = getAvailableMoves(state.board as TicTacToeBoard);

  if (difficulty === "random") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const autoPlayer = state.autoPlayer ?? DEFAULT_AUTO_PLAYER_INDEX;
  const autoSymbol = PLAYER_IDX_TO_ENTRY_MAP[autoPlayer] as Mark;

  let bestScore = -Infinity;
  let bestMove: TicTacToeMove = moves[0];

  for (const [r, c] of moves) {
    const next = cloneBoard(state.board as TicTacToeBoard);
    next[r][c] = autoSymbol;
    const score = minimax(next, oppositeMark(autoSymbol), autoSymbol, 0);
    if (score > bestScore) {
      bestScore = score;
      bestMove = [r, c];
    }
  }

  return bestMove;
}

function getWinnerSymbol(board: TicTacToeBoard): TicTacEntry {
  const winning = getWinningEntry(board);
  if (!winning) return null;
  const [a] = winning;
  return board[a[0]][a[1]];
}

function findNewMoveForSymbol(
  before: TicTacToeBoard,
  after: TicTacToeBoard,
  symbol: TicTacEntry,
): [number, number] | null {
  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      if (before[r][c] !== after[r][c] && after[r][c] === symbol) {
        return [r, c];
      }
    }
  }
  return null;
}

export const automatedTicTacToeLogic: GameLogic<AutomatedTicTacToeState, AutomatedTicTacToeView> = {
  minPlayers: 1,
  maxPlayers: 1,
  start: () => ({
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    // Human (player 0) moves first in this 1-player mode.
    nextPlayer: HUMAN_PLAYER_INDEX,
    opponentType: "minimax",
    autoPlayer: DEFAULT_AUTO_PLAYER_INDEX,
  }),
  update: (state, payload, playerIndex) => {
    // Only the human client sends moves.
    if (playerIndex !== HUMAN_PLAYER_INDEX) return null;
    if (state.nextPlayer !== HUMAN_PLAYER_INDEX) return null;
    if (isGameDone(state.board as TicTacToeBoard)) return null;

    const move = zTicTacToeMove.safeParse(payload);
    if (move.error) return null;

    const [i, j] = move.data;
    if (state.board[i][j] !== null) return null;

    const afterHumanBoard = cloneBoard(state.board as TicTacToeBoard);
    afterHumanBoard[i][j] = PLAYER_IDX_TO_ENTRY_MAP[HUMAN_PLAYER_INDEX];

    let nextState: AutomatedTicTacToeState = {
      ...state,
      board: afterHumanBoard,
      nextPlayer: (state.nextPlayer + 1) % NUM_PLAYERS,
    };

    if (isGameDone(nextState.board as TicTacToeBoard)) return nextState;

    const aiMove = chooseAutomatedMove(nextState);
    if (!aiMove) return nextState;

    const [r, c] = aiMove;
    if (nextState.board[r][c] !== null) return nextState;

    const afterAiBoard = cloneBoard(nextState.board as TicTacToeBoard);
    const aiPlayer = nextState.autoPlayer ?? DEFAULT_AUTO_PLAYER_INDEX;
    afterAiBoard[r][c] = PLAYER_IDX_TO_ENTRY_MAP[aiPlayer];

    nextState = {
      ...nextState,
      board: afterAiBoard,
      nextPlayer: (nextState.nextPlayer + 1) % NUM_PLAYERS,
    };

    return nextState;
  },
  isDone: (state) => isGameDone(state.board as TicTacToeBoard),
  viewAs: (state) => ({
    board: state.board,
    nextPlayer: state.nextPlayer,
    winningEntry: getWinningEntry(state.board as TicTacToeBoard),
  }),
  tagView: (view) => ({ type: "automatedTicTacToe", view }),
  describeMove: (prevState, newState, payload) => {
    const move = zTicTacToeMove.parse(payload);
    const [i, j] = move;

    const aiPlayer = newState.autoPlayer ?? DEFAULT_AUTO_PLAYER_INDEX;
    const aiSymbol = PLAYER_IDX_TO_ENTRY_MAP[aiPlayer];
    const aiMove = findNewMoveForSymbol(
      prevState.board as TicTacToeBoard,
      newState.board as TicTacToeBoard,
      aiSymbol,
    );

    const winner = getWinnerSymbol(newState.board as TicTacToeBoard);

    const humanMsg =
      winner && winner !== aiSymbol
        ? ` moved at (${i}, ${j}) and won the game`
        : ` moved at (${i}, ${j})`;

    if (!aiMove) {
      if (isBoardFull(newState.board as TicTacToeBoard)) {
        return ` moved at (${i}, ${j}) and ended the game in a draw`;
      }
      return humanMsg;
    }

    const [r, c] = aiMove;
    const aiMsg =
      winner === aiSymbol
        ? ` automated opponent moved at (${r}, ${c}) and won the game`
        : isBoardFull(newState.board as TicTacToeBoard)
          ? ` automated opponent moved at (${r}, ${c}) and ended the game in a draw`
          : ` automated opponent moved at (${r}, ${c})`;

    return `${humanMsg}||${aiMsg}`;
  },
};

export const automatedTicTacToeGameService = new GameService<
  AutomatedTicTacToeState,
  AutomatedTicTacToeView
>(automatedTicTacToeLogic);
