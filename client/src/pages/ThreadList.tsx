import "./Home.css";
import { Box, Button, Heading, Stack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ThreadSummaryView from "../components/ThreadSummaryView.tsx";
import useThreadList from "../hooks/useThreadList.ts";

export default function ThreadList() {
  const threadList = useThreadList();
  const navigate = useNavigate();

  return (
    <Box p={6} maxW="1200px" mx="auto">
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        className="home-card__header"
      >
        <Heading size="2xl" fontWeight="bold" className="home-card__title">
          All Forum Posts
        </Heading>
        <Box display="flex" alignItems="center" gap={2} className="home-card__actions">
          <Button
            background="#166534"
            color="#f0fdf4"
            border="1px solid #14532d"
            _hover={{ background: "#14532d", borderColor: "#134e4a" }}
            size="lg"
            borderRadius="md"
            fontWeight="800"
            fontSize="lg"
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
  );
}
