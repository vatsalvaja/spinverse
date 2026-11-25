import { useId } from "react";

// Animated details that sit on top of the baked temple art (same 1600x900 coordinate space).
const FLAMES = [
  { x: 468, y: 668 },
  { x: 1132, y: 668 },
];
const SPARKS = [
  [300, 792], [420, 776], [520, 806], [212, 760], [1090, 792], [1210, 782], [1330, 806], [1410, 770], [800, 640],
];

export function PharaohFx() {
  const u = "pf" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <>
      <defs>
        <radialGradient id={`${u}g`}>
          <stop offset="0" stopColor="#ffe9a8" stopOpacity=".95" />
          <stop offset="1" stopColor="#ff9d3a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${u}f`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff6a1a" />
          <stop offset=".5" stopColor="#ffa52e" />
          <stop offset="1" stopColor="#fff2a0" />
        </linearGradient>
      </defs>
      <ellipse cx="800" cy="500" rx="190" ry="260" fill={`url(#${u}g)`} className="sv-pulse" style={{ transformOrigin: "800px 500px" }} opacity=".35" />
      {FLAMES.map((f, i) => (
        <g key={i}>
          <circle cx={f.x} cy={f.y - 16} r="110" fill={`url(#${u}g)`} opacity=".5" className="sv-flicker" style={{ transformOrigin: `${f.x}px ${f.y}px`, animationDelay: `${i * 0.5}s` }} />
          <g className="sv-flicker" style={{ transformOrigin: `${f.x}px ${f.y + 6}px`, animationDelay: `${i * 0.35}s` }}>
            <path d={`M${f.x},${f.y - 58} C${f.x + 22},${f.y - 32} ${f.x + 18},${f.y - 8} ${f.x},${f.y + 6} C${f.x - 18},${f.y - 8} ${f.x - 22},${f.y - 32} ${f.x},${f.y - 58}Z`} fill={`url(#${u}f)`} />
            <path d={`M${f.x},${f.y - 38} C${f.x + 9},${f.y - 22} ${f.x + 8},${f.y - 10} ${f.x},${f.y} C${f.x - 8},${f.y - 10} ${f.x - 9},${f.y - 22} ${f.x},${f.y - 38}Z`} fill="#fffbe0" />
          </g>
        </g>
      ))}
      {SPARKS.map(([x, y], i) => (
        <path key={i} d={`M${x},${y - 15} L${x + 3},${y - 3} L${x + 15},${y} L${x + 3},${y + 3} L${x},${y + 15} L${x - 3},${y + 3} L${x - 15},${y} L${x - 3},${y - 3}Z`} fill="#fff6d0" className="sv-twinkle" style={{ animationDelay: `${i * 0.55}s` }} />
      ))}
    </>
  );
}
