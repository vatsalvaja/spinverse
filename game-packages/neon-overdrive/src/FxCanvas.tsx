"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type Palette = "cyan" | "magenta" | "violet" | "gold" | "white" | "mix" | "fire";
const PAL: Record<Palette, string[]> = {
  cyan: ["#35e8ff", "#9ff6ff", "#ffffff", "#1f9bff"],
  magenta: ["#ff3fd0", "#ff9ae8", "#ffffff", "#c11aa6"],
  violet: ["#8f5bff", "#c7aeff", "#ffffff", "#5a2de0"],
  gold: ["#ffcf5a", "#fff0b0", "#ffffff", "#ff9d1c"],
  white: ["#ffffff", "#dff7ff", "#ffe6fb"],
  mix: ["#35e8ff", "#ff3fd0", "#8f5bff", "#ffffff", "#ffcf5a"],
  fire: ["#ff5a3c", "#ffae2e", "#fff3c4", "#ff4fd8"],
};

export interface FxHandle {
  sparks(x: number, y: number, n: number, power?: number, pal?: Palette): void;
  bolt(x1: number, y1: number, x2: number, y2: number, pal?: Palette, width?: number): void;
  storm(count: number, seconds: number, pal?: Palette): void;
  ring(x: number, y: number, pal?: Palette, size?: number): void;
  rain(n: number, seconds: number, pal?: Palette): void;
  burst(x: number, y: number, pal?: Palette, power?: number): void;
  clear(): void;
}

interface Spark { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; c: string; g: number; trail: boolean }
interface Bolt { pts: [number, number][]; life: number; max: number; c: string; w: number }
interface Ring { x: number; y: number; life: number; max: number; size: number; c: string }
interface Shard { x: number; y: number; vy: number; vx: number; len: number; w: number; c: string; delay: number }

