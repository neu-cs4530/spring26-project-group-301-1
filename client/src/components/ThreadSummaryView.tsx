import "./ThreadSummaryView.css";
import { NavLink, useNavigate } from "react-router-dom";
import type { ThreadSummary } from "@gamenite/shared";
import useTimeSince from "../hooks/useTimeSince.ts";
import UserLink from "./UserLink.tsx";
import { ShieldCheck, ShieldOff } from "lucide-react";

/**
 * Summarizes information for a single thread as part of a list of threads
 */
export default function ThreadSummaryView({
  threadId,
  createdBy,
  createdAt,
  title,
  comments,
  filtered,
}: ThreadSummary) {
  const navigate = useNavigate();
  const timeSince = useTimeSince();

  return (
    <div className="threadSummary" role="listitem">
      <div className="postStats" onClick={() => navigate(`/forum/post/${threadId}`)}>
        {comments} {comments === 1 ? "reply" : "replies"}
      </div>
      <NavLink to={`/forum/post/${threadId}`} className="mid">
        {title}{" "}
        <span title={filtered ? "Filter on" : "Filter off"}>
          {filtered ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
        </span>
      </NavLink>
      <div className="lastActivity">
        <UserLink user={createdBy} capitalize /> posted {timeSince(createdAt)}
      </div>
    </div>
  );
}
