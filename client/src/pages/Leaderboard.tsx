import "./Leaderboard.css";
import "../components/MagicBento.css";
import { useCallback, useRef, useState } from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import type { LeaderboardEntry } from "@gamenite/shared";
import useLoginContext from "../hooks/useLoginContext.ts";
import { GlobalSpotlight } from "../components/ui/MagicBento.tsx";
import LeaderboardSummaryView from "../components/LeaderboardSummaryView.tsx";
import { getCustomBackgroundStyle, isLightHexColor } from "../util/customBackground.ts";

export default function Leaderboard() {
  const gridRef = useRef<HTMLDivElement>(null);
  const { user } = useLoginContext();
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const cardBackgroundStyle = getCustomBackgroundStyle((user.customBackground || "").trim());
  const useDarkTextForHeader = isLightHexColor((user.customBackground || "").trim());

  const handleEntriesLoaded = useCallback(
    (entries: LeaderboardEntry[]) => {
      const ownEntry = entries.find((entry) => entry.user?.username === user.username);
      setCurrentRank(ownEntry?.rank ?? null);
    },
    [user.username],
  );

  return (
    <Box p={6} maxW="1200px" mx="auto" className="leaderboard-page bento-section" ref={gridRef}>
      <GlobalSpotlight
        gridRef={gridRef}
        spotlightRadius={500}
        glowColor="116, 148, 235"
        showSpotlight={false}
      />
      <Box
        className={`leaderboard-page__panel magic-bento-card magic-bento-card--border-glow particle-container ${useDarkTextForHeader ? "leaderboard-page__panel--darkText" : ""}`}
        style={cardBackgroundStyle}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
          className="leaderboard-page__header"
        >
          <Heading size="2xl" fontWeight="bold" className="leaderboard-page__title">
            Leaderboard
          </Heading>
        </Box>

        <Box
          height="1px"
          bg={useDarkTextForHeader ? "rgba(17, 24, 39, 0.45)" : "gray.200"}
          my={2}
          className="leaderboard-page__divider"
        />

        <Box my={4} className="leaderboard-page__content">
          <Box className="leaderboard-page__card">
            <LeaderboardSummaryView
              onEntriesLoaded={handleEntriesLoaded}
              topLeft={
                <Text className="leaderboard-page__rank">Your rank: {currentRank ?? "N/A"}</Text>
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
