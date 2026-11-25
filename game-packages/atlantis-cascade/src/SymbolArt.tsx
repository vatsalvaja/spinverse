"use client";

import { memo, type ReactNode } from "react";
import type { SymId } from "./engine";

/**
 * Hand-built vector artwork for the ten Atlantis Cascade symbols.
 *
 * Every symbol is layered the same way: a pooled reflection under it, a body with a cylindrical or faceted gradient,
 * rim light, specular highlights and an inner glow, then living details (sparkles, mist, light sweeps) that are
 * animated from the game stylesheet. All gradients live once in <SymbolDefs/> so hundreds of tiles stay cheap.
 */

export const SYMBOL_NAME: Record<SymId, string> = {
  pearl: "Pearl of the Deep",
  trident: "Trident of Poseidon",
  crown: "Crown of Atlantis",
  eye: "Kraken Eye",
  amphora: "Sunken Amphora",
  conch: "Sea Conch",
  crystal: "Sea-glass Crystal",
  scale: "Mermaid Scale",
  wild: "Poseidon's Sigil (Wild)",
  scatter: "Atlantis Heart (Scatter)",
};

/** The colour each symbol glows with when it wins. */
export const SYMBOL_GLOW: Record<SymId, string> = {
  pearl: "#ffd9f4",
  trident: "#ffe28a",
  crown: "#ffd25a",
  eye: "#c8ff6a",
  amphora: "#7ffcf3",
  conch: "#ff9cc0",
  crystal: "#7fefff",
  scale: "#c59bff",
  wild: "#5ff7ef",
  scatter: "#ff5fe0",
};

const stops = (spec: string) =>
  spec.split("|").map((s, i) => {
    const [o, c, a] = s.trim().split(" ");
    return <stop key={i} offset={`${o}%`} stopColor={c} stopOpacity={a ?? 1} />;
  });

function LG({ id, s, x2 = 0, y2 = 1 }: { id: string; s: string; x2?: number; y2?: number }) {
  return (
    <linearGradient id={`acg-${id}`} x1="0" y1="0" x2={x2} y2={y2}>
      {stops(s)}
    </linearGradient>
  );
}
function RG({ id, s, cx = 0.5, cy = 0.5, r = 0.5 }: { id: string; s: string; cx?: number; cy?: number; r?: number }) {
  return (
    <radialGradient id={`acg-${id}`} cx={cx} cy={cy} r={r}>
      {stops(s)}
    </radialGradient>
  );
}

