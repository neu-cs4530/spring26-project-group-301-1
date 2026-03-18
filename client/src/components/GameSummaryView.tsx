import "./GameSummaryView.css";
import type { GameInfo } from "@gamenite/shared";
import { NavLink, useNavigate } from "react-router-dom";
import { gameNames } from "../util/consts.ts";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";

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
}: GameInfo) {
  const timeSince = useTimeSince();
  const navigate = useNavigate();
  const numPlayers = players.length;

  return (
    <div className="gameSummary" role="listitem">
      <div className="gameSummary__header">
        <NavLink to={`/game/${gameId}`} className="gameSummary__titleLink">
          {gameNames[type]}
        </NavLink>

        <div className="gameSummary__lastActivity">
          <UserLink user={createdBy} capitalize /> created {timeSince(createdAt)}
        </div>
      </div>

      <div className="gameSummary__status" onClick={() => navigate(`/game/${gameId}`)}>
        {status}
        {status !== "done" && `, ${numPlayers} player${numPlayers === 1 ? "" : "s"}`}
      </div>
    </div>
  );
}
