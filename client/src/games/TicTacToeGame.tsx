import type { TicTacToeMove, TicTacToeView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";

export default function TicTacToeGame({
  view,
  userPlayerIndex,
  makeMove,
}: GameProps<TicTacToeView, TicTacToeMove>) {
  const disabled = userPlayerIndex !== view.nextPlayer;
  const me = userPlayerIndex === 0 ? "O" : "X";

  const viewEntry = (row: number, col: number, entry: "O" | "X" | null) => {
    if (entry !== null) {
      if (view.winningEntry?.some(([winRow, winCol]) => winRow === row && winCol === col)) {
        return <span style={{ color: "blue", fontWeight: "bolder" }}>{entry}</span>;
      }
      return entry;
    }
    if (userPlayerIndex === -1) return "";
    if (view.winningEntry) return "";
    return (
      <button disabled={disabled} onClick={() => makeMove({type: "move", coord: [row, col]})}>
        {me}?
      </button>
    );
  };

  return view.board.map((entries, row) => (
    <div style={{ height: 50 }} key={row}>
      {entries.map((entry, col) => (
        <span style={{ display: "inline-block", textAlign: "center", width: 50 }} key={col}>
          {viewEntry(row, col, entry)}
        </span>
      ))}
    </div>
  ));
}
