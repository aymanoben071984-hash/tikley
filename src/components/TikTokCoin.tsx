import React from "react";

interface TikTokCoinProps {
  size?: number;
  spin?: boolean;
  className?: string;
}

/** Gold TikTok coin icon (OverlayLive's `.ol-tiktok-coin` style). */
export function TikTokCoin({ size = 16, spin = true, className = "" }: TikTokCoinProps) {
  const id = React.useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      className={`ol-tiktok-coin ${spin ? "ol-tiktok-coin-spin" : ""} ${className}`}
    >
      <defs>
        <radialGradient id={`c-${id}`} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ffc93c" />
          <stop offset="100%" stopColor="#e08a00" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="15" fill="#b86e00" />
      <circle cx="16" cy="16" r="13.6" fill={`url(#c-${id})`} />
      <circle cx="16" cy="16" r="11" fill="none" stroke="#fff6c8" strokeOpacity="0.55" strokeWidth="1" />
      <g transform="translate(9.6 9.2) scale(0.54)">
        <path
          fill="#8a4b00"
          d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"
        />
      </g>
    </svg>
  );
}
