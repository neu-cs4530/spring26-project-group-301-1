import { useEffect, useState } from "react";
import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { Link } from "react-router-dom";
import { LogOut, UserRound } from "lucide-react";
import { getPendingRequests } from "../services/friendsService.ts";

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { user, pass, reset } = useLoginContext();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refreshPendingRequests = async () => {
      const res = await getPendingRequests({ username: user.username, password: pass });
      if (cancelled) return;
      if ("error" in res) {
        return;
      }
      setPendingRequestCount(res.length);
    };

    const onWindowFocus = () => {
      void refreshPendingRequests();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshPendingRequests();
      }
    };

    void refreshPendingRequests();
    const intervalId = window.setInterval(refreshPendingRequests, 5000);
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [user.username, pass]);

  return (
    <header id="header" className="header">
      <Link to="/" className="title">
        <img src="/PlaySpace.png" alt="PlaySpace logo" className="header__logo" />
        PlaySpace!
      </Link>

      <nav className="header__right" aria-label="Header actions">
        <Link to={`/profile/${user.username}`} className="header__link header__link--profile">
          <UserRound className="header__linkIcon" aria-hidden="true" />
          View Profile
          {pendingRequestCount > 0 && (
            <span
              className="header__badge"
              title={`${pendingRequestCount} pending friend request${pendingRequestCount === 1 ? "" : "s"}`}
              aria-label={`${pendingRequestCount} pending friend request${pendingRequestCount === 1 ? "" : "s"}`}
            >
              {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
            </span>
          )}
        </Link>

        <Link to="/login" onClick={reset} className="header__link header__link--logout">
          <LogOut className="header__linkIcon" aria-hidden="true" />
          Log Out
        </Link>
      </nav>
    </header>
  );
}
