import useNewGameForm from "../hooks/useNewGameForm.ts";
import { gameNames } from "../util/consts.ts";

export default function NewGame() {
  const { gameKey, opponentType, handleInputChange, err, handleSubmit } = useNewGameForm();

  return (
    <form className="content spacedSection" onSubmit={handleSubmit}>
      <h2>Create new game</h2>

      <div>
        <select
          name="gameKey"
          value={gameKey}
          aria-label="Game selection"
          onChange={handleInputChange}
        >
          <option value="">— Select a game —</option>
          {Object.entries(gameNames)
            .filter(([key]) => key !== "automatedTicTacToe")
            .map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
        </select>
      </div>

      {gameKey === "tictactoe" && (
        <div>
          <select
            name="opponentType"
            value={opponentType}
            aria-label="Opponent type selection"
            onChange={handleInputChange}
          >
            <option value="player">Player</option>
            <option value="automated">Automated</option>
          </select>
        </div>
      )}

      {err && <p className="error-message">{err}</p>}
      <div>
        <button className="primary narrow">Create New Game</button>
      </div>
    </form>
  );
}
