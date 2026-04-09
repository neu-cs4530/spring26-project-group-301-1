import "./Game.css";
import { useParams } from "react-router-dom";
import { getGameById } from "../services/gameService.ts";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { GameInfo } from "@gamenite/shared";
import ChatPanel from "../components/ChatPanel.tsx";
import GamePanel from "../components/GamePanel.tsx";
import useLoginContext from "../hooks/useLoginContext.ts";
import useAuth from "../hooks/useAuth.ts";
import { ParticleCard, GlobalSpotlight } from "../components/ui/MagicBento.tsx";

const basePanelStyle: CSSProperties = {
  backgroundColor: "#000001",
  border: "3px solid rgba(106, 248, 158, 0.6)",
  borderRadius: "16px",
};

export default function Game() {
  const { gameId } = useParams();
  const [game, setGame] = useState<GameInfo | null>(null);
  const { user } = useLoginContext();
  const auth = useAuth();
  const gridRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    let ignore = false;
    (async () => {
      // non-nullish assertion is ok here given that Game is only called in a
      // route with `:gameId`
      const game = await getGameById(gameId!, auth);
      if (ignore || "error" in game) return;
      setGame(game);
    })();
    return () => {
      ignore = true;
    };
  }, [gameId, auth]);

  return (
    game && (
      <div className="gameContainer bento-section" ref={gridRef}>
        <GlobalSpotlight
          gridRef={gridRef}
          spotlightRadius={400}
          glowColor="106, 248, 158"
          showSpotlight={false}
        />
        <ParticleCard
          className="gameContainer__panelBg magic-bento-card magic-bento-card--border-glow"
          style={{ ...basePanelStyle, ...gameBgStyle }}
          glowColor="106, 248, 158"
          particleCount={0}
          enableTilt={false}
          enableMagnetism={false}
        >
          <GamePanel {...game} />
        </ParticleCard>
        <ParticleCard
          className="gameContainer__panelBg magic-bento-card magic-bento-card--border-glow"
          style={{ ...basePanelStyle, ...gameBgStyle }}
          glowColor="106, 248, 158"
          particleCount={0}
          enableTilt={false}
          enableMagnetism={false}
        >
          <ChatPanel chatId={game.chat} lightText={true} />
        </ParticleCard>
      </div>
    )
  );
}
