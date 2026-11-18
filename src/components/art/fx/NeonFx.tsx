"use client";

import { useId } from "react";

const ORBS = [
  { x: 500, y: 772, r: 30, a: "#ff4fd8", b: "#7a1d8a", d: 0 },
  { x: 650, y: 820, r: 36, a: "#6ff2ff", b: "#1b6bff", d: 1.1 },
  { x: 800, y: 846, r: 42, a: "#fff0a8", b: "#ff8a1f", d: 0.5 },
  { x: 950, y: 820, r: 36, a: "#9b5cff", b: "#3a1380", d: 1.7 },
  { x: 1100, y: 772, r: 30, a: "#6ff2ff", b: "#1b6bff", d: 0.8 },
];
const SIGNS: [number, number, number, number, string][] = [
  [306, 330, 64, 90, "#ff4fd8"],
  [1316, 372, 70, 96, "#6ff2ff"],
  [486, 500, 46, 62, "#9b5cff"],
  [1130, 520, 40, 56, "#ff9a3a"],
];

export function NeonFx() {
  const u = "nf" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <>
      <defs>
        {ORBS.map((o, i) => (
          <radialGradient key={i} id={`${u}o${i}`} cx=".35" cy=".3" r=".8">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset=".35" stopColor={o.a} />
            <stop offset="1" stopColor={o.b} />
          </radialGradient>
        ))}
        <radialGradient id={`${u}c`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset=".3" stopColor="#6ff2ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#6ff2ff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="800" cy="270" r="238" fill="none" stroke="#6ff2ff" strokeOpacity=".7" strokeWidth="2.5" strokeDasharray="6 16" className="sv-spin-slow" style={{ transformOrigin: "800px 270px" }} />
      <circle cx="800" cy="270" r="270" fill="none" stroke="#ff4fd8" strokeOpacity=".5" strokeWidth="2" strokeDasharray="34 24" className="sv-spin-rev" style={{ transformOrigin: "800px 270px" }} />
      <circle cx="800" cy="172" r="120" fill={`url(#${u}c)`} className="sv-pulse" style={{ transformOrigin: "800px 172px" }} opacity=".8" />
      <line x1="800" y1="150" x2="800" y2="-10" stroke="#6ff2ff" strokeWidth="6" opacity=".7" className="sv-neon-flick" />
      {SIGNS.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} fill={c} opacity=".28" className="sv-neon-flick" style={{ animationDelay: `${i * 1.3}s` }} />
      ))}
      {ORBS.map((o, i) => (
        <g key={i} className="sv-float" style={{ animationDelay: `${o.d}s` }}>
          <circle cx={o.x} cy={o.y} r={o.r * 2.4} fill={o.a} opacity=".16" />
          <circle cx={o.x} cy={o.y} r={o.r * 1.45} fill="none" stroke={o.a} strokeWidth="2" strokeDasharray="5 9" opacity=".85" className="sv-spin-mid" style={{ transformOrigin: `${o.x}px ${o.y}px` }} />
          <circle cx={o.x} cy={o.y} r={o.r} fill={`url(#${u}o${i})`} />
          <ellipse cx={o.x - o.r * 0.3} cy={o.y - o.r * 0.4} rx={o.r * 0.28} ry={o.r * 0.16} fill="#fff" opacity=".85" />
        </g>
      ))}
    </>
  );
}
