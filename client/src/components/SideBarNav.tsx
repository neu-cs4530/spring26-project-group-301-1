import "./SideBarNav.css";
import { NavLink, type NavLinkRenderProps } from "react-router-dom";
import { House, Gamepad2, MessageCircle, User } from "lucide-react";
import useAuth from "../hooks/useAuth.ts";

/**
 * The SideBarNav component contains the primary naviagation menu. It
 * highlights the currently selected page and triggers navigation when the
 * menu items are clicked.
 */
export default function SideBarNav() {
  const { username } = useAuth();

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

      <NavLink to={`/profile/${username}`} id="menu_user" className={navClass}>
        <User className="menu_icon" aria-hidden="true" />
        <span>Profile</span>
      </NavLink>
    </div>
  );
}
