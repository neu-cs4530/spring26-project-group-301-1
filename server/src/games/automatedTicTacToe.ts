import {
  zTicTacToeMove,
  type TicTacEntry,
  type TicTacToeMove,
  type TicTacToeState,
  type TicTacToeView,
} from "@gamenite/shared";
import {
  type TicTacToeBoard,
  type Mark,
  PLAYER_IDX_TO_ENTRY_MAP,
  checkWinByEntry,
  isBoardFull,
  getWinningEntry,
} from "@gamenite/shared/src/games/ticTacToeUtils.ts";
import type { GameLogic } from "./gameLogic.ts";
import { GameService } from "./gameServiceManager.ts";

type TicTacToeOpponentType = "human" | "random" | "minimax";

export type AutomatedTicTacToeState = TicTacToeState & {
  opponentType?: TicTacToeOpponentType;
  autoPlayer?: number;
  aiMoveTimestamp?: number;
};

export type AutomatedTicTacToeView = TicTacToeView;

const NUM_PLAYERS: number = 2;
const HUMAN_PLAYER_INDEX = 0;
const DEFAULT_AUTO_PLAYER_INDEX = 1;

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
      if (board[r][c] === null) out.push({ type: "move", coord: [r, c] });
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

  for (const move of moves) {
    const [r, c] = move.coord ? move.coord : [-1, -1];
    const next = cloneBoard(board);
    next[r][c] = current;
    const score = minimax(next, oppositeMark(current), ai, depth + 1);
    best = isMax ? Math.max(best, score) : Math.min(best, score);
  }

  return best;
}

export function chooseAutomatedMove(state: AutomatedTicTacToeState): TicTacToeMove | null {
  const difficulty: TicTacToeOpponentType = state.opponentType ? state.opponentType : "minimax";
  if (difficulty === "human") return null;

  const moves = getAvailableMoves(state.board as TicTacToeBoard);
  if (moves.length === 0) return null;

  if (difficulty === "random") {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const autoPlayer = state.autoPlayer ?? DEFAULT_AUTO_PLAYER_INDEX;
  const autoSymbol = PLAYER_IDX_TO_ENTRY_MAP[autoPlayer] as Mark;

  let bestScore = -Infinity;
  let bestMove: TicTacToeMove = moves[0];

  for (const move of moves) {
    const [r, c] = move.coord ? move.coord : [-1, -1];
    const next = cloneBoard(state.board as TicTacToeBoard);
    next[r][c] = autoSymbol;
    const score = minimax(next, oppositeMark(autoSymbol), autoSymbol, 0);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
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
  getWinner: (state, players) => {
    const board = state.board as TicTacToeBoard;
    if (checkWinByEntry(board, "X")) {
      return players[1];
    }
    if (checkWinByEntry(board, "O")) {
      return players[0];
    }
    if (state.forfeited === true) {
      return players[state.nextPlayer];
    }
    return null;
  },
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
    forfeited: false,
  }),
  update: (state, payload, playerIndex) => {
    // Prevent moves after forfeiting
    if (state.forfeited === true) return null;
    // Only the human client sends moves.
    if (playerIndex !== HUMAN_PLAYER_INDEX) return null;
    if (state.nextPlayer !== HUMAN_PLAYER_INDEX) return null;
    if (isGameDone(state.board as TicTacToeBoard)) return null;

    const move = zTicTacToeMove.safeParse(payload);
    if (move.error) return null;

    // Handle forfeit move
    if (move.data.type === "forfeit") {
      // Mark game as forfeited
      return {
        ...state,
        forfeited: true,
      };
    }

    const { coord } = move.data;
    if (!coord) return null;
    const [i, j] = coord;
    if (state.board[i][j] !== null) return null;

    const afterHumanBoard = cloneBoard(state.board as TicTacToeBoard);
    afterHumanBoard[i][j] = PLAYER_IDX_TO_ENTRY_MAP[HUMAN_PLAYER_INDEX];

    let nextState: AutomatedTicTacToeState = {
      ...state,
      board: afterHumanBoard,
      nextPlayer: (state.nextPlayer + 1) % NUM_PLAYERS,
      opponentType: state.opponentType ?? "minimax",
    };

    if (isGameDone(nextState.board as TicTacToeBoard)) return nextState;

    const aiMove = chooseAutomatedMove(nextState);
    if (!aiMove) return nextState;
    const [r, c] = aiMove.coord ? aiMove.coord : [-1, -1];
    if (nextState.board[r][c] !== null) return nextState;

    const afterAiBoard = cloneBoard(nextState.board as TicTacToeBoard);
    const aiPlayer = nextState.autoPlayer ?? DEFAULT_AUTO_PLAYER_INDEX;
    afterAiBoard[r][c] = PLAYER_IDX_TO_ENTRY_MAP[aiPlayer];

    nextState = {
      ...nextState,
      board: afterAiBoard,
      nextPlayer: (nextState.nextPlayer + 1) % NUM_PLAYERS,
      aiMoveTimestamp: Date.now(),
    };

    return nextState;
  },
  isDone: (state) => isGameDone(state.board as TicTacToeBoard),
  viewAs: (state) => ({
    board: state.board,
    nextPlayer: state.nextPlayer,
    winningEntry: getWinningEntry(state.board as TicTacToeBoard),
    forfeited: state.forfeited ?? false,
  }),
  tagView: (view) => ({ type: "automatedTicTacToe", view }),
  describeMove: (prevState, newState, payload) => {
    const move = zTicTacToeMove.parse(payload);
    // Forfeit message
    if (move.type === "forfeit") {
      return " forfeited the game";
    }

    const [i, j] = move.coord ? move.coord : [-1, -1];

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