/** Rendered once by the game. Zero-size but not display:none so gradients and clips resolve everywhere. */
export function SymbolDefs() {
  return (
    <svg width="0" height="0" aria-hidden focusable="false" style={{ position: "absolute", pointerEvents: "none" }}>
      <defs>
        {/* metals */}
        <LG id="gold" s="0 #fff8cc|22 #f8d96e|52 #c98f26|78 #7e4d12|100 #f1c14f" />
        <LG id="goldH" s="0 #5d3a0c|22 #d9a63f|45 #fff2b0|68 #d9a63f|100 #5d3a0c" x2={1} y2={0} />
        <LG id="goldD" s="0 #ffe9a0|50 #b9801f|100 #5a3508" x2={1} y2={1} />
        <LG id="silver" s="0 #ffffff|50 #9fc7e0|100 #ffffff" x2={1} y2={1} />
        {/* light */}
        <RG id="hi" s="0 #fff .95|100 #fff 0" />
        <RG id="glowAqua" s="0 #7ffcf3 .6|100 #7ffcf3 0" />
        <RG id="glowGreen" s="0 #c4ff6a .55|100 #c4ff6a 0" />
        <RG id="glowPink" s="0 #ff8ae8 .6|100 #ff8ae8 0" />
        <RG id="glowGold" s="0 #ffd868 .6|100 #ffd868 0" />
        <RG id="glowViolet" s="0 #b98aff .6|100 #b98aff 0" />
        <RG id="pool" s="0 #38d8e8 .38|100 #38d8e8 0" />
        <LG id="sweep" s="0 #fff 0|50 #fff .75|100 #fff 0" x2={1} y2={0} />
        {/* pearl in shell */}
        <RG id="pearl" s="0 #ffffff|20 #fff3f8|50 #e9d9ee|78 #b8c6e2|100 #7f93c6" cx={0.36} cy={0.3} r={0.75} />
        <LG id="shellOut" s="0 #ffd9c7|45 #e592a8|100 #6d4a9a" x2={1} y2={1} />
        <LG id="shellLow" s="0 #f6c4b8|50 #cf7a98|100 #4f3280" />
        <RG id="nacre" s="0 #ffffff|30 #ffe2f0|55 #d3efff|80 #e2d2ff|100 #ffd2e2" />
        {/* gems */}
        <RG id="aqua" s="0 #f0ffff|30 #7ff6f0|65 #14a3b4|100 #06476a" cx={0.38} cy={0.32} r={0.8} />
        <RG id="ruby" s="0 #ffe0ea|30 #ff6a92|70 #b3123f|100 #4a0620" cx={0.38} cy={0.32} r={0.8} />
        <RG id="violet" s="0 #f2e4ff|30 #b98aff|70 #6a2fc0|100 #2a0e60" cx={0.38} cy={0.32} r={0.8} />
        {/* kraken eye */}
        <LG id="bezel" s="0 #6a566f|45 #2c2236|100 #0f0b16" x2={1} y2={1} />
        <RG id="sclera" s="0 #fffbd6|35 #d6ff7a|70 #55b845|100 #12461f" />
        <RG id="iris" s="0 #fff0a0|45 #f0a72a|80 #a8431a|100 #4a1608" />
        {/* amphora */}
        <LG id="clayH" s="0 #2c130d|22 #a24a2a|45 #e69a63|68 #a24a2a|100 #24100a" x2={1} y2={0} />
        <RG id="patina" s="0 #36d1b8 .6|100 #36d1b8 0" />
        <LG id="beam" s="0 #aefcff 0|100 #aefcff .7" />
        {/* conch */}
        <LG id="conch" s="0 #fff6ea|35 #f9d6b4|70 #ee9f8c|100 #b35a6c" x2={1} y2={1} />
        <RG id="aperture" s="0 #fff0f6|38 #ffb8cc|75 #ff7898|100 #8a2548" />
        {/* crystal */}
        <LG id="cTL" s="0 #ffffff|100 #8ff0f0" />
        <LG id="cTR" s="0 #ffffff|100 #b8f8ff" />
        <LG id="cL" s="0 #c7fffb|100 #38c8d6" />
        <LG id="cR" s="0 #8de9ff|100 #1f6fc0" />
        <RG id="cGlow" s="0 #ffffff .9|60 #b6fbff .25|100 #b6fbff 0" />
        {/* mermaid scale */}
        <LG id="scaleA" s="0 #8cf0ff|38 #6c8aff|70 #c070ff|100 #ff8ed2" x2={1} y2={1} />
        <LG id="scaleB" s="0 #ffd98f|40 #ff9ad2|100 #7affd8" x2={1} y2={1} />
        {/* wild + scatter */}
        <RG id="orb" s="0 #ffffff|22 #c4fff8|52 #24d8d2|82 #0a5f92|100 #05274a" cx={0.4} cy={0.35} r={0.75} />
        <LG id="ray" s="0 #7ffcf3 .75|100 #7ffcf3 0" />
        <RG id="heart" s="0 #ffffff|18 #ffd0f4|48 #e24fd0|82 #6a1fb0|100 #2b0a5e" cx={0.45} cy={0.38} r={0.7} />
        <LG id="heartL" s="0 #ffd6f8 .9|100 #b03ad0 .2" x2={1} y2={1} />
        <LG id="heartR" s="0 #7a35d6 .1|100 #2b0a5e .7" x2={1} y2={1} />

        {/* shared crystal shard used by the crystal symbol */}
        <g id="ac-shard">
          <path d="M34 26 L50 34 L50 92 L34 76Z" fill="url(#acg-cL)" />
          <path d="M66 26 L50 34 L50 92 L66 76Z" fill="url(#acg-cR)" />
          <path d="M50 6 L34 26 L50 34Z" fill="url(#acg-cTL)" />
          <path d="M50 6 L66 26 L50 34Z" fill="url(#acg-cTR)" opacity=".92" />
          <path d="M34 26 L50 34 L66 26" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1" />
          <path d="M50 34 L50 92" stroke="#e6ffff" strokeOpacity=".5" strokeWidth="1" />
        </g>

        {/* sweep clips: one rough silhouette per symbol */}
        <clipPath id="acc-pearl"><path d="M5 60 C5 30 26 10 50 10 C74 10 95 30 95 60 C95 82 74 94 50 94 C26 94 5 82 5 60Z" /></clipPath>
        <clipPath id="acc-crown"><path d="M14 66 L10 30 L20 48 L30 22 L40 44 L50 10 L60 44 L70 22 L80 48 L90 30 L86 80 L14 80Z" /></clipPath>
        <clipPath id="acc-amphora"><path d="M42 14 L42 26 C42 34 22 36 22 54 C22 72 38 80 40 86 L36 90 L64 90 L60 86 C62 80 78 72 78 54 C78 36 58 34 58 26 L58 14Z" /></clipPath>
        <clipPath id="acc-scale"><path d="M50 8 C74 8 88 28 86 48 C84 70 64 90 50 94 C36 90 16 70 14 48 C12 28 26 8 50 8Z" /></clipPath>
        <clipPath id="acc-conch"><ellipse cx="54" cy="58" rx="33" ry="27" transform="rotate(-30 54 58)" /></clipPath>
        <clipPath id="acc-pearl-lid"><path d="M11 62 C5 36 24 12 50 12 C76 12 95 36 89 62 C80 50 66 44 50 44 C34 44 20 50 11 62Z" /></clipPath>
        <clipPath id="acc-pearl-low"><path d="M8 60 C8 84 28 94 50 94 C72 94 92 84 92 60 C82 68 66 72 50 72 C34 72 18 68 8 60Z" /></clipPath>
        <clipPath id="acc-heart"><path d="M50 86 C20 64 10 46 14 32 C18 18 38 14 50 30 C62 14 82 18 86 32 C90 46 80 64 50 86Z" /></clipPath>
        <clipPath id="acc-wild-orb"><circle cx="50" cy="44" r="30" /></clipPath>
        <clipPath id="acc-trident"><path d="M50 3 C56 12 59 20 56 26 L53 26 L53 96 L47 96 L47 26 L44 26 C41 20 44 12 50 3Z M27 8 L33 22 L29 22 L29 30 C29 38 38 42 47 42 L47 48 C32 48 23 40 23 29 L23 22 L20 22Z M73 8 L67 22 L71 22 L71 30 C71 38 62 42 53 42 L53 48 C68 48 77 40 77 29 L77 22 L80 22Z" /></clipPath>
      </defs>
    </svg>
  );
}

