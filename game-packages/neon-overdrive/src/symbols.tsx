"use client";

import { TIERS, tierOf, type SymId, type Tier } from "./engine";

/**
 * Layered SVG artwork for every reel symbol. Gradients, clip paths and filters live once in <NeonDefs/>
 * (rendered by the game root) and are referenced by id, so each symbol is only its own geometry.
 * Every symbol is a physical object: a dark chassis, chrome bevels, an emissive core, a glass highlight
 * and a floor reflection. Idle motion is CSS (see styles.ts) and only touches transforms and opacity.
 */

const TIER_LIST: Tier[] = ["mini", "minor", "major", "grand"];

export function NeonDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden focusable="false">
      <defs>
        <linearGradient id="nd-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6fbff" />
          <stop offset=".3" stopColor="#8f9fc2" />
          <stop offset=".52" stopColor="#2a3354" />
          <stop offset=".78" stopColor="#a9b9da" />
          <stop offset="1" stopColor="#3a4566" />
        </linearGradient>
        <linearGradient id="nd-chromeH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3a4566" />
          <stop offset=".25" stopColor="#e9f2ff" />
          <stop offset=".55" stopColor="#7d8db3" />
          <stop offset="1" stopColor="#242c49" />
        </linearGradient>
        <linearGradient id="nd-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262c55" />
          <stop offset=".55" stopColor="#0d1130" />
          <stop offset="1" stopColor="#05071a" />
        </linearGradient>
        <linearGradient id="nd-gunmetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#59668c" />
          <stop offset=".5" stopColor="#1c2243" />
          <stop offset="1" stopColor="#0a0d26" />
        </linearGradient>
        <linearGradient id="nd-cyan" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9fbff" />
          <stop offset=".45" stopColor="#25d9ff" />
          <stop offset="1" stopColor="#0a58d0" />
        </linearGradient>
        <linearGradient id="nd-magenta" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd6f7" />
          <stop offset=".45" stopColor="#ff3fd0" />
          <stop offset="1" stopColor="#6a0a86" />
        </linearGradient>
        <linearGradient id="nd-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eadfff" />
          <stop offset=".45" stopColor="#8f5bff" />
          <stop offset="1" stopColor="#2f1383" />
        </linearGradient>
        <linearGradient id="nd-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff8d6" />
          <stop offset=".5" stopColor="#ffcf5a" />
          <stop offset="1" stopColor="#c4730d" />
        </linearGradient>
        <linearGradient id="nd-fac1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c8fff0" />
          <stop offset="1" stopColor="#17c9a0" />
        </linearGradient>
        <linearGradient id="nd-fac2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2ef2c0" />
          <stop offset="1" stopColor="#046a70" />
        </linearGradient>
        <linearGradient id="nd-fac3" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f9c9a" />
          <stop offset="1" stopColor="#052f4d" />
        </linearGradient>
        <linearGradient id="nd-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7ff3ff" stopOpacity=".85" />
          <stop offset="1" stopColor="#7ff3ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="nd-glassSweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nd-hi" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nd-reactor" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".3" stopColor="#d4fbff" />
          <stop offset=".7" stopColor="#35e8ff" />
          <stop offset="1" stopColor="#0a58d0" stopOpacity=".2" />
        </radialGradient>
        <radialGradient id="nd-eye" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".25" stopColor="#7ff3ff" />
          <stop offset=".62" stopColor="#1f7bff" />
          <stop offset="1" stopColor="#0a1348" />
        </radialGradient>
        <radialGradient id="nd-body" cx=".38" cy=".3" r=".8">
          <stop offset="0" stopColor="#eef6ff" />
          <stop offset=".3" stopColor="#8b9bc2" />
          <stop offset=".65" stopColor="#2b3458" />
          <stop offset="1" stopColor="#0a0d26" />
        </radialGradient>
        <radialGradient id="nd-lens" cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor="#ffb6f0" />
          <stop offset=".45" stopColor="#d322b8" />
          <stop offset="1" stopColor="#3b0a62" />
        </radialGradient>
        {TIER_LIST.map((t) => (
          <radialGradient key={t} id={`nd-orb-${t}`} cx=".36" cy=".3" r=".85">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".18" stopColor={TIERS[t].light} />
            <stop offset=".55" stopColor={TIERS[t].main} />
            <stop offset="1" stopColor={TIERS[t].deep} />
          </radialGradient>
        ))}
        <clipPath id="nd-cellwin"><rect x="37" y="24" width="26" height="52" rx="9" /></clipPath>
        <clipPath id="nd-crystalclip"><polygon points="50,6 73,26 73,70 50,94 27,70 27,26" /></clipPath>
        <clipPath id="nd-lensclip"><path d="M14 44 C14 33 30 28 44 29 L56 29 C70 28 86 33 86 44 C86 58 76 66 63 65 C57 64 55 58 50 58 C45 58 43 64 37 65 C24 66 14 58 14 44 Z" /></clipPath>
        <clipPath id="nd-orbclip"><circle cx="50" cy="46" r="29" /></clipPath>
        <filter id="nd-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id="nd-bloom" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="nd-bloomLg" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
    </svg>
  );
}

