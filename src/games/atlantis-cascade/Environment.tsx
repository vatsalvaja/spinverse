"use client";

import { memo, useEffect, useRef } from "react";

/**
 * The living ocean behind the machine. It never stops: god-rays sway, caustics crawl, fish and jellyfish drift
 * past, and a single canvas keeps bubbles rising and plankton floating. Everything animates with transform or
 * opacity only (the canvas aside), so it stays cheap, and it slows down rather than disappears when the player
 * asks for reduced motion.
 */

const ENV_CSS = /* css */ `
.ae{position:absolute;inset:0;overflow:hidden;pointer-events:none;--t:1;background:#02121c}
.ae *{pointer-events:none}
@media (prefers-reduced-motion:reduce){.ae{--t:2.6}}
.ae-base{position:absolute;inset:0;background:radial-gradient(120% 80% at 50% 0%,#0e7a96 0%,#0a4d6e 28%,#04283e 58%,#010b14 100%)}
.ae-img{position:absolute;inset:-4%;width:108%;height:108%;object-fit:cover;user-select:none;-webkit-user-drag:none}
.ae-back{opacity:.9;animation:ae-drift calc(70s*var(--t)) ease-in-out infinite alternate;transition:filter 2.4s ease}
@keyframes ae-drift{from{transform:translate3d(-1.6%,.6%,0) scale(1.02)}to{transform:translate3d(1.6%,-.8%,0) scale(1.07)}}
.ae-front{object-position:50% 100%;opacity:.88;inset:auto -3% -4% -3%;top:auto;height:62%;width:106%;object-fit:cover;animation:ae-sway calc(9s*var(--t)) ease-in-out infinite alternate;transform-origin:50% 100%}
@keyframes ae-sway{from{transform:translate3d(0,0,0) rotate(-.3deg)}to{transform:translate3d(0,-1.2%,0) rotate(.3deg) scale(1.01)}}
.ae[data-mode=bonus] .ae-back{filter:hue-rotate(78deg) saturate(1.45) brightness(.92)}
.ae-tint{position:absolute;inset:0;opacity:0;transition:opacity 2.4s ease;background:radial-gradient(70% 60% at 50% 45%,rgba(255,95,224,.28),rgba(120,40,200,.22) 55%,rgba(20,6,50,.5))}
.ae[data-mode=bonus] .ae-tint{opacity:1}

/* god rays */
.ae-ray{position:absolute;top:-12%;height:125%;transform-origin:50% 0;border-radius:50%/0 0 100% 100%;filter:blur(9px);
  background:linear-gradient(180deg,rgba(200,255,255,.34),rgba(140,235,255,.12) 50%,transparent 92%);
  animation:ae-ray calc(var(--d,9s)*var(--t)) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
@keyframes ae-ray{from{transform:rotate(calc(var(--r,0deg) - 3.5deg));opacity:calc(var(--o,.7)*.55)}to{transform:rotate(calc(var(--r,0deg) + 3.5deg));opacity:var(--o,.7)}}

/* caustics */
.ae-caus{position:absolute;left:-15%;top:-15%;width:130%;height:130%;will-change:transform}
.ae-caus.a{opacity:.2;animation:ae-caus-a calc(46s*var(--t)) linear infinite alternate}
.ae-caus.b{opacity:.14;animation:ae-caus-b calc(63s*var(--t)) linear infinite alternate}
@keyframes ae-caus-a{from{transform:translate3d(-4%,-2%,0) scale(1)}to{transform:translate3d(4%,3%,0) scale(1.12)}}
@keyframes ae-caus-b{from{transform:translate3d(3%,3%,0) scale(1.1)}to{transform:translate3d(-3%,-3%,0) scale(1)}}

/* surface */
.ae-surface{position:absolute;left:0;right:0;top:0;height:13%;background:linear-gradient(180deg,rgba(210,255,255,.3),rgba(150,240,255,.08) 60%,transparent)}
.ae-wave{position:absolute;left:0;top:-1px;width:200%;height:46px;animation:ae-wave calc(22s*var(--t)) linear infinite}
.ae-wave.b{top:6px;opacity:.55;animation-duration:calc(31s*var(--t));animation-direction:reverse}
@keyframes ae-wave{to{transform:translate3d(-50%,0,0)}}

/* creatures */
.ae-fish{position:absolute;left:0;will-change:transform;animation:ae-swim calc(var(--sp,80s)*var(--t)) linear infinite;animation-delay:var(--dl,0s)}
@keyframes ae-swim{from{transform:translate3d(-30vw,0,0)}to{transform:translate3d(130vw,0,0)}}
.ae-fish.rev{animation-name:ae-swim-r}
@keyframes ae-swim-r{from{transform:translate3d(130vw,0,0)}to{transform:translate3d(-30vw,0,0)}}
.ae-fish svg{display:block;overflow:visible}
.ae-fish i{display:block;animation:ae-bob calc(3.4s*var(--t)) ease-in-out infinite alternate}
@keyframes ae-bob{from{transform:translateY(-6px)}to{transform:translateY(7px)}}
.ae-jelly{position:absolute;animation:ae-jfloat calc(var(--sp,22s)*var(--t)) ease-in-out infinite alternate;animation-delay:var(--dl,0s)}
@keyframes ae-jfloat{from{transform:translate3d(-2vw,5vh,0)}to{transform:translate3d(3vw,-7vh,0)}}
.ae-jelly svg{overflow:visible;filter:drop-shadow(0 0 14px var(--jc,#7ffcf3))}
.ae-bell{transform-origin:50% 20%;animation:ae-pump calc(2.6s*var(--t)) ease-in-out infinite}
@keyframes ae-pump{0%,100%{transform:scale(1,1)}45%{transform:scale(.88,1.12)}}
.ae-tent{transform-origin:50% 0;animation:ae-tent calc(2.6s*var(--t)) ease-in-out infinite}
@keyframes ae-tent{0%,100%{transform:scaleY(1) skewX(0)}45%{transform:scaleY(1.12) skewX(3deg)}}

/* ruins + crystals */
.ae-ruin{position:absolute;bottom:6%;opacity:.7}
.ae-glow{animation:ae-glow calc(4s*var(--t)) ease-in-out infinite alternate}
@keyframes ae-glow{from{opacity:.45}to{opacity:1}}
.ae-crys{position:absolute;bottom:-1%;filter:drop-shadow(0 0 22px rgba(95,247,239,.65))}
.ae-vig{position:absolute;inset:0;background:radial-gradient(85% 75% at 50% 46%,transparent 40%,rgba(0,6,12,.78) 100%)}
.ae-fog{position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(0deg,rgba(1,10,18,.85),transparent)}
`;