const STAR = "M0 -7 L1.7 -1.7 L7 0 L1.7 1.7 L0 7 L-1.7 1.7 L-7 0 L-1.7 -1.7Z";
function Star({ x, y, s = 1, delay = 0, fill = "#fff" }: { x: number; y: number; s?: number; delay?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="ac-star" style={{ animationDelay: `${delay}s` }} d={STAR} fill={fill} />
    </g>
  );
}

/** A pooled reflection of light on the glass beneath each symbol. */
function Pool({ fill = "url(#acg-pool)", cy = 94, rx = 34 }: { fill?: string; cy?: number; rx?: number }) {
  return <ellipse cx="50" cy={cy} rx={rx} ry="5" fill={fill} />;
}

function Sweep({ clip, delay = 0 }: { clip: string; delay?: number }) {
  return (
    <g clipPath={`url(#${clip})`} style={{ pointerEvents: "none" }}>
      <rect className="ac-sweep" style={{ animationDelay: `${delay}s` }} x="-30" y="-10" width="22" height="120" fill="url(#acg-sweep)" transform="skewX(-18)" />
    </g>
  );
}

/* ----------------------------------------------------------------------------------------------- */

function Pearl() {
  const ridgesTop: ReactNode[] = [];
  const ridgesLow: ReactNode[] = [];
  for (let i = -5; i <= 5; i++) {
    const a = (i * 15 * Math.PI) / 180;
    ridgesTop.push(<path key={i} d={`M50 50 L${(50 + Math.sin(a) * 52).toFixed(1)} ${(50 - Math.cos(a) * 46).toFixed(1)}`} stroke="#5b2f6d" strokeOpacity=".28" strokeWidth="1.2" />);
    ridgesTop.push(<path key={`h${i}`} d={`M50 50 L${(50 + Math.sin(a + 0.04) * 52).toFixed(1)} ${(50 - Math.cos(a + 0.04) * 46).toFixed(1)}`} stroke="#fff" strokeOpacity=".3" strokeWidth=".8" />);
  }
  for (let i = -4; i <= 4; i++) {
    const a = (i * 15 * Math.PI) / 180;
    ridgesLow.push(<path key={i} d={`M50 96 L${(50 + Math.sin(a) * 52).toFixed(1)} ${(96 - Math.cos(a) * 40).toFixed(1)}`} stroke="#3a1f66" strokeOpacity=".3" strokeWidth="1.3" />);
    ridgesLow.push(<path key={`h${i}`} d={`M50 96 L${(50 + Math.sin(a + 0.045) * 52).toFixed(1)} ${(96 - Math.cos(a + 0.045) * 40).toFixed(1)}`} stroke="#fff" strokeOpacity=".28" strokeWidth=".8" />);
  }
  return (
    <>
      <Pool />
      <circle cx="50" cy="56" r="40" fill="url(#acg-glowPink)" className="ac-pulse" />
      <g className="ac-pearl-lid">
        <path d="M11 62 C5 36 24 12 50 12 C76 12 95 36 89 62 C80 50 66 44 50 44 C34 44 20 50 11 62Z" fill="url(#acg-shellOut)" />
        <g clipPath="url(#acc-pearl-lid)">{ridgesTop}</g>
        <path d="M18 60 C14 40 30 23 50 23 C70 23 86 40 82 60 C74 52 62 49 50 49 C38 49 26 52 18 60Z" fill="url(#acg-nacre)" opacity=".93" />
        <path d="M11 62 C5 36 24 12 50 12 C76 12 95 36 89 62" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" />
      </g>
      <ellipse cx="50" cy="66" rx="38" ry="9" fill="url(#acg-nacre)" />
      <g className="ac-pearl-ball">
        <circle cx="50" cy="59" r="16.5" fill="url(#acg-pearl)" />
        <ellipse cx="50" cy="69" rx="10" ry="3.6" fill="#8ff4ff" opacity=".35" />
        <ellipse cx="43.5" cy="52" rx="6.4" ry="4" transform="rotate(-32 43.5 52)" fill="url(#acg-hi)" />
        <circle cx="44.6" cy="51.2" r="2" fill="#fff" />
        <circle cx="50" cy="59" r="16.5" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth=".8" />
      </g>
      <path d="M8 60 C8 84 28 94 50 94 C72 94 92 84 92 60 C82 68 66 72 50 72 C34 72 18 68 8 60Z" fill="url(#acg-shellLow)" />
      <g clipPath="url(#acc-pearl-low)">{ridgesLow}</g>
      <path d="M8 60 C18 68 34 72 50 72 C66 72 82 68 92 60" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" />
      <Sweep clip="acc-pearl" delay={0.4} />
      <Star x={63} y={46} s={1.1} delay={0.2} />
      <Star x={34} y={40} s={0.7} delay={1.1} />
    </>
  );
}

