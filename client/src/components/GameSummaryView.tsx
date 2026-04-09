import "./GameSummaryView.css";
import type { GameInfo } from "@gamenite/shared";
import { useNavigate } from "react-router-dom";
import { gameNames } from "../util/consts.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import { Lock, ShieldCheck, ShieldOff } from "lucide-react";

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

  const statusClass =
    status === "waiting"
      ? "gameSummary__status--waiting"
      : status === "active"
        ? "gameSummary__status--active"
        : "gameSummary__status--done";

  function handleClick() {
    navigate(`/game/${gameId}`);
  }

  return (
    <div className="gameSummary" role="listitem" onClick={handleClick}>
      <div className="gameSummary__header">
        <div className="gameSummary__titleContainer">
          <span className="gameSummary__titleLink">{gameNames[type]}</span>
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
