import "./LeaderboardSummaryView.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import { getLeaderboard } from "../services/statsService.ts";
import { gameNames } from "../util/consts.ts";
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

  const first = entries.find((e) => e.rank === 1);
  const second = entries.find((e) => e.rank === 2);
  const third = entries.find((e) => e.rank === 3);

  return (
    <div className="leaderboard-summary">
      <div className="leaderboard-summary-toggle">
        <label htmlFor="leaderboard-game-filter" className="leaderboard-summary-toggle-label">
          Game:
        </label>
        <select
          id="leaderboard-game-filter"
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as ViewMode)}
          aria-label="Leaderboard game selection"
        >
          <option value="all">All Games</option>
          {GAME_TYPES.map((g) => (
            <option key={g} value={g}>
              {gameNames[g]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="leaderboard-summary-state">Loading…</p>
      ) : error ? (
        <p className="leaderboard-summary-state leaderboard-summary-state--error">{error}</p>
      ) : entries.length === 0 ? (
        <p className="leaderboard-summary-state">No results yet.</p>
      ) : (
        <>
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
                  aria-label={"leaderboard-" + entry.user.display}
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

          <div className="leaderboard-summary-podium" aria-label="Top three players">
            <div
              className={`leaderboard-summary-podium__slot leaderboard-summary-podium__slot--second ${
                second?.user ? "clickable" : "is-empty"
              }`}
              onClick={() => second?.user && navigate(`/profile/${second.user.username}`)}
            >
              <div className="leaderboard-summary-podium__medal">🥈 2nd</div>
              <div className="leaderboard-summary-podium__name">
                {second?.user ? (
                  <UserLink user={second.user} capitalize />
                ) : (
                  <span className="leaderboard-summary-unknown">—</span>
                )}
              </div>
            </div>

            <div
              className={`leaderboard-summary-podium__slot leaderboard-summary-podium__slot--first ${
                first?.user ? "clickable" : "is-empty"
              }`}
              onClick={() => first?.user && navigate(`/profile/${first.user.username}`)}
            >
              <div className="leaderboard-summary-podium__medal">🥇 1st</div>
              <div className="leaderboard-summary-podium__name">
                {first?.user ? (
                  <UserLink user={first.user} capitalize />
                ) : (
                  <span className="leaderboard-summary-unknown">—</span>
                )}
              </div>
            </div>

            <div
              className={`leaderboard-summary-podium__slot leaderboard-summary-podium__slot--third ${
                third?.user ? "clickable" : "is-empty"
              }`}
              onClick={() => third?.user && navigate(`/profile/${third.user.username}`)}
            >
              <div className="leaderboard-summary-podium__medal">🥉 3rd</div>
              <div className="leaderboard-summary-podium__name">
                {third?.user ? (
                  <UserLink user={third.user} capitalize />
                ) : (
                  <span className="leaderboard-summary-unknown">—</span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="leaderboard-summary-header">
        {generatedAt && (
          <span className="leaderboard-summary-updated">Updated {timeSince(generatedAt)}</span>
        )}
      </div>
    </div>
  );
}
