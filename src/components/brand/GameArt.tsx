import type { GameId } from "@/data/types";
import { cn } from "@/lib/utils";

/** Hand-built SVG key art for the three launch games (no external image assets needed). */
export function GameArt({ gameId, className }: { gameId: GameId; className?: string }) {
  const Art = ART[gameId];
  return (
    <svg
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      className={cn("h-full w-full", className)}
      role="img"
      aria-label={LABEL[gameId]}
    >
      <Art />
    </svg>
  );
}

const LABEL: Record<GameId, string> = {
  "pharaohs-fortune": "Illustration of a golden sun rising behind desert pyramids",
  "atlantis-cascade": "Illustration of a sunken city with glowing gems tumbling through the water",
  "neon-overdrive": "Illustration of a neon cyberpunk skyline above a glowing grid",
  skyfall: "Illustration of a futuristic aircraft climbing above a midnight city skyline",
};

function Pharaoh() {
  return (
    <g>
      <defs>
        <linearGradient id="ph-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c0a05" />
          <stop offset=".55" stopColor="#7c3410" />
          <stop offset="1" stopColor="#e8a83c" />
        </linearGradient>
        <radialGradient id="ph-sun" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff4cf" />
          <stop offset=".55" stopColor="#f2c25a" />
          <stop offset="1" stopColor="#f2c25a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ph-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a1f08" />
          <stop offset="1" stopColor="#140703" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ph-sky)" />
      {[[40, 30], [90, 60], [310, 40], [356, 82], [150, 24], [250, 20]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 2 ? 1.1 : 1.6} fill="#fbe9b8" opacity=".75" />
      ))}
      <circle cx="200" cy="168" r="120" fill="url(#ph-sun)" />
      <circle cx="200" cy="168" r="64" fill="#f6d27a" />
      <circle cx="200" cy="168" r="64" fill="none" stroke="#fff4cf" strokeWidth="1.5" opacity=".7" />
      <polygon points="-20,236 92,138 204,236" fill="#2a1006" />
      <polygon points="92,138 204,236 120,236" fill="#3a1a09" />
      <polygon points="170,236 300,112 430,236" fill="#33150a" />
      <polygon points="300,112 430,236 330,236" fill="#46200d" />
      <rect y="232" width="400" height="68" fill="url(#ph-sand)" />
      <path d="M0 250 Q100 240 200 252 T400 246" stroke="#e8a83c" strokeOpacity=".25" fill="none" />
      <path d="M0 270 Q120 258 220 272 T400 266" stroke="#e8a83c" strokeOpacity=".18" fill="none" />
      {/* Ankh */}
      <g stroke="#2a0f05" strokeWidth="7" strokeLinecap="round" fill="none">
        <ellipse cx="200" cy="138" rx="15" ry="21" />
        <line x1="200" y1="159" x2="200" y2="214" />
        <line x1="172" y1="174" x2="228" y2="174" />
      </g>
      {/* hieroglyph band */}
      <g fill="#e8a83c" opacity=".55">
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={14 + i * 28} y={284} width={i % 3 === 0 ? 10 : 6} height={i % 2 ? 6 : 9} rx="1.5" />
        ))}
      </g>
    </g>
  );
}

