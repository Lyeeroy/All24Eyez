export function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="8" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M4.5 20c.8-3.6 3.7-5.4 7.5-5.4s6.7 1.8 7.5 5.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
