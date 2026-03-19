import React from "react";
import "./ProfileSidebar.css";

const SECTIONS = [
  {
    id: "game-background",
    label: "Game Background",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          rx="3"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
        />
        <path d="M3 17l4-4a3 3 0 014 0l4 4" strokeWidth="2" stroke="currentColor" fill="none" />
        <circle cx="9" cy="9" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: "password",
    label: "Password",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect
          x="5"
          y="11"
          width="14"
          height="8"
          rx="2"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
        />
        <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth="2" stroke="currentColor" fill="none" />
      </svg>
    ),
  },
  {
    id: "privacy",
    label: "Privacy",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          d="M12 3l7 4v5c0 5.25-3.5 10-7 10s-7-4.75-7-10V7l7-4z"
          strokeWidth="2"
          stroke="currentColor"
          fill="none"
        />
        <circle cx="12" cy="13" r="2.5" fill="currentColor" />
      </svg>
    ),
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
              <span className="sidebarIcon">{section.icon}</span>
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
        </div>
      )}
    </nav>
  );
}