function Atlantis() {
  return (
    <g>
      <defs>
        <linearGradient id="at-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d7f92" />
          <stop offset=".5" stopColor="#07405a" />
          <stop offset="1" stopColor="#020f1f" />
        </linearGradient>
        <linearGradient id="at-ray" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bff7ee" stopOpacity=".5" />
          <stop offset="1" stopColor="#bff7ee" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="at-gem" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9fff6" />
          <stop offset="1" stopColor="#1fb7b0" />
        </linearGradient>
        <linearGradient id="at-gem2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd5ec" />
          <stop offset="1" stopColor="#d4408f" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#at-sea)" />
      <polygon points="60,0 120,0 190,300 20,300" fill="url(#at-ray)" opacity=".5" />
      <polygon points="200,0 250,0 340,300 220,300" fill="url(#at-ray)" opacity=".4" />
      <polygon points="320,0 350,0 400,240 380,300" fill="url(#at-ray)" opacity=".3" />
      {/* sunken city */}
      <g fill="#031a2c">
        <rect x="20" y="196" width="26" height="104" />
        <rect x="52" y="168" width="20" height="132" />
        <path d="M78 300v-92a24 24 0 0 1 48 0v92z" />
        <rect x="132" y="190" width="18" height="110" />
        <rect x="286" y="180" width="22" height="120" />
        <path d="M314 300v-80a20 20 0 0 1 40 0v80z" />
        <rect x="360" y="200" width="26" height="100" />
      </g>
      <g stroke="#2fb8b0" strokeOpacity=".3" strokeWidth="1.2">
        <line x1="85" y1="190" x2="85" y2="300" />
        <line x1="105" y1="180" x2="105" y2="300" />
        <line x1="325" y1="210" x2="325" y2="300" />
        <line x1="340" y1="208" x2="340" y2="300" />
      </g>
      {/* trident */}
      <g stroke="#e8c670" strokeWidth="5" strokeLinecap="round" fill="none" opacity=".92">
        <line x1="200" y1="96" x2="200" y2="250" />
        <path d="M172 112c0 16 12 26 28 26s28-10 28-26" />
        <line x1="172" y1="90" x2="172" y2="112" />
        <line x1="228" y1="90" x2="228" y2="112" />
        <line x1="200" y1="78" x2="200" y2="112" />
      </g>
      {/* cascading gems */}
      <g>
        <polygon points="130,24 148,42 130,60 112,42" fill="url(#at-gem)" />
        <polygon points="130,66 142,78 130,90 118,78" fill="url(#at-gem2)" opacity=".9" />
        <polygon points="130,102 144,116 130,130 116,116" fill="url(#at-gem)" opacity=".7" />
        <polygon points="270,40 290,60 270,80 250,60" fill="url(#at-gem2)" />
        <polygon points="270,92 284,106 270,120 256,106" fill="url(#at-gem)" opacity=".85" />
        <polygon points="270,134 282,146 270,158 258,146" fill="url(#at-gem)" opacity=".55" />
        <g stroke="#bff7ee" strokeOpacity=".35" strokeWidth="2" strokeLinecap="round">
          <line x1="130" y1="130" x2="130" y2="168" />
          <line x1="270" y1="158" x2="270" y2="190" />
        </g>
      </g>
      {/* bubbles */}
      <g fill="none" stroke="#d9fff9" strokeOpacity=".6">
        {[[60, 120, 7], [92, 90, 4], [340, 110, 8], [310, 70, 4], [220, 40, 5], [180, 200, 3], [236, 230, 6]].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
      </g>
    </g>
  );
}

function Neon() {
  const verticals = [-260, -170, -90, -30, 30, 90, 170, 260];
  return (
    <g>
      <defs>
        <linearGradient id="ne-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0a0220" />
          <stop offset=".6" stopColor="#3a0b5e" />
          <stop offset="1" stopColor="#c0267a" />
        </linearGradient>
        <linearGradient id="ne-sun" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd25a" />
          <stop offset=".5" stopColor="#ff5e8a" />
          <stop offset="1" stopColor="#b03bf2" />
        </linearGradient>
        <clipPath id="ne-sunclip">
          <circle cx="200" cy="150" r="62" />
        </clipPath>
        <radialGradient id="ne-orb" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".35" stopColor="#6ff2ff" />
          <stop offset="1" stopColor="#1b6bff" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#ne-sky)" />
      <circle cx="200" cy="150" r="62" fill="url(#ne-sun)" />
      <g clipPath="url(#ne-sunclip)" fill="#2a0845">
        {[116, 132, 146, 158, 168].map((y, i) => (
          <rect key={y} x="120" y={y} width="160" height={2 + i * 1.6} />
        ))}
      </g>
      {/* skyline */}
      <g fill="#0b0220">
        <rect x="0" y="130" width="34" height="90" />
        <rect x="38" y="104" width="28" height="116" />
        <rect x="70" y="146" width="40" height="74" />
        <rect x="116" y="124" width="22" height="96" />
        <rect x="262" y="118" width="26" height="102" />
        <rect x="292" y="94" width="34" height="126" />
        <rect x="330" y="140" width="28" height="80" />
        <rect x="362" y="112" width="38" height="108" />
      </g>
      <g fill="#6ff2ff" opacity=".75">
        {[[46, 114], [46, 128], [52, 142], [300, 104], [312, 104], [300, 120], [370, 122], [384, 122], [370, 138], [10, 142], [20, 156], [126, 134], [270, 130]].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="4" height="3" />
        ))}
      </g>
      {/* grid floor */}
      <rect y="220" width="400" height="80" fill="#10032a" />
      <g stroke="#ff4fd8" strokeOpacity=".75" strokeWidth="1.1">
        {verticals.map((v) => (
          <line key={v} x1="200" y1="220" x2={200 + v * 2.2} y2="300" />
        ))}
        {[228, 238, 252, 270, 292].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} />
        ))}
      </g>
      {/* held orbs */}
      <g>
        {[[84, 252, "50"], [152, 266, "25"], [248, 266, "100"], [316, 252, "10"]].map(([x, y, label]) => (
          <g key={String(label)}>
            <circle cx={x as number} cy={y as number} r="20" fill="#6ff2ff" opacity=".15" />
            <circle cx={x as number} cy={y as number} r="14" fill="url(#ne-orb)" />
            <text x={x as number} y={(y as number) + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#06122e">
              {label}
            </text>
          </g>
        ))}
      </g>
    </g>
  );
}