function Trident() {
  return (
    <>
      <Pool fill="url(#acg-glowGold)" />
      <g className="ac-trident-body"><g transform="rotate(-10 50 52) translate(0 1)">
        <circle cx="50" cy="40" r="34" fill="url(#acg-glowGold)" className="ac-pulse" />
        {/* shaft */}
        <path d="M47 44 L53 44 L52.4 92 L50 98 L47.6 92Z" fill="url(#acg-goldH)" />
        {[56, 68, 80].map((y) => (
          <g key={y}>
            <rect x="45" y={y} width="10" height="4" rx="1.4" fill="url(#acg-goldH)" />
            <rect x="45" y={y} width="10" height="1.1" rx=".5" fill="#fff" opacity=".6" />
          </g>
        ))}
        {/* side prongs */}
        <g>
          <path d="M27 8 L33 22 L29 22 L29 30 C29 38 38 42 47 42 L47 48 C32 48 23 40 23 29 L23 22 L20 22Z" fill="url(#acg-goldH)" />
          <path d="M27 8 L33 22" stroke="#fff" strokeOpacity=".7" strokeWidth=".8" />
        </g>
        <g transform="translate(100 0) scale(-1 1)">
          <path d="M27 8 L33 22 L29 22 L29 30 C29 38 38 42 47 42 L47 48 C32 48 23 40 23 29 L23 22 L20 22Z" fill="url(#acg-goldH)" />
          <path d="M27 8 L33 22" stroke="#fff" strokeOpacity=".7" strokeWidth=".8" />
        </g>
        {/* centre spear */}
        <path d="M50 3 C56 12 59 20 56 26 L53 26 L53 46 L47 46 L47 26 L44 26 C41 20 44 12 50 3Z" fill="url(#acg-goldH)" />
        <path d="M50 5 C52 12 53 20 52 26" stroke="#fff" strokeOpacity=".75" strokeWidth=".9" fill="none" />
        {/* hub */}
        <ellipse cx="50" cy="47" rx="11" ry="5.2" fill="url(#acg-goldH)" />
        <ellipse cx="50" cy="45.6" rx="9" ry="1.6" fill="#fff" opacity=".45" />
        <circle cx="50" cy="47" r="3.8" fill="url(#acg-aqua)" />
        <circle cx="49" cy="45.8" r="1.1" fill="#fff" />
        <Sweep clip="acc-trident" delay={0.9} />
        <Star x={50} y={4} s={1.25} delay={0.1} />
        <Star x={27} y={9} s={0.8} delay={0.9} />
        <Star x={73} y={9} s={0.8} delay={1.6} />
      </g></g>
    </>
  );
}

function Crown() {
  return (
    <>
      <Pool fill="url(#acg-glowGold)" cy={92} />
      <circle cx="50" cy="50" r="40" fill="url(#acg-glowGold)" className="ac-pulse" />
      <g className="ac-crown-body">
        <path d="M14 66 L10 30 L20 48 L30 22 L40 44 L50 10 L60 44 L70 22 L80 48 L90 30 L86 66Z" fill="url(#acg-gold)" />
        <path d="M14 66 L10 30 L20 48 L30 22 L40 44 L50 10 L60 44 L70 22 L80 48 L90 30 L86 66Z" fill="none" stroke="#fff3b8" strokeOpacity=".7" strokeWidth="1" />
        {/* velvet shadow between the spires */}
        <path d="M20 66 L20 48 L30 58 L40 44 L50 60 L60 44 L70 58 L80 48 L80 66Z" fill="#3b0f3a" opacity=".45" />
        {/* engraved facets */}
        <path d="M50 10 L40 44 L50 60 L60 44Z" fill="#fff" opacity=".18" />
        <path d="M30 22 L20 48 L30 58 L40 44Z" fill="#7e4d12" opacity=".25" />
        <path d="M70 22 L80 48 L70 58 L60 44Z" fill="#7e4d12" opacity=".25" />
        {/* band */}
        <rect x="12" y="63" width="76" height="17" rx="3" fill="url(#acg-gold)" />
        <rect x="12" y="63" width="76" height="3" rx="1.5" fill="#fff" opacity=".5" />
        <path d="M14 72 q4.2 -6 8.4 0 t8.4 0 t8.4 0 t8.4 0 t8.4 0 t8.4 0 t8.4 0 t8.4 0 t8.4 0" fill="none" stroke="#7e4d12" strokeOpacity=".7" strokeWidth="1.2" />
        <rect x="12" y="76.8" width="76" height="3.2" rx="1.4" fill="#7e4d12" opacity=".45" />
        {/* gems */}
        <ellipse cx="50" cy="71.5" rx="7.4" ry="6.4" fill="url(#acg-aqua)" stroke="#fff3b8" strokeWidth="1.4" />
        <ellipse cx="47.6" cy="69" rx="2.6" ry="1.6" fill="#fff" opacity=".85" />
        <circle cx="29" cy="71.5" r="3.6" fill="url(#acg-ruby)" stroke="#fff3b8" strokeWidth="1" />
        <circle cx="71" cy="71.5" r="3.6" fill="url(#acg-violet)" stroke="#fff3b8" strokeWidth="1" />
        {/* tip pearls */}
        {[[10, 29], [30, 20], [50, 8], [70, 20], [90, 29]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={i === 2 ? 4.6 : 3.7} fill="url(#acg-pearl)" />
            <circle cx={x - 1.2} cy={y - 1.3} r="1.1" fill="#fff" />
          </g>
        ))}
        <Sweep clip="acc-crown" delay={0.6} />
        <Star x={50} y={9} s={1.3} delay={0.3} />
        <Star x={12} y={30} s={0.8} delay={1.4} />
        <Star x={88} y={30} s={0.8} delay={0.8} />
      </g>
    </>
  );
}

