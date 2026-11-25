import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export const PALETTES = {
  gold: ["#ffd46a", "#fff1b8", "#ffb52e", "#ffe9a0"],
  white: ["#ffffff", "#fff6d2", "#ffeeb0"],
  teal: ["#8ff7ea", "#33d6c6", "#d8fffa"],
  ruby: ["#ff7a90", "#ff3355", "#ffc2cc"],
  ember: ["#ff9a3c", "#ffcf6a", "#ff6a1a"],
} as const;
export type PaletteName = keyof typeof PALETTES;

export interface FxHandle {
  /** Coins and sparks thrown up from a point (fractions of the canvas), then falling under gravity. */
  fountain: (x: number, y: number, count: number, power?: number) => void;
  /** Coins raining from above for `seconds`. */
  shower: (count: number, seconds: number) => void;
  /** Confetti drifting down for `seconds`. */
  confetti: (count: number, seconds: number) => void;
  /** A radial puff of golden sparks. */
  sparks: (x: number, y: number, count: number, radius?: number) => void;
  /** A firework shell: rises from (x0,y0) to (x1,y1), then bursts into streaks and crackle. */
  rocket: (x0: number, y0: number, x1: number, y1: number, palettes: PaletteName[], size?: number) => void;
  /** A big soft flash of light. */
  flare: (x: number, y: number, size?: number) => void;
  clear: () => void;
}

type Kind = "coin" | "spark" | "streak" | "confetti" | "rocket" | "flare";

interface P {
  kind: Kind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  rot: number;
  vr: number;
  age: number;
  life: number;
  tilt: number;
  col?: string;
  w?: number;
  h?: number;
  x0?: number;
  y0?: number;
  tx?: number;
  ty?: number;
  pal?: PaletteName[];
  size?: number;
  crackle?: boolean;
}

const MAX = 760;
const CONFETTI = ["#ffd46a", "#fff1b8", "#ffffff", "#33d6c6", "#ff5a78", "#ff9a3c"];
const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];

/**
 * Particle layer for the celebrations: coins, confetti, sparks and firework shells. Draws only while
 * particles exist, caps its population, and does nothing for reduced-motion users.
 */
