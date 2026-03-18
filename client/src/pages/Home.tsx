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
    <Box p={6} maxW="1200px" mx="auto">
      <Stack gap={8}>
        <Box textAlign="center" mb={4}>
          <Heading size="lg" color="teal.600" fontWeight="bold">
            Welcome, {user?.username || "user"}!
          </Heading>
          <Box fontSize="xl" color="gray.700" mt={2}></Box>
        </Box>
        {/* Active Games Card */}
        <Box borderRadius="2xl" border="1px solid #E5E7EB" bg="white" p={6} boxShadow="sm">
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Heading size="lg" fontWeight="bold">
              Active Games
            </Heading>
            <Box display="flex" alignItems="center" gap={2}>
              <Box color="gray.500" fontWeight="medium" fontSize="md"></Box>
            </Box>
          </Box>
          <Box height="1px" bg="gray.200" my={2} />
          <Box my={4}>
            {"message" in gameList ? (
              <Box>{gameList.message}</Box>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} id="gameList">
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
                  >
                    <GameSummaryView {...game} />
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
          <Box>
            <Button
              background="green"
              size="sm"
              borderRadius="md"
              onClick={() => navigate("/game/new")}
            >
              Create New Game
            </Button>
          </Box>
        </Box>

        {/* Recent Posts Card */}
        <Box boxShadow="md" borderRadius="lg" bg="white" p={4}>
          <Box mb={2}>
            <Heading size="md">Recent Posts</Heading>
          </Box>
          <Box height="1px" bg="gray.200" my={2} />
          <Box my={4}>
            {"message" in threadList ? (
              <Box>{threadList.message}</Box>
            ) : (
              <Stack gap={3} id="threadList" role="list">
                {threadList.map((thread) => (
                  <ThreadSummaryView {...thread} key={thread.threadId.toString()} />
                ))}
              </Stack>
            )}
          </Box>
          <Box>
            <Button colorScheme="teal" size="sm" onClick={() => navigate("/forum/post/new")}>
              Create New Post
            </Button>
          </Box>
        </Box>

        {/* Leaderboard Card */}
        <Box boxShadow="md" borderRadius="lg" bg="white" p={4}>
          <Box mb={2}>
            <Heading size="md">Leaderboard</Heading>
          </Box>
          <Box height="1px" bg="gray.200" my={2} />
          <Box my={4}>
            <LeaderboardSummaryView />
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