function Eye() {
  const arms: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    arms.push(
      <g key={i} transform={`rotate(${i * 45} 50 50)`}>
        <path d="M50 4 C59 8 61 15 54 20 C52 22 48 22 46 20 C39 15 41 8 50 4Z" fill="url(#acg-bezel)" stroke="#a78bb8" strokeOpacity=".5" strokeWidth=".8" />
        <circle cx="50" cy="12" r="1.2" fill="#d6ff7a" opacity=".8" />
        <circle cx="50" cy="16.6" r=".9" fill="#d6ff7a" opacity=".6" />
      </g>,
    );
  }
  return (
    <>
      <Pool fill="url(#acg-glowGreen)" cy={95} />
      <circle cx="50" cy="50" r="48" fill="url(#acg-glowGreen)" className="ac-pulse" />
      <g className="ac-eye-body">
        {arms}
        <circle cx="50" cy="50" r="34" fill="url(#acg-bezel)" />
        <circle cx="50" cy="50" r="33" fill="none" stroke="url(#acg-gold)" strokeWidth="3.2" />
        <circle cx="50" cy="50" r="29" fill="none" stroke="#000" strokeOpacity=".5" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="28" fill="url(#acg-sclera)" />
        {/* veins */}
        <g stroke="#b3361e" strokeOpacity=".35" strokeWidth=".7" fill="none">
          <path d="M24 46 C30 46 34 49 38 50" />
          <path d="M26 58 C31 56 35 54 38 53" />
          <path d="M76 44 C70 45 66 48 62 50" />
          <path d="M74 60 C69 57 66 55 62 53" />
        </g>
        <g className="ac-eye-iris">
          <circle cx="50" cy="50" r="17" fill="url(#acg-iris)" />
          <g stroke="#3a0f05" strokeOpacity=".4" strokeWidth=".7">
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * Math.PI * 2;
              return <path key={i} d={`M${(50 + Math.cos(a) * 7).toFixed(1)} ${(50 + Math.sin(a) * 7).toFixed(1)} L${(50 + Math.cos(a) * 16.5).toFixed(1)} ${(50 + Math.sin(a) * 16.5).toFixed(1)}`} />;
            })}
          </g>
          <ellipse className="ac-eye-pupil" cx="50" cy="50" rx="4.6" ry="14.5" fill="#050302" />
        </g>
        <ellipse cx="42" cy="41" rx="5.5" ry="3.4" transform="rotate(-35 42 41)" fill="url(#acg-hi)" />
        <circle cx="43.4" cy="40.4" r="1.8" fill="#fff" />
        <circle cx="57" cy="58" r="1.5" fill="#fff" opacity=".7" />
        {/* lid shadow for depth */}
        <path d="M22 50 A28 28 0 0 1 78 50 C70 38 60 34 50 34 C40 34 30 38 22 50Z" fill="#000" opacity=".28" />
        <Star x={72} y={26} s={0.9} delay={0.5} fill="#e9ffb0" />
      </g>
    </>
  );
}

