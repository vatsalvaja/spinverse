"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface FxHandle {
  /** an expanding ring (shockwave) at a point given as fractions of the arena */
  ring: (x: number, y: number, color: string, size?: number) => void;
  /** low dust burst along the floor (ground impact) */
  dust: (x: number, y: number, color: string) => void;
  /** a roaring jet of fire or magical flame from a mouth toward the opponent, for `ms` */
  breath: (x: number, y: number, dir: 1 | -1, color: "gold" | "blue", ms: number) => void;
  /** a jagged lightning bolt from one point to another */
  bolt: (x0: number, y0: number, x1: number, y1: number, color: string) => void;
  /** the tie collision: gold and blue sparks racing in and exploding at a point */
  clash: (x: number, y: number) => void;
  clear: () => void;
}

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  g: number;
  /** soft radial blob (flame) instead of a hard spark */
  blob?: boolean;
  hot?: boolean;
}
interface Ring {
  x: number;
  y: number;
  life: number;
  max: number;
  color: string;
  size: number;
}
interface Bolt {
  pts: { x: number; y: number }[];
  life: number;
  max: number;
  color: string;
}
interface Jet {
  x: number;
  y: number;
  dir: 1 | -1;
  gold: boolean;
  left: number;
  acc: number;
}

const GOLD = ["#fff3c4", "#ffd479", "#f5a524", "#ff8a2a", "#ffffff"];
const BLUE = ["#e6fdff", "#9be4ff", "#3db8ff", "#3b82f6", "#ffffff"];
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * The effects canvas over the arena. Everything is positioned in fractions of the arena. It always runs a very
 * light ambient layer (embers rising on the Tiger's side, cold sparks on the Dragon's) unless the player prefers
 * reduced motion, and spins up for the bigger effects: fire breath, lightning, shockwaves and the tie collision.
 */
