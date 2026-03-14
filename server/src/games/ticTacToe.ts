import {
  zTicTacToeMove,
  type TicTacEntry,
  type TicTacToeState,
  type TicTacToeView,
} from "@gamenite/shared";
import type { GameLogic } from "./gameLogic.ts";
import { GameService } from "./gameServiceManager.ts";

// Utility type for a tic tac toe board, used to guarantee board dimentions
// and entries for helper functions. Private to this file.
type TicTacToeBoard = [
  [TicTacEntry, TicTacEntry, TicTacEntry],
  [TicTacEntry, TicTacEntry, TicTacEntry],
  [TicTacEntry, TicTacEntry, TicTacEntry],
];

const NUM_PLAYERS: number = 2;

// Player 0 (Player #1 in the front-end) starts the game, and goes second (O).
// Player 1 (Player #2 in the front-end) joins the game after it is started, and goes first (X).
const PLAYER_IDX_TO_ENTRY_MAP: [TicTacEntry, TicTacEntry] = ["O", "X"];

// List of all possible winning indexes (rows, columns, diagonals) for ease of testing
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

/**
 * Checks the whole board to determine if there is a win for the given entry.
 *
 * @param board the board to check
 * @param entry the entry to compare to
 * @returns true if a win exists for the given entry.
 */
function checkWinbyEntry(board: TicTacToeBoard, entry: TicTacEntry) {
  for (let i = 0; i < WINNING_COORDS.length; i += 1) {
    const [a, b, c] = WINNING_COORDS[i];
    if (checkCoordsForEquality(board, a, b, c, entry)) {
      return true;
    }
  }
  return false;
}

/**
 * Determine if the board is full of entries, or if there are still playable places.
 *
 * @param board the board to check
 * @returns true if full, false if not
 */
function isBoardFull(board: TicTacToeBoard) {
  for (let i = 0; i < board.length; i += 1) {
    if (
      board[i].filter(function (v) {
        return v === null;
      }).length > 0
    )
      return false;
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

/**
 * Helper function to determine if a game is done.
 *
 * @param board the board representing the current game state
 * @returns true if the game is done, otherwise false
 */
function isGameDone(state: TicTacToeState) {
  return (
    state.forfeited === true ||
    checkWinbyEntry(state.board, "X") ||
    checkWinbyEntry(state.board, "O") ||
    isBoardFull(state.board)
  );
}

export const ticTacToeLogic: GameLogic<TicTacToeState, TicTacToeView> = {
  minPlayers: 2,
  maxPlayers: 2,
  start: () => ({
    board: [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ],
    nextPlayer: 1,
    forfeited: false,
  }),
  update: (state, payload, playerIndex) => {
    const move = zTicTacToeMove.safeParse(payload);
    if (move.error) return null;
    // reject moves from the wrong player
    if (playerIndex !== state.nextPlayer) return null;
    // reject moves if game is already done
    if (isGameDone(state)) return null;

    // Deep copy the board to avoid 'object is not iterable' error
    const newBoard: TicTacToeBoard = state.board.map((row) => [...row]) as TicTacToeBoard;
    if (move.data.type === "forfeit") {
      if (state.forfeited === true) return null;
      return {
        board: newBoard,
        nextPlayer: (state.nextPlayer + 1) % NUM_PLAYERS,
        forfeited: true,
      };
    }

    if (move.data.coord === undefined) return null;

    const [i, j] = move.data.coord;

    // reject moves that would overwrite existing moves
    if (state.board[i][j] !== null) return null;

    newBoard[i][j] = PLAYER_IDX_TO_ENTRY_MAP[playerIndex];

    const nextState: TicTacToeState = {
      board: newBoard,
      nextPlayer: (state.nextPlayer + 1) % NUM_PLAYERS,
      forfeited: state.forfeited,
    };

    return nextState;
  },
  isDone: (state) => {
    return isGameDone(state);
  },
  viewAs: (state) => {
    const stateView: TicTacToeView = {
      board: state.board,
      nextPlayer: state.nextPlayer,
      winningEntry: getWinningEntry(state.board),
      forfeited: state.forfeited,
    };
    return stateView;
  },
  tagView: (view) => ({ type: "tictactoe", view }),
  describeMove: (_prevState, newState, payload) => {
    const move = zTicTacToeMove.parse(payload);
    if (move.type === "forfeit") {
      return ` forfeited the game`;
    }
    if (move.coord === undefined) {
      return ` made an invalid move`;
    }
    const [i, j] = move.coord;

    // next move is a winning move, assumes this is not called after game is over with additional moves
    if (isGameDone(newState) && getWinningEntry(newState.board)) {
      return ` moved at (${i}, ${j}) and won the game`;
    }
    if (isBoardFull(newState.board)) {
      return ` moved at (${i}, ${j}) and ended the game in a draw`;
    }
    return ` moved at (${i}, ${j})`;
  },
  getWinner: (state, players) => {
    const board = state.board as TicTacToeBoard;

    if (checkWinbyEntry(board, "X")) {
      return players[1];
    }
    if (checkWinbyEntry(board, "O")) {
      return players[0];
    }
    if (state.forfeited === true) {
      return players[state.nextPlayer];
    }
    return null;
  },
};

export const ticTacToeGameService = new GameService<TicTacToeState, TicTacToeView>(ticTacToeLogic);
