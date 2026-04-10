import { useState, useEffect, useRef } from "react";
import type { TicTacToeMove, TicTacToeView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";
import "./TicTacToeGame.css";

const AUTOMATED_OPPONENT_THINKING_EVENT = "automated-opponent-thinking";

export default function TicTacToeGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<TicTacToeView, TicTacToeMove>) {
  // Delay board display to simulate AI thinking time
  const [displayView, setDisplayView] = useState<TicTacToeView>(view);
  const prevViewRef = useRef<TicTacToeView>(view);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitThinking = (thinking: boolean) => {
    window.dispatchEvent(
      new CustomEvent(AUTOMATED_OPPONENT_THINKING_EVENT, {
        detail: { thinking },
      }),
    );
  };

  useEffect(() => {
    const prevView = prevViewRef.current;
    const changedCells: { row: number; col: number; value: "O" | "X" }[] = [];

    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 3; col += 1) {
        const prevValue = prevView.board[row][col];
        const nextValue = view.board[row][col];
        if (prevValue !== nextValue && nextValue !== null) {
          changedCells.push({ row, col, value: nextValue });
        }
      }
    }

    // Clean up any pending timeout
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (delayedTimeoutRef.current) clearTimeout(delayedTimeoutRef.current);

    prevViewRef.current = view;

    const shouldDelayAutomatedResponse =
      userPlayerIndex === 0 &&
      changedCells.length === 2 &&
      changedCells.some((cell) => cell.value === "O") &&
      changedCells.some((cell) => cell.value === "X");

    if (shouldDelayAutomatedResponse) {
      const humanMove = changedCells.find((cell) => cell.value === "O");
      if (!humanMove) {
        timeoutRef.current = setTimeout(() => {
          emitThinking(false);
          setDisplayView(view);
        }, 0);
      } else {
        const interimBoard = prevView.board.map((boardRow) => [
          ...boardRow,
        ]) as TicTacToeView["board"];
        interimBoard[humanMove.row][humanMove.col] = "O";

        const interimView: TicTacToeView = {
          ...view,
          board: interimBoard,
          nextPlayer: 1,
          winningEntry: null,
        };

        timeoutRef.current = setTimeout(() => {
          emitThinking(true);
          setDisplayView(interimView);
          delayedTimeoutRef.current = setTimeout(() => {
            emitThinking(false);
            setDisplayView(view);
          }, 1500);
        }, 0);
      }
    } else {
      // Immediate updates (including human game-ending moves) are not delayed
      timeoutRef.current = setTimeout(() => {
        emitThinking(false);
        setDisplayView(view);
      }, 0);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (delayedTimeoutRef.current) {
        clearTimeout(delayedTimeoutRef.current);
        delayedTimeoutRef.current = null;
      }
      emitThinking(false);
    };
  }, [view, userPlayerIndex]);

  const disabled = userPlayerIndex !== displayView.nextPlayer || displayView.forfeited;
  const playerMark = userPlayerIndex === 0 ? "O" : "X";

  const boardFull = displayView.board.every((row) => row.every((entry) => entry !== null));

  // Only show status for draw or forfeits, not for win/loss (handled by winner banner)
  const statusMessage = (() => {
    if (displayView.winningEntry) {
      if (displayView.forfeited && userPlayerIndex >= 0) {
        return "You lost by forfeit.";
      }
      // No text for win/loss, handled by winner banner
      return "";
    }
    if (boardFull) return "Draw game.";
    return "";
  })();

  const renderEntry = (row: number, col: number, entry: "O" | "X" | null) => {
    if (entry !== null) {
      const isWinningCell = displayView.winningEntry?.some(
        ([winRow, winCol]) => winRow === row && winCol === col,
      );
      const cellClass = isWinningCell
        ? "tttCell tttCell--filled tttCell--winner"
        : "tttCell tttCell--filled";
      return <span className={cellClass}>{entry}</span>;
    }

    if (userPlayerIndex === -1 || displayView.winningEntry || boardFull) {
      return <span className="tttCell tttCell--empty" aria-hidden="true" />;
    }

    return (
      <button
        className="tttMoveButton"
        disabled={disabled}
        aria-label={`Place ${playerMark} at row ${row + 1}, column ${col + 1}`}
        onClick={() => makeMove({ type: "move", coord: [row, col] })}
      />
    );
  };

  // Winner banner logic (consistent with Nim)
  let winnerBanner: React.ReactNode = null;
  if (displayView.winningEntry) {
    const winnerIndex = (displayView.nextPlayer + 1) % 2;
    const isUserAPlayer = userPlayerIndex >= 0;
    const didUserWin = isUserAPlayer ? winnerIndex === userPlayerIndex : null;
    const isAutomatedOpponentWinForSpectator =
      didUserWin === null && players.length === 1 && winnerIndex === 1;
    const losingPlayerName = players[0]?.display ?? "The player";
    const winnerName = players[winnerIndex]?.display ?? "A player";
    const bannerText = displayView.forfeited
      ? didUserWin
        ? "You won by forfeit"
        : didUserWin === false
          ? "You lost by forfeit"
          : isAutomatedOpponentWinForSpectator
            ? `${losingPlayerName} lost by forfeit`
            : `${winnerName} won by forfeit`
      : didUserWin
        ? "You won!"
        : didUserWin === false
          ? "You lost."
          : isAutomatedOpponentWinForSpectator
            ? `${losingPlayerName} lost.`
            : `${winnerName} won!`;
    winnerBanner = (
      <div
        className={
          didUserWin
            ? "nimGame__winnerBanner"
            : "nimGame__winnerBanner nimGame__winnerBanner--notWinner"
        }
      >
        {bannerText}
      </div>
    );
  } else if (boardFull) {
    winnerBanner = (
      <div className="nimGame__winnerBanner nimGame__winnerBanner--notWinner">Draw game.</div>
    );
  }

  return view.opponentTypeSelected ? (
    <div className="ticTacToeGame content">
      {winnerBanner}
      <div
        className={statusMessage ? "ticTacToeBoard ticTacToeBoard--withStatus" : "ticTacToeBoard"}
        role="grid"
        aria-label="Tic-Tac-Toe board"
      >
        {displayView.board.map((entries, row) =>
          entries.map((entry, col) => (
            <div className="ticTacToeCell" role="gridcell" key={`${row}-${col}`}>
              {renderEntry(row, col, entry)}
            </div>
          )),
        )}
      </div>
    </div>
  ) : (
    <div className="ticTacToeGame content">
      <h3 className="tttDifficultyTitle">Select Difficulty:</h3>
      <div className="tttDifficultyButtonsRow">
        <button
          className="tttDifficultyButton__action--easy"
          onClick={() => makeMove({ type: "move", difficulty: "random" })}
        >
          Easy (Random)
        </button>
        <button
          className="tttDifficultyButton__action--hard"
          onClick={() => makeMove({ type: "move", difficulty: "minimax" })}
        >
          Hard (Optimal)
        </button>
      </div>
    </div>
  );
}
