export function SkylineArt({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 140" preserveAspectRatio="none" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="20" y="60" width="70" height="80" />
        <rect x="110" y="30" width="60" height="110" />
        <rect x="190" y="75" width="80" height="65" />
        <rect x="290" y="15" width="70" height="125" />
        <rect x="380" y="55" width="90" height="85" />
        <rect x="490" y="40" width="60" height="100" />
        <rect x="570" y="80" width="80" height="60" />
        <rect x="670" y="20" width="75" height="120" />
        <rect x="765" y="65" width="70" height="75" />
        <rect x="855" y="35" width="85" height="105" />
        <rect x="960" y="70" width="60" height="70" />
        <rect x="1040" y="25" width="70" height="115" />
        <rect x="1130" y="60" width="60" height="80" />
      </g>
    </svg>
  );
}