import Link from "next/link";

function LogoSVG({ height = 48 }: { height?: number }) {
  const width = (400 / 120) * height; // maintain aspect ratio
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 120" fill="none" width={width} height={height} aria-label="WorkHelm">
      <defs>
        <linearGradient id="helm-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="helm-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <g transform="translate(60, 60)">
        <path d="M-28 8 C-28 -16 -18 -28 0 -28 C18 -28 28 -16 28 8"
          stroke="url(#helm-shine)" strokeWidth="5" strokeLinecap="round" fill="url(#helm-grad)" />
        <path d="M-40 8 C-40 2 -20 0 0 0 C20 0 40 2 40 8"
          stroke="url(#helm-shine)" strokeWidth="4" strokeLinecap="round" fill="none" />
        <line x1="-38" y1="8" x2="-34" y2="8" stroke="url(#helm-shine)" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="-28" x2="0" y2="2" stroke="url(#helm-shine)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      </g>
      <text x="140" y="48" fontFamily="system-ui, -apple-system, sans-serif" fontSize="36" fontWeight="800" fill="#1E293B" letterSpacing="-0.5">
        Work<tspan fill="#2563EB">Helm</tspan>
      </text>
      <text x="140" y="72" fontFamily="system-ui, -apple-system, sans-serif" fontSize="12" fontWeight="500" fill="#64748B" letterSpacing="2">
        FOLLOW UP. CLOSE MORE.
      </text>
    </svg>
  );
}

export function Logo({ href = "/", size = "md" }: { href?: string; size?: "sm" | "md" | "lg" }) {
  const heights = { sm: 28, md: 40, lg: 56 };
  const h = heights[size];

  if (href) {
    return (
      <Link href={href} className="flex items-center shrink-0">
        <LogoSVG height={h} />
      </Link>
    );
  }

  return <LogoSVG height={h} />;
}
