const HalalcoLogo = ({ className = "h-9 w-9" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer circle */}
    <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="4" />
    {/* Center building/H motif inspired by Halalco logo */}
    {/* Left pillar */}
    <rect x="32" y="30" width="8" height="40" rx="1.5" fill="currentColor" />
    {/* Right pillar */}
    <rect x="60" y="30" width="8" height="40" rx="1.5" fill="currentColor" />
    {/* Center crossbar */}
    <rect x="40" y="45" width="20" height="8" rx="1.5" fill="currentColor" />
    {/* Top center tower */}
    <rect x="46" y="22" width="8" height="23" rx="1.5" fill="currentColor" />
    {/* Top pointed accent */}
    <path d="M50 14 L54 22 H46 Z" fill="currentColor" />
    {/* Left leaf accent */}
    <path d="M30 28 Q36 20 42 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    {/* Right leaf accent */}
    <path d="M70 28 Q64 20 58 26" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

export default HalalcoLogo;
