"use client";

import { memo } from "react";

/**
 * The hall behind the duel: a ruined stone temple in deep charcoal and blue-black with a cracked flagstone floor
 * running to the horizon. The painted creatures bring their own fire and storm on either side; this set only has
 * to hold the centre quiet and dark so the cards read. Static SVG plus slow mist, so it costs almost nothing.
 */
export const Backdrop = memo(function Backdrop() {
  const seams: string[] = [];
  for (let i = -9; i <= 9; i++) seams.push(`M ${800 + i * 62} 596 L ${800 + i * 250} 860`);
  const rows = [606, 628, 662, 712, 786];

  return (
    <div className="tcb" aria-hidden>
      <svg viewBox="0 0 1600 860" preserveAspectRatio="xMidYMid slice" className="tcb-svg" focusable="false">
        <defs>
          <linearGradient id="tcb-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#05060a" />
            <stop offset=".6" stopColor="#0b0d15" />
            <stop offset="1" stopColor="#07080c" />
          </linearGradient>
          <linearGradient id="tcb-floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#151821" />
            <stop offset="1" stopColor="#06070a" />
          </linearGradient>
          <radialGradient id="tcb-amber" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#ff8a2a" stopOpacity=".42" />
            <stop offset="1" stopColor="#ff8a2a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tcb-cold" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#3a8dff" stopOpacity=".42" />
            <stop offset="1" stopColor="#3a8dff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="tcb-dark" cx=".5" cy=".5" r=".5">
            <stop offset="0" stopColor="#000" stopOpacity=".7" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <filter id="tcb-mist" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="26" />
          </filter>
          <filter id="tcb-stone" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.03 0.05" numOctaves="4" seed="7" result="n" />
            <feDiffuseLighting in="n" lightingColor="#8d93a6" surfaceScale="3" diffuseConstant="1" result="d">
              <feDistantLight azimuth="235" elevation="48" />
            </feDiffuseLighting>
            <feComposite in="d" in2="SourceGraphic" operator="in" />
          </filter>
          <clipPath id="tcb-floor-clip">
            <rect x="0" y="596" width="1600" height="264" />
          </clipPath>
        </defs>

        <rect width="1600" height="860" fill="url(#tcb-bg)" />

        {/* far temple walls and the dark gateway */}
        <rect x="0" y="0" width="1600" height="600" fill="#0e1018" />
        <rect x="0" y="0" width="1600" height="600" fill="#0e1018" filter="url(#tcb-stone)" opacity=".45" />
        {[0, 1, 2, 3, 4, 5, 6].map((r) =>
          Array.from({ length: 9 }, (_, c) => (
            <rect key={`${r}-${c}`} x={c * 190 - (r % 2 ? 90 : 0)} y={r * 96} width="188" height="94" fill="none" stroke="#04050a" strokeOpacity=".7" strokeWidth="3" />
          )),
        )}
        <path d="M600 600 L600 300 C 600 170, 1000 170, 1000 300 L1000 600 Z" fill="#03040a" />
        <path d="M600 600 L600 300 C 600 170, 1000 170, 1000 300 L1000 600" fill="none" stroke="#23262f" strokeWidth="9" />
        <path d="M624 600 L624 306 C 624 196, 976 196, 976 306 L976 600" fill="none" stroke="#0b0c12" strokeWidth="5" />
        <ellipse cx="800" cy="560" rx="240" ry="80" fill="#9fb4cc" opacity=".05" filter="url(#tcb-mist)" />

        {/* firelight left, storm light right */}
        <ellipse cx="260" cy="420" rx="460" ry="340" fill="url(#tcb-amber)" />
        <ellipse cx="1340" cy="420" rx="460" ry="340" fill="url(#tcb-cold)" />

        {/* floor */}
        <g clipPath="url(#tcb-floor-clip)">
          <rect x="0" y="596" width="1600" height="264" fill="url(#tcb-floor)" />
          <rect x="0" y="596" width="1600" height="264" fill="#1a1d27" filter="url(#tcb-stone)" opacity=".55" />
          <path d={seams.join(" ")} stroke="#040508" strokeWidth="2.2" strokeOpacity=".8" fill="none" />
          {rows.map((y) => (
            <path key={y} d={`M0 ${y} L1600 ${y}`} stroke="#040508" strokeWidth={1.2 + (y - 596) / 60} strokeOpacity=".75" />
          ))}
          <ellipse cx="300" cy="720" rx="460" ry="120" fill="url(#tcb-amber)" />
          <ellipse cx="1300" cy="720" rx="460" ry="120" fill="url(#tcb-cold)" />
          <ellipse cx="800" cy="740" rx="380" ry="110" fill="url(#tcb-dark)" />
        </g>
        <path d="M0 596 L1600 596" stroke="#000" strokeOpacity=".7" strokeWidth="3" />

        <g className="tcb-mist tcb-mist1">
          <ellipse cx="520" cy="720" rx="540" ry="44" fill="#aab4c6" opacity=".08" filter="url(#tcb-mist)" />
        </g>
        <g className="tcb-mist tcb-mist2">
          <ellipse cx="1120" cy="750" rx="560" ry="48" fill="#9fb0c9" opacity=".07" filter="url(#tcb-mist)" />
        </g>
      </svg>
      <div className="tcb-vig" />
    </div>
  );
});
