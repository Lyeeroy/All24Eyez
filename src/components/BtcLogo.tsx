export function BtcLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      className={className}
      aria-hidden
    >
      <defs>
        <radialGradient id="btc-body" cx="32%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#ffd27a" />
          <stop offset="42%" stopColor="#f5a623" />
          <stop offset="100%" stopColor="#c45e08" />
        </radialGradient>
        <radialGradient id="btc-sheen" cx="30%" cy="22%" r="70%">
          <stop offset="0%" stopColor="#fff6d6" stopOpacity="0.7" />
          <stop offset="45%" stopColor="#ffd27a" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#7a3b00" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id="btc-ring" x1="20%" y1="8%" x2="86%" y2="96%">
          <stop offset="0%" stopColor="#ffe7b0" />
          <stop offset="40%" stopColor="#f0b03a" />
          <stop offset="100%" stopColor="#9a4d0a" />
        </linearGradient>
      </defs>
      <circle cx="64" cy="64" r="62" fill="url(#btc-body)" />
      <circle cx="64" cy="64" r="62" fill="url(#btc-sheen)" />
      <circle
        cx="64"
        cy="64"
        r="56"
        fill="none"
        stroke="url(#btc-ring)"
        strokeWidth="3.2"
        opacity="0.85"
      />
      <path
        fill="#fff8ea"
        d="M84.2 55.6c1.2-8.2-5-12.6-13.6-15.5l2.8-11.1-6.8-1.7-2.7 10.8c-1.8-.4-3.6-.9-5.4-1.3l2.7-10.9-6.8-1.7-2.8 11.1c-1.5-.3-2.9-.7-4.3-1.1l.1-.2-9.4-2.3-1.8 7.3s5 1.2 4.9 1.2c2.7.7 3.2 2.5 3.1 3.9L32.4 74.4c-.2.6-.6 1.5-1.6 1.1.1.1-4.9-1.2-4.9-1.2l-3.3 7.8 8.7 2.2c1.6.4 3.2.8 4.8 1.2l-2.8 11.2 6.8 1.7 2.8-11.2c1.8.5 3.6.9 5.4 1.3l-2.8 11.1 6.8 1.7 2.8-11.2c11.6 2.2 20.3 1.3 24-9.2 3-8.4-.1-13.3-6.3-16.5 4.5-1 7.9-4 8.8-10.1ZM71.4 73.8c-2.1 8.4-16.4 3.9-21 2.7l3.8-15c4.6 1.1 19.5 3.4 17.2 12.3Zm2.1-17.6c-1.9 7.7-13.8 3.8-17.6 2.8l3.4-13.6c3.8 1 16.3 2.7 14.2 10.8Z"
      />
    </svg>
  );
}
