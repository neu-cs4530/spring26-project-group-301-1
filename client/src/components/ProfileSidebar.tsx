import React from "react";
import "./ProfileSidebar.css";
import { Image, Lock, Shield } from "lucide-react";

const SECTIONS = [
  {
    id: "game-background",
    label: "Background",
    icon: Image,
  },
  {
    id: "password",
    label: "Password",
    icon: Lock,
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: Shield,
  },
];

interface ProfileSidebarProps {
  activeSection: string;
  onSelect: (sectionId: string) => void;
  isDirty?: boolean;
  onSubmit?: (e?: React.FormEvent) => void;
}

export default function ProfileSidebar({
  activeSection,
  onSelect,
  isDirty,
  onSubmit,
}: ProfileSidebarProps) {
  return (
    <nav
      className="profileSidebar"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <ul style={{ flex: 1 }}>
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              className={section.id === activeSection ? "sidebarLink is-active" : "sidebarLink"}
              type="button"
              onClick={() => onSelect(section.id)}
            >
              <span className="sidebarIcon">
                <section.icon className="profileSidebarMenuIcon" aria-hidden="true" />
              </span>
              {section.label}
            </button>
          </li>
        ))}
      </ul>
      {typeof isDirty === "boolean" && isDirty && (
        <div style={{ marginTop: "auto" }}>
          <button
            className="primary narrow"
            style={{ width: "100%", marginTop: "1.2rem" }}
            aria-label="Submit profile edits"
            type="submit"
            onClick={onSubmit}
          >
            Save Changes
          </button>
          <div className="smallAndGray">After updating your profile, you will be logged out</div>
        </div>
      )}
    </nav>
  );
}
