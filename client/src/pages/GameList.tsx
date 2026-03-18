import "./Home.css";
import { Box, Button, Heading, SimpleGrid } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import GameSummaryView from "../components/GameSummaryView.tsx";
import useGameList from "../hooks/useGameList.ts";

export default function GameList() {
  const gameList = useGameList();
  const navigate = useNavigate();

  return (
    <Box p={6} maxW="1200px" mx="auto" className="home-page">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        className="home-card__header"
      >
        <Heading size="2xl" fontWeight="bold" className="home-card__title">
          All Games
        </Heading>
        <Box display="flex" alignItems="center" gap={2} className="home-card__actions">
          <Button
            background="green"
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
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6} id="gameList" className="home-game-list">
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
          </SimpleGrid>
        )}
      </Box>
    </Box>
  );
}
