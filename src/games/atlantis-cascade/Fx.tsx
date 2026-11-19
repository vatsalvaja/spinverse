"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type FxKind = "bubble" | "pearl" | "coin" | "shard" | "spark";

interface P {
  kind: FxKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number; // gravity, positive falls
  drag: number;
  r: number;
  rot: number;
  vr: number;
  life: number;
  max: number;
  hue: number;
  wob: number;
  ph: number;
}

export interface FxHandle {
  /** A burst of `count` particles at a pixel position. */
  burst(x: number, y: number, kind: FxKind, count: number, power?: number, hue?: number): void;
  /** A mixed pop of bubbles, shards and sparks, for a symbol bursting. */
  pop(x: number, y: number, hue: number, size: number): void;
  /** Particles falling from above for `seconds`. */
  rain(kind: FxKind, count: number, seconds: number): void;
  /** Bubbles rising from the bottom edge for `seconds`. */
  surge(count: number, seconds: number): void;
  clear(): void;
}

const MAX = 900;
const rnd = (a: number, b: number) => a + Math.random() * (b - a);

/** One full-screen canvas for every celebration and pop. It only runs while there is something to draw. */
export const Fx = forwardRef<FxHandle, { calm?: boolean }>(function Fx({ calm }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const spawners = useRef<{ kind: FxKind; left: number; every: number; acc: number; mode: "rain" | "surge"; per: number }[]>([]);
  const raf = useRef(0);
  const last = useRef(0);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const calmRef = useRef(!!calm);
  calmRef.current = !!calm;

  const add = (p: Partial<P> & { kind: FxKind; x: number; y: number }) => {
    if (parts.current.length >= MAX) return;
    const max = p.max ?? rnd(1.2, 2.4);
    parts.current.push({ vx: 0, vy: 0, g: 0, drag: 0.99, r: 6, rot: 0, vr: 0, life: max, max, hue: 180, wob: 0, ph: Math.random() * 6.28, ...p });
  };

  const ensureLoop = () => {
    if (raf.current) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(frame);
  };

  const frame = (now: number) => {
    raf.current = 0;
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dt = Math.min(0.05, (now - last.current) / 1000);
    last.current = now;
    const { w, h, dpr } = size.current;

    // spawners
    for (const s of spawners.current) {
      s.left -= dt;
      s.acc += dt;
      while (s.acc >= s.every && s.left > 0) {
        s.acc -= s.every;
        for (let i = 0; i < s.per; i++) {
          if (s.mode === "rain") {
            const k = s.kind;
            add({
              kind: k,
              x: rnd(0, w),
              y: rnd(-60, -10),
              vx: rnd(-40, 40),
              vy: rnd(120, 380),
              g: 520,
              r: k === "coin" ? rnd(9, 15) : rnd(5, 11),
              rot: rnd(0, 6.28),
              vr: rnd(-6, 6),
              max: rnd(2.4, 4),
              hue: k === "coin" ? 45 : k === "pearl" ? 320 : 185,
              wob: k === "bubble" ? rnd(10, 30) : 0,
            });
          } else {
            add({ kind: "bubble", x: rnd(0, w), y: h + 20, vx: rnd(-20, 20), vy: -rnd(120, 420), g: -30, r: rnd(4, 16), max: rnd(2.2, 4), wob: rnd(8, 26), hue: 185 });
          }
        }
      }
    }
    spawners.current = spawners.current.filter((s) => s.left > 0);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const live: P[] = [];
    for (const p of parts.current) {
      p.life -= dt;
      if (p.life <= 0 || p.y > h + 80 || p.y < -200) continue;
      p.vy += p.g * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
      p.ph += dt * 3;
      p.x += (p.vx + Math.sin(p.ph) * p.wob) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const a = Math.min(1, p.life / Math.min(0.6, p.max * 0.4));
      draw(ctx, p, a);
      live.push(p);
    }
    parts.current = live;
    if (live.length || spawners.current.length) raf.current = requestAnimationFrame(frame);
  };

  useImperativeHandle(ref, () => ({
    burst(x, y, kind, count, power = 1, hue = 185) {
      const n = calmRef.current ? Math.ceil(count * 0.6) : count;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283;
        const sp = rnd(80, 420) * power;
        add({
          kind,
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 120 * power,
          g: kind === "bubble" ? -60 : 640,
          drag: 0.97,
          r: kind === "coin" ? rnd(9, 14) : kind === "spark" ? rnd(2, 5) : rnd(4, 11),
          rot: rnd(0, 6.28),
          vr: rnd(-9, 9),
          max: rnd(0.9, 2.2),
          hue,
          wob: kind === "bubble" ? rnd(6, 20) : 0,
        });
      }
      ensureLoop();
    },
    pop(x, y, hue, sz) {
      const n = calmRef.current ? 6 : 10 + Math.min(10, sz);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.283;
        const sp = rnd(60, 340);
        const r = Math.random();
        add({
          kind: r < 0.5 ? "bubble" : r < 0.8 ? "shard" : "spark",
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 40,
          g: r < 0.5 ? -90 : 520,
          drag: 0.965,
          r: r < 0.5 ? rnd(3, 9) : r < 0.8 ? rnd(4, 9) : rnd(2, 4.5),
          rot: rnd(0, 6.28),
          vr: rnd(-10, 10),
          max: rnd(0.6, 1.5),
          hue: r < 0.8 ? 185 : hue,
          wob: r < 0.5 ? rnd(6, 16) : 0,
        });
      }
      ensureLoop();
    },
    rain(kind, count, seconds) {
      const n = calmRef.current ? Math.ceil(count * 0.55) : count;
      const every = 0.05;
      spawners.current.push({ kind, left: seconds, every, acc: 0, mode: "rain", per: Math.max(1, Math.round((n / seconds) * every)) });
      ensureLoop();
    },
    surge(count, seconds) {
      const n = calmRef.current ? Math.ceil(count * 0.55) : count;
      const every = 0.05;
      spawners.current.push({ kind: "bubble", left: seconds, every, acc: 0, mode: "surge", per: Math.max(1, Math.round((n / seconds) * every)) });
      ensureLoop();
    },
    clear() {
      parts.current = [];
      spawners.current = [];
      const c = cv.current;
      c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    },
  }));

  useEffect(() => {
    const fit = () => {
      const c = cv.current;
      if (!c) return;
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      size.current = { w, h, dpr };
    };
    fit();
    window.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, []);

  return <canvas ref={cv} className="pointer-events-none absolute inset-0 z-[35] h-full w-full" aria-hidden />;
});