function jag(x1: number, y1: number, x2: number, y2: number, disp: number): [number, number][] {
  let pts: [number, number][] = [[x1, y1], [x2, y2]];
  for (let k = 0; k < 5; k++) {
    const next: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const mx = (ax + bx) / 2 + (Math.random() - 0.5) * disp;
      const my = (ay + by) / 2 + (Math.random() - 0.5) * disp;
      next.push([ax, ay], [mx, my]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    disp *= 0.55;
  }
  return pts;
}

/** One full-screen canvas for sparks, lightning, rings and energy rain. Draws only while something is alive. */
export const FxCanvas = forwardRef<FxHandle, { calm?: boolean }>(function FxCanvas({ calm }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const sparks = useRef<Spark[]>([]);
  const bolts = useRef<Bolt[]>([]);
  const rings = useRef<Ring[]>([]);
  const shards = useRef<Shard[]>([]);
  const raf = useRef(0);
  const last = useRef(0);
  const size = useRef({ w: 1, h: 1, dpr: 1 });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const k = calm ? 0.55 : 1;

  const frame = useRef<(t: number) => void>(() => {});
  frame.current = (t: number) => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const dt = Math.min(0.05, (t - last.current) / 1000 || 0.016);
    last.current = t;
    const { w, h, dpr } = size.current;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";

    // shards (energy rain)
    for (const s of shards.current) {
      if (s.delay > 0) { s.delay -= dt; continue; }
      s.y += s.vy * dt;
      s.x += s.vx * dt;
      const g = ctx.createLinearGradient(s.x, s.y - s.len, s.x, s.y);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, s.c);
      ctx.fillStyle = g;
      ctx.fillRect(s.x - s.w / 2, s.y - s.len, s.w, s.len);
    }
    shards.current = shards.current.filter((s) => s.y - s.len < h + 20);

    for (const r of rings.current) {
      r.life += dt;
      const p = r.life / r.max;
      ctx.strokeStyle = r.c;
      ctx.globalAlpha = Math.max(0, 1 - p);
      ctx.lineWidth = 3 + (1 - p) * 6;
      ctx.shadowColor = r.c;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(r.x * w, r.y * h, r.size * Math.min(w, h) * (0.05 + p * 0.5), 0, Math.PI * 2);
      ctx.stroke();
    }
    rings.current = rings.current.filter((r) => r.life < r.max);
    ctx.shadowBlur = 0;

    for (const s of sparks.current) {
      s.life += dt;
      s.vy += s.g * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      const p = s.life / s.max;
      ctx.globalAlpha = Math.max(0, 1 - p * p);
      ctx.fillStyle = s.c;
      if (s.trail) {
        ctx.strokeStyle = s.c;
        ctx.lineWidth = s.size * 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 0.04, s.y - s.vy * 0.04);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * (1 - p * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    sparks.current = sparks.current.filter((s) => s.life < s.max);

    for (const b of bolts.current) {
      b.life += dt;
      const p = b.life / b.max;
      const flick = Math.random() < 0.3 ? 0.4 : 1;
      ctx.globalAlpha = Math.max(0, 1 - p) * flick;
      ctx.lineJoin = "round";
      ctx.strokeStyle = b.c;
      ctx.shadowColor = b.c;
      ctx.shadowBlur = 20;
      ctx.lineWidth = b.w * 2.6;
      ctx.beginPath();
      b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = b.w;
      ctx.beginPath();
      b.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
      ctx.stroke();
    }
    bolts.current = bolts.current.filter((b) => b.life < b.max);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";

    if (sparks.current.length || bolts.current.length || rings.current.length || shards.current.length) raf.current = requestAnimationFrame((n) => frame.current(n));
    else {
      raf.current = 0;
      ctx.clearRect(0, 0, w, h);
    }
  };

  const kick = () => {
    if (!raf.current) {
      last.current = performance.now();
      raf.current = requestAnimationFrame((n) => frame.current(n));
    }
  };

  useEffect(() => {
    const fit = () => {
      const c = cv.current;
      if (!c) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = window.innerWidth;
      const h = window.innerHeight;
      c.width = Math.floor(w * dpr);
      c.height = Math.floor(h * dpr);
      size.current = { w, h, dpr };
    };
    fit();
    window.addEventListener("resize", fit);
    const pending = timers.current;
    return () => {
      window.removeEventListener("resize", fit);
      cancelAnimationFrame(raf.current);
      raf.current = 0;
      pending.forEach(clearTimeout);
    };
  }, []);

  useImperativeHandle(ref, () => {
    const pick = (p: Palette) => PAL[p][Math.floor(Math.random() * PAL[p].length)];
    const api: FxHandle = {
      sparks(x, y, n, power = 1, pal = "mix") {
        const { w, h } = size.current;
        const count = Math.round(n * k);
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const v = (80 + Math.random() * 380) * power;
          sparks.current.push({ x: x * w, y: y * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0, max: 0.5 + Math.random() * 0.9, size: 1.2 + Math.random() * 2.6, c: pick(pal), g: 360, trail: true });
        }
        kick();
      },
      bolt(x1, y1, x2, y2, pal = "cyan", width = 2.2) {
        const { w, h } = size.current;
        const disp = (Math.hypot((x2 - x1) * w, (y2 - y1) * h) / Math.max(w, h)) * 0.5;
        bolts.current.push({ pts: jag(x1, y1, x2, y2, disp), life: 0, max: 0.28 + Math.random() * 0.2, c: pick(pal), w: width });
        kick();
      },
      storm(count, seconds, pal = "mix") {
        const n = Math.round(count * k);
        for (let i = 0; i < n; i++) {
          timers.current.push(
            setTimeout(() => {
              const fromTop = Math.random() < 0.6;
              const x1 = Math.random();
              const y1 = fromTop ? -0.02 : Math.random();
              api.bolt(x1, y1, Math.min(1, Math.max(0, x1 + (Math.random() - 0.5) * 0.5)), fromTop ? 0.3 + Math.random() * 0.6 : Math.random(), pal, 1.6 + Math.random() * 2);
              if (Math.random() < 0.5) api.sparks(Math.random(), 0.3 + Math.random() * 0.5, 10, 0.6, pal);
            }, (i / n) * seconds * 1000 + Math.random() * 120),
          );
        }
      },
      ring(x, y, pal = "cyan", size_ = 1) {
        rings.current.push({ x, y, life: 0, max: 0.9, size: size_, c: pick(pal) });
        kick();
      },
      rain(n, seconds, pal = "mix") {
        const { w, h } = size.current;
        const count = Math.round(n * k);
        for (let i = 0; i < count; i++) {
          const len = 30 + Math.random() * 90;
          shards.current.push({ x: Math.random() * w, y: -len - Math.random() * 40, vy: 500 + Math.random() * 700, vx: (Math.random() - 0.5) * 60, len, w: 1.5 + Math.random() * 2.5, c: pick(pal), delay: Math.random() * seconds });
        }
        void h;
        kick();
      },
      burst(x, y, pal = "mix", power = 1) {
        api.sparks(x, y, 70 * power, 1.3 * power, pal);
        api.ring(x, y, pal, 1.2);
        timers.current.push(setTimeout(() => api.ring(x, y, "white", 1.6), 110));
      },
      clear() {
        sparks.current = [];
        bolts.current = [];
        rings.current = [];
        shards.current = [];
        timers.current.forEach(clearTimeout);
        timers.current = [];
      },
    };
    return api;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  return <canvas ref={cv} className="pointer-events-none absolute inset-0 z-[40] h-full w-full" aria-hidden />;
});
