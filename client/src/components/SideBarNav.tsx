import "./SideBarNav.css";
import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import { House, Gamepad2, MessageCircle, User, Mail } from "lucide-react";
import useAuth from "../hooks/useAuth.ts";
import useFriendRequestCount from "../hooks/useFriendRequestCount";

/**
 * The SideBarNav component contains the primary naviagation menu. It
 * highlights the currently selected page and triggers navigation when the
 * menu items are clicked.
 */
export default function SideBarNav() {
  const { username } = useAuth();
  const friendRequestCount = useFriendRequestCount();

  const navClass = ({ isActive }: NavLinkRenderProps) =>
    `menu_button ${isActive ? "menu_selected" : ""}`;

  return (
    <div className="sideBarNav">
      <NavLink to="/" className={navClass}>
        <House className="menu_icon" aria-hidden="true" />
        <span>Home</span>
      </NavLink>

      <NavLink to="/games" className={navClass}>
        <Gamepad2 className="menu_icon" aria-hidden="true" />
        <span>Games</span>
      </NavLink>

      <NavLink to="/forum" className={navClass}>
        <MessageCircle className="menu_icon" aria-hidden="true" />
        <span>Forum</span>
      </NavLink>
      <NavLink to="/messages" className={navClass}>
        <Mail className="menu_icon" aria-hidden="true" />
        Messages
      </NavLink>

      <NavLink
        to={`/profile/${username}`}
        id="menu_user"
        className={navClass}
        style={{ position: "relative" }}
      >
        <User className="menu_icon" aria-hidden="true" />
        <span>Profile</span>
        {friendRequestCount > 0 && <span className="sidebarAlertBadge">{friendRequestCount}</span>}
      </NavLink>
    </div>
  );
}
