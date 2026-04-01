type EyeToggleProps = {
  shown: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  label?: string;
};

export default function EyeToggle({
  shown,
  onClick,
  label = "Show/Hide Password",
}: EyeToggleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        marginLeft: 6,
        display: "flex",
        alignItems: "center",
      }}
    >
      {shown ? (
        // Eye open SVG
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      ) : (
        // Eye closed SVG
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#888"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 5.06-6.06M1 1l22 22"></path>
          <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97"></path>
        </svg>
      )}
    </button>
  );
}