function Fish({ s = 1, flip = false }: { s?: number; flip?: boolean }) {
  return (
    <svg width={40 * s} height={14 * s} viewBox="0 0 40 14" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <path d="M0 7 C8 -1 20 -1 28 7 C20 15 8 15 0 7Z M27 7 L39 1 L36 7 L39 13Z" fill="#0a3b52" />
    </svg>
  );
}

function School({ y, sp, dl, rev, n, s, o }: { y: string; sp: number; dl: number; rev?: boolean; n: number; s: number; o: number }) {
  const fish = Array.from({ length: n }).map((_, i) => ({ x: (i % 3) * 28 * s + Math.floor(i / 3) * 14 * s, y: ((i * 37) % 5) * 9 * s - 18 * s }));
  return (
    <div className={`ae-fish${rev ? " rev" : ""}`} style={{ top: y, ["--sp" as string]: `${sp}s`, ["--dl" as string]: `${dl}s`, opacity: o }}>
      <i style={{ position: "relative", width: 1, height: 1 }}>
        {fish.map((f, k) => (
          <span key={k} style={{ position: "absolute", left: f.x, top: f.y }}>
            <Fish s={s} flip={rev} />
          </span>
        ))}
      </i>
    </div>
  );
}

function Jelly({ x, y, s, c, sp, dl }: { x: string; y: string; s: number; c: string; sp: number; dl: number }) {
  return (
    <div className="ae-jelly" style={{ left: x, top: y, ["--sp" as string]: `${sp}s`, ["--dl" as string]: `${dl}s`, ["--jc" as string]: c }}>
      <svg width={70 * s} height={100 * s} viewBox="0 0 70 100">
        <defs>
          <radialGradient id={`ae-jg-${x.replace(/[^0-9]/g, "")}`} cx=".5" cy=".3" r=".8">
            <stop offset="0" stopColor="#fff" stopOpacity=".95" />
            <stop offset=".45" stopColor={c} stopOpacity=".6" />
            <stop offset="1" stopColor={c} stopOpacity=".15" />
          </radialGradient>
        </defs>
        <g className="ae-bell">
          <path d="M6 34 C6 10 22 2 35 2 C48 2 64 10 64 34 C58 38 52 32 46 38 C40 32 30 32 24 38 C18 32 12 38 6 34Z" fill={`url(#ae-jg-${x.replace(/[^0-9]/g, "")})`} stroke="#fff" strokeOpacity=".5" strokeWidth="1" />
          <ellipse cx="26" cy="14" rx="9" ry="4" fill="#fff" opacity=".5" transform="rotate(-24 26 14)" />
        </g>
        <g className="ae-tent" stroke={c} strokeOpacity=".7" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M20 38 C16 54 24 66 18 84" />
          <path d="M30 38 C34 56 26 70 32 92" />
          <path d="M40 38 C36 54 46 68 40 88" />
          <path d="M50 38 C54 52 46 62 52 80" />
        </g>
      </svg>
    </div>
  );
}

