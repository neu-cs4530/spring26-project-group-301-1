import type { TicTacToeMove, TicTacToeView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";
import "./TicTacToeGame.css";

export default function TicTacToeGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<TicTacToeView, TicTacToeMove>) {
  const disabled = userPlayerIndex !== view.nextPlayer || view.forfeited;
  const me = userPlayerIndex === 0 ? "O" : "X";

  const boardFull = view.board.every((row) => row.every((entry) => entry !== null));

  const statusMessage = (() => {
    if (view.winningEntry) {
      const winnerIndex = view.nextPlayer;
      const winnerName =
        winnerIndex === userPlayerIndex ? "You" : (players[winnerIndex]?.display ?? "A player");
      return view.forfeited ? `${winnerName} won by forfeit.` : `${winnerName} won!`;
    }

    if (boardFull) return "Draw game.";
    if (view.nextPlayer === userPlayerIndex) return "Your turn.";

    const nextName = players[view.nextPlayer]?.display ?? "Opponent";
    return `${nextName}'s turn.`;
  })();

  const renderEntry = (row: number, col: number, entry: "O" | "X" | null) => {
    if (entry !== null) {
      const isWinningCell = view.winningEntry?.some(
        ([winRow, winCol]) => winRow === row && winCol === col,
      );
      const cellClass = isWinningCell
        ? "tttCell tttCell--filled tttCell--winner"
        : "tttCell tttCell--filled";
      return <span className={cellClass}>{entry}</span>;
    }

    if (userPlayerIndex === -1 || view.winningEntry || boardFull) {
      return <span className="tttCell tttCell--empty" aria-hidden="true" />;
    }

    return (
      <button
        className="tttMoveButton"
        disabled={disabled}
        onClick={() => makeMove({ type: "move", coord: [row, col] })}
      >
        {me}
      </button>
    );
  };

  return (
    <div className="ticTacToeGame content spacedSection">
      <div className="ticTacToeStatus">{statusMessage}</div>
      <div className="ticTacToeBoard" role="grid" aria-label="Tic-Tac-Toe board">
        {view.board.map((entries, row) =>
          entries.map((entry, col) => (
            <div className="ticTacToeCell" role="gridcell" key={`${row}-${col}`}>
              {renderEntry(row, col, entry)}
            </div>
          )),
        )}
      </div>
    </div>
  );
}
