import useNewGameForm from "../hooks/useNewGameForm.ts";
import { gameNames } from "../util/consts.ts";
import { Gamepad2, Plus } from "lucide-react";

export default function NewGame() {
  const { gameKey, opponentType, handleInputChange, err, handleSubmit } = useNewGameForm();

  return (
    <div className="newGamePage">
      <form className="newGameCard" onSubmit={handleSubmit}>
        <div className="newGameCard__header">
          <h2 className="newGameCard__title">Create New Game</h2>
          <p className="newGameCard__subtitle">Select a game to get started.</p>
        </div>

        <div className="newGameCard__formShell">
          <label className="newGameCard__selectRow" htmlFor="new-game-select">
            <Gamepad2 className="newGameCard__icon" aria-hidden="true" />
            <select
              id="new-game-select"
              name="gameKey"
              className="newGameCard__select"
              value={gameKey}
              aria-label="Game selection"
              onChange={(e) => handleInputChange(e)}
            >
              <option value="">Choose a game</option>
              {Object.entries(gameNames)
                .filter(([key]) => key !== "automatedTicTacToe")
                .map(([key, name]) => (
                  <option key={key} value={key}>
                    {name}
                  </option>
                ))}
            </select>
          </label>

          {gameKey === "tictactoe" && (
            <div>
              <p>Select opponent type:</p>
              <select
                name="opponentType"
                value={opponentType as "player" | "automated"}
                aria-label="Opponent type selection"
                onChange={handleInputChange}
              >
                <option value="player">Player</option>
                <option value="automated">Automated</option>
              </select>
            </div>
          )}

          <button className="newGameCard__submit" type="submit">
            <Plus className="newGameCard__submitIcon" aria-hidden="true" />
            Create Game
          </button>
        </div>

        {err && <p className="error-message newGameCard__error">{err}</p>}
      </form>
    </div>
  );
}
