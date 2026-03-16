import "./LeaderboardSummaryView.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import { getLeaderboard } from "../services/statsService.ts";
import { zGameKey, type GameKey, type LeaderboardEntry } from "@gamenite/shared";

const GAME_TYPES: GameKey[] = zGameKey.options.map((o) => o.value);

type ViewMode = "all" | GameKey;

interface LeaderboardSummaryViewProps {
  entryLimit?: number;
}

function rankClassName(rank: number) {
  if (rank === 1) return "leaderboard-summary-rank leaderboard-summary-rank--gold";
  if (rank === 2) return "leaderboard-summary-rank leaderboard-summary-rank--silver";
  if (rank === 3) return "leaderboard-summary-rank leaderboard-summary-rank--bronze";
  return "leaderboard-summary-rank";
}

export default function LeaderboardSummaryView({ entryLimit = 10 }: LeaderboardSummaryViewProps) {
  const navigate = useNavigate();
  const timeSince = useTimeSince();

  const [viewMode, setViewMode] = useState<ViewMode>("all");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getLeaderboard({
          gameType: viewMode === "all" ? undefined : viewMode,
          entryLimit,
        });
        if (cancelled) return;
        if ("error" in res) {
          setError(res.error);
        } else {
          setEntries(res.entries);
          setGeneratedAt(res.generatedAt);
        }
      } catch {
        if (!cancelled) setError("Failed to load leaderboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [viewMode, entryLimit]);

  return (
    <div className="leaderboard-summary">
      <div className="leaderboard-summary-header">
        {generatedAt && (
          <span className="leaderboard-summary-updated">Updated {timeSince(generatedAt)}</span>
        )}
      </div>

      <div className="leaderboard-summary-toggle" role="tablist">
        <button
          role="tab"
          aria-selected={viewMode === "all"}
          className={viewMode === "all" ? "active" : ""}
          onClick={() => setViewMode("all")}
        >
          All Games
        </button>
        {GAME_TYPES.map((g) => (
          <button
            key={g}
            role="tab"
            aria-selected={viewMode === g}
            className={viewMode === g ? "active" : ""}
            onClick={() => setViewMode(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="leaderboard-summary-state">Loading…</p>
      ) : error ? (
        <p className="leaderboard-summary-state leaderboard-summary-state--error">{error}</p>
      ) : entries.length === 0 ? (
        <p className="leaderboard-summary-state">No results yet.</p>
      ) : (
        <table className="leaderboard-summary-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Won</th>
              <th>Lost</th>
              <th>Draw</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.user?.username ?? entry.rank}
                className="leaderboard-summary-row"
                onClick={() => entry.user && navigate(`/profile/${entry.user.username}`)}
              >
                <td className={rankClassName(entry.rank)}>{entry.rank}</td>
                <td>
                  {entry.user ? (
                    <UserLink user={entry.user} capitalize />
                  ) : (
                    <span className="leaderboard-summary-unknown">Unknown</span>
                  )}
                </td>
                <td className="leaderboard-summary-wins">{entry.wins}</td>
                <td className="leaderboard-summary-losses">{entry.losses}</td>
                <td className="leaderboard-summary-draws">{entry.draws}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