export const FxCanvas = forwardRef<FxHandle, { reduced: boolean }>(function FxCanvas({ reduced }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);
  const raf = useRef(0);
  const last = useRef(0);
  const queue = useRef<{ end: number; left: number; per: number; kind: "coin" | "confetti" }[]>([]);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const running = useRef(false);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = el.getBoundingClientRect();
      size.current = { w: r.width, h: r.height, dpr };
      el.width = Math.max(1, Math.round(r.width * dpr));
      el.height = Math.max(1, Math.round(r.height * dpr));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf.current);
      running.current = false;
    };
  }, []);

  const add = (p: P) => {
    if (parts.current.length < MAX) parts.current.push(p);
  };

  /** Burst of glowing streaks, some of which crackle into sparks as they die. */
  const burst = (x: number, y: number, pal: PaletteName[], scale: number) => {
    const count = Math.round(54 * scale);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.25;
      const v = (140 + Math.random() * 300) * scale;
      const colors = PALETTES[pick(pal)];
      add({ kind: "streak", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1.8 + Math.random() * 1.6, rot: 0, vr: 0, age: 0, life: 1.1 + Math.random() * 0.8, tilt: Math.random() * 6, col: pick(colors), crackle: Math.random() < 0.35 });
    }
    // inner ring in a second colour
    const inner = Math.round(22 * scale);
    for (let i = 0; i < inner; i++) {
      const a = (i / inner) * Math.PI * 2;
      const v = (70 + Math.random() * 50) * scale;
      add({ kind: "streak", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1.5, rot: 0, vr: 0, age: 0, life: 0.9 + Math.random() * 0.4, tilt: 0, col: "#ffffff" });
    }
    add({ kind: "flare", x, y, vx: 0, vy: 0, r: 90 * scale, rot: 0, vr: 0, age: 0, life: 0.45, tilt: 0 });
  };

  const loop = (now: number) => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) {
      running.current = false;
      return;
    }
    const dt = Math.min(0.05, (now - (last.current || now)) / 1000);
    last.current = now;
    const { w, h, dpr } = size.current;
    const t = now / 1000;

    queue.current = queue.current.filter((q) => {
      if (t >= q.end || q.left <= 0) return false;
      const n = Math.min(q.left, Math.max(1, Math.round(q.per * dt * 60)));
      for (let i = 0; i < n; i++) {
        if (q.kind === "coin") add({ kind: "coin", x: Math.random() * w, y: -20 - Math.random() * 60, vx: (Math.random() - 0.5) * 90, vy: 120 + Math.random() * 240, r: 9 + Math.random() * 10, rot: Math.random() * 6, vr: 4 + Math.random() * 8, age: 0, life: 5, tilt: Math.random() * 6 });
        else add({ kind: "confetti", x: Math.random() * w, y: -10 - Math.random() * 80, vx: (Math.random() - 0.5) * 60, vy: 60 + Math.random() * 90, r: 0, rot: Math.random() * 6, vr: 3 + Math.random() * 7, age: 0, life: 7, tilt: Math.random() * 6, col: pick(CONFETTI), w: 6 + Math.random() * 6, h: 10 + Math.random() * 8 });
      }
      q.left -= n;
      return true;
    });

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const keep: P[] = [];
    const spawn: P[] = [];

    for (const p of parts.current) {
      p.age += dt;
      if (p.age > p.life || p.y > h + 60 || p.x < -80 || p.x > w + 80) {
        if (p.kind === "rocket") burst(p.tx ?? p.x, p.ty ?? p.y, p.pal ?? ["gold"], p.size ?? 1);
        continue;
      }
      const a = Math.max(0, Math.min(1, (p.life - p.age) / 0.6));

      if (p.kind === "rocket") {
        const k = p.age / p.life;
        const e = 1 - Math.pow(1 - k, 2.2);
        p.x = (p.x0 ?? 0) + ((p.tx ?? 0) - (p.x0 ?? 0)) * e;
        p.y = (p.y0 ?? 0) + ((p.ty ?? 0) - (p.y0 ?? 0)) * e;
        spawn.push({ kind: "spark", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 30, vy: 20 + Math.random() * 40, r: 2 + Math.random() * 2, rot: 0, vr: 0, age: 0, life: 0.35, tilt: Math.random() * 6 });
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#fff6d2";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        keep.push(p);
        continue;
      }

      if (p.kind === "flare") {
        const k = p.age / p.life;
        const rr = p.r * (0.5 + k * 1.6);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - k) * 0.9;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        g.addColorStop(0, "rgba(255,250,220,1)");
        g.addColorStop(0.35, "rgba(255,210,100,.6)");
        g.addColorStop(1, "rgba(255,160,40,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
        ctx.fill();
        keep.push(p);
        continue;
      }

      if (p.kind === "streak") {
        const drag = Math.pow(0.18, dt);
        p.vx *= drag;
        p.vy = p.vy * drag + 190 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = a * (0.65 + 0.35 * Math.sin(p.age * 40 + p.tilt));
        ctx.strokeStyle = p.col ?? "#ffd46a";
        ctx.lineWidth = p.r;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(p.x - p.vx * 0.06, p.y - p.vy * 0.06);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
        if (p.crackle && p.age > p.life * 0.75) {
          p.crackle = false;
          for (let i = 0; i < 3; i++) spawn.push({ kind: "spark", x: p.x, y: p.y, vx: (Math.random() - 0.5) * 160, vy: (Math.random() - 0.5) * 160, r: 2, rot: 0, vr: 0, age: 0, life: 0.4, tilt: Math.random() * 6 });
        }
        keep.push(p);
        continue;
      }

      if (p.kind === "confetti") {
        p.vy = Math.min(p.vy + 260 * dt, 170);
        p.x += (p.vx + Math.sin(p.age * 3 + p.tilt) * 55) * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = a;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.max(0.2, Math.abs(Math.cos(p.rot * 1.7))));
        ctx.fillStyle = p.col ?? "#ffd46a";
        ctx.fillRect(-(p.w ?? 8) / 2, -(p.h ?? 12) / 2, p.w ?? 8, p.h ?? 12);
        ctx.restore();
        keep.push(p);
        continue;
      }

      p.vy += (p.kind === "coin" ? 980 : 260) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      ctx.globalAlpha = a;
      if (p.kind === "coin") {
        const sx = Math.abs(Math.cos(p.rot + p.tilt));
        ctx.globalCompositeOperation = "source-over";
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(Math.sin(p.rot * 0.5) * 0.4);
        ctx.scale(Math.max(0.12, sx), 1);
        const g = ctx.createLinearGradient(-p.r, -p.r, p.r, p.r);
        g.addColorStop(0, "#fff6c9");
        g.addColorStop(0.45, "#f3c44f");
        g.addColorStop(1, "#a8731a");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "#7a4d10";
        ctx.stroke();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = "rgba(255,244,190,.8)";
        ctx.beginPath();
        ctx.arc(0, 0, p.r * 0.62, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.globalCompositeOperation = "lighter";
        const s = p.r * (0.6 + 0.4 * Math.sin(p.age * 18 + p.tilt));
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 3);
        g.addColorStop(0, "rgba(255,246,200,.95)");
        g.addColorStop(0.4, "rgba(255,200,80,.5)");
        g.addColorStop(1, "rgba(255,160,40,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, s * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      keep.push(p);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    parts.current = keep;
    spawn.forEach(add);

    if (parts.current.length || queue.current.length) {
      raf.current = requestAnimationFrame(loop);
    } else {
      ctx.clearRect(0, 0, w, h);
      running.current = false;
      last.current = 0;
    }
  };

  const kick = () => {
    if (running.current) return;
    running.current = true;
    last.current = 0;
    raf.current = requestAnimationFrame(loop);
  };

  useImperativeHandle(ref, () => ({
    fountain: (fx, fy, count, power = 1) => {
      if (reduced) return;
      const { w, h } = size.current;
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
        const v = (420 + Math.random() * 520) * power;
        add({ kind: "coin", x: fx * w, y: fy * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 8 + Math.random() * 9, rot: Math.random() * 6, vr: 5 + Math.random() * 9, age: 0, life: 4, tilt: Math.random() * 6 });
      }
      kick();
    },
    shower: (count, seconds) => {
      if (reduced) return;
      const now = performance.now() / 1000;
      queue.current.push({ end: now + seconds, left: count, per: count / (seconds * 60), kind: "coin" });
      kick();
    },
    confetti: (count, seconds) => {
      if (reduced) return;
      const now = performance.now() / 1000;
      queue.current.push({ end: now + seconds, left: count, per: count / (seconds * 60), kind: "confetti" });
      kick();
    },
    sparks: (fx, fy, count, radius = 1) => {
      if (reduced) return;
      const { w, h } = size.current;
      for (let i = 0; i < count; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (80 + Math.random() * 360) * radius;
        add({ kind: "spark", x: fx * w, y: fy * h, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, r: 3 + Math.random() * 5, rot: 0, vr: 0, age: 0, life: 0.9 + Math.random() * 0.9, tilt: Math.random() * 6 });
      }
      kick();
    },
    rocket: (x0, y0, x1, y1, palettes, sz = 1) => {
      if (reduced) return;
      const { w, h } = size.current;
      add({ kind: "rocket", x: x0 * w, y: y0 * h, x0: x0 * w, y0: y0 * h, tx: x1 * w, ty: y1 * h, vx: 0, vy: 0, r: 3, rot: 0, vr: 0, age: 0, life: 0.55 + Math.random() * 0.25, tilt: 0, pal: palettes, size: sz });
      kick();
    },
    flare: (fx, fy, sz = 1) => {
      if (reduced) return;
      const { w, h } = size.current;
      add({ kind: "flare", x: fx * w, y: fy * h, vx: 0, vy: 0, r: 220 * sz, rot: 0, vr: 0, age: 0, life: 0.6, tilt: 0 });
      kick();
    },
    clear: () => {
      parts.current = [];
      queue.current = [];
    },
  }));

  return <canvas ref={canvas} className="pointer-events-none absolute inset-0 z-[35] h-full w-full" aria-hidden />;
});
