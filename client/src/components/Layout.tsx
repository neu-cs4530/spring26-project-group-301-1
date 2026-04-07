import "./Layout.css";
import { Outlet, useNavigate } from "react-router-dom";
import Header from "./Header.tsx";
import { House, Gamepad2, MessageCircle, User } from "lucide-react";
import useAuth from "../hooks/useAuth.ts";
import Dock from "./ui/Dock.tsx";

export default function Layout() {
  const navigate = useNavigate();
  const { username } = useAuth();

  const dockItems = [
    {
      icon: (
        <div className="dock-item-content">
          <House size={40} color="#fff" />
          <span className="dock-item-label">Home</span>
        </div>
      ),
      label: "",
      onClick: () => navigate("/"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <Gamepad2 size={40} color="#fff" />
          <span className="dock-item-label">Games</span>
        </div>
      ),
      label: "",
      onClick: () => navigate("/games"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <MessageCircle size={40} color="#fff" />
          <span className="dock-item-label">Forum</span>
        </div>
      ),
      label: "",
      onClick: () => navigate("/forum"),
    },
    {
      icon: (
        <div className="dock-item-content">
          <User size={40} color="#fff" />
          <span className="dock-item-label">Profile</span>
        </div>
      ),
      label: "",
      onClick: () => navigate(`/profile/${username}`),
    },
  ];

  return (
    <div id="main" className="main">
      <Header />
      <div id="right_main" className="right_main">
        <Outlet />
      </div>
      <div className="dock-wrapper">
        <Dock items={dockItems} baseItemSize={90} magnification={105} panelHeight={85} />
      </div>
    </div>
  );
}