const waveD = "M0 20 Q 100 4 200 20 T 400 20 T 600 20 T 800 20 T 1000 20 T 1200 20 T 1400 20 T 1600 20 V40 H0Z";

export const Environment = memo(function Environment({ mode, calm }: { mode: "normal" | "bonus"; calm: boolean }) {
  const cv = useRef<HTMLCanvasElement>(null);

  // bubbles and plankton
  useEffect(() => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    const fit = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = c.clientWidth;
      h = c.clientHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const nb = calm ? 16 : 36;
    const np = calm ? 36 : 84;
    const speed = calm ? 0.45 : 1;
    const bubbles = Array.from({ length: nb }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1.6 + Math.random() * Math.random() * 7, v: 14 + Math.random() * 34, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.4 }));
    const motes = Array.from({ length: np }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.5 + Math.random() * 1.3, vx: (Math.random() - 0.5) * 9, vy: (Math.random() - 0.4) * 7, ph: Math.random() * 6.28, hue: Math.random() < 0.2 ? 320 : 185 }));

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * speed;
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.ph += dt * 1.4;
        m.x += (m.vx + Math.sin(m.ph) * 4) * dt;
        m.y += m.vy * dt;
        if (m.x < -4) m.x = w + 4;
        if (m.x > w + 4) m.x = -4;
        if (m.y < -4) m.y = h + 4;
        if (m.y > h + 4) m.y = -4;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(m.ph * 1.3));
        ctx.fillStyle = `hsla(${m.hue},90%,82%,${(0.5 * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, 6.283);
        ctx.fill();
      }
      for (const b of bubbles) {
        b.y -= b.v * dt;
        b.ph += dt * 1.8;
        const x = b.x + Math.sin(b.ph) * (4 + b.r);
        if (b.y < -20) {
          b.y = h + 20;
          b.x = Math.random() * w;
        }
        ctx.globalAlpha = b.a;
        const g = ctx.createRadialGradient(x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.1, x, b.y, b.r);
        g.addColorStop(0, "rgba(255,255,255,.5)");
        g.addColorStop(0.65, "rgba(160,245,255,.08)");
        g.addColorStop(1, "rgba(130,235,255,.3)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, b.y, b.r, 0, 6.283);
        ctx.fill();
        ctx.strokeStyle = "rgba(220,255,255,.65)";
        ctx.lineWidth = 0.8;
        ctx.stroke();
        if (b.r > 3) {
          ctx.fillStyle = "rgba(255,255,255,.85)";
          ctx.beginPath();
          ctx.arc(x - b.r * 0.4, b.y - b.r * 0.42, b.r * 0.18, 0, 6.283);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [calm]);

  const rays = [
    { l: "-2%", w: "13vw", r: "-14deg", o: 0.8, d: 9, dl: 0 },
    { l: "12%", w: "9vw", r: "-9deg", o: 0.55, d: 12, dl: -3 },
    { l: "26%", w: "15vw", r: "-5deg", o: 0.7, d: 10, dl: -6 },
    { l: "44%", w: "11vw", r: "2deg", o: 0.6, d: 13, dl: -2 },
    { l: "58%", w: "16vw", r: "7deg", o: 0.75, d: 9.5, dl: -7 },
    { l: "74%", w: "10vw", r: "11deg", o: 0.55, d: 11, dl: -4 },
    { l: "88%", w: "14vw", r: "15deg", o: 0.7, d: 12, dl: -1 },
  ];

  return (
    <div className="ae" data-mode={mode} aria-hidden>
      <style dangerouslySetInnerHTML={{ __html: ENV_CSS }} />
      <div className="ae-base" />
      <img className="ae-img ae-back" src="/art/atlantis/back.webp" alt="" draggable={false} />
      <div className="ae-tint" />

      {/* light from the surface */}
      {rays.map((r, i) => (
        <div key={i} className="ae-ray" style={{ left: r.l, width: r.w, ["--r" as string]: r.r, ["--o" as string]: r.o, ["--d" as string]: `${r.d}s`, ["--dl" as string]: `${r.dl}s` }} />
      ))}
      <div className="ae-surface">
        <svg className="ae-wave" viewBox="0 0 1600 40" preserveAspectRatio="none">
          <path d={waveD} fill="rgba(210,255,255,.22)" />
        </svg>
        <svg className="ae-wave b" viewBox="0 0 1600 40" preserveAspectRatio="none">
          <path d={waveD} fill="rgba(160,240,255,.18)" />
        </svg>
      </div>

      {/* caustics: bright net of light, drifting in two directions */}
      <svg className="ae-caus a" width="100%" height="100%" preserveAspectRatio="none">
        <filter id="ae-cf-a" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.011 0.019" numOctaves="2" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 .6  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -4.15" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ae-cf-a)" />
      </svg>
      <svg className="ae-caus b" width="100%" height="100%" preserveAspectRatio="none">
        <filter id="ae-cf-b" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016 0.012" numOctaves="2" seed="11" />
          <feColorMatrix type="matrix" values="0 0 0 0 .7  0 0 0 0 1  0 0 0 0 1  9 0 0 0 -4.2" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ae-cf-b)" />
      </svg>

      {/* far away: a school, a manta, more schools */}
      <School y="22%" sp={95} dl={-30} n={8} s={0.8} o={0.45} />
      <School y="40%" sp={70} dl={-55} rev n={6} s={1.05} o={0.5} />
      <School y="63%" sp={115} dl={-10} n={9} s={0.7} o={0.38} />
      <div className="ae-fish" style={{ top: "14%", ["--sp" as string]: "160s", ["--dl" as string]: "-70s", opacity: 0.3 }}>
        <svg width="220" height="90" viewBox="0 0 220 90">
          <path d="M110 12 C140 20 190 24 218 42 C190 40 168 44 150 52 C140 70 126 80 110 88 C94 80 80 70 70 52 C52 44 30 40 2 42 C30 24 80 20 110 12Z" fill="#0a3b52" />
        </svg>
      </div>

      {/* ancient ruins at the edges, fading into the deep */}
      <svg className="ae-ruin" style={{ left: "1%", width: "15vw", height: "44vh" }} viewBox="0 0 120 300" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="ae-col" x1="0" x2="1">
            <stop offset="0" stopColor="#05233a" />
            <stop offset=".45" stopColor="#14607a" />
            <stop offset="1" stopColor="#04202f" />
          </linearGradient>
        </defs>
        <path d="M30 300 L30 70 L36 60 L52 64 L60 52 L78 62 L90 300Z" fill="url(#ae-col)" />
        {[40, 50, 60, 70, 80].map((x) => (
          <path key={x} d={`M${x} 70 L${x} 300`} stroke="#0a1e30" strokeOpacity=".6" strokeWidth="1.4" />
        ))}
        <rect x="22" y="286" width="76" height="14" rx="2" fill="#0a3550" />
        <rect className="ae-glow" x="54" y="130" width="8" height="14" rx="2" fill="#7ffcf3" />
        <rect className="ae-glow" x="54" y="190" width="8" height="14" rx="2" fill="#7ffcf3" style={{ animationDelay: "-2s" }} />
      </svg>
      <svg className="ae-ruin" style={{ right: "1%", width: "13vw", height: "36vh" }} viewBox="0 0 120 240" preserveAspectRatio="xMidYMax meet">
        <path d="M24 240 L24 90 C24 40 96 40 96 90 L96 240 L80 240 L80 96 C80 66 40 66 40 96 L40 240Z" fill="url(#ae-col)" />
        <rect className="ae-glow" x="56" y="64" width="8" height="14" rx="2" fill="#7ffcf3" style={{ animationDelay: "-1s" }} />
      </svg>

      <div className="ae-fog" />
      {/* foreground coral and the clam, swaying */}
      <img className="ae-img ae-front" src="/art/atlantis/front.webp" alt="" draggable={false} />

      {/* glowing sea crystals */}
      <svg className="ae-crys" style={{ left: "-1%", width: "17vw", height: "34vh" }} viewBox="0 0 160 200" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="ae-cy1" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#d8ffff" />
            <stop offset=".5" stopColor="#4fe0ea" />
            <stop offset="1" stopColor="#0a6f92" />
          </linearGradient>
        </defs>
        <g className="ae-glow">
          <path d="M60 200 L48 70 L66 20 L84 70 L78 200Z" fill="url(#ae-cy1)" opacity=".9" />
          <path d="M66 20 L84 70 L78 200 L66 120Z" fill="#fff" opacity=".18" />
          <path d="M20 200 L16 120 L30 84 L44 122 L40 200Z" fill="url(#ae-cy1)" opacity=".8" />
          <path d="M100 200 L100 110 L116 76 L132 112 L128 200Z" fill="url(#ae-cy1)" opacity=".75" />
        </g>
      </svg>
      <svg className="ae-crys" style={{ right: "-1%", width: "15vw", height: "30vh", filter: "drop-shadow(0 0 22px rgba(255,120,230,.6))" }} viewBox="0 0 160 200" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="ae-cy2" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#ffe6fb" />
            <stop offset=".5" stopColor="#ff7de2" />
            <stop offset="1" stopColor="#5a1a96" />
          </linearGradient>
        </defs>
        <g className="ae-glow" style={{ animationDelay: "-2s" }}>
          <path d="M70 200 L58 90 L76 40 L94 90 L90 200Z" fill="url(#ae-cy2)" opacity=".9" />
          <path d="M76 40 L94 90 L90 200 L76 130Z" fill="#fff" opacity=".18" />
          <path d="M112 200 L110 130 L124 96 L138 132 L134 200Z" fill="url(#ae-cy2)" opacity=".8" />
          <path d="M30 200 L26 140 L38 112 L50 142 L48 200Z" fill="url(#ae-cy2)" opacity=".75" />
        </g>
      </svg>

      <Jelly x="4%" y="26%" s={1.1} c="#7ffcf3" sp={24} dl={-6} />
      <Jelly x="88%" y="46%" s={0.9} c="#ff8ae8" sp={28} dl={-14} />
      <Jelly x="10%" y="58%" s={0.6} c="#b98aff" sp={20} dl={-2} />
      <Jelly x="80%" y="16%" s={0.55} c="#7ffcf3" sp={26} dl={-18} />

      <canvas ref={cv} className="absolute inset-0 h-full w-full" />
      <div className="ae-vig" />
    </div>
  );
});
