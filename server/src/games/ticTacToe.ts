import { zTicTacToeMove, type TicTacToeState, type TicTacToeView } from "@gamenite/shared";
import {
  type TicTacToeBoard,
  PLAYER_IDX_TO_ENTRY_MAP,
  checkWinByEntry,
  isBoardFull,
  getWinningEntry,
  isGameDone,
} from "@gamenite/shared/src/games/ticTacToeUtils.ts";
import type { GameLogic } from "./gameLogic.ts";
import { GameService } from "./gameServiceManager.ts";

const NUM_PLAYERS: number = 2;
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

    if ("difficulty" in move.data) {
      // difficult selection not supported for player v player tic tac toe
      return null;
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
      opponentTypeSelected: true,
    };
    return stateView;
  },
  tagView: (view) => ({ type: "tictactoe", view }),
  describeMove: (_prevState, newState, payload) => {
    const move = zTicTacToeMove.parse(payload);
    if (move.type === "forfeit") {
      return ` forfeited the game`;
    }
    if ("difficulty" in move) {
      return ` made an illegal move`; // not allowed for regular tic tac toe
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
};

export const ticTacToeGameService = new GameService<TicTacToeState, TicTacToeView>(ticTacToeLogic);
