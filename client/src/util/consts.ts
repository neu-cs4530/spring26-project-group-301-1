import { type GameKey } from "@gamenite/shared";

export const gameNames: { [key in GameKey]: string } = {
  nim: "Nim",
  guess: "Number Guesser",
  tictactoe: "Tic-Tac-Toe",
  automatedTicTacToe: "Tic-Tac-Toe vs Bot",
};
