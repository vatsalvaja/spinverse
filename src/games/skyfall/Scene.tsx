"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Aircraft } from "./Aircraft";
import { COUNTDOWN_MS, CRASH_MS, RESULTS_MS, TAKEOFF_MS, type Snapshot, type SkyfallEngine } from "./engine";

export interface SceneHandle {
  cashBurst: () => void;
  crashBurst: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: "spark" | "smoke" | "ring" | "debris";
  rot?: number;
  vr?: number;
  g?: number;
}

/* ------------------------------ small helpers ------------------------------ */
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const mk = (w: number, h: number) => {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

interface LayerSpec {
  par: number;
  minH: number;
  maxH: number;
  minW: number;
  maxW: number;
  body: string;
  lit: number;
  cell: number;
  alpha: number;
  rim: number;
}
const LAYERS: LayerSpec[] = [
  { par: 0.1, minH: 0.16, maxH: 0.36, minW: 0.03, maxW: 0.07, body: "#0c1a3a", lit: 0.1, cell: 4, alpha: 0.4, rim: 0.12 },
  { par: 0.26, minH: 0.24, maxH: 0.5, minW: 0.04, maxW: 0.09, body: "#09132e", lit: 0.2, cell: 6, alpha: 0.65, rim: 0.2 },
  { par: 0.55, minH: 0.34, maxH: 0.72, minW: 0.06, maxW: 0.12, body: "#050a1b", lit: 0.28, cell: 8, alpha: 0.9, rim: 0.32 },
];
const WINDOWS = ["#ffd98a", "#ffd98a", "#7cf0ff", "#dfe9ff", "#ffb35c"];

/** One tileable strip of skyline. Buildings never cross the tile edge, so repeating it is seamless. */
function makeCity(w: number, h: number, spec: LayerSpec, seed: number, scale: number) {
  const r = rng(seed);
  const tileW = Math.max(900, Math.round(w * 1.7));
  const c = mk(tileW, h);
  const g = c.getContext("2d");
  if (!g) return { c, tileW };
  let x = 0;
  while (x < tileW) {
    let bw = (spec.minW + r() * (spec.maxW - spec.minW)) * w;
    if (tileW - x - bw < spec.minW * w * 0.8) bw = tileW - x;
    const bh = (spec.minH + r() * (spec.maxH - spec.minH)) * h;
    const top = h - bh;
    const grad = g.createLinearGradient(0, top, 0, h);
    grad.addColorStop(0, spec.body);
    grad.addColorStop(1, "#02050f");
    g.fillStyle = grad;
    g.fillRect(x, top, bw, bh + 2);
    // stepped crown on some towers
    if (r() < 0.35) {
      const sw = bw * (0.5 + r() * 0.2);
      const sh = bh * (0.06 + r() * 0.1);
      g.fillStyle = spec.body;
      g.fillRect(x + (bw - sw) / 2, top - sh, sw, sh + 1);
      if (r() < 0.6) {
        g.fillStyle = `rgba(255,90,120,${spec.alpha * 0.9})`;
        g.fillRect(x + bw / 2 - 1, top - sh - 6 * scale, 2 * scale, 6 * scale);
      }
    }
    // rim light along the roof
    g.fillStyle = `rgba(120,210,255,${spec.rim})`;
    g.fillRect(x, top, bw, Math.max(1, scale));
    g.fillStyle = `rgba(120,210,255,${spec.rim * 0.4})`;
    g.fillRect(x, top, Math.max(1, scale), bh);
    // windows
    const cs = spec.cell * scale;
    const cols = Math.max(1, Math.floor((bw - cs) / (cs * 1.6)));
    const rows = Math.floor((bh - cs * 2) / (cs * 1.9));
    const accent = WINDOWS[Math.floor(r() * WINDOWS.length)];
    for (let rr = 0; rr < rows; rr++) {
      for (let cc = 0; cc < cols; cc++) {
        if (r() > spec.lit * (rr % 5 === 0 ? 0.4 : 1.2)) continue;
        g.globalAlpha = spec.alpha * (0.45 + r() * 0.55);
        g.fillStyle = r() < 0.7 ? accent : WINDOWS[Math.floor(r() * WINDOWS.length)];
        g.fillRect(x + cs * 0.8 + cc * cs * 1.6, top + cs * 1.4 + rr * cs * 1.9, cs, cs * 1.05);
      }
    }
    g.globalAlpha = 1;
    // a vertical neon strip on some towers
    if (spec.alpha > 0.6 && r() < 0.25) {
      g.fillStyle = r() < 0.5 ? "rgba(34,211,238,.85)" : "rgba(230,193,112,.85)";
      g.fillRect(x + bw - cs * 1.2, top + bh * 0.1, Math.max(1.5, scale * 1.6), bh * (0.3 + r() * 0.4));
    }
    x += bw + (r() < 0.25 ? spec.minW * w * 0.25 : 0);
    if (x >= tileW) break;
  }
  return { c, tileW };
}

function makeCloud(size: number, seed: number) {
  const r = rng(seed);
  const c = mk(size * 2, size);
  const g = c.getContext("2d");
  if (!g) return c;
  for (let i = 0; i < 9; i++) {
    const cx = size * (0.4 + r() * 1.2);
    const cy = size * (0.4 + r() * 0.25);
    const rad = size * (0.2 + r() * 0.28);
    const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, "rgba(150,200,255,.34)");
    grad.addColorStop(1, "rgba(150,200,255,0)");
    g.fillStyle = grad;
    g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  return c;
}

interface Built {
  w: number;
  h: number;
  dpr: number;
  sky: HTMLCanvasElement;
  cities: { c: HTMLCanvasElement; tileW: number }[];
  clouds: HTMLCanvasElement[];
  stars: { x: number; y: number; r: number; p: number }[];
}

function build(w: number, h: number, dpr: number): Built {
  const scale = clamp(h / 520, 0.6, 1.6);
  const sky = mk(w * dpr, h * dpr);
  const g = sky.getContext("2d");
  if (g) {
    g.scale(dpr, dpr);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#030614");
    grad.addColorStop(0.45, "#08173a");
    grad.addColorStop(0.8, "#0f3560");
    grad.addColorStop(1, "#164a78");
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    const glow = g.createRadialGradient(w * 0.5, h * 1.02, 0, w * 0.5, h * 1.02, w * 0.75);
    glow.addColorStop(0, "rgba(34,211,238,.32)");
    glow.addColorStop(0.5, "rgba(34,211,238,.09)");
    glow.addColorStop(1, "rgba(34,211,238,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    const gold = g.createRadialGradient(w * 0.12, h * 0.95, 0, w * 0.12, h * 0.95, w * 0.4);
    gold.addColorStop(0, "rgba(230,193,112,.14)");
    gold.addColorStop(1, "rgba(230,193,112,0)");
    g.fillStyle = gold;
    g.fillRect(0, 0, w, h);
  }
  const r = rng(77);
  const stars = Array.from({ length: Math.round(w / 7) }, () => ({ x: r() * w, y: r() * h * 0.62, r: 0.4 + r() * 1.1, p: r() * 6.28 }));
  return {
    w,
    h,
    dpr,
    sky,
    cities: LAYERS.map((l, i) => makeCity(w, h * 1.0, l, 11 + i * 31, scale)),
    clouds: [makeCloud(180 * scale, 3), makeCloud(240 * scale, 8), makeCloud(150 * scale, 21)],
    stars,
  };
}

/* ------------------------------ the scene ------------------------------ */
interface Props {
  engine: SkyfallEngine;
  snap: Snapshot;
  calm: boolean;
  summary: string | null;
}

export const Scene = forwardRef<SceneHandle, Props>(function Scene({ engine, snap, calm, summary }, ref) {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const multEl = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const fx = useRef<Particle[]>([]);
  const burstQ = useRef<("cash" | "crash")[]>([]);
  const calmRef = useRef(calm);
  calmRef.current = calm;

  useImperativeHandle(ref, () => ({
    cashBurst: () => burstQ.current.push("cash"),
    crashBurst: () => burstQ.current.push("crash"),
  }));

  useEffect(() => {
    const cv = canvas.current;
    const st = stage.current;
    const pl = plane.current;
    const me = multEl.current;
    const fl = flash.current;
    if (!cv || !st || !pl || !me || !fl) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let built: Built | null = null;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = performance.now();
    let scroll = 0;
    let camY = 0;
    let angle = 0;
    let prevPhase = engine.currentPhase;
    let trail: { x: number; y: number }[] = [];
    let flashA = 0;
    let shown = "";
    let tier = "";
    let planeHidden = false;
    let lastX = 0;
    let lastY = 0;
    let padOrigin = 0;
    let padReset = false;

    const resize = () => {
      const r = st.getBoundingClientRect();
      W = Math.max(200, Math.round(r.width));
      H = Math.max(160, Math.round(r.height));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      built = build(W, H, dpr);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(st);

    /** the pad the aircraft waits on, and the point where takeoff ends */
    const pad = () => ({ x: W * 0.14, y: H * 0.8 });

    const spawn = (n: number, x: number, y: number, kind: "cash" | "crash") => {
      const q = calmRef.current ? 0.5 : 1;
      if (kind === "cash") {
        for (let i = 0; i < Math.round(n * q); i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.8;
          const s = 120 + Math.random() * 260;
          fx.current.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 0.8 + Math.random() * 0.6, size: 1.5 + Math.random() * 2.5, color: Math.random() < 0.5 ? "#e6c170" : "#7cf0ff", kind: "spark", g: 260 });
        }
        return;
      }
      const cols = ["#ffffff", "#7cf0ff", "#22d3ee", "#e6c170", "#ff8a5c", "#ff4d6d"];
      for (let i = 0; i < Math.round(110 * q); i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 60 + Math.random() * 520;
        fx.current.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0, max: 0.6 + Math.random() * 1.1, size: 1.2 + Math.random() * 3.2, color: cols[Math.floor(Math.random() * cols.length)], kind: "spark", g: 180 });
      }
      for (let i = 0; i < Math.round(20 * q); i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 20 + Math.random() * 110;
        fx.current.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, life: 0, max: 1.2 + Math.random() * 1.2, size: 14 + Math.random() * 26, color: "rgba(40,55,95,", kind: "smoke" });
      }
      for (let i = 0; i < Math.round(12 * q); i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 80 + Math.random() * 300;
        fx.current.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 90, life: 0, max: 1.4 + Math.random(), size: 4 + Math.random() * 7, color: Math.random() < 0.3 ? "#e6c170" : "#1d2c52", kind: "debris", rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 14, g: 520 });
      }
      fx.current.push({ x, y, vx: 0, vy: 0, life: 0, max: 0.75, size: 20, color: "#7cf0ff", kind: "ring" });
      fx.current.push({ x, y, vx: 0, vy: 0, life: 0, max: 1.1, size: 12, color: "#ffffff", kind: "ring" });
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      engine.tick(now);
      const b = built;
      if (!b) return;
      const phase = engine.currentPhase;
      const ms = engine.phaseMs;
      const sec = engine.flightSec;
      const p0 = pad();

      /* ---------- where the aircraft is ---------- */
      const takeoffEndX = W * 0.27;
      const takeoffEndY = H * 0.7;
      const endX = W * 0.7;
      const endY = H * 0.24;
      const pathAt = (s: number) => {
        const p = 1 - Math.exp(-s / 9);
        const bob = Math.min(1, s / 14);
        return {
          x: lerp(takeoffEndX, endX, p) + Math.sin(s * 0.9) * W * 0.006 * bob,
          y: lerp(takeoffEndY, endY, Math.pow(p, 0.88)) + Math.sin(s * 1.6) * H * 0.012 * bob,
          p,
        };
      };
      let px = p0.x;
      let py = p0.y;
      let targetAngle = 0;
      let thrust = 0.18;
      let lift = 0;
      let speedMul = 0.6;
      let visible = true;

      if (phase === "waiting") {
        const left = COUNTDOWN_MS - ms;
        px = p0.x;
        py = p0.y + Math.sin(now / 900) * 1.2;
        thrust = left < 1400 ? lerp(0.5, 0.2, clamp((left - 0) / 1400, 0, 1)) : 0.2;
        // the very first aircraft glides in; later rounds it is already on the pad (it arrived at the end of the last results)
        const arrive = engine.roundNumber === 1 ? clamp(ms / 900, 0, 1) : 1;
        px = lerp(-W * 0.2, p0.x, 1 - Math.pow(1 - arrive, 3));
        targetAngle = lerp(-4, 0, arrive);
        speedMul = lerp(1.4, 0.4, arrive);
        if (trail.length) trail = [];
      } else if (phase === "takeoff") {
        const u = clamp(ms / TAKEOFF_MS, 0, 1);
        const run = u * u;
        px = lerp(p0.x, takeoffEndX, run);
        py = lerp(p0.y, takeoffEndY, Math.pow(Math.max(0, u - 0.35) / 0.65, 2));
        targetAngle = -14 * Math.pow(Math.max(0, u - 0.3) / 0.7, 1.2);
        thrust = lerp(0.5, 1, u);
        speedMul = lerp(0.8, 3.2, run);
        lift = 0;
      } else if (phase === "flying") {
        const pos = pathAt(sec);
        const nxt = pathAt(sec + 0.12);
        px = pos.x;
        py = pos.y;
        targetAngle = clamp((Math.atan2(nxt.y - pos.y, nxt.x - pos.x) * 180) / Math.PI, -42, 6);
        thrust = 1;
        lift = clamp((takeoffEndY - pos.y) / (takeoffEndY - endY), 0, 1);
        speedMul = 3.4 + Math.min(6, Math.log2(Math.max(1, engine.liveRaw)) * 1.6);
      } else if (phase === "crashed") {
        px = lastX;
        py = lastY;
        visible = false;
        lift = camY / (H * 0.42);
        speedMul = lerp(1.2, 0.2, clamp(ms / 900, 0, 1));
      } else {
        // results: let the world settle while the next aircraft is prepared
        visible = false;
        lift = ms < RESULTS_MS - 1300 ? camY / (H * 0.42) : 0;
        speedMul = 0.5;
        const k = clamp((ms - (RESULTS_MS - 900)) / 900, 0, 1);
        if (k > 0) {
          // the next aircraft slides in from the left
          visible = true;
          px = lerp(-W * 0.2, p0.x, 1 - Math.pow(1 - k, 3));
          py = p0.y;
          targetAngle = lerp(-4, 0, k);
          thrust = 0.4;
          lift = 0;
        }
      }

      /* ---------- phase edges ---------- */
      if (phase !== prevPhase) {
        if (phase === "crashed") {
          spawn(0, lastX, lastY, "crash");
          flashA = 1;
        }
        if (phase === "waiting") trail = [];
        if (phase !== "results") padReset = false;
        prevPhase = phase;
      }
      while (burstQ.current.length) {
        const k = burstQ.current.shift();
        if (k === "cash") spawn(26, W * 0.34, H * 0.3, "cash");
        else if (k === "crash") {
          spawn(0, lastX || px, lastY || py, "crash");
          flashA = 1;
        }
      }

      /* ---------- camera and scroll ---------- */
      const camTarget = lift * H * 0.42;
      camY = lerp(camY, camTarget, 1 - Math.exp(-dt * (phase === "results" ? 3.2 : phase === "waiting" ? 2.2 : 3)));
      // the pad is re-placed just as the next aircraft starts to arrive, and slides in with it
      if (phase === "results" && ms >= RESULTS_MS - 900 && !padReset) {
        padOrigin = scroll;
        padReset = true;
      }
      scroll += dt * 26 * speedMul * clamp(H / 520, 0.7, 1.5);
      angle = lerp(angle, targetAngle, 1 - Math.exp(-dt * 6));

      if (phase === "flying" || phase === "takeoff") {
        const t = trail[trail.length - 1];
        if (!t || Math.hypot(t.x - px, t.y - py) > 3) trail.push({ x: px, y: py });
        if (trail.length > 700) trail.splice(0, trail.length - 700);
        lastX = px;
        lastY = py;
      }

      /* ---------- draw ---------- */
      ctx.setTransform(b.dpr, 0, 0, b.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(b.sky, 0, 0, W, H);

      // stars
      ctx.fillStyle = "#cfe6ff";
      for (const s of b.stars) {
        ctx.globalAlpha = 0.35 + 0.35 * Math.sin(now / 900 + s.p);
        ctx.fillRect(s.x, s.y + camY * 0.05, s.r, s.r);
      }
      ctx.globalAlpha = 1;

      // searchlights from the far skyline
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 2; i++) {
        const bx = W * (0.3 + i * 0.4);
        const ang = -Math.PI / 2 + Math.sin(now / 2600 + i * 2.1) * 0.5;
        const grad = ctx.createLinearGradient(bx, H, bx + Math.cos(ang) * H, H + Math.sin(ang) * H);
        grad.addColorStop(0, "rgba(120,220,255,.16)");
        grad.addColorStop(1, "rgba(120,220,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(bx, H * 0.78 + camY * 0.2);
        ctx.lineTo(bx + Math.cos(ang - 0.05) * H * 1.1, H * 0.78 + camY * 0.2 + Math.sin(ang - 0.05) * H * 1.1);
        ctx.lineTo(bx + Math.cos(ang + 0.05) * H * 1.1, H * 0.78 + camY * 0.2 + Math.sin(ang + 0.05) * H * 1.1);
        ctx.fill();
      }
      ctx.restore();

      // clouds (behind the near skyline)
      const clouds = b.clouds;
      for (let i = 0; i < 7; i++) {
        const cl = clouds[i % clouds.length];
        const par = 0.08 + (i % 4) * 0.07;
        const cw = cl.width * (0.7 + (i % 3) * 0.25);
        const span = W + cw * 1.5;
        const x = ((((i * 0.37 * span - scroll * par - now * 0.004 * (1 + (i % 3))) % span) + span) % span) - cw;
        const y = H * (0.1 + ((i * 0.131) % 0.5)) + camY * par * 1.4;
        ctx.globalAlpha = 0.5 + (i % 3) * 0.15;
        ctx.drawImage(cl, x, y, cw, cl.height * (cw / cl.width));
      }
      ctx.globalAlpha = 1;

      // skyline layers: far to near, sinking as the camera follows the climb
      for (let i = 0; i < b.cities.length; i++) {
        const { c, tileW } = b.cities[i];
        const par = LAYERS[i].par;
        const off = ((scroll * par * 12) % tileW + tileW) % tileW;
        const y = camY * (0.5 + par * 1.6) + (i === 0 ? 0 : 0);
        ctx.drawImage(c, -off, y, tileW, H);
        ctx.drawImage(c, tileW - off, y, tileW, H);
      }

      // the landing pad rides on the nearest layer and slides away on takeoff
      {
        const padScroll = (scroll - padOrigin) * LAYERS[2].par * 12;
        const slide = phase === "results" && padReset ? Math.pow(1 - clamp((ms - (RESULTS_MS - 900)) / 900, 0, 1), 3) * W * 0.6 : 0;
        const gx = p0.x - W * 0.12 - padScroll - slide;
        const gy = p0.y + H * 0.045 + camY * (0.5 + LAYERS[2].par * 1.6);
        if (gx > -W * 0.6 && gx < W) {
          const pw = W * 0.3;
          const g = ctx.createLinearGradient(0, gy, 0, gy + H * 0.2);
          g.addColorStop(0, "#14223f");
          g.addColorStop(1, "#050a18");
          ctx.fillStyle = g;
          ctx.fillRect(gx, gy, pw, H * 0.25);
          ctx.fillStyle = "rgba(120,220,255,.55)";
          ctx.fillRect(gx, gy, pw, 2);
          const blink = (Math.floor(now / 400) % 2) as 0 | 1;
          for (let k = 0; k < 8; k++) {
            ctx.fillStyle = (k + blink) % 2 ? "rgba(34,211,238,.95)" : "rgba(230,193,112,.9)";
            ctx.fillRect(gx + (pw / 7.4) * k + 4, gy - 3, 3, 3);
          }
          const pg = ctx.createRadialGradient(gx + pw * 0.45, gy, 0, gx + pw * 0.45, gy, pw * 0.5);
          pg.addColorStop(0, "rgba(34,211,238,.28)");
          pg.addColorStop(1, "rgba(34,211,238,0)");
          ctx.fillStyle = pg;
          ctx.fillRect(gx - pw * 0.1, gy - H * 0.16, pw * 1.3, H * 0.2);
        }
      }

      // speed streaks at high multipliers
      if (phase === "flying" && engine.liveRaw > 3 && !calmRef.current) {
        const k = clamp((engine.liveRaw - 3) / 12, 0, 1);
        ctx.strokeStyle = `rgba(160,235,255,${0.06 + k * 0.16})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
          const sy = ((i * 97.3 + 31) % H) * 0.85;
          const sx = (((i * 211.7 - scroll * 40 * (1 + (i % 3))) % (W + 200)) + W + 200) % (W + 200) - 100;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 40 + k * 80, sy);
          ctx.stroke();
        }
      }

      // the flight trail: a glowing line with a soft area underneath
      if (trail.length > 2) {
        const first = trail[0];
        const lastP = trail[trail.length - 1];
        const area = ctx.createLinearGradient(0, endY, 0, H);
        area.addColorStop(0, "rgba(34,211,238,.28)");
        area.addColorStop(1, "rgba(34,211,238,0)");
        ctx.beginPath();
        ctx.moveTo(first.x, H);
        for (const t of trail) ctx.lineTo(t.x, t.y);
        ctx.lineTo(lastP.x, H);
        ctx.closePath();
        ctx.fillStyle = area;
        ctx.fill();
        const line = ctx.createLinearGradient(first.x, first.y, lastP.x, lastP.y);
        line.addColorStop(0, "rgba(34,211,238,0)");
        line.addColorStop(0.4, "rgba(34,211,238,.55)");
        line.addColorStop(1, "rgba(200,250,255,1)");
        ctx.save();
        ctx.shadowColor = "rgba(34,211,238,.9)";
        ctx.shadowBlur = 14;
        ctx.strokeStyle = line;
        ctx.lineWidth = 3;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(first.x, first.y);
        for (const t of trail) ctx.lineTo(t.x, t.y);
        ctx.stroke();
        ctx.restore();
      }

      // near haze at the bottom edge
      const haze = ctx.createLinearGradient(0, H * 0.78, 0, H);
      haze.addColorStop(0, "rgba(10,30,60,0)");
      haze.addColorStop(1, "rgba(8,24,52,.55)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, H * 0.78, W, H * 0.22);

      /* ---------- particles ---------- */
      const list = fx.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.life += dt;
        if (p.life >= p.max) {
          list.splice(i, 1);
          continue;
        }
        const k = p.life / p.max;
        if (p.kind === "ring") {
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = (1 - k) * 0.8;
          ctx.lineWidth = 3 * (1 - k) + 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size + k * W * 0.18, 0, 6.283);
          ctx.stroke();
          ctx.globalAlpha = 1;
          continue;
        }
        p.vy += (p.g ?? 0) * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === "spark") {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 1 - k;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x, p.y, p.size, p.size);
          ctx.globalCompositeOperation = "source-over";
        } else if (p.kind === "smoke") {
          p.vx *= 0.985;
          p.vy *= 0.985;
          ctx.globalAlpha = (1 - k) * 0.5;
          ctx.fillStyle = `${p.color}1)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.6 + k), 0, 6.283);
          ctx.fill();
        } else {
          p.rot = (p.rot ?? 0) + (p.vr ?? 0) * dt;
          ctx.globalAlpha = 1 - k * k;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot ?? 0);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size, -p.size * 0.4, p.size * 2, p.size * 0.8);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      /* ---------- aircraft element ---------- */
      const pw = clamp(W * 0.19, 104, 230);
      pl.style.width = `${pw}px`;
      pl.style.transform = `translate3d(${(px - pw * 0.42).toFixed(1)}px, ${(py - pw * 0.18).toFixed(1)}px, 0) rotate(${angle.toFixed(2)}deg)`;
      pl.style.setProperty("--thrust", thrust.toFixed(2));
      if (visible === planeHidden) {
        pl.style.opacity = visible ? "1" : "0";
        planeHidden = !visible;
      }

      /* ---------- flash ---------- */
      if (flashA > 0.01) {
        flashA *= Math.pow(0.02, dt);
        fl.style.opacity = flashA.toFixed(3);
      } else if (fl.style.opacity !== "0") fl.style.opacity = "0";

      /* ---------- multiplier text ---------- */
      let text = "";
      if (phase === "flying" || phase === "takeoff") text = (Math.floor(engine.liveRaw * 100 + 1e-9) / 100).toFixed(2) + "x";
      else if (phase === "crashed" || phase === "results") text = engine.crashPoint.toFixed(2) + "x";
      if (text !== shown) {
        me.textContent = text;
        shown = text;
      }
      const m = engine.liveRaw;
      const t = phase === "crashed" || phase === "results" ? "crash" : m >= 10 ? "high" : m >= 2 ? "mid" : "low";
      if (t !== tier) {
        me.dataset.tier = t;
        tier = t;
      }
      me.style.opacity = phase === "waiting" ? "0" : "1";
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine]);

  const phase = snap.phase;
  const crashed = phase === "crashed" || phase === "results";

  return (
    <div ref={stage} className={`sf-stage ${phase === "crashed" && !calm ? "sf-shake" : ""}`} data-phase={phase}>
      <canvas ref={canvas} className="sf-canvas" aria-hidden />
      <div ref={plane} className="sf-plane" aria-hidden>
        <Aircraft className="h-auto w-full" />
      </div>

      {/* multiplier: kept to the left of the flight path so the aircraft always stays clear */}
      <div className="sf-mult-wrap" aria-live="off">
        {crashed && <p className="sf-crash-label">Crashed</p>}
        <div ref={multEl} className="sf-mult" data-tier="low" />
      </div>

      {phase === "waiting" && (
        <div className="sf-countdown" role="timer" aria-label={`Next round in ${snap.countdown} seconds`}>
          <svg viewBox="0 0 120 120" className="sf-ring" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="url(#sf-cd)" strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * snap.countdownProgress} transform="rotate(-90 60 60)" />
            <defs>
              <linearGradient id="sf-cd" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#22d3ee" />
                <stop offset="1" stopColor="#e6c170" />
              </linearGradient>
            </defs>
          </svg>
          <div className="sf-cd-text">
            <span className="sf-cd-num">{Math.max(1, snap.countdown)}</span>
            <span className="sf-cd-lab">Next round</span>
          </div>
        </div>
      )}

      {phase === "results" && summary && <p className="sf-summary">{summary}</p>}
      {phase === "takeoff" && <p className="sf-banner">Takeoff</p>}

      <div ref={flash} className="sf-flash" aria-hidden />
      <div className="sf-sweep" key={snap.round} aria-hidden />
      <span className="sf-demo-tag">Demo round {snap.round}</span>
    </div>
  );
});

export const PHASE_TIMES = { COUNTDOWN_MS, TAKEOFF_MS, CRASH_MS, RESULTS_MS };
