export function FridgeIllustration({ size = 96, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="16" y="8" width="60" height="86" rx="18" fill="#FFFFFF" stroke="#F86A1E" strokeWidth="5" />
      <line x1="21" y1="34" x2="71" y2="34" stroke="#F86A1E" strokeWidth="4" strokeLinecap="round" />
      <rect x="60" y="16" width="6" height="14" rx="3" fill="#F86A1E" />
      <rect x="60" y="44" width="6" height="18" rx="3" fill="#F86A1E" />
      <circle cx="32" cy="56" r="7" fill="#BFE0B4" />
      <circle cx="46" cy="72" r="5" fill="#FAA046" />
    </svg>
  );
}
