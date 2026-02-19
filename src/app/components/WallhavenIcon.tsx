interface WallhavenIconProps {
  size?: number;
  rounded?: boolean;
  className?: string;
}

// Static star positions (deterministic pseudo-random layout)
const STARS: [number, number, number, number][] = [
  // [x, y, radius, opacity]
  [30, 45, 1.2, 0.9], [88, 30, 0.9, 0.7], [145, 65, 1.5, 0.8], [200, 40, 0.8, 0.6],
  [260, 20, 1.8, 1.0], [312, 55, 1.0, 0.75], [380, 35, 1.4, 0.85], [435, 70, 0.8, 0.6],
  [480, 45, 1.2, 0.9], [15, 100, 0.7, 0.5], [75, 118, 1.1, 0.7], [132, 88, 0.9, 0.65],
  [185, 112, 1.6, 0.9], [244, 78, 0.8, 0.6], [296, 105, 1.0, 0.8], [358, 92, 1.3, 0.85],
  [412, 118, 0.8, 0.55], [495, 85, 1.1, 0.75], [52, 158, 1.0, 0.7], [108, 175, 0.7, 0.5],
  [168, 144, 1.4, 0.8], [228, 162, 0.9, 0.65], [282, 148, 1.1, 0.75], [338, 172, 0.8, 0.55],
  [398, 138, 1.5, 0.85], [458, 165, 0.7, 0.5], [502, 152, 1.0, 0.7], [22, 218, 0.8, 0.6],
  [88, 205, 1.2, 0.8], [142, 228, 0.9, 0.65], [198, 215, 1.0, 0.7], [252, 242, 0.7, 0.5],
  [308, 208, 1.3, 0.8], [368, 224, 0.8, 0.6], [428, 202, 1.0, 0.75], [476, 232, 0.9, 0.65],
  [60, 272, 0.8, 0.5], [118, 258, 1.1, 0.7], [176, 282, 0.7, 0.45], [238, 268, 1.0, 0.65],
  [298, 290, 0.8, 0.55], [358, 252, 1.2, 0.75], [418, 272, 0.7, 0.5], [470, 285, 0.9, 0.6],
  [95, 312, 0.8, 0.45], [160, 302, 1.0, 0.6], [218, 318, 0.7, 0.4], [275, 308, 0.9, 0.55],
  [332, 325, 0.7, 0.4], [392, 305, 1.0, 0.6], [448, 320, 0.8, 0.5],
  // Extra bright stars
  [256, 55, 2.2, 1.0], [128, 38, 2.0, 0.95], [400, 80, 1.9, 0.9],
];