function Skyfall() {
  const towers: [number, number, number][] = [[0, 190, 34], [34, 160, 28], [62, 205, 40], [102, 175, 26], [128, 215, 36], [164, 150, 30], [194, 195, 38], [232, 170, 28], [260, 210, 34], [294, 160, 30], [324, 200, 38], [362, 178, 38]];
  return (
    <g>
      <defs>
        <linearGradient id="sf-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#030816" />
          <stop offset=".6" stopColor="#0b2146" />
          <stop offset="1" stopColor="#0f5f7a" />
        </linearGradient>
        <linearGradient id="sf-trail" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#22d3ee" stopOpacity="0" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#sf-sky)" />
      {[[40, 30], [90, 60], [150, 22], [210, 48], [260, 20], [330, 40], [370, 70], [120, 90]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} fill="#dff7ff" opacity=".8" />
      ))}
      <path d="M40 230 C 120 220, 190 170, 290 90" fill="none" stroke="url(#sf-trail)" strokeWidth="3" strokeLinecap="round" />
      <g transform="translate(290 90) rotate(-32)">
        <path d="M18 0 L-14 -10 L-8 0 L-14 10 Z" fill="#0d1a38" stroke="#e6c170" strokeWidth=".8" />
        <path d="M-8 0 L-24 -2 L-24 2 Z" fill="#22d3ee" />
        <circle cx="-9" cy="-5" r="2" fill="#7df4ff" />
        <circle cx="-9" cy="5" r="2" fill="#7df4ff" />
      </g>
      <g fill="#050b1c">
        {towers.map(([x, h, w], i) => (
          <rect key={i} x={x} y={300 - h + 60} width={w} height={h} />
        ))}
      </g>
      <g fill="#e6c170" opacity=".75">
        {towers.flatMap(([x, h, w], i) => [0, 1, 2].map((k) => <rect key={`${i}-${k}`} x={x + 6 + k * 9} y={300 - h + 80 + ((i * 13 + k * 17) % 60)} width="3" height="4" />))}
      </g>
    </g>
  );
}

const ART: Record<GameId, () => JSX.Element> = {
  "pharaohs-fortune": Pharaoh,
  "atlantis-cascade": Atlantis,
  "neon-overdrive": Neon,
  skyfall: Skyfall,
};
