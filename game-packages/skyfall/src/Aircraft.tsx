"use client";

/**
 * The SKYFALL aircraft: an original swept-wing stealth jet drawn as layered SVG. Dark navy metal, cyan-lit twin
 * engines, thin gold trim. It faces right; the engine flame trails to the left and is driven by `--thrust` (0..1)
 * on the wrapper, so the scene can change it every frame without re-rendering React.
 */
export function Aircraft({ className }: { className?: string }) {
  return (
    <svg viewBox="-34 -6 262 104" className={className} aria-hidden focusable="false" overflow="visible">
      <defs>
        <linearGradient id="sf-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a5288" />
          <stop offset=".35" stopColor="#1d2c52" />
          <stop offset="1" stopColor="#070d1f" />
        </linearGradient>
        <linearGradient id="sf-wing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2c4274" />
          <stop offset=".55" stopColor="#131f3d" />
          <stop offset="1" stopColor="#060b19" />
        </linearGradient>
        <linearGradient id="sf-wing-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#101a35" />
          <stop offset="1" stopColor="#050912" />
        </linearGradient>
        <linearGradient id="sf-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bff6ff" />
          <stop offset=".4" stopColor="#35c7e6" />
          <stop offset="1" stopColor="#0a2b4d" />
        </linearGradient>
        <linearGradient id="sf-gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8a6420" />
          <stop offset=".5" stopColor="#f6dc94" />
          <stop offset="1" stopColor="#b88a2c" />
        </linearGradient>
        <radialGradient id="sf-engine" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".3" stopColor="#7cf0ff" />
          <stop offset="1" stopColor="#0aa7d6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sf-flame" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#e9fdff" />
          <stop offset=".25" stopColor="#6ae9ff" />
          <stop offset="1" stopColor="#0aa7d6" stopOpacity="0" />
        </linearGradient>
        <filter id="sf-blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* engine plume, scaled by --thrust and flickered in CSS */}
      <g className="sf-plume" style={{ transformOrigin: "36px 46px" }}>
        <ellipse cx="6" cy="46" rx="46" ry="15" fill="url(#sf-engine)" filter="url(#sf-blur)" opacity=".85" />
        <path d="M38 41 C 14 38, -10 42, -32 46 C -10 50, 14 54, 38 51 Z" fill="url(#sf-flame)" />
        <path d="M38 43.5 C 20 42.5, 4 44.5, -14 46 C 4 47.5, 20 49.5, 38 48.5 Z" fill="#fff" opacity=".85" />
      </g>

      {/* far wing and far fin sit behind the body */}
      <path d="M120 44 L 92 12 L 78 12 L 100 46 Z" fill="url(#sf-wing-far)" />
      <path d="M62 40 L 46 6 L 38 6 L 48 42 Z" fill="url(#sf-wing-far)" />

      {/* fuselage */}
      <path d="M214 47 C 196 38, 172 33, 140 32 L 78 31 C 58 31, 44 36, 36 41 L 36 52 C 46 56, 62 58, 82 58 L 150 58 C 178 58, 198 53, 214 47 Z" fill="url(#sf-body)" />
      <path d="M214 47 C 196 38, 172 33, 140 32 L 78 31 C 58 31, 44 36, 36 41" fill="none" stroke="#7fdcff" strokeOpacity=".55" strokeWidth="1" />
      <path d="M42 52.5 C 56 55.5, 70 56.5, 90 56.5 L 150 56.5 C 176 56.5, 196 52, 210 47.6" fill="none" stroke="#04070f" strokeOpacity=".7" strokeWidth="1.6" />
      {/* gold trim line */}
      <path d="M60 45.5 L 170 45 C 184 45, 196 46, 206 47" fill="none" stroke="url(#sf-gold)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M104 33 L 116 33 L 112 58 L 100 58 Z" fill="#05091a" opacity=".35" />

      {/* canopy */}
      <path d="M150 33.5 C 160 28.5, 176 30.5, 190 38 C 180 41.5, 166 42.5, 150 41.5 Z" fill="url(#sf-glass)" />
      <path d="M156 34 C 164 31.5, 174 32.5, 182 36" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.1" strokeLinecap="round" />

      {/* near wing */}
      <path d="M126 50 L 66 90 L 46 90 L 88 52 Z" fill="url(#sf-wing)" />
      <path d="M126 50 L 66 90" stroke="url(#sf-gold)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M88 52 L 46 90" stroke="#7fdcff" strokeOpacity=".35" strokeWidth="1" />
      <circle cx="49" cy="88" r="2.2" fill="#7cf0ff" />

      {/* near tail fin */}
      <path d="M72 36 L 52 -2 L 40 -2 L 52 38 Z" fill="url(#sf-wing)" />
      <path d="M72 36 L 52 -2" stroke="url(#sf-gold)" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="46" cy="0" r="1.8" fill="#ff5a7a" />

      {/* twin engine nozzles */}
      <g>
        <rect x="30" y="38.5" width="14" height="6.2" rx="2.4" fill="#060b18" stroke="#2c4274" strokeWidth=".8" />
        <rect x="30" y="47.5" width="14" height="6.2" rx="2.4" fill="#060b18" stroke="#2c4274" strokeWidth=".8" />
        <ellipse cx="31" cy="41.6" rx="2.6" ry="2.4" fill="#d9fbff" />
        <ellipse cx="31" cy="50.6" rx="2.6" ry="2.4" fill="#d9fbff" />
        <ellipse className="sf-core" cx="31" cy="41.6" rx="6" ry="4.6" fill="url(#sf-engine)" />
        <ellipse className="sf-core" cx="31" cy="50.6" rx="6" ry="4.6" fill="url(#sf-engine)" />
      </g>

      {/* nose glint */}
      <path d="M196 44 L 212 47" stroke="#fff" strokeOpacity=".7" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
