import useLoginContext from "../hooks/useLoginContext.ts";
import "./Header.css";
import { Link } from "react-router-dom";

/**
 * Header component that renders the main title.
 */
export default function Header() {
  const { user, reset } = useLoginContext();

  return (
    <header id="header" className="header">
      <Link to="/" className="title">
        GameNite Connect!
      </Link>

      <nav className="header__right" aria-label="Header actions">
        <Link to={`/profile/${user.username}`} className="header__link header__link--profile">
          View Profile
        </Link>

        <Link to="/login" onClick={reset} className="header__link header__link--logout">
          Log Out
        </Link>
      </nav>
    </header>
  );
}