export const Fx = forwardRef<FxHandle, { reduced: boolean }>(function Fx({ reduced }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ ps: [] as P[], rings: [] as Ring[], bolts: [] as Bolt[], jets: [] as Jet[], raf: 0, last: 0, w: 0, h: 0, dpr: 1, amb: 0 });
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const run = useRef<() => void>(() => {});

  useImperativeHandle(ref, () => {
    const s = st.current;
    const kick = () => run.current();
    const q = () => (reducedRef.current ? 0.45 : 1);
    return {
      ring(x, y, color, size = 0.2) {
        s.rings.push({ x, y, life: 0, max: 0.9, color, size });
        kick();
      },
      dust(x, y, color) {
        for (let i = 0; i < Math.round(30 * q()); i++) {
          const dir = Math.random() < 0.5 ? -1 : 1;
          s.ps.push({ x: x + (Math.random() - 0.5) * 0.05, y, vx: dir * (0.06 + Math.random() * 0.3), vy: -(0.02 + Math.random() * 0.1), life: 0, max: 0.8 + Math.random() * 0.8, size: 14 + Math.random() * 22, color, g: 0.2, blob: true });
        }
        kick();
      },
      breath(x, y, dir, color, ms) {
        s.jets.push({ x, y, dir, gold: color === "gold", left: ms / 1000, acc: 0 });
        kick();
      },
      bolt(x0, y0, x1, y1, color) {
        const pts = [{ x: x0, y: y0 }];
        const n = 9;
        for (let i = 1; i < n; i++) {
          const t = i / n;
          pts.push({ x: x0 + (x1 - x0) * t + (Math.random() - 0.5) * 0.05, y: y0 + (y1 - y0) * t + (Math.random() - 0.5) * 0.09 });
        }
        pts.push({ x: x1, y: y1 });
        s.bolts.push({ pts, life: 0, max: 0.24, color });
        kick();
      },
      clash(x, y) {
        for (let i = 0; i < Math.round(110 * q()); i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 0.2 + Math.random() * 0.75;
          s.ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.7 + Math.random() * 0.9, size: 1.5 + Math.random() * 3.5, color: Math.random() < 0.5 ? GOLD[Math.floor(Math.random() * GOLD.length)] : BLUE[Math.floor(Math.random() * BLUE.length)], g: 0.2 });
        }
        for (let i = 0; i < Math.round(26 * q()); i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 0.05 + Math.random() * 0.3;
          s.ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.6 + Math.random() * 0.6, size: 30 + Math.random() * 50, color: Math.random() < 0.5 ? "#ffb347" : "#5cc8ff", g: 0, blob: true });
        }
        s.rings.push({ x, y, life: 0, max: 0.9, color: "#ffd479", size: 0.26 }, { x, y, life: 0, max: 1.1, color: "#9be4ff", size: 0.34 });
        kick();
      },
      clear() {
        s.ps = s.ps.filter((p) => p.max > 4);
        s.rings = [];
        s.bolts = [];
        s.jets = [];
      },
    };
  }, []);

  useEffect(() => {
    const c = cv.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const s = st.current;
    const parent = c.parentElement as HTMLElement;
    let ambient = !reducedRef.current;

    const resize = () => {
      const r = parent.getBoundingClientRect();
      s.dpr = Math.min(2, window.devicePixelRatio || 1);
      s.w = Math.max(1, r.width);
      s.h = Math.max(1, r.height);
      c.width = Math.round(s.w * s.dpr);
      c.height = Math.round(s.h * s.dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);

    const blob = (x: number, y: number, r: number, color: string, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(color, a));
      g.addColorStop(1, rgba(color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - s.last) / 1000);
      s.last = now;
      const { w, h } = s;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ambient = !reducedRef.current;

      // ambient embers and cold sparks (long-lived, so they are told apart from the effects by `max`)
      if (ambient) {
        s.amb += dt * 22;
        while (s.amb >= 1) {
          s.amb -= 1;
          const gold = Math.random() < 0.55;
          s.ps.push({
            x: gold ? Math.random() * 0.34 : 0.66 + Math.random() * 0.34,
            y: 0.45 + Math.random() * 0.5,
            vx: (Math.random() - 0.5) * 0.03 + (gold ? 0.004 : -0.004),
            vy: -(0.03 + Math.random() * 0.07),
            life: 0,
            max: 4 + Math.random() * 3,
            size: 1.2 + Math.random() * 2.2,
            color: gold ? GOLD[Math.floor(Math.random() * 4)] : BLUE[Math.floor(Math.random() * 4)],
            g: 0,
          });
        }
      }

      // jets of flame
      for (let i = s.jets.length - 1; i >= 0; i--) {
        const j = s.jets[i];
        j.left -= dt;
        j.acc += dt * (reducedRef.current ? 70 : 150);
        while (j.acc >= 1) {
          j.acc -= 1;
          const cols = j.gold ? GOLD : BLUE;
          const spread = (Math.random() - 0.5) * 0.12;
          s.ps.push({
            x: j.x,
            y: j.y + (Math.random() - 0.5) * 0.012,
            vx: j.dir * (0.4 + Math.random() * 0.55),
            vy: -0.04 + spread,
            life: 0,
            max: 0.5 + Math.random() * 0.5,
            size: 26 + Math.random() * 38,
            color: j.gold ? (Math.random() < 0.35 ? "#ffd479" : "#ff8a1e") : Math.random() < 0.35 ? "#bdeeff" : "#2f9bff",
            g: -0.02,
            blob: true,
            hot: Math.random() < 0.3,
          });
          // sparks riding the jet
          s.ps.push({ x: j.x, y: j.y, vx: j.dir * (0.3 + Math.random() * 0.8), vy: -0.06 + (Math.random() - 0.5) * 0.3, life: 0, max: 0.5 + Math.random() * 0.8, size: 1.5 + Math.random() * 3, color: cols[Math.floor(Math.random() * cols.length)], g: 0.06 });
        }
        if (j.left <= 0) s.jets.splice(i, 1);
      }

      ctx.globalCompositeOperation = "lighter";
      for (let i = s.ps.length - 1; i >= 0; i--) {
        const p = s.ps[i];
        p.life += dt;
        if (p.life >= p.max) {
          s.ps.splice(i, 1);
          continue;
        }
        p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        const k = 1 - p.life / p.max;
        if (p.blob) {
          const r = p.size * (0.6 + (1 - k) * 0.9);
          blob(p.x * w, p.y * h, r, p.hot ? "#ffffff" : p.color, 0.55 * k);
          continue;
        }
        const twinkle = p.max > 3 ? Math.min(1, k * 3) * (0.55 + 0.45 * Math.sin(p.life * 7 + p.x * 40)) : k;
        ctx.globalAlpha = Math.max(0, twinkle);
        ctx.fillStyle = p.color;
        const sz = p.size * (0.5 + k * 0.7);
        ctx.fillRect(p.x * w - sz / 2, p.y * h - sz / 2, sz, sz);
        ctx.globalAlpha = 1;
      }
      for (let i = s.rings.length - 1; i >= 0; i--) {
        const r = s.rings[i];
        r.life += dt;
        if (r.life >= r.max) {
          s.rings.splice(i, 1);
          continue;
        }
        const k = r.life / r.max;
        ctx.globalAlpha = (1 - k) * 0.85;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = 4 * (1 - k) + 1;
        ctx.beginPath();
        ctx.ellipse(r.x * w, r.y * h, r.size * w * (0.15 + k), r.size * w * (0.15 + k) * 0.32, 0, 0, 6.283);
        ctx.stroke();
      }
      for (let i = s.bolts.length - 1; i >= 0; i--) {
        const b = s.bolts[i];
        b.life += dt;
        if (b.life >= b.max) {
          s.bolts.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = 1 - b.life / b.max;
        ctx.lineJoin = "round";
        for (const [lw, col] of [[8, b.color], [2.4, "#ffffff"]] as [number, string][]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = lw;
          ctx.beginPath();
          b.pts.forEach((p, j) => (j ? ctx.lineTo(p.x * w, p.y * h) : ctx.moveTo(p.x * w, p.y * h)));
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";

      // sleep when there is nothing to draw (reduced motion with no active effect)
      const busy = s.ps.length || s.rings.length || s.bolts.length || s.jets.length || ambient;
      if (busy) s.raf = requestAnimationFrame(frame);
      else {
        s.raf = 0;
        ctx.clearRect(0, 0, w, h);
      }
    };

    run.current = () => {
      if (s.raf) return;
      s.last = performance.now();
      s.raf = requestAnimationFrame(frame);
    };
    run.current();

    return () => {
      cancelAnimationFrame(s.raf);
      s.raf = 0;
      ro.disconnect();
      run.current = () => {};
    };
  }, []);

  return <canvas ref={cv} className="tc-fx" aria-hidden />;
});
