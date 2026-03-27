import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import type { GameKey } from "@gamenite/shared";
import useAuth from "./useAuth.ts";
import { useNavigate } from "react-router-dom";
import { createGame } from "../services/gameService.ts";

/**
 * Custom hook to manage game creation form logic
 * @throws if outside a LoginContext
 * @returns an object containing
 *  - Form value `gameKey`
 *  - Possibly-null error message `err`
 *  - Form handlers `handleInputChange` and `handleSubmit`
 */
type OpponentType = "player" | "automated";

type UseNewGameFormResult = {
  gameKey: GameKey | "";
  opponentType: OpponentType;
  filtered: boolean;
  handleInputChange: (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  err: string | null;
  handleSubmit: (e: SyntheticEvent<HTMLFormElement>) => Promise<void>;
};

function resolveGameKey(gameKey: GameKey, opponentType: OpponentType): GameKey {
  if (gameKey === "tictactoe" && opponentType === "automated") {
    return "automatedTicTacToe" as GameKey;
  }
  return gameKey;
}

export default function useNewGameForm(): UseNewGameFormResult {
  const [gameKey, setGameKey] = useState<GameKey | "">("");
  const [filtered, setFiltered] = useState<boolean>(true);
  const [opponentType, setOpponentType] = useState<OpponentType>("player");
  const [err, setErr] = useState<string | null>(null);
  const auth = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "gameKey") {
      const nextGame = value as GameKey | "";
      setGameKey(nextGame);
      if (nextGame !== "tictactoe") setOpponentType("player");
      return;
    }

    if (name === "opponentType") {
      setOpponentType(value as OpponentType);
    }

    if (name === "filtered") {
      setFiltered(value === "true");
    }
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!gameKey) {
      setErr("Please select a game");
      return;
    }

    const finalGameKey = resolveGameKey(gameKey, opponentType);
    const game = await createGame(auth, finalGameKey, filtered);

    if ("error" in game) {
      setErr(game.error);
      return;
    }

    navigate(`/game/${game.gameId}`);
  };

  return { gameKey, opponentType, filtered, handleInputChange, err, handleSubmit };
}
