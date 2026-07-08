export function Sparkle({ size = 20, className = '' }) {
  return (
    <svg
      className={`sparkle ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2c.4 3.4 1.2 5.6 2.4 6.8C15.6 10 17.8 10.8 21 11.2c-3.2.4-5.4 1.2-6.6 2.4-1.2 1.2-2 3.4-2.4 6.8-.4-3.4-1.2-5.6-2.4-6.8C8.4 12.4 6.2 11.6 3 11.2c3.2-.4 5.4-1.2 6.6-2.4C10.8 7.6 11.6 5.4 12 2Z"
        fill="currentColor"
      />
      <path
        d="M19 3c.2 1.3.6 2.2 1.2 2.8.6.6 1.5 1 2.8 1.2-1.3.2-2.2.6-2.8 1.2-.6.6-1 1.5-1.2 2.8-.2-1.3-.6-2.2-1.2-2.8-.6-.6-1.5-1-2.8-1.2 1.3-.2 2.2-.6 2.8-1.2.6-.6 1-1.5 1.2-2.8Z"
        fill="currentColor"
      />
    </svg>
  );
}
