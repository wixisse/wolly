import { useId } from "react";
import wollyIcon from "../../../public/icon.png";

interface WollyIconProps {
  size?: number;
  rounded?: boolean;
  className?: string;
  useCustomIcon?: boolean;
}

/**
 * Wolly app icon — minimal monitor / screen mark.
 * A clean flat display with a thin stand + base on a deep violet background.
 * Reads clearly at 16 px and scales to 512 px for .desktop entries.
 */
export function WollyIcon({
  size = 512,
  rounded = true,
  className = "",
  useCustomIcon = false,
}: WollyIconProps) {
  const id = useId();
  const R = rounded ? Math.round(512 * 0.224) : 0;

  if (useCustomIcon) {
    return (
      <img
        src={wollyIcon}
        alt="Wolly"
        width={size}
        height={size}
        className={className}
        style={{ display: "block", borderRadius: rounded ? "20%" : "0" }}
      />
    );
  }

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
        <clipPath id={`${id}-clip`}>
          <rect width="512" height="512" rx={R} ry={R} />
        </clipPath>

        <linearGradient
          id={`${id}-bg`}
          x1="0"
          y1="0"
          x2="512"
          y2="512"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#130828" />
          <stop offset="100%" stopColor="#0a0318" />
        </linearGradient>
        <radialGradient id={`${id}-bglow`} cx="50%" cy="48%" r="50%">
          <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#6d28d9" stopOpacity="0" />
        </radialGradient>

        <linearGradient
          id={`${id}-bezel`}
          x1="256"
          y1="80"
          x2="256"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2a1558" />
          <stop offset="100%" stopColor="#1a0d3e" />
        </linearGradient>

        <linearGradient
          id={`${id}-screen`}
          x1="256"
          y1="104"
          x2="256"
          y2="316"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0e0730" />
          <stop offset="60%" stopColor="#0a0525" />
          <stop offset="100%" stopColor="#07031a" />
        </linearGradient>
        <radialGradient id={`${id}-wallglow`} cx="50%" cy="42%" r="55%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#4f46e5" stopOpacity="0.10" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${id}-horizon`}
          x1="96"
          y1="0"
          x2="416"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0" />
          <stop offset="30%" stopColor="#a78bfa" stopOpacity="0.55" />
          <stop offset="70%" stopColor="#818cf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>

        <linearGradient
          id={`${id}-stand`}
          x1="256"
          y1="334"
          x2="256"
          y2="420"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22114a" />
          <stop offset="100%" stopColor="#16093a" />
        </linearGradient>

        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id={`${id}-glow`} x="-6%" y="-6%" width="112%" height="112%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
          <feFlood floodColor="#7c3aed" floodOpacity="0.5" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="halo" />
          <feMerge>
            <feMergeNode in="halo" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g clipPath={`url(#${id}-clip)`}>
        <rect width="512" height="512" fill={`url(#${id}-bg)`} />
        <rect width="512" height="512" fill={`url(#${id}-bglow)`} />

        <rect
          x="72"
          y="88"
          width="368"
          height="244"
          rx="20"
          ry="20"
          fill={`url(#${id}-bezel)`}
          filter={`url(#${id}-glow)`}
        />
        <rect
          x="72"
          y="88"
          width="368"
          height="244"
          rx="20"
          ry="20"
          fill="none"
          stroke="rgba(167,139,250,0.30)"
          strokeWidth="1.5"
        />

        <rect
          x="96"
          y="110"
          width="320"
          height="200"
          rx="8"
          ry="8"
          fill={`url(#${id}-screen)`}
        />
        <rect
          x="96"
          y="110"
          width="320"
          height="200"
          rx="8"
          ry="8"
          fill={`url(#${id}-wallglow)`}
        />

        <rect
          x="96"
          y="234"
          width="320"
          height="2"
          rx="1"
          fill={`url(#${id}-horizon})`}
          opacity="0.9"
        />
        <path
          d="M 96 310 L 148 258 L 186 282 L 230 240 L 256 260 L 282 240 L 326 282 L 364 258 L 416 310 Z"
          fill="rgba(167,139,250,0.09)"
        />
        <rect
          x="96"
          y="110"
          width="320"
          height="60"
          rx="0"
          ry="0"
          fill="rgba(255,255,255,0.025)"
        />
        <rect
          x="96"
          y="110"
          width="320"
          height="200"
          rx="8"
          ry="8"
          fill="none"
          stroke="rgba(167,139,250,0.15)"
          strokeWidth="1"
        />

        <rect
          x="238"
          y="332"
          width="36"
          height="54"
          fill={`url(#${id}-stand)`}
        />

        <rect
          x="154"
          y="384"
          width="204"
          height="22"
          rx="11"
          ry="11"
          fill={`url(#${id}-stand)`}
        />
        <rect
          x="154"
          y="384"
          width="204"
          height="4"
          rx="2"
          ry="2"
          fill="rgba(167,139,250,0.12)"
        />

        <rect width="512" height="512" fill={`url(#${id}-sheen)`} />
      </g>
    </svg>
  );
}
