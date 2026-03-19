import type { GuessMove, GuessView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";
import { useState } from "react";
import "./GuessGame.css";

export default function GuessGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<GuessView, GuessMove>) {
  const [guess, setGuess] = useState(16);
  const playerHasGuessed =
    view.finished ||
    view.guesses[userPlayerIndex] !== false ||
    view.forfeits[userPlayerIndex] === true;

  /** Checks if a best is the best guess */
  function isBestGuess(index: number) {
    if (!view.finished) return false;
    const guess = view.guesses[index];
    for (const otherGuess of view.guesses) {
      if (Math.abs(otherGuess - view.secret) < Math.abs(guess - view.secret)) {
        return false;
      }
    }
    return true;
  }

  /** Get the response text for a specific player's guess */
  function getGuessText(guess: boolean | number, index: number) {
    if (index === userPlayerIndex) {
      if (view.forfeits[index] === true) return `You forfeited`;
      if (view.finished) return `You guessed ${guess}`;
      return view.myGuess ? `You guessed ${view.myGuess}` : "You haven't guessed yet";
    }
    if (guess === false) {
      return `${players[index].display} hasn't guessed yet`;
    }
    if (guess === true) {
      return `${players[index].display} has guessed`;
    }
    if (view.forfeits[index] === true) {
      return `${players[index].display} forfeited`;
    }
    return `${players[index].display} guessed ${guess}`;
  }

  const numericGuesses = view.guesses
    .map((entry, index) => ({ entry, index }))
    .filter((item): item is { entry: number; index: number } => typeof item.entry === "number")
    .filter((item) => view.forfeits[item.index] !== true);

  const winningPlayerIndices = (() => {
    if (!view.finished || numericGuesses.length === 0) return [] as number[];
    const minDistance = Math.min(
      ...numericGuesses.map((item) => Math.abs(item.entry - view.secret)),
    );
    return numericGuesses
      .filter((item) => Math.abs(item.entry - view.secret) === minDistance)
      .map((item) => item.index);
  })();

  const winnerNames = winningPlayerIndices.map((index) =>
    index === userPlayerIndex ? "You" : players[index].display,
  );

  const winnerBannerText = (() => {
    if (winnerNames.length === 0) return "No winner this round.";
    if (winnerNames.length === 1) {
      return winnerNames[0] === "You" ? "You won!" : `${winnerNames[0]} won`;
    }
    if (winnerNames.length === 2) return `${winnerNames[0]} and ${winnerNames[1]} tie`;
    return "Tie game";
  })();

  const userWon =
    view.finished && userPlayerIndex >= 0 && winningPlayerIndices.includes(userPlayerIndex);

  const finishedSecret = view.finished ? view.secret : null;
  const secretPercent = finishedSecret === null ? 0 : ((finishedSecret - 1) / 99) * 100;

  const finishedRows = players.map((player, index) => {
    const rawGuess = view.guesses[index];
    const displayName = index === userPlayerIndex ? "You" : player.display;
    let text = `${displayName} hasn't guessed yet`;

    if (view.forfeits[index] === true) {
      text = `${displayName} forfeited`;
    } else if (typeof rawGuess === "number") {
      text = `${displayName} guessed ${rawGuess}`;
    }

    return {
      index,
      text,
      closest: winningPlayerIndices.includes(index),
    };
  });

  const pendingOtherPlayerNames = players
    .map((player, index) => ({ player, index }))
    .filter(
      ({ index }) =>
        index !== userPlayerIndex && view.guesses[index] === false && view.forfeits[index] !== true,
    )
    .map(({ player }) => player.display);

  const waitingMessage = (() => {
    if (pendingOtherPlayerNames.length === 0) return "Waiting for other players...";
    if (pendingOtherPlayerNames.length === 1) {
      return `Waiting for ${pendingOtherPlayerNames[0]} to guess...`;
    }
    if (pendingOtherPlayerNames.length === 2) {
      return `Waiting for ${pendingOtherPlayerNames[0]} and ${pendingOtherPlayerNames[1]} to guess...`;
    }

    const allButLast = pendingOtherPlayerNames.slice(0, -1).join(", ");
    const last = pendingOtherPlayerNames[pendingOtherPlayerNames.length - 1];
    return `Waiting for ${allButLast}, and ${last} to guess...`;
  })();

  return (
    <div className="guessGame content spacedSection">
      {view.finished ? (
        <>
          <div
            className={
              userWon
                ? "guessGame__winnerBanner"
                : "guessGame__winnerBanner guessGame__winnerBanner--notWinner"
            }
          >
            {winnerBannerText}
          </div>

          <div className="guessGame__summaryCard">
            <h3 className="guessGame__numberTitle">The number was {finishedSecret}!</h3>
            <div className="guessGame__finishedRows" role="list">
              {finishedRows.map((row) => (
                <div className="guessGame__finishedRow" role="listitem" key={row.index}>
                  <div className="guessGame__finishedText">{row.text}</div>
                  {row.closest && <span className="guessGame__closestTag">closest guess</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="guessGame__trackCard">
            <div className="guessGame__trackWrap">
              <div className="guessGame__trackLine" aria-hidden="true" />
              <div className="guessGame__trackMarker" style={{ left: `${secretPercent}%` }}>
                <span>{finishedSecret}</span>
              </div>
            </div>
            <div className="guessGame__trackLabels">
              <span>1</span>
              <span>100</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className="guessGame__intro">
            Guess a number between 1 and 100. The closest player wins.
          </p>

          <ul className="guessGame__list" aria-label="player guesses">
            {view.guesses.map((guess, index) => (
              <li key={index} className="guessGame__listItem">
                <span>{getGuessText(guess, index)}</span>
                {isBestGuess(index) && <span className="guessGame__crown">best</span>}
              </li>
            ))}
          </ul>
        </>
      )}

      {!view.finished &&
        userPlayerIndex >= 0 &&
        (playerHasGuessed ? (
          <div className="guessGame__waiting">{waitingMessage}</div>
        ) : (
          <form
            className="guessGame__controls"
            onSubmit={(e) => {
              e.preventDefault();
              makeMove({ type: "move", guess: guess });
            }}
          >
            <label className="guessGame__label" htmlFor="guess-range">
              Make your guess
            </label>
            <input
              id="guess-range"
              className="guessGame__range"
              type="range"
              value={guess}
              min={1}
              max={100}
              step={1}
              onChange={(e) => setGuess(parseInt(e.target.value))}
            />
            <div className="guessGame__rangeMeta">
              <span>1</span>
              <span className="guessGame__rangeCurrent">{guess}</span>
              <span>100</span>
            </div>
            <button className="narrow guessGame__button guessGame__submit">Submit Guess</button>
          </form>
        ))}
    </div>
  );
}
