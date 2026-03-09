import { useState, type ChangeEvent, type SyntheticEvent } from "react";
import type { GameKey } from "@gamenite/shared";
import useAuth from "./useAuth.ts";
import { useNavigate } from "react-router-dom";
import { createGame } from "../services/gameService.ts";

type OpponentType = "player" | "automated";

function resolveGameKey(gameKey: GameKey, opponentType: OpponentType): GameKey {
  if (gameKey === "tictactoe" && opponentType === "automated") {
    return "automatedTicTacToe" as GameKey;
  }
  return gameKey;
}

export default function useNewGameForm() {
  const [gameKey, setGameKey] = useState<GameKey | "">("");
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
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!gameKey) {
      setErr("Please select a game");
      return;
    }

    const finalGameKey = resolveGameKey(gameKey, opponentType);
    const game = await createGame(auth, finalGameKey);

    if ("error" in game) {
      setErr(game.error);
      return;
    }

    navigate(`/game/${game.gameId}`);
  };

  return { gameKey, opponentType, handleInputChange, err, handleSubmit };
}