/* ------------------------------ individual art ------------------------------ */

function Floor({ c }: { c: string }) {
  return <ellipse className="no-floor" cx="50" cy="93" rx="28" ry="4.2" fill={c} opacity=".35" filter="url(#nd-soft)" />;
}

function PlasmaCell() {
  return (
    <g className="no-bob">
      <Floor c="#25d9ff" />
      {/* chassis */}
      <rect x="29" y="14" width="42" height="74" rx="15" fill="url(#nd-gunmetal)" stroke="url(#nd-chrome)" strokeWidth="1.6" />
      <rect x="31.5" y="16.5" width="37" height="69" rx="13" fill="none" stroke="#6fe8ff" strokeOpacity=".28" />
      {/* terminals */}
      <rect x="39" y="6" width="22" height="12" rx="3.5" fill="url(#nd-chromeH)" stroke="#0a0d26" strokeWidth=".8" />
      <rect x="43" y="3.5" width="14" height="5" rx="2" fill="url(#nd-chrome)" />
      <rect x="27" y="79" width="46" height="11" rx="5.5" fill="url(#nd-chromeH)" stroke="#0a0d26" strokeWidth=".8" />
      <rect x="30" y="82" width="40" height="2" rx="1" fill="#25d9ff" opacity=".8" className="no-blink" />
      {/* glass window and fluid */}
      <rect x="36" y="23" width="28" height="54" rx="10" fill="#031026" stroke="#7ff3ff" strokeOpacity=".75" strokeWidth="1.2" />
      <g clipPath="url(#nd-cellwin)">
        <g className="no-fluid">
          <rect x="30" y="38" width="40" height="50" fill="url(#nd-cyan)" />
          <path className="no-wave" d="M28 38 Q35 33 42 38 T56 38 T70 38 V44 H28Z" fill="#c9fbff" opacity=".85" />
        </g>
        <circle className="no-bub b1" cx="45" cy="70" r="2.2" fill="#e7feff" opacity=".8" />
        <circle className="no-bub b2" cx="55" cy="72" r="1.6" fill="#e7feff" opacity=".8" />
        <circle className="no-bub b3" cx="50" cy="68" r="1.2" fill="#e7feff" opacity=".8" />
        <path d="M54 44 L45 58 H51 L47 71 L58 54 H51 Z" fill="#fff" opacity=".92" filter="url(#nd-bloom)" />
        <rect x="38" y="25" width="4" height="50" rx="2" fill="#fff" opacity=".38" />
        <rect x="58" y="27" width="2" height="46" rx="1" fill="#fff" opacity=".2" />
      </g>
      {/* charge ticks */}
      {[30, 38, 46, 54, 62, 70].map((y, i) => (
        <rect key={y} x="31.5" y={y} width="3" height="3.2" rx=".8" fill="#25d9ff" opacity={0.35 + (i % 3) * 0.2} />
      ))}
      <path d="M71 26 C74 40 74 62 70 82" fill="none" stroke="#25d9ff" strokeOpacity=".6" strokeWidth="1.4" />
    </g>
  );
}

