export function HomeIllustration({ size = 160, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 150 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* fridge */}
      <rect x="18" y="32" width="74" height="98" rx="20" fill="#FFFFFF" stroke="#F86A1E" strokeWidth="6" />
      <line x1="24" y1="64" x2="86" y2="64" stroke="#F86A1E" strokeWidth="4" strokeLinecap="round" />
      <rect x="76" y="40" width="6" height="13" rx="3" fill="#F86A1E" />
      <rect x="76" y="72" width="6" height="18" rx="3" fill="#F86A1E" />
      <circle cx="36" cy="80" r="8" fill="#BFE0B4" />
      <circle cx="52" cy="98" r="6" fill="#FAA046" />

      {/* whisk, peeking out like on the logo */}
      <line x1="86" y1="40" x2="112" y2="14" stroke="#F86A1E" strokeWidth="7" strokeLinecap="round" />
      <ellipse cx="122" cy="10" rx="12" ry="16" stroke="#F86A1E" strokeWidth="3" fill="none" />
      <line x1="114" y1="0" x2="114" y2="20" stroke="#F86A1E" strokeWidth="2" strokeLinecap="round" />
      <line x1="130" y1="0" x2="130" y2="20" stroke="#F86A1E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