function Amphora() {
  return (
    <>
      <Pool fill="url(#acg-pool)" cy={95} />
      {/* magic leaking from the mouth */}
      <path className="ac-beam" d="M43 22 L57 22 L66 0 L34 0Z" fill="url(#acg-beam)" />
      <g className="ac-amphora-body"><g transform="translate(0 6) scale(.94 .94) translate(3 0)">
        {/* handles */}
        <path d="M42 22 C28 19 17 28 22 42 C24 47 30 46 28 41 C25 33 31 29 42 30" fill="none" stroke="url(#acg-goldD)" strokeWidth="4.2" strokeLinecap="round" />
        <path d="M58 22 C72 19 83 28 78 42 C76 47 70 46 72 41 C75 33 69 29 58 30" fill="none" stroke="url(#acg-goldD)" strokeWidth="4.2" strokeLinecap="round" />
        {/* body */}
        <path d="M42 14 L42 26 C42 34 22 36 22 54 C22 72 38 80 40 86 L36 90 L64 90 L60 86 C62 80 78 72 78 54 C78 36 58 34 58 26 L58 14Z" fill="url(#acg-clayH)" />
        <ellipse cx="34" cy="76" rx="20" ry="16" fill="url(#acg-patina)" />
        <ellipse cx="66" cy="40" rx="10" ry="8" fill="url(#acg-patina)" opacity=".6" />
        {/* painted frieze */}
        <path d="M22.5 48 C30 51 70 51 77.5 48 L77.8 52 C70 55 30 55 22.2 52Z" fill="url(#acg-gold)" />
        <path d="M23 59 q4.6 -7 9.2 0 t9.2 0 t9.2 0 t9.2 0 t9.2 0 t9.2 0" fill="none" stroke="#f8d96e" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M24 67 L76 67" stroke="#f8d96e" strokeOpacity=".7" strokeWidth="1" />
        <circle cx="50" cy="60" r="0" />
        <path d="M50 70 l3 5 l-6 0z" fill="#f8d96e" opacity=".85" />
        {/* barnacles / sea-moss */}
        <circle cx="30" cy="80" r="2" fill="#2fbfa8" opacity=".8" />
        <circle cx="34" cy="83" r="1.4" fill="#2fbfa8" opacity=".7" />
        <circle cx="70" cy="76" r="1.8" fill="#2fbfa8" opacity=".6" />
        {/* shine */}
        <path d="M31 46 C27 56 29 68 36 78" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" strokeLinecap="round" />
        <path d="M60 40 C66 44 70 50 71 58" fill="none" stroke="#fff" strokeOpacity=".16" strokeWidth="2" strokeLinecap="round" />
        {/* rim and mouth */}
        <ellipse cx="50" cy="14" rx="12" ry="4.2" fill="url(#acg-goldH)" />
        <ellipse cx="50" cy="13.4" rx="8.4" ry="2.6" fill="#06222c" />
        <ellipse className="ac-pulse" cx="50" cy="13.4" rx="7" ry="2" fill="#aefcff" />
        <Sweep clip="acc-amphora" delay={1.2} />
      </g></g>
      <circle className="ac-bub ac-bub1" cx="48" cy="14" r="2.2" fill="#d8ffff" opacity=".7" />
      <circle className="ac-bub ac-bub2" cx="53" cy="14" r="1.6" fill="#d8ffff" opacity=".7" />
      <circle className="ac-bub ac-bub3" cx="50" cy="14" r="1.2" fill="#d8ffff" opacity=".7" />
    </>
  );
}

function Conch() {
  const spots: ReactNode[] = [];
  const pts = [[44, 48], [52, 44], [60, 46], [38, 58], [48, 58], [58, 56], [66, 54], [44, 68], [54, 66], [36, 68]];
  pts.forEach(([x, y], i) => spots.push(<circle key={i} cx={x} cy={y} r={1.1 + (i % 3) * 0.5} fill="#b04a62" opacity=".5" />));
  return (
    <>
      <Pool fill="url(#acg-glowPink)" cy={94} />
      <circle cx="58" cy="64" r="34" fill="url(#acg-glowPink)" className="ac-pulse" />
      <g className="ac-conch-body">
        {/* spire */}
        <ellipse cx="34" cy="36" rx="17" ry="11" transform="rotate(-35 34 36)" fill="url(#acg-conch)" />
        <ellipse cx="24" cy="26" rx="11" ry="7" transform="rotate(-35 24 26)" fill="url(#acg-conch)" />
        <ellipse cx="17.5" cy="19.5" rx="6.6" ry="4.4" transform="rotate(-35 17.5 19.5)" fill="url(#acg-conch)" />
        <circle cx="13" cy="14.5" r="2.6" fill="#fde4d0" />
        <path d="M22 44 C30 46 38 42 44 34 M14 33 C20 34 27 31 31 25 M10 24 C14 25 19 23 22 19" fill="none" stroke="#b04a62" strokeOpacity=".45" strokeWidth="1.2" />
        {/* body whorl */}
        <ellipse cx="54" cy="58" rx="33" ry="27" transform="rotate(-30 54 58)" fill="url(#acg-conch)" />
        <g clipPath="url(#acc-conch)">
          <path d="M26 60 C40 64 60 56 70 38" fill="none" stroke="#b04a62" strokeOpacity=".4" strokeWidth="1.6" />
          <path d="M30 72 C46 76 68 66 78 46" fill="none" stroke="#b04a62" strokeOpacity=".4" strokeWidth="1.6" />
          <path d="M40 40 C52 40 62 34 66 26" fill="none" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" />
          {spots}
        </g>
        {/* shoulder knobs */}
        {[[40, 34], [49, 30], [58, 30], [67, 33], [74, 40]].map(([x, y], i) => (
          <path key={i} d={`M${x - 3.4} ${y + 3} L${x} ${y - 6} L${x + 3.4} ${y + 3}Z`} fill="#fbdcc4" stroke="#e8a58f" strokeWidth=".7" />
        ))}
        {/* aperture */}
        <g transform="rotate(35 70 70)">
          <ellipse cx="70" cy="70" rx="14" ry="22" fill="#ffd9e6" />
          <ellipse cx="71" cy="70" rx="10" ry="18" fill="url(#acg-aperture)" />
          <ellipse className="ac-pulse" cx="72" cy="68" rx="5" ry="10" fill="#fff" opacity=".45" />
          <ellipse cx="70" cy="70" rx="14" ry="22" fill="none" stroke="#fff" strokeOpacity=".8" strokeWidth="1.6" />
        </g>
        <ellipse cx="42" cy="48" rx="9" ry="4" transform="rotate(-32 42 48)" fill="url(#acg-hi)" />
        <Sweep clip="acc-conch" delay={0.7} />
      </g>
      {/* the sea whispering out of the shell */}
      <path className="ac-echo ac-echo1" d="M86 78 C92 74 92 66 86 62" fill="none" stroke="#ffd0e0" strokeWidth="1.8" strokeLinecap="round" />
      <path className="ac-echo ac-echo2" d="M90 82 C98 76 98 64 90 58" fill="none" stroke="#ffd0e0" strokeWidth="1.5" strokeLinecap="round" />
      <Star x={30} y={50} s={0.8} delay={0.4} />
    </>
  );
}

