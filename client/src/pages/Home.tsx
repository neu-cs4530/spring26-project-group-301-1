import "./Home.css";
import useThreadList from "../hooks/useThreadList.ts";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import { useNavigate } from "react-router-dom";
import useGameList from "../hooks/useGameList.ts";
import GameSummaryView from "../components/GameSummaryView.tsx";
import LeaderboardSummaryView from "../components/LeaderboardSummaryView.tsx";
import { Box, Heading, Button, Stack } from "@chakra-ui/react";
import useLoginContext from "../hooks/useLoginContext.ts";
import { useRef } from "react";
import { ParticleCard, GlobalSpotlight, BentoCardGrid } from "../components/ui/MagicBento.tsx";
import TextType from "../components/ui/TextType.tsx";

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "5px solid #392e4e",
  background: "#000001",
  padding: "24px",
  color: "white",
};

export default function Home() {
  const threadList = useThreadList(3);
  const gameList = useGameList(3);
  const navigate = useNavigate();
  const { user } = useLoginContext();
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <Box py={6} px={12} mx="auto" className="home-page">
      <Stack gap={8} className="home-page__content">
        <Box textAlign="center" mb={4} marginBottom={0} className="home-page__welcome">
          <TextType
            text={`Welcome, ${user?.display || user?.username || "user"}!`}
            as="h1"
            className="home-page__welcome-title"
            typingSpeed={40}
            showCursor
            loop={false}
            cursorCharacter="|"
          />
        </Box>

        <GlobalSpotlight gridRef={gridRef} spotlightRadius={300} glowColor="0, 0, 0" />

        <BentoCardGrid gridRef={gridRef}>
          {/* Recent Games Card */}
          <ParticleCard
            className="magic-bento-card magic-bento-card--border-glow home-card home-card--active-games"
            style={cardStyle}
            glowColor="132, 0, 255"
            particleCount={0}
            enableTilt={false}
            enableMagnetism={false}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
              className="home-card__header"
            >
              <Heading size="2xl" fontWeight="bold" className="home-card__title">
                Recent Games
              </Heading>
              <Box display="flex" alignItems="center" gap={2} className="home-card__actions">
                <Button
                  background="#f0fdf4"
                  color="#166534"
                  border="1px solid #bbf7d0"
                  _hover={{ background: "#dcfce7", borderColor: "#86efac" }}
                  size="sm"
                  borderRadius="md"
                  fontWeight="600"
                  onClick={() => navigate("/game/new")}
                  className="home-card__button home-card__button--create-game"
                >
                  Create New Game
                </Button>
              </Box>
            </Box>

            <Box my={4} className="home-card__body">
              {"message" in gameList ? (
                <Box className="home-card__empty-state">{gameList.message}</Box>
              ) : (
                <Stack gap={3} id="gameList" className="home-game-list">
                  {gameList.map((game) => (
                    <Box key={game.gameId.toString()} className="home-game-list__item">
                      <GameSummaryView {...game} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </ParticleCard>

          {/* Leaderboard Card */}
          <ParticleCard
            className="magic-bento-card magic-bento-card--border-glow home-card home-card--leaderboard"
            style={cardStyle}
            glowColor="132, 0, 255"
            particleCount={0}
            enableTilt={false}
            enableMagnetism={false}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
              className="home-card__header"
            >
              <Heading size="2xl" fontWeight="bold" className="home-card__title">
                Leaderboard
              </Heading>
            </Box>

            <Box my={4} className="home-card__body home-leaderboard">
              <LeaderboardSummaryView />
            </Box>
          </ParticleCard>

          {/* Recent Posts Card */}
          <ParticleCard
            className="magic-bento-card magic-bento-card--border-glow home-card home-card--recent-posts"
            style={cardStyle}
            glowColor="132, 0, 255"
            particleCount={0}
            enableTilt={false}
            enableMagnetism={false}
          >
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={2}
              className="home-card__header"
            >
              <Heading size="2xl" fontWeight="bold" className="home-card__title">
                Recent Forum Posts
              </Heading>

              <Box display="flex" alignItems="center" gap={2} className="home-card__actions">
                <Button
                  background="#f0fdf4"
                  color="#166534"
                  border="1px solid #bbf7d0"
                  _hover={{ background: "#dcfce7", borderColor: "#86efac" }}
                  size="sm"
                  borderRadius="md"
                  fontWeight="600"
                  onClick={() => navigate("/forum/post/new")}
                  className="home-card__button home-card__button--create-post"
                >
                  Create New Post
                </Button>
              </Box>
            </Box>

            <Box my={4} className="home-card__body">
              {"message" in threadList ? (
                <Box className="home-card__empty-state">{threadList.message}</Box>
              ) : (
                <Stack gap={3} id="threadList" role="list" className="home-thread-list">
                  {threadList.map((thread) => (
                    <ThreadSummaryView {...thread} key={thread.threadId.toString()} />
                  ))}
                </Stack>
              )}
            </Box>
          </ParticleCard>
        </BentoCardGrid>
      </Stack>
    </Box>
  );
}
