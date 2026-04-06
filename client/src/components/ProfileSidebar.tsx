import React from "react";
import "./ProfileSidebar.css";
import { Image, Lock, Shield, User, type LucideIcon } from "lucide-react";

const SETTINGS = [
  {
    id: "display-name",
    label: "Display Name",
    icon: User,
  },
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
  const renderSectionButton = (section: { id: string; label: string; icon: LucideIcon }) => (
    <li key={section.id}>
      <button
        className={section.id === activeSection ? "sidebarLink is-active" : "sidebarLink"}
        type="button"
        onClick={() => onSelect(section.id)}
      >
        <span className="sidebarIcon">
          <section.icon className="profileSidebarMenuIcon" aria-hidden={true} />
        </span>
        {section.label}
      </button>
    </li>
  );

  return (
    <nav
      className="profileSidebar"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div className="profileSidebar__sections" style={{ flex: 1 }}>
        <section className="profileSidebar__group" aria-label="Settings section">
          <h2 className="profileSidebar__groupHeading">Settings</h2>
          <ul>{SETTINGS.map((section) => renderSectionButton(section))}</ul>
        </section>
      </div>
      {typeof isDirty === "boolean" && isDirty && (
        <div style={{ marginTop: "auto" }}>
          <button
            className="profileSidebar__saveButton"
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
