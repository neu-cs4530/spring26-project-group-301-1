import "./GameSummaryView.css";
import type { GameInfo } from "@gamenite/shared";
import { useNavigate } from "react-router-dom";
import { gameNames } from "../util/consts.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import { Lock, ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";

const VISITED_KEY = "visitedGames";

function getVisited(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function markVisited(id: string) {
  const visited = getVisited();
  visited.add(id);
  localStorage.setItem(VISITED_KEY, JSON.stringify([...visited]));
}

/**
 * Summarizes information for a single game as part of a list of games
 */
export default function GameSummaryView({
  gameId,
  status,
  type,
  players,
  createdAt,
  createdBy,
  chatFiltered,
  isPrivate,
}: GameInfo) {
  const timeSince = useTimeSince();
  const navigate = useNavigate();
  const numPlayers = players.length;
  const [visited, setVisited] = useState(() => getVisited().has(gameId.toString()));

  const statusClass =
    status === "waiting"
      ? "gameSummary__status--waiting"
      : status === "active"
        ? "gameSummary__status--active"
        : "gameSummary__status--done";

  function handleClick() {
    markVisited(gameId.toString());
    setVisited(true);
    navigate(`/game/${gameId}`);
  }

  return (
    <div className="gameSummary" role="listitem" onClick={handleClick}>
      <div className="gameSummary__header">
        <div className="gameSummary__titleContainer">
          <span
            className={`gameSummary__titleLink ${visited ? "gameSummary__titleLink--visited" : ""}`}
          >
            {gameNames[type]}
          </span>
          {isPrivate && (
            <div className="gameSummary__privateBadge">
              <Lock size={14} />
              <span>Private</span>
            </div>
          )}
        </div>
      </div>

      <div className={`gameSummary__status ${statusClass}`}>
        {status}
        {status !== "done" && `, ${numPlayers} player${numPlayers === 1 ? "" : "s"}`}
        {chatFiltered ? (
          <span title="Chat filter on">
            <ShieldCheck size={14} />
          </span>
        ) : (
          <span title="Chat filter off">
            <ShieldOff size={14} />
          </span>
        )}
      </div>

      <div className="gameSummary__lastActivity">
        <UserLink user={createdBy} capitalize /> created {timeSince(createdAt)}
      </div>
    </div>
  );
}
