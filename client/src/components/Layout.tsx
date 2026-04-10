import "./Layout.css";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Header from "./Header.tsx";
import { House, Gamepad2, Mail, Trophy, Menu, MessageCircle, User, X } from "lucide-react";
import useAuth from "../hooks/useAuth.ts";
import Dock from "./ui/Dock.tsx";

export default function Layout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { username } = useAuth();
  const [isDockMenuOpen, setIsDockMenuOpen] = useState(false);

  const isActiveGameRoute = /^\/game\/[^/]+$/.test(pathname) && pathname !== "/game/new";

  useEffect(() => {
    if (!isActiveGameRoute) {
      const timer = setTimeout(() => setIsDockMenuOpen(false), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isActiveGameRoute]);

  const navigateFromDock = (target: string) => {
    navigate(target);
    setIsDockMenuOpen(false);
  };

  const dockItems = [
    {
      icon: (
        <div className="dock-item-content">
          <House size={40} color="#fff" />
          <span className="dock-item-label">Home</span>
        </div>
      ),
      label: "",
      onClick: () => navigateFromDock("/"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <Gamepad2 size={40} color="#fff" />
          <span className="dock-item-label">Games</span>
        </div>
      ),
      label: "",
      onClick: () => navigateFromDock("/games"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <MessageCircle size={40} color="#fff" />
          <span className="dock-item-label">Forum</span>
        </div>
      ),
      label: "",
      onClick: () => navigateFromDock("/forum"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <Mail size={40} color="#fff" />
          <span className="dock-item-label">Messages</span>
        </div>
      ),
      label: "",
      onClick: () => navigateFromDock("/messages"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <Trophy size={40} color="#fff" />
          <span className="dock-item-label">Standings</span>
        </div>
      ),
      label: "",
      onClick: () => navigateFromDock("/leaderboard"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <User size={40} color="#fff" />
          <span className="dock-item-label">Profile</span>
        </div>
      ),
      label: "",
      onClick: () => navigateFromDock(`/profile/${username}`),
    },
  ];

  return (
    <div id="main" className="main">
      <Header />
      <div id="right_main" className="right_main">
        <Outlet />
      </div>
      {isActiveGameRoute ? (
        <div className="dock-wrapper dock-wrapper--game">
          <button
            className="dock-menu-button"
            type="button"
            aria-label={isDockMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isDockMenuOpen}
            aria-controls="game-route-dock"
            onClick={() => setIsDockMenuOpen((current) => !current)}
          >
            {isDockMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          {isDockMenuOpen && (
            <div id="game-route-dock" className="dock-wrapper__expanded">
              <Dock
                items={dockItems}
                baseItemSize={90}
                magnification={105}
                panelHeight={110}
                dockHeight={110}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="dock-wrapper">
          <Dock items={dockItems} baseItemSize={90} magnification={105} panelHeight={110} />
        </div>
      )}
    </div>
  );
}