function Crystal() {
  return (
    <>
      <Pool fill="url(#acg-pool)" />
      <circle cx="50" cy="52" r="44" fill="url(#acg-glowAqua)" className="ac-pulse" />
      <g className="ac-crystal-body">
        <use href="#ac-shard" transform="translate(23 90) rotate(-22) scale(.48) translate(-50 -92)" />
        <use href="#ac-shard" transform="translate(78 91) rotate(20) scale(.42) translate(-50 -92)" />
        <use href="#ac-shard" transform="translate(0 0)" />
        <ellipse cx="50" cy="52" rx="14" ry="26" fill="url(#acg-cGlow)" opacity=".85" className="ac-pulse" />
        <path className="ac-facet" d="M50 6 L66 26 L50 34Z" fill="#fff" opacity=".6" />
        <path className="ac-facet ac-facet2" d="M34 26 L50 34 L50 92 L34 76Z" fill="#fff" opacity=".0" />
        <path d="M40 38 L40 70" stroke="#fff" strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
        <Star x={56} y={30} s={1.1} delay={0.2} />
        <Star x={42} y={60} s={0.75} delay={1.2} />
        <Star x={18} y={46} s={0.6} delay={0.8} />
      </g>
    </>
  );
}

function ScaleGem() {
  const scales: ReactNode[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 6; col++) {
      const x = 14 + col * 14 + (row % 2) * 7;
      const y = 16 + row * 11;
      scales.push(<path key={`${row}-${col}`} d={`M${x} ${y} a7 7 0 0 0 14 0`} fill="none" stroke="#fff" strokeOpacity={0.32} strokeWidth="1.1" />);
      scales.push(<path key={`s${row}-${col}`} d={`M${x + 1} ${y + 1.4} a6 6 0 0 0 12 0`} fill="none" stroke="#2a0e60" strokeOpacity={0.18} strokeWidth="1" />);
    }
  }
  return (
    <>
      <Pool fill="url(#acg-glowViolet)" cy={95} />
      <circle cx="50" cy="52" r="42" fill="url(#acg-glowViolet)" className="ac-pulse" />
      <g className="ac-scale-body">
        <path d="M50 8 C74 8 88 28 86 48 C84 70 64 90 50 94 C36 90 16 70 14 48 C12 28 26 8 50 8Z" fill="url(#acg-scaleA)" />
        <path className="ac-irid" d="M50 8 C74 8 88 28 86 48 C84 70 64 90 50 94 C36 90 16 70 14 48 C12 28 26 8 50 8Z" fill="url(#acg-scaleB)" />
        <g clipPath="url(#acc-scale)">{scales}</g>
        <ellipse cx="50" cy="40" rx="22" ry="26" fill="url(#acg-hi)" opacity=".35" />
        <path d="M50 8 C74 8 88 28 86 48 C84 70 64 90 50 94 C36 90 16 70 14 48 C12 28 26 8 50 8Z" fill="none" stroke="url(#acg-silver)" strokeWidth="2.8" />
        <path d="M50 12 C70 12 82 28 80 46" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.2" strokeLinecap="round" />
        <ellipse cx="36" cy="26" rx="8" ry="4.4" transform="rotate(-40 36 26)" fill="url(#acg-hi)" />
        <Sweep clip="acc-scale" delay={0.5} />
        <Star x={64} y={30} s={0.9} delay={0.7} />
      </g>
    </>
  );
}

