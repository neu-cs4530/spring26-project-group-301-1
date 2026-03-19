import "./Game.css";
import { useParams } from "react-router-dom";
import { getGameById } from "../services/gameService.ts";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { GameInfo } from "@gamenite/shared";
import ChatPanel from "../components/ChatPanel.tsx";
import GamePanel from "../components/GamePanel.tsx";
import useLoginContext from "../hooks/useLoginContext.ts";

export default function Game() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameInfo | null>(null);
  const { user } = useLoginContext();

  const gameBgStyle = useMemo<CSSProperties>(() => {
    const bg = (user.customBackground || "").trim();
    if (!bg) return {};

    const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(bg);
    if (isHex) {
      return { backgroundColor: bg };
    }

    return {
      backgroundImage: `url("${bg}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }, [user.customBackground]);

  useEffect(() => {
    let ignore = false;
    (async () => {
      // non-nullish assertion is ok here given that Game is only called in a
      // route with `:gameId`
      const game = await getGameById(gameId!);
      if (ignore || "error" in game) return;
      setGame(game);
    })();
    return () => {
      ignore = true;
    };
  }, [gameId]);

  return (
    game && (
      <div className="gameContainer">
        <div className="gameContainer__panelBg" style={gameBgStyle}>
          <GamePanel {...game} />
        </div>
        <ChatPanel chatId={game.chat} />
      </div>
    )
  );
}
