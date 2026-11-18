"use client";

import { useId } from "react";

const jelly = (x: number, y: number, s: number, delay: number, a: string, b: string) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <g className="sv-float" style={{ animationDelay: `${delay}s` }}>
      <path d="M-46,0 C-46,-62 46,-62 46,0 C26,-10 -26,-10 -46,0Z" fill={a} opacity=".6" />
      <path d="M-30,-6 C-30,-44 30,-44 30,-6" fill="none" stroke={b} strokeWidth="2" opacity=".85" />
      {[-28, -14, 0, 14, 28].map((tx, i) => (
        <path key={i} d={`M${tx},0 q8,26 0,52 t0,56 t0,50`} fill="none" stroke={b} strokeWidth="2.4" opacity=".55" strokeLinecap="round" />
      ))}
    </g>
  </g>
);

export function AtlantisFx() {
  const u = "af" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const fish = [
    [0, 0, 1], [60, 24, 0.8], [110, -18, 0.9], [170, 14, 0.7], [210, -30, 0.85], [270, 8, 0.75], [320, -10, 0.9], [380, 20, 0.7],
  ];
  return (
    <>
      <defs>
        <radialGradient id={`${u}c`}>
          <stop offset="0" stopColor="#ffffff" stopOpacity=".9" />
          <stop offset=".35" stopColor="#9ff8ef" stopOpacity=".5" />
          <stop offset="1" stopColor="#2fb8b0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}r`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8fffc" stopOpacity=".55" />
          <stop offset="1" stopColor="#e8fffc" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="sv-sway" style={{ transformOrigin: "300px 0px" }} opacity=".7">
        {[0, 1, 2, 3].map((i) => (
          <polygon key={i} points={`${160 + i * 330},0 ${220 + i * 330},0 ${640 + i * 330},900 ${380 + i * 330},900`} fill={`url(#${u}r)`} opacity={0.2 + (i % 2) * 0.12} />
        ))}
      </g>
      <circle cx="800" cy="176" r="150" fill={`url(#${u}c)`} className="sv-pulse" style={{ transformOrigin: "800px 176px" }} />
      <circle cx="800" cy="782" r="190" fill={`url(#${u}c)`} className="sv-pulse" style={{ transformOrigin: "800px 782px", animationDelay: "1.2s" }} opacity=".7" />
      <g className="sv-swim">
        {fish.map(([dx, dy, s], i) => (
          <g key={i} transform={`translate(${dx} ${420 + dy}) scale(${s})`} fill="#bffcf5" opacity=".6">
            <ellipse cx="0" cy="0" rx="20" ry="7.5" />
            <polygon points="-18,0 -34,-9 -34,9" />
          </g>
        ))}
      </g>
      {jelly(250, 330, 1.2, 0, "#7fe8ff", "#d6f9ff")}
      {jelly(1370, 300, 0.95, 2.4, "#c58bff", "#f0d9ff")}
      {jelly(520, 520, 0.6, 1.1, "#ff9ad8", "#ffe0f5")}
      {[[770, 742], [840, 760], [790, 810], [860, 700]].map(([x, y], i) => (
        <path key={i} d={`M${x},${y - 11} L${x + 2.5},${y - 2.5} L${x + 11},${y} L${x + 2.5},${y + 2.5} L${x},${y + 11} L${x - 2.5},${y + 2.5} L${x - 11},${y} L${x - 2.5},${y - 2.5}Z`} fill="#fff" className="sv-twinkle" style={{ animationDelay: `${i * 0.7}s` }} />
      ))}
    </>
  );
}