function Wild() {
  const rays: ReactNode[] = [];
  for (let i = 0; i < 8; i++) rays.push(<path key={i} d="M50 44 L44 4 L56 4Z" fill="url(#acg-ray)" transform={`rotate(${i * 45} 50 44)`} />);
  const teeth: ReactNode[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    teeth.push(<circle key={i} cx={(50 + Math.cos(a) * 39).toFixed(1)} cy={(44 + Math.sin(a) * 39).toFixed(1)} r={i % 2 ? 1.5 : 2.4} fill="#fff1b0" />);
  }
  return (
    <>
      <Pool fill="url(#acg-glowAqua)" cy={96} rx={36} />
      <circle cx="50" cy="44" r="48" fill="url(#acg-glowAqua)" className="ac-pulse" />
      <g className="ac-wild-rays">{rays}</g>
      <g className="ac-wild-ring">
        <circle cx="50" cy="44" r="39" fill="none" stroke="url(#acg-gold)" strokeWidth="4.4" />
        {teeth}
      </g>
      <circle cx="50" cy="44" r="33" fill="#03233f" />
      <circle cx="50" cy="44" r="30" fill="url(#acg-orb)" />
      <g className="ac-wild-swirl" clipPath="url(#acc-wild-orb)">
        <path d="M50 44 C58 36 70 40 70 48 C70 60 52 66 40 58 C28 50 32 30 48 26" fill="none" stroke="#fff" strokeOpacity=".65" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M50 44 C42 52 30 48 30 40 C30 28 48 22 60 30 C72 38 68 58 52 62" fill="none" stroke="#7ffcf3" strokeOpacity=".7" strokeWidth="1.8" strokeLinecap="round" />
      </g>
      <ellipse cx="40" cy="30" rx="11" ry="6" transform="rotate(-35 40 30)" fill="url(#acg-hi)" />
      {/* the sigil: a small trident burned into the light */}
      <g className="ac-pulse"><g transform="translate(50 45) scale(.34) translate(-50 -50)">
        <path d="M47 44 L53 44 L52 92 L50 98 L48 92Z" fill="#fff6c2" />
        <path d="M27 8 L33 22 L29 22 L29 30 C29 38 38 42 47 42 L47 48 C32 48 23 40 23 29 L23 22 L20 22Z" fill="#fff6c2" />
        <path d="M73 8 L67 22 L71 22 L71 30 C71 38 62 42 53 42 L53 48 C68 48 77 40 77 29 L77 22 L80 22Z" fill="#fff6c2" />
        <path d="M50 3 C56 12 59 20 56 26 L53 26 L53 46 L47 46 L47 26 L44 26 C41 20 44 12 50 3Z" fill="#fff6c2" />
      </g></g>
      <g className="ac-wild-orbit">
        <circle cx="50" cy="2" r="2.4" fill="#fff" />
        <circle cx="50" cy="86" r="1.8" fill="#9ffcf3" />
      </g>
      {/* ribbon */}
      <path d="M22 84 L78 84 L82 90 L78 96 L22 96 L18 90Z" fill="url(#acg-gold)" stroke="#5a3508" strokeWidth=".8" />
      <text x="50" y="93.4" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="1.8" fill="#3a2006" style={{ fontFamily: "var(--font-atlantis), serif" }}>WILD</text>
      <Star x={80} y={18} s={1} delay={0.3} />
      <Star x={18} y={66} s={0.7} delay={1.3} />
    </>
  );
}

function Scatter() {
  const rays: ReactNode[] = [];
  for (let i = 0; i < 12; i++) rays.push(<path key={i} d="M50 50 L46 2 L54 2Z" fill="url(#acg-ray)" transform={`rotate(${i * 30} 50 50)`} opacity=".55" />);
  return (
    <>
      <Pool fill="url(#acg-glowPink)" cy={96} />
      <circle cx="50" cy="50" r="48" fill="url(#acg-glowPink)" className="ac-pulse" />
      <g className="ac-wild-rays">{rays}</g>
      <circle className="ac-scatter-ring" cx="50" cy="50" r="45" fill="none" stroke="url(#acg-gold)" strokeWidth="2.6" strokeDasharray="14 5 3 5" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#7ffcf3" strokeOpacity=".5" strokeWidth="1" />
      <g className="ac-heart">
        <path d="M50 86 C20 64 10 46 14 32 C18 18 38 14 50 30 C62 14 82 18 86 32 C90 46 80 64 50 86Z" fill="url(#acg-heart)" />
        <g clipPath="url(#acc-heart)">
          <path d="M14 32 L50 50 L50 30Z" fill="url(#acg-heartL)" />
          <path d="M50 30 L50 50 L86 32Z" fill="url(#acg-heartL)" opacity=".5" />
          <path d="M14 32 L50 50 L28 66Z" fill="url(#acg-heartR)" />
          <path d="M86 32 L50 50 L72 66Z" fill="url(#acg-heartR)" opacity=".8" />
          <path d="M28 66 L50 50 L50 86Z" fill="#fff" opacity=".1" />
          <path d="M72 66 L50 50 L50 86Z" fill="#000" opacity=".25" />
          <path d="M14 32 L50 50 L86 32 M50 30 L50 50 M28 66 L50 50 L72 66 M50 50 L50 86" stroke="#fff" strokeOpacity=".5" strokeWidth=".9" fill="none" />
          <circle className="ac-pulse" cx="50" cy="46" r="13" fill="#fff" opacity=".35" />
        </g>
        <path d="M50 86 C20 64 10 46 14 32 C18 18 38 14 50 30 C62 14 82 18 86 32 C90 46 80 64 50 86Z" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="1.4" />
        <ellipse cx="31" cy="30" rx="9" ry="5" transform="rotate(-38 31 30)" fill="url(#acg-hi)" />
        <circle cx="29" cy="28.4" r="1.8" fill="#fff" />
      </g>
      <Star x={84} y={18} s={1.1} delay={0.1} fill="#ffe3fa" />
      <Star x={14} y={74} s={0.8} delay={1} fill="#ffe3fa" />
      <Star x={52} y={6} s={0.7} delay={1.6} fill="#ffe3fa" />
    </>
  );
}

const ART: Record<SymId, () => ReactNode> = {
  pearl: Pearl,
  trident: Trident,
  crown: Crown,
  eye: Eye,
  amphora: Amphora,
  conch: Conch,
  crystal: Crystal,
  scale: ScaleGem,
  wild: Wild,
  scatter: Scatter,
};

/** One symbol's artwork. Sizing and motion come from the surrounding tile. */
export const SymbolArt = memo(function SymbolArt({ id, className }: { id: SymId; className?: string }) {
  const Art = ART[id];
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={SYMBOL_NAME[id]} overflow="visible" data-sym={id}>
      <Art />
    </svg>
  );
});
