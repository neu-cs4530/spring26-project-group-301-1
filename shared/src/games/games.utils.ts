import { type TaggedGameView } from "../game.types.ts";

export function getCurrentPlayer(taggedView: TaggedGameView): number | null {
  switch (taggedView.type) {
    case "tictactoe":
    case "automatedTicTacToe":
      return taggedView.view.winningEntry || taggedView.view.forfeited
        ? null
        : taggedView.view.nextPlayer;
    case "nim":
      return taggedView.view.forfeited || taggedView.view.remaining <= 0
        ? null
        : taggedView.view.nextPlayer;
    case "guess":
      return taggedView.view.finished ? null : -1;
  }
}