function QuantumChip() {
  const pins = [0, 1, 2, 3, 4, 5];
  return (
    <g className="no-bob slow">
      <Floor c="#8f5bff" />
      {pins.map((i) => (
        <g key={i}>
          <rect x={25 + i * 9.5} y="9" width="4.6" height="11" rx="1.2" fill="url(#nd-gold)" stroke="#5a3a08" strokeWidth=".5" />
          <rect x={25 + i * 9.5} y="80" width="4.6" height="11" rx="1.2" fill="url(#nd-gold)" stroke="#5a3a08" strokeWidth=".5" />
          <rect x="9" y={25 + i * 9.5} width="11" height="4.6" rx="1.2" fill="url(#nd-gold)" stroke="#5a3a08" strokeWidth=".5" />
          <rect x="80" y={25 + i * 9.5} width="11" height="4.6" rx="1.2" fill="url(#nd-gold)" stroke="#5a3a08" strokeWidth=".5" />
        </g>
      ))}
      <rect x="18" y="18" width="64" height="64" rx="9" fill="url(#nd-gunmetal)" stroke="url(#nd-chrome)" strokeWidth="1.8" />
      <rect x="23" y="23" width="54" height="54" rx="5.5" fill="#080a22" stroke="#8f5bff" strokeOpacity=".85" strokeWidth="1" />
      {/* circuit traces */}
      <g fill="none" stroke="#ff4fd8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#nd-bloom)">
        <path className="no-trace" pathLength="100" d="M36 36 H28 V27" />
        <path className="no-trace d2" pathLength="100" d="M64 36 H72 V28" />
        <path className="no-trace d3" pathLength="100" d="M36 64 H27 V73" />
        <path className="no-trace d4" pathLength="100" d="M64 64 H73 V72 H60" />
        <path className="no-trace d2" pathLength="100" d="M50 33 V26 H42" />
        <path className="no-trace" pathLength="100" d="M50 67 V74 H58" />
      </g>
      {/* the die */}
      <rect x="34" y="34" width="32" height="32" rx="4.5" fill="url(#nd-violet)" stroke="#e1d0ff" strokeWidth="1.2" />
      <rect x="37" y="37" width="26" height="26" rx="3" fill="#150b44" />
      <g className="no-qpulse">
        <circle cx="50" cy="50" r="8.2" fill="none" stroke="#fff" strokeWidth="2.6" filter="url(#nd-bloom)" />
        <path d="M54.5 54.5 L60 60" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3" fill="#ff4fd8" />
      </g>
      {[[24, 24], [76, 24], [24, 76], [76, 76]].map(([x, y], i) => (
        <circle key={i} className={`no-blink d${i}`} cx={x} cy={y} r="1.5" fill="#35e8ff" />
      ))}
      <polygon points="18,18 50,18 18,52" fill="#fff" opacity=".1" />
      <path d="M22 20 H78" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
    </g>
  );
}

