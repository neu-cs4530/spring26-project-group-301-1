import "./Game.css";
import { useParams } from "react-router-dom";
import { getGameById } from "../services/gameService.ts";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { GameInfo } from "@gamenite/shared";
import ChatPanel from "../components/ChatPanel.tsx";
import GamePanel from "../components/GamePanel.tsx";
import useLoginContext from "../hooks/useLoginContext.ts";

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.slice(1);
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return [red, green, blue];
}

function isDarkHexColor(hex: string): boolean {
  const [red, green, blue] = hexToRgb(hex);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  return luminance < 0.45;
}

export default function Game() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameInfo | null>(null);
  const { user } = useLoginContext();
  const customBackground = (user.customBackground || "").trim();

  const gameBgStyle = useMemo<CSSProperties>(() => {
    if (!customBackground) return {};

    const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(customBackground);
    if (isHex) {
      return { backgroundColor: customBackground };
    }

    return {
      backgroundImage: `url("${customBackground}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    };
  }, [customBackground]);

  const shouldUseLightChatText = useMemo(() => {
    const isHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(customBackground);
    if (!isHex) return false;
    return isDarkHexColor(customBackground);
  }, [customBackground]);

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
        <div className="gameContainer__panelBg" style={gameBgStyle}>
          <ChatPanel chatId={game.chat} lightText={shouldUseLightChatText} />
        </div>
      </div>
    )
  );
}
