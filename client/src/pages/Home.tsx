import "./Home.css";
import useThreadList from "../hooks/useThreadList.ts";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import { useNavigate } from "react-router-dom";
import useGameList from "../hooks/useGameList.ts";
import GameSummaryView from "../components/GameSummaryView.tsx";
import LeaderboardSummaryView from "../components/LeaderboardSummaryView.tsx";
import { Box, Heading, Button, Stack, SimpleGrid } from "@chakra-ui/react";
import useLoginContext from "../hooks/useLoginContext.ts";

export default function Home() {
  const threadList = useThreadList(4);
  const gameList = useGameList(4);
  const navigate = useNavigate();
  const { user } = useLoginContext();

  return (
    <Box p={6} maxW="1400px" mx="auto" className="home-page">
      <Stack gap={8} className="home-page__content">
        <Box textAlign="left" mb={4} marginBottom={0} className="home-page__welcome">
          <Heading size="3xl" color="black" fontWeight="bold" className="home-page__welcome-title">
            Welcome, {user?.display || user?.username || "user"}!
          </Heading>
        </Box>

        {/* Recent Games & Leaderboard Row */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8} className="home-page__top-row">
          {/* Active Games Card */}
          <Box
            borderRadius="xl"
            border="1px solid #E5E7EB"
            bg="white"
            p={6}
            boxShadow="sm"
            className="home-card home-card--active-games"
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

            <Box height="1px" bg="gray.200" my={2} className="home-card__divider" />

            <Box my={4} className="home-card__body">
              {"message" in gameList ? (
                <Box className="home-card__empty-state">{gameList.message}</Box>
              ) : (
                <Stack gap={3} id="gameList" className="home-game-list">
                  {gameList.map((game) => (
                    <Box
                      key={game.gameId.toString()}
                      borderRadius="xl"
                      border="1px solid #E5E7EB"
                      bg="white"
                      p={5}
                      boxShadow="xs"
                      transition="box-shadow 0.2s"
                      _hover={{ boxShadow: "md" }}
                      className="home-game-list__item"
                    >
                      <GameSummaryView {...game} />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>

          {/* Leaderboard Card */}
          <Box
            borderRadius="xl"
            border="1px solid #E5E7EB"
            bg="white"
            p={6}
            boxShadow="sm"
            className="home-card home-card--leaderboard"
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

            <Box height="1px" bg="gray.200" my={2} className="home-card__divider" />

            <Box my={4} className="home-card__body home-leaderboard">
              <LeaderboardSummaryView />
            </Box>
          </Box>
        </SimpleGrid>

        {/* Recent Posts Card */}
        <Box
          borderRadius="xl"
          border="1px solid #E5E7EB"
          bg="white"
          p={6}
          boxShadow="sm"
          className="home-card home-card--recent-posts"
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

          <Box height="1px" bg="gray.200" my={2} className="home-card__divider" />

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
        </Box>
      </Stack>
    </Box>
  );
}