export function WallhavenIcon({ size = 512, rounded = true, className = "" }: WallhavenIconProps) {
  const r = rounded ? Math.round(size * 0.224) : 0; // Apple-style ~22.4% radius

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <defs>
        {/* Rounded clip */}
        <clipPath id={`clip-${size}`}>
          <rect width="512" height="512" rx={r * (512 / size)} ry={r * (512 / size)} />
        </clipPath>

        {/* Background: deep radial dark */}
        <radialGradient id={`bg-${size}`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#1c1040" />
          <stop offset="55%" stopColor="#0d0820" />
          <stop offset="100%" stopColor="#04040e" />
        </radialGradient>

        {/* Aurora 1: violet band */}
        <radialGradient id={`aurora1-${size}`} cx="40%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>

        {/* Aurora 2: indigo/teal */}
        <radialGradient id={`aurora2-${size}`} cx="68%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#0891b2" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
        </radialGradient>

        {/* Aurora 3: deep purple sweep */}
        <linearGradient id={`aurora3-${size}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#4c1d95" stopOpacity="0" />
          <stop offset="30%" stopColor="#6d28d9" stopOpacity="0.2" />
          <stop offset="65%" stopColor="#0e7490" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#065f46" stopOpacity="0" />
        </linearGradient>

        {/* Back mountains gradient */}
        <linearGradient id={`backmt-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#162040" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#06080f" stopOpacity="0.85" />
        </linearGradient>

        {/* Mid mountains gradient */}
        <linearGradient id={`midmt-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2848" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#08091a" stopOpacity="0.95" />
        </linearGradient>

        {/* Front mountains: body */}
        <linearGradient id={`frontmt-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#263354" />
          <stop offset="40%" stopColor="#151e34" />
          <stop offset="100%" stopColor="#07080f" />
        </linearGradient>

        {/* Snow: white silver */}
        <linearGradient id={`snow-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f4ff" />
          <stop offset="100%" stopColor="#b8c8e8" stopOpacity="0.9" />
        </linearGradient>

        {/* Peak glow: radial white */}
        <radialGradient id={`peakglow-${size}`} cx="50%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Top shine: lens flare diagonal */}
        <linearGradient id={`shine-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Moon glow */}
        <radialGradient id={`moonglow-${size}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8eeff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#c8d8ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Reflection gradient */}
        <linearGradient id={`reflect-${size}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a2848" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#04040e" stopOpacity="0" />
        </linearGradient>

        {/* Bright star glow */}
        <filter id={`starglow-${size}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Bloom filter for peaks */}
        <filter id={`bloom-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feComposite in="blur" in2="SourceGraphic" operator="over" />
        </filter>
      </defs>

      <g clipPath={`url(#clip-${size})`}>
        {/* ── Background ────────────────────────────────────── */}
        <rect width="512" height="512" fill={`url(#bg-${size})`} />

        {/* ── Aurora bands ──────────────────────────────────── */}
        <ellipse cx="200" cy="185" rx="260" ry="105" fill={`url(#aurora1-${size})`} />
        <ellipse cx="340" cy="205" rx="240" ry="90" fill={`url(#aurora2-${size})`} />
        <rect x="0" y="130" width="512" height="160" fill={`url(#aurora3-${size})`} />

        {/* ── Stars ─────────────────────────────────────────── */}
        {STARS.map(([x, y, r2, op], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r2}
            fill="white"
            fillOpacity={op}
            filter={r2 >= 1.8 ? `url(#starglow-${size})` : undefined}
          />
        ))}

        {/* ── Moon ──────────────────────────────────────────── */}
        <circle cx="420" cy="68" r="22" fill={`url(#moonglow-${size})`} />
        <circle cx="420" cy="68" r="14" fill="#dde8ff" fillOpacity="0.88" />
        {/* Moon crescent shadow */}
        <circle cx="427" cy="64" r="11.5" fill="#0d0820" fillOpacity="0.85" />

        {/* ── Back mountains ────────────────────────────────── */}
        <path
          d="M 0 390 L 55 330 L 110 358 L 190 288 L 270 318 L 345 272 L 415 295 L 470 268 L 512 295 L 512 512 L 0 512 Z"
          fill={`url(#backmt-${size})`}
        />

        {/* ── Mid mountains ─────────────────────────────────── */}
        <path
          d="M 0 420 L 70 368 L 155 395 L 235 338 L 310 372 L 395 322 L 460 348 L 512 330 L 512 512 L 0 512 Z"
          fill={`url(#midmt-${size})`}
        />

        {/* ── Front mountains: W form ───────────────────────── */}
        {/* Main mountain body */}
        <path
          d="M 52 512 L 52 415 L 148 175 L 218 295 L 256 208 L 294 295 L 364 175 L 460 415 L 460 512 Z"
          fill={`url(#frontmt-${size})`}
        />

        {/* Peak glow overlay */}
        <path
          d="M 52 512 L 52 415 L 148 175 L 218 295 L 256 208 L 294 295 L 364 175 L 460 415 L 460 512 Z"
          fill={`url(#peakglow-${size})`}
          opacity="0.6"
          filter={`url(#bloom-${size})`}
        />

        {/* ── Snow caps ─────────────────────────────────────── */}
        {/* Left peak snow */}
        <path d="M 148 175 L 122 232 L 174 232 Z" fill={`url(#snow-${size})`} opacity="0.92" />
        {/* Center peak snow */}
        <path d="M 256 208 L 234 258 L 278 258 Z" fill={`url(#snow-${size})`} opacity="0.88" />
        {/* Right peak snow */}
        <path d="M 364 175 L 338 232 L 390 232 Z" fill={`url(#snow-${size})`} opacity="0.92" />

        {/* Snow highlights (very top tip) */}
        <path d="M 148 175 L 140 200 L 156 200 Z" fill="#f8fbff" />
        <path d="M 256 208 L 248 232 L 264 232 Z" fill="#f8fbff" fillOpacity="0.9" />
        <path d="M 364 175 L 356 200 L 372 200 Z" fill="#f8fbff" />

        {/* ── Lake reflection at bottom ────────────────────── */}
        <rect x="0" y="448" width="512" height="64" fill={`url(#reflect-${size})`} />
        {/* Subtle reflection of W peaks */}
        <path
          d="M 52 512 L 148 470 L 218 498 L 256 482 L 294 498 L 364 470 L 460 512 Z"
          fill="#a0b4d0"
          fillOpacity="0.08"
        />

        {/* ── Top lens shine ────────────────────────────────── */}
        <rect width="512" height="512" fill={`url(#shine-${size})`} />

        {/* ── "W" watermark text hint (very subtle) ─────────── */}
        {/* Subtle "WH" at top-left, very faint */}
        <text
          x="22"
          y="52"
          fontSize="28"
          fontWeight="800"
          fill="white"
          fillOpacity="0.08"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-1"
        >
          WH
        </text>
      </g>
    </svg>
  );
}
