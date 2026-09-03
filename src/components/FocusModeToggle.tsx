interface FocusModeToggleProps {
  focused: boolean;
  onToggle: () => void;
}

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
  );
}

export function FocusModeToggle({ focused, onToggle }: FocusModeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={focused}
      aria-label={focused ? "Exit focus mode" : "Enter focus mode"}
      title={focused ? "Exit focus mode (Esc)" : "Focus mode"}
      className="flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center text-[var(--text-muted)] transition-colors hover:text-[var(--text-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-accent)]"
    >
      {focused ? <CompressIcon /> : <ExpandIcon />}
    </button>
  );
}