function CircuitCrystal() {
  return (
    <g className="no-bob">
      <Floor c="#2ef2c0" />
      <g className="no-shard s1"><polygon points="12,64 18,50 24,66 18,78" fill="url(#nd-fac2)" stroke="#c8fff0" strokeWidth=".8" opacity=".9" /></g>
      <g className="no-shard s2"><polygon points="80,24 86,12 91,28 85,38" fill="url(#nd-fac1)" stroke="#c8fff0" strokeWidth=".8" opacity=".9" /></g>
      <polygon points="50,6 73,26 73,70 50,94 27,70 27,26" fill="#04252b" />
      {/* facets */}
      <polygon points="50,6 73,26 50,38" fill="url(#nd-fac1)" />
      <polygon points="50,6 27,26 50,38" fill="url(#nd-fac2)" />
      <polygon points="27,26 50,38 27,70" fill="url(#nd-fac3)" />
      <polygon points="73,26 50,38 73,70" fill="url(#nd-fac2)" />
      <polygon points="27,70 50,38 50,94" fill="url(#nd-fac3)" />
      <polygon points="73,70 50,38 50,94" fill="url(#nd-fac1)" opacity=".82" />
      {/* etched circuitry */}
      <g fill="none" stroke="#e8fff8" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" filter="url(#nd-bloom)">
        <path className="no-trace" pathLength="100" d="M50 38 V56 L60 66 V78" />
        <path className="no-trace d2" pathLength="100" d="M50 56 L40 66 V74" />
        <path className="no-trace d3" pathLength="100" d="M50 38 L38 30 H33" />
      </g>
      <circle cx="60" cy="66" r="2" fill="#fff" className="no-blink" />
      <circle cx="40" cy="66" r="2" fill="#fff" className="no-blink d2" />
      <circle cx="50" cy="38" r="2.6" fill="#fff" filter="url(#nd-bloom)" />
      <polygon points="50,6 73,26 73,70 50,94 27,70 27,26" fill="none" stroke="#e8fff8" strokeWidth="1.8" strokeLinejoin="round" />
      <g clipPath="url(#nd-crystalclip)">
        <rect className="no-glint" x="0" y="-10" width="22" height="120" fill="url(#nd-glassSweep)" transform="rotate(18 50 50)" />
      </g>
      <path d="M33 28 L46 12" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function HoloVisor() {
  const lens = "M14 44 C14 33 30 28 44 29 L56 29 C70 28 86 33 86 44 C86 58 76 66 63 65 C57 64 55 58 50 58 C45 58 43 64 37 65 C24 66 14 58 14 44 Z";
  return (
    <g className="no-bob slow">
      <Floor c="#ff4fd8" />
      <ellipse cx="50" cy="48" rx="46" ry="20" fill="#ff4fd8" opacity=".22" filter="url(#nd-bloomLg)" />
      {/* straps */}
      <rect x="4" y="38" width="10" height="14" rx="3" fill="url(#nd-chromeH)" stroke="#0a0d26" />
      <rect x="86" y="38" width="10" height="14" rx="3" fill="url(#nd-chromeH)" stroke="#0a0d26" />
      <path d="M4 44 H0 M96 44 H100" stroke="#2a3354" strokeWidth="6" strokeLinecap="round" />
      {/* frame */}
      <path d="M9 44 C9 28 30 22 44 23 L56 23 C70 22 91 28 91 44 C91 62 78 72 63 71 C57 70 55 64 50 64 C45 64 43 70 37 71 C22 72 9 62 9 44 Z" fill="url(#nd-gunmetal)" stroke="url(#nd-chrome)" strokeWidth="2" />
      <path d={lens} fill="url(#nd-lens)" stroke="#ffd0f4" strokeWidth="1" />
      <g clipPath="url(#nd-lensclip)">
        {/* HUD */}
        <g fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth=".9">
          <circle cx="30" cy="46" r="9" />
          <circle cx="30" cy="46" r="4" strokeDasharray="2 2" className="no-spin" />
          <path d="M18 46 H42 M30 34 V58" strokeOpacity=".35" />
          <path d="M58 36 H82 M58 41 H76 M58 46 H80" strokeOpacity=".55" />
          <path d="M60 56 L66 50 L72 54 L80 44" stroke="#35e8ff" strokeOpacity=".95" strokeWidth="1.3" />
        </g>
        <rect x="58" y="51" width="3" height="6" fill="#fff" opacity=".7" /><rect x="63" y="48" width="3" height="9" fill="#fff" opacity=".5" />
        <rect className="no-scan" x="10" y="28" width="82" height="4" fill="#fff" opacity=".55" />
        <ellipse cx="34" cy="36" rx="22" ry="6" fill="#fff" opacity=".28" transform="rotate(-8 34 36)" />
      </g>
      <rect x="47" y="27" width="6" height="34" rx="2" fill="url(#nd-chrome)" opacity=".95" />
      <path d="M16 31 C26 25 40 25 46 26" fill="none" stroke="#fff" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="44" r="1.8" fill="#35e8ff" className="no-blink" />
      <circle cx="88" cy="44" r="1.8" fill="#35e8ff" className="no-blink d2" />
    </g>
  );
}

function CyberDrone() {
  const rotor = (x: number, y: number, d: string) => (
    <g key={d}>
      <path d={`M50 52 L${x} ${y}`} stroke="url(#nd-chrome)" strokeWidth="5" strokeLinecap="round" />
      <ellipse className={`no-rotor ${d}`} cx={x} cy={y - 3} rx="13" ry="3.6" fill="#7ff3ff" opacity=".35" />
      <ellipse cx={x} cy={y - 3} rx="13" ry="3.6" fill="none" stroke="#c9fbff" strokeOpacity=".8" strokeWidth=".9" />
      <rect x={x - 3} y={y - 4} width="6" height="8" rx="2" fill="url(#nd-gunmetal)" stroke="#8b9bc2" strokeWidth=".7" />
    </g>
  );
  return (
    <g className="no-bob">
      <Floor c="#5aa8ff" />
      <polygon className="no-beam" points="43,64 57,64 70,96 30,96" fill="url(#nd-beam)" />
      {rotor(15, 30, "r1")}{rotor(85, 30, "r2")}{rotor(18, 72, "r3")}{rotor(82, 72, "r4")}
      {/* hull */}
      <ellipse cx="50" cy="54" rx="27" ry="23" fill="url(#nd-gunmetal)" stroke="url(#nd-chrome)" strokeWidth="2" />
      <circle cx="50" cy="53" r="19" fill="url(#nd-body)" stroke="#0a0d26" strokeWidth="1" />
      <path d="M31 53 H69 M50 34 V72" stroke="#0a0d26" strokeOpacity=".45" strokeWidth=".8" />
      <circle cx="50" cy="53" r="13" fill="#05071a" stroke="#7ff3ff" strokeWidth="1.4" />
      <circle className="no-eye" cx="50" cy="53" r="10.5" fill="url(#nd-eye)" filter="url(#nd-bloom)" />
      <circle cx="50" cy="53" r="3.4" fill="#05071a" className="no-pupil" />
      <ellipse cx="46" cy="48.5" rx="4" ry="2.6" fill="#fff" opacity=".85" transform="rotate(-30 46 48.5)" />
      <path d="M33 40 C38 33 48 31 56 32" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      <rect x="47" y="22" width="6" height="8" rx="1.5" fill="url(#nd-chrome)" />
      <line x1="50" y1="22" x2="50" y2="14" stroke="#c9d6f5" strokeWidth="1.4" />
      <circle className="no-blink" cx="50" cy="13" r="2.4" fill="#ff4fd8" filter="url(#nd-bloom)" />
      <circle className="no-blink d2" cx="38" cy="70" r="1.6" fill="#35e8ff" />
      <circle className="no-blink" cx="62" cy="70" r="1.6" fill="#35e8ff" />
    </g>
  );
}

function ArcReactor() {
  const nodes = Array.from({ length: 8 }, (_, i) => (i * Math.PI) / 4);
  return (
    <g>
      <ellipse cx="50" cy="44" rx="42" ry="42" fill="#35e8ff" opacity=".28" filter="url(#nd-bloomLg)" className="no-core-glow" />
      <ellipse className="no-floor" cx="50" cy="93" rx="30" ry="4.2" fill="#7ff3ff" opacity=".4" filter="url(#nd-soft)" />
      {/* outer chrome ring */}
      <circle cx="50" cy="44" r="38" fill="url(#nd-gunmetal)" stroke="url(#nd-chrome)" strokeWidth="6" />
      <circle cx="50" cy="44" r="34.5" fill="none" stroke="#0a0d26" strokeWidth="1.4" />
      {nodes.map((a, i) => (
        <circle key={i} cx={50 + Math.cos(a) * 36.5} cy={44 + Math.sin(a) * 36.5} r="1.6" fill="#05071a" stroke="#c9d6f5" strokeWidth=".6" />
      ))}
      {/* rotating coil segments */}
      <g className="no-rot" style={{ transformOrigin: "50px 44px" }}>
        {nodes.map((a, i) => (
          <path key={i} d="M50 15 L54.5 24 H45.5 Z" fill="url(#nd-cyan)" stroke="#e7feff" strokeWidth=".6" transform={`rotate(${(a * 180) / Math.PI} 50 44)`} />
        ))}
      </g>
      <circle cx="50" cy="44" r="21" fill="#05071a" stroke="url(#nd-chrome)" strokeWidth="2.2" />
      <g className="no-rotr" style={{ transformOrigin: "50px 44px" }}>
        <circle cx="50" cy="44" r="17" fill="none" stroke="#35e8ff" strokeWidth="2.4" strokeDasharray="9 6" opacity=".9" />
        <polygon points="50,29 63,51.5 37,51.5" fill="none" stroke="#e7feff" strokeWidth="1.4" opacity=".85" />
      </g>
      {/* arcs */}
      <g fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" filter="url(#nd-bloom)">
        <path className="no-arc" d="M50 44 L56 38 L53 33 L60 28" />
        <path className="no-arc d2" d="M50 44 L43 49 L47 54 L40 60" />
        <path className="no-arc d3" d="M50 44 L58 49 L63 46 L68 52" />
      </g>
      <circle className="no-core" cx="50" cy="44" r="10" fill="url(#nd-reactor)" filter="url(#nd-bloom)" />
      <circle cx="50" cy="44" r="4" fill="#fff" />
      <ellipse cx="40" cy="26" rx="11" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 40 26)" />
      {/* wild plate */}
      <g>
        <rect x="26" y="76" width="48" height="16" rx="5" fill="#05071a" stroke="url(#nd-gold)" strokeWidth="1.6" />
        <rect x="28" y="78" width="44" height="5" rx="2.5" fill="#fff" opacity=".12" />
        <text x="50" y="88.5" textAnchor="middle" fontSize="12.5" fontWeight="900" letterSpacing="2.4" fill="url(#nd-gold)" stroke="#6a3c06" strokeWidth=".35" style={{ fontFamily: "Impact, 'Arial Black', system-ui, sans-serif" }}>WILD</text>
      </g>
    </g>
  );
}

export function OrbArt({ value, tier, boost = 1, hot = false }: { value: number; tier?: Tier; boost?: number; hot?: boolean }) {
  const t = tier ?? tierOf(value);
  const c = TIERS[t];
  const shown = value * boost;
  const label = t === "grand" ? "GRAND" : `×${shown}`;
  return (
    <g>
      <ellipse className="no-floor" cx="50" cy="94" rx="28" ry="4" fill={c.main} opacity=".42" filter="url(#nd-soft)" />
      <circle cx="50" cy="46" r="38" fill={c.main} opacity={hot ? 0.38 : 0.24} filter="url(#nd-bloomLg)" className="no-core-glow" />
      {/* rear half of the orbit rings */}
      <g transform="rotate(-24 50 46)"><ellipse cx="50" cy="46" rx="45" ry="11" fill="none" stroke={c.main} strokeOpacity=".5" strokeWidth="1.3" /></g>
      <g transform="rotate(32 50 46)"><ellipse cx="50" cy="46" rx="45" ry="10" fill="none" stroke={c.light} strokeOpacity=".4" strokeWidth="1" strokeDasharray="3 3" /></g>
      {/* glass sphere */}
      <circle cx="50" cy="46" r="30" fill={c.deep} stroke={c.light} strokeOpacity=".85" strokeWidth="1.4" />
      <circle cx="50" cy="46" r="29" fill={`url(#nd-orb-${t})`} />
      <g clipPath="url(#nd-orbclip)">
        <g className="no-swirl" style={{ transformOrigin: "50px 46px" }}>
          <circle cx="38" cy="40" r="11" fill={c.light} opacity=".45" filter="url(#nd-soft)" />
          <circle cx="62" cy="54" r="12" fill={c.main} opacity=".6" filter="url(#nd-soft)" />
          <circle cx="54" cy="34" r="6" fill="#fff" opacity=".35" filter="url(#nd-soft)" />
          <path d="M26 50 Q38 38 50 46 T74 42" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
        </g>
        <ellipse cx="50" cy="46" rx="29" ry="29" fill="none" stroke="#fff" strokeOpacity=".18" strokeWidth="6" />
      </g>
      <ellipse cx="39" cy="28" rx="13" ry="7" fill="#fff" opacity=".82" transform="rotate(-32 39 28)" />
      <ellipse cx="62" cy="70" rx="12" ry="3.4" fill="#fff" opacity=".22" transform="rotate(-18 62 70)" />
      {/* front half of the rings, with orbiting nodes */}
      <g transform="rotate(-24 50 46)">
        <path d="M5 46 A45 11 0 0 0 95 46" fill="none" stroke={c.light} strokeWidth="1.8" filter="url(#nd-bloom)" />
        <circle r="2.8" fill="#fff" filter="url(#nd-bloom)">
          <animateMotion dur="3.4s" repeatCount="indefinite" path="M5 46 A45 11 0 1 0 95 46 A45 11 0 1 0 5 46" />
        </circle>
      </g>
      <g transform="rotate(32 50 46)">
        <path d="M5 46 A45 10 0 0 0 95 46" fill="none" stroke={c.main} strokeWidth="1.4" opacity=".9" />
        <circle r="2.2" fill={c.light} filter="url(#nd-bloom)">
          <animateMotion dur="4.6s" repeatCount="indefinite" path="M95 46 A45 10 0 1 1 5 46 A45 10 0 1 1 95 46" />
        </circle>
      </g>
      {/* value plate */}
      <g>
        <rect x="24" y="68" width="52" height="20" rx="7" fill="#05071a" fillOpacity=".92" stroke={c.main} strokeWidth="1.8" />
        <rect x="26" y="70" width="48" height="6" rx="3" fill="#fff" opacity=".13" />
        <text x="50" y="83.2" textAnchor="middle" fontSize={label.length > 3 ? 12.5 : 15} fontWeight="900" fill={c.light} stroke={c.deep} strokeWidth=".3" letterSpacing={label.length > 3 ? 1.2 : 0.4} style={{ fontFamily: "Impact, 'Arial Black', system-ui, sans-serif" }}>{label}</text>
      </g>
    </g>
  );
}

/* --------------------------------- wrapper --------------------------------- */

export function SymbolArt({ id, value, boost, hot, className }: { id: SymId; value?: number; boost?: number; hot?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" overflow="visible">
      {id === "cell" && <PlasmaCell />}
      {id === "chip" && <QuantumChip />}
      {id === "crystal" && <CircuitCrystal />}
      {id === "visor" && <HoloVisor />}
      {id === "drone" && <CyberDrone />}
      {id === "reactor" && <ArcReactor />}
      {id === "orb" && <OrbArt value={value ?? 1} boost={boost} hot={hot} />}
    </svg>
  );
}
