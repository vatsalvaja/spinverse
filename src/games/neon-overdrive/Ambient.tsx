"use client";

import { memo, useEffect, useRef } from "react";

/** Floating data bits, drifting squares and the odd electrical arc. One light canvas, capped at ~30 fps. */
function DigitalCanvas({ calm, od }: { calm: boolean; od: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const odRef = useRef(od);
  odRef.current = od;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    let w = 1;
    let h = 1;
    const fit = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    const N = calm ? 26 : 64;
    const mk = (init: boolean) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : h + 10,
      vy: -(8 + Math.random() * 26),
      vx: (Math.random() - 0.5) * 8,
      s: 1.5 + Math.random() * 3.5,
      a: 0.2 + Math.random() * 0.6,
      ph: Math.random() * 6.28,
      bit: Math.random() < 0.4 ? (Math.random() < 0.5 ? "0" : "1") : "",
      hue: Math.random(),
    });
    const parts = Array.from({ length: N }, () => mk(true));
    let arcs: { pts: [number, number][]; life: number; max: number }[] = [];
    let nextArc = 1.5;
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const arc = () => {
      const left = Math.random() < 0.5;
      const x1 = left ? Math.random() * w * 0.2 : w * 0.8 + Math.random() * w * 0.2;
      const y1 = Math.random() * h * 0.7;
      const x2 = x1 + (left ? 1 : -1) * (60 + Math.random() * w * 0.12);
      const y2 = y1 + (Math.random() - 0.3) * h * 0.25;
      let pts: [number, number][] = [[x1, y1], [x2, y2]];
      let d = 60;
      for (let k = 0; k < 4; k++) {
        const nx: [number, number][] = [];
        for (let i = 0; i < pts.length - 1; i++) {
          nx.push(pts[i], [(pts[i][0] + pts[i + 1][0]) / 2 + (Math.random() - 0.5) * d, (pts[i][1] + pts[i + 1][1]) / 2 + (Math.random() - 0.5) * d]);
        }
        nx.push(pts[pts.length - 1]);
        pts = nx;
        d *= 0.55;
      }
      arcs.push({ pts, life: 0, max: 0.32 });
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = (t - last) / 1000;
      if (dt < 0.032) return;
      last = t;
      acc += dt;
      const step = Math.min(dt, 0.1);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      const od = odRef.current;
      const A = od ? "255,79,216" : "53,232,255";
      const B = od ? "255,174,46" : "143,91,255";
      for (const p of parts) {
        p.y += p.vy * step;
        p.x += (p.vx + Math.sin(acc * 0.6 + p.ph) * 6) * step;
        if (p.y < -12) Object.assign(p, mk(false), { x: Math.random() * w });
        const tw = 0.6 + 0.4 * Math.sin(acc * 2 + p.ph);
        const col = p.hue < 0.55 ? A : B;
        if (p.bit) {
          ctx.fillStyle = `rgba(${col},${p.a * tw})`;
          ctx.font = "11px ui-monospace, monospace";
          ctx.fillText(p.bit, p.x, p.y);
        } else {
          ctx.fillStyle = `rgba(${col},${p.a * tw})`;
          ctx.shadowColor = `rgb(${col})`;
          ctx.shadowBlur = 8;
          ctx.fillRect(p.x, p.y, p.s, p.s);
          ctx.shadowBlur = 0;
        }
      }
      nextArc -= step;
      if (nextArc <= 0) {
        arc();
        nextArc = 2.2 + Math.random() * 4;
      }
      ctx.lineJoin = "round";
      for (const a of arcs) {
        a.life += step;
        const p = a.life / a.max;
        ctx.strokeStyle = `rgba(${A},${Math.max(0, 1 - p) * (Math.random() < 0.3 ? 0.35 : 0.8)})`;
        ctx.shadowColor = `rgb(${A})`;
        ctx.shadowBlur = 14;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        a.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      arcs = arcs.filter((a) => a.life < a.max);
      ctx.globalCompositeOperation = "source-over";
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
    };
  }, [calm]);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