function draw(ctx: CanvasRenderingContext2D, p: P, a: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalAlpha = a;
  switch (p.kind) {
    case "bubble": {
      const g = ctx.createRadialGradient(-p.r * 0.35, -p.r * 0.4, p.r * 0.1, 0, 0, p.r);
      g.addColorStop(0, "rgba(255,255,255,.55)");
      g.addColorStop(0.6, "rgba(160,245,255,.12)");
      g.addColorStop(1, "rgba(120,230,255,.32)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "rgba(220,255,255,.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.9)";
      ctx.beginPath();
      ctx.arc(-p.r * 0.38, -p.r * 0.4, Math.max(1, p.r * 0.2), 0, 6.283);
      ctx.fill();
      break;
    }
    case "pearl": {
      const g = ctx.createRadialGradient(-p.r * 0.35, -p.r * 0.35, p.r * 0.1, 0, 0, p.r);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.5, "#f6e4f2");
      g.addColorStop(1, "#a9b6dc");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, 6.283);
      ctx.fill();
      break;
    }
    case "coin": {
      ctx.rotate(0.3);
      ctx.scale(Math.max(0.12, Math.abs(Math.cos(p.rot))), 1);
      const g = ctx.createLinearGradient(-p.r, -p.r, p.r, p.r);
      g.addColorStop(0, "#fff6c2");
      g.addColorStop(0.5, "#f1c14f");
      g.addColorStop(1, "#a8701a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.r, 0, 6.283);
      ctx.fill();
      ctx.strokeStyle = "#7a4a08";
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 0.62, 0.4, 2.6);
      ctx.stroke();
      break;
    }
    case "shard": {
      ctx.rotate(p.rot);
      const g = ctx.createLinearGradient(-p.r, -p.r, p.r, p.r);
      g.addColorStop(0, "rgba(230,255,255,.95)");
      g.addColorStop(1, "rgba(60,200,230,.6)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -p.r * 1.3);
      ctx.lineTo(p.r * 0.8, p.r * 0.7);
      ctx.lineTo(-p.r * 0.7, p.r * 0.5);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "spark": {
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 3);
      g.addColorStop(0, `hsla(${p.hue},100%,88%,1)`);
      g.addColorStop(0.4, `hsla(${p.hue},100%,62%,.5)`);
      g.addColorStop(1, `hsla(${p.hue},100%,50%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.r * 3, 0, 6.283);
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}
