import type { NimMove, NimView } from "@gamenite/shared";
import type { GameProps } from "../util/types.ts";
import "./NimGame.css";

export default function NimGame({
  view,
  players,
  userPlayerIndex,
  makeMove,
}: GameProps<NimView, NimMove>) {
  const disabled = userPlayerIndex !== view.nextPlayer || view.forfeited === true;

  function winnerDisplay(index: number) {
    return index === userPlayerIndex ? "You" : players[index].display;
  }

  const pileObjects = Array.from({ length: view.remaining }, (_, index) => index);

  const gameOver = view.remaining === 0 || view.forfeited === true;
  const userWon = gameOver && userPlayerIndex >= 0 && view.nextPlayer === userPlayerIndex;
  const winnerBannerText =
    view.forfeited === true
      ? `${winnerDisplay(view.nextPlayer)} won by forfeit`
      : `${winnerDisplay(view.nextPlayer)} won`;

  return (
    <div className="nimGame content spacedSection">
      <div className="nimGame__intro">
        Remove 1, 2, or 3 objects on your turn. The player who takes the last object loses.
      </div>

      <div className="nimGame__board">
        <div className="nimGame__boardHeader">
          <h2 className="nimGame__title">Current pile</h2>
          <span className="nimGame__remainingBadge">
            {view.remaining} object{view.remaining !== 1 && "s"}
          </span>
        </div>

        <div className="nimGame__pile" aria-label={`Pile with ${view.remaining} objects`}>
          {pileObjects.length > 0 ? (
            pileObjects.map((objectIndex) => <span key={objectIndex} className="nimGame__object" />)
          ) : (
            <div className="nimGame__emptyPile">No objects left</div>
          )}
        </div>
      </div>

      {gameOver ? (
        <div
          className={
            userWon
              ? "nimGame__winnerBanner"
              : "nimGame__winnerBanner nimGame__winnerBanner--notWinner"
          }
        >
          {winnerBannerText}
        </div>
      ) : null}

      {userPlayerIndex >= 0 && (
        <div className="nimGame__actions">
          <button
            className="narrow nimGame__button"
            disabled={disabled || view.remaining < 1}
            onClick={() => makeMove({ type: "move", count: 1 })}
          >
            Take one
          </button>
          <button
            disabled={disabled || view.remaining < 2}
            className="narrow nimGame__button"
            onClick={() => makeMove({ type: "move", count: 2 })}
          >
            Take two
          </button>
          <button
            disabled={disabled || view.remaining < 3}
            className="narrow nimGame__button"
            onClick={() => makeMove({ type: "move", count: 3 })}
          >
            Take three
          </button>
        </div>
      )}
    </div>
  );
}