/** The permanent cyberpunk world behind the machine. Everything here animates by itself. */
export const Ambient = memo(function Ambient({ calm, od }: { calm: boolean; od: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#04010e]" aria-hidden>
      {/* skyline poster, slowly drifting */}
      <div className="no-kb absolute inset-[-4%]" style={{ backgroundImage: "url(/art/neon/back.webp)", backgroundSize: "cover", backgroundPosition: "center 30%", opacity: 0.62, filter: od ? "hue-rotate(58deg) saturate(1.35)" : "none", transition: "filter 1.4s" }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#05010f]/70 via-[#05010f]/25 to-[#05010f]/85" />
      {/* street canyon framing */}
      <div className="no-side absolute inset-0" style={{ backgroundImage: "url(/art/neon/mid.webp)", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.32, mixBlendMode: "screen", WebkitMaskImage: "radial-gradient(60% 70% at 50% 50%, transparent 35%, #000 85%)", maskImage: "radial-gradient(60% 70% at 50% 50%, transparent 35%, #000 85%)", filter: od ? "hue-rotate(58deg)" : "none", transition: "filter 1.4s" }} />

      {/* the energy core, big and slow, behind the machine */}
      <div className="no-core-bg">
        <svg viewBox="0 0 400 400" fill="none">
          <defs>
            <radialGradient id="no-corebg" cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="var(--c4)" stopOpacity=".8" />
              <stop offset=".25" stopColor="var(--c1)" stopOpacity=".5" />
              <stop offset="1" stopColor="var(--c2)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="no-corepulse" cx="200" cy="200" r="190" fill="url(#no-corebg)" />
          <g style={{ transformOrigin: "200px 200px", animation: "no-spin 60s linear infinite" }} stroke="var(--c1)" strokeWidth="1.4" opacity=".7">
            <circle cx="200" cy="200" r="178" strokeDasharray="2 10" />
            <circle cx="200" cy="200" r="150" strokeDasharray="34 12 4 12" />
          </g>
          <g style={{ transformOrigin: "200px 200px", animation: "no-spin 38s linear infinite reverse" }} stroke="var(--c3)" strokeWidth="1.6" opacity=".6">
            <circle cx="200" cy="200" r="122" strokeDasharray="60 20" />
            <path d="M200 70 L212 92 H188 Z M330 200 L308 212 V188 Z M200 330 L188 308 H212 Z M70 200 L92 188 V212 Z" fill="var(--c3)" />
          </g>
          <g style={{ transformOrigin: "200px 200px", animation: "no-spin 22s linear infinite" }} stroke="var(--c2)" strokeWidth="2" opacity=".7">
            <circle cx="200" cy="200" r="92" strokeDasharray="8 8" />
          </g>
        </svg>
      </div>
      <div className="no-rings">
        <div className="no-ring" />
        <div className="no-ring" style={{ animationDelay: "2s" }} />
        <div className="no-ring" style={{ animationDelay: "4s" }} />
      </div>

      {/* moving neon light bars */}
      <div className="no-bars">
        {[
          { l: "8%", c: "#35e8ff", d: "-2s", t: "13s" },
          { l: "28%", c: "#ff3fd0", d: "-6s", t: "17s" },
          { l: "58%", c: "#8f5bff", d: "-9s", t: "15s" },
          { l: "80%", c: "#35e8ff", d: "-4s", t: "19s" },
        ].map((b, i) => (
          <div key={i} className="no-bar" style={{ left: b.l, ["--bc" as string]: b.c, animationDelay: b.d, animationDuration: b.t }} />
        ))}
      </div>

      {/* perspective grid floor */}
      <div className="no-floor3d"><div className="no-grid" /></div>

      {/* holographic panels, wide screens only */}
      <div className="hidden min-[900px]:block">
        <div className="no-holopanel" style={{ left: "3%", top: "16%", width: "9vw", height: "26vh" }} />
        <div className="no-holopanel" style={{ left: "5.5%", top: "48%", width: "6vw", height: "14vh", animationDelay: "-3s" }} />
        <div className="no-holopanel" style={{ right: "3%", top: "20%", width: "9vw", height: "22vh", animationDelay: "-2s" }} />
        <div className="no-holopanel" style={{ right: "6%", top: "52%", width: "6vw", height: "16vh", animationDelay: "-5s" }} />
      </div>

      <DigitalCanvas calm={calm} od={od} />

      {/* overdrive tint and glitchy hot light */}
      <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: od ? 1 : 0, background: "radial-gradient(70% 60% at 50% 50%, rgba(255,60,200,.26), rgba(255,140,40,.1) 55%, transparent 80%)", mixBlendMode: "screen" }} />
      <div className="no-scanlines" />
      <div className="absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_45%,transparent,rgba(2,0,8,.8))]" />
    </div>
  );
});
