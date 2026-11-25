"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";
import { POCKETS, colorOf } from "./engine";

/**
 * The roulette wheel, drawn on one canvas: a dark mahogany cabinet in perspective, polished brass bands, a honey-wood
 * ball track with brass deflectors, a rotating pocket ring (37 European pockets, correct colours, numbered), a wooden
 * cone with brass spokes and hub, and an upright brass turret. Everything static is rendered once per size; each
 * frame only blits layers, so `draw()` is cheap enough to call at 60 fps. The component owns no animation loop.
 *
 * Angle convention (matches the engine and the animation): 0 = 12 o'clock, positive = clockwise on screen.
 * Pocket i (index into POCKETS) sits at angle wheel + i * 2PI / 37.
 */

/** Ball radius on the outer track, as a fraction of the bowl rim radius R. */
export const BALL_TRACK_R = 0.915;
/** Ball radius when resting in a pocket (the pocket centre line), as a fraction of R. */
export const BALL_POCKET_R = 0.635;

export interface WheelFrame {
  /** rotation of the pocket ring (radians) */
  wheel: number;
  /** absolute angle of the ball (radians) */
  ball: number;
  /** ball radius as a fraction of R */
  ballR: number;
  /** 0..1 bounce height */
  lift: number;
}

export interface WheelHandle {
  draw(frame: WheelFrame): void;
}

const TAU = Math.PI * 2;
const N = POCKETS.length;
export const pocketAngle = (index: number) => (index * TAU) / N;

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ------------------------------ layout ------------------------------ */
/** All lengths in units of R (the bowl rim radius). The canvas is 2.4R wide. */
function layout(tiltDeg: number) {
  const t = (clamp(tiltDeg, 0, 85) * Math.PI) / 180;
  const k = Math.cos(t); // depth squash of anything lying in the wheel plane
  const s = Math.sin(t); // projection of anything standing upright
  const e = 1.16 * k; // half height of the cabinet's top ellipse
  const side = 0.18 * s; // visible thickness of the cabinet
  const th = 0.78 * s; // projected height of the turret
  const top = Math.max(e, th + 0.04) + 0.03;
  const bottom = e + side + 0.05;
  return { k, s, e, side, th, top, bottom, h: top + bottom };
}

/* ------------------------------ helpers ------------------------------ */
function rng(seed: number) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mk(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function ctxOf(c: HTMLCanvasElement) {
  const g = c.getContext("2d");
  if (!g) throw new Error("2d context unavailable");
  return g;
}

/** A conic gradient centred on the origin, or a flat fallback colour where the browser lacks them. */
function conic(g: CanvasRenderingContext2D, start: number, stops: [number, string][], fallback: string): string | CanvasGradient {
  if (typeof g.createConicGradient !== "function") return fallback;
  const gr = g.createConicGradient(start, 0, 0);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}

function ring(g: CanvasRenderingContext2D, ro: number, ri: number, fill: string | CanvasGradient) {
  g.beginPath();
  g.arc(0, 0, ro, 0, TAU);
  g.arc(0, 0, ri, 0, TAU, true);
  g.fillStyle = fill;
  g.fill();
}

/** Turned-wood grain: thin concentric arcs of slightly different tone. */
function grain(g: CanvasRenderingContext2D, rnd: () => number, r0: number, r1: number, count: number, dark: string, light: string, w: number) {
  for (let i = 0; i < count; i++) {
    const r = lerp(r0, r1, rnd());
    const a0 = rnd() * TAU;
    const span = 0.35 + rnd() * 2.6;
    const a = 0.04 + rnd() * 0.14;
    g.strokeStyle = rnd() < 0.55 ? `rgba(${dark},${a})` : `rgba(${light},${a * 0.9})`;
    g.lineWidth = w * (0.4 + rnd() * 1.6);
    g.beginPath();
    g.arc(0, 0, r, a0, a0 + span);
    g.stroke();
  }
}

const BRASS: [number, string][] = [
  [0, "#7a5a1f"],
  [0.08, "#ecd283"],
  [0.16, "#a0762a"],
  [0.3, "#f8e8ae"],
  [0.42, "#7a5518"],
  [0.55, "#d9b863"],
  [0.7, "#8a6420"],
  [0.82, "#f3dc94"],
  [1, "#7a5a1f"],
];
const MAHOGANY: [number, string][] = [
  [0, "#3a160b"],
  [0.12, "#6a3016"],
  [0.25, "#2a0f08"],
  [0.5, "#1b0a05"],
  [0.65, "#47190d"],
  [0.8, "#7a3b1b"],
  [0.92, "#43190c"],
  [1, "#3a160b"],
];

interface Layers {
  Wd: number;
  Hd: number;
  R: number;
  cx: number;
  cy: number;
  k: number;
  s: number;
  back: HTMLCanvasElement;
  disc: HTMLCanvasElement;
  discR: number;
  glare: HTMLCanvasElement;
  turret: HTMLCanvasElement;
  tx: number;
  ty: number;
  ball: HTMLCanvasElement;
  ballRad: number;
  shadow: HTMLCanvasElement;
  shadowRad: number;
}

/* ------------------------------ static cabinet, rims and ball track ------------------------------ */
function buildBack(Wd: number, Hd: number, R: number, cx: number, cy: number, k: number, s: number): HTMLCanvasElement {
  const c = mk(Wd, Hd);
  const g = ctxOf(c);
  const rnd = rng(11);
  const side = 0.18 * s * R;

  // soft contact shadow on the floor under the cabinet
  g.save();
  g.translate(cx, cy + side * 0.95);
  g.scale(1, Math.max(0.2, k * 0.9));
  const sh = g.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.5);
  sh.addColorStop(0, "rgba(0,0,0,.72)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh;
  g.beginPath();
  g.arc(0, 0, R * 1.5, 0, TAU);
  g.fill();
  g.restore();

  // cabinet wall (the visible thickness below the front edge of the top)
  const rx = 1.16 * R;
  const ry = 1.16 * R * k;
  if (side > 1) {
    g.save();
    g.beginPath();
    g.moveTo(cx - rx, cy);
    g.lineTo(cx - rx, cy + side);
    g.ellipse(cx, cy + side, rx, ry, 0, Math.PI, 0, true);
    g.lineTo(cx + rx, cy);
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false);
    g.closePath();
    const wall = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
    for (const [o, col] of [[0, "#0e0503"], [0.07, "#35150a"], [0.2, "#6c2f15"], [0.3, "#2b1008"], [0.5, "#1a0905"], [0.68, "#2e1109"], [0.82, "#602912"], [0.93, "#2a0e06"], [1, "#0b0402"]] as [number, string][]) wall.addColorStop(o, col);
    g.fillStyle = wall;
    g.fill();
    g.clip();
    const vd = g.createLinearGradient(0, cy, 0, cy + side + ry);
    vd.addColorStop(0, "rgba(255,190,130,.10)");
    vd.addColorStop(0.5, "rgba(0,0,0,.18)");
    vd.addColorStop(1, "rgba(0,0,0,.6)");
    g.fillStyle = vd;
    g.fillRect(cx - rx, cy, rx * 2, side + ry + 2);
    // glossy vertical reflection streaks
    for (const [fx, fw, a] of [[-0.62, 0.05, 0.16], [-0.5, 0.018, 0.1], [0.55, 0.035, 0.1]] as [number, number, number][]) {
      const st = g.createLinearGradient(cx + fx * R, 0, cx + (fx + fw) * R, 0);
      st.addColorStop(0, "rgba(255,230,200,0)");
      st.addColorStop(0.5, `rgba(255,230,200,${a})`);
      st.addColorStop(1, "rgba(255,230,200,0)");
      g.fillStyle = st;
      g.fillRect(cx + fx * R, cy, fw * R, side + ry + 2);
    }
    g.restore();
    // brass line along the top edge of the wall
    g.save();
    g.lineWidth = Math.max(1.2, 0.01 * R);
    const edge = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
    edge.addColorStop(0, "#6e4f18");
    edge.addColorStop(0.3, "#f3dc94");
    edge.addColorStop(0.6, "#9b7125");
    edge.addColorStop(1, "#5e4313");
    g.strokeStyle = edge;
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false);
    g.stroke();
    g.restore();
  }

  // everything below lies in the wheel plane
  g.save();
  g.translate(cx, cy);
  g.scale(1, k);
  const lw = Math.max(0.8, 0.0035 * R);

  // mahogany top rim
  ring(g, 1.16 * R, 1.075 * R, conic(g, -2.2, MAHOGANY, "#3a160b"));
  grain(g, rnd, 1.08 * R, 1.155 * R, 110, "10,3,1", "190,110,60", lw);
  g.strokeStyle = "rgba(255,200,150,.30)";
  g.lineWidth = lw * 1.2;
  g.beginPath();
  g.arc(0, 0, 1.158 * R, 0, TAU);
  g.stroke();

  // brass band
  ring(g, 1.075 * R, 1.04 * R, conic(g, -1.2, BRASS, "#c9a24a"));
  g.strokeStyle = "rgba(30,18,4,.65)";
  g.lineWidth = lw;
  for (const r of [1.075, 1.04]) {
    g.beginPath();
    g.arc(0, 0, r * R, 0, TAU);
    g.stroke();
  }

  // inner lip
  ring(g, 1.04 * R, 0.97 * R, conic(g, -2.6, MAHOGANY, "#3a160b"));
  grain(g, rnd, 0.975 * R, 1.035 * R, 70, "10,3,1", "190,110,60", lw);

  // polished honey-wood ball track
  const track = g.createRadialGradient(0, 0, 0.8 * R, 0, 0, 0.97 * R);
  for (const [o, col] of [[0, "#a8773c"], [0.28, "#e2b878"], [0.6, "#d9a967"], [0.9, "#a9743a"], [1, "#68401f"]] as [number, string][]) track.addColorStop(o, col);
  ring(g, 0.97 * R, 0.8 * R, track);
  grain(g, rnd, 0.805 * R, 0.965 * R, 160, "90,50,20", "255,236,190", lw * 0.8);
  ring(g, 0.97 * R, 0.8 * R, conic(g, -2.4, [[0, "rgba(255,240,200,0)"], [0.5, "rgba(255,240,200,0)"], [0.6, "rgba(255,246,222,.30)"], [0.68, "rgba(255,240,200,0)"], [0.9, "rgba(255,240,200,0)"], [0.96, "rgba(255,246,222,.14)"], [1, "rgba(255,240,200,0)"]], "rgba(0,0,0,0)"));
  // darker outer wall of the track
  const wallShade = g.createRadialGradient(0, 0, 0.93 * R, 0, 0, 0.97 * R);
  wallShade.addColorStop(0, "rgba(40,18,6,0)");
  wallShade.addColorStop(1, "rgba(40,18,6,.55)");
  ring(g, 0.97 * R, 0.93 * R, wallShade);

  // brass diamond deflectors
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + TAU / 16;
    g.save();
    g.rotate(a);
    g.translate(0, -0.85 * R);
    for (const [ox, oy, col] of [[R * 0.006, R * 0.008, "rgba(30,12,3,.45)"], [0, 0, ""]] as [number, number, string][]) {
      g.beginPath();
      g.moveTo(ox, -0.05 * R + oy);
      g.lineTo(0.03 * R + ox, oy);
      g.lineTo(ox, 0.05 * R + oy);
      g.lineTo(-0.03 * R + ox, oy);
      g.closePath();
      if (col) g.fillStyle = col;
      else {
        const d = g.createLinearGradient(-0.03 * R, -0.05 * R, 0.03 * R, 0.05 * R);
        d.addColorStop(0, "#fbeab0");
        d.addColorStop(0.5, "#b88a30");
        d.addColorStop(1, "#6e4f18");
        g.fillStyle = d;
      }
      g.fill();
    }
    g.strokeStyle = "rgba(255,248,220,.7)";
    g.lineWidth = lw * 0.8;
    g.beginPath();
    g.moveTo(0, -0.045 * R);
    g.lineTo(-0.024 * R, 0);
    g.stroke();
    g.restore();
  }

  // brass ring where the track meets the wheel
  ring(g, 0.8 * R, 0.77 * R, conic(g, -0.6, BRASS, "#c9a24a"));
  g.strokeStyle = "rgba(30,18,4,.7)";
  g.lineWidth = lw;
  for (const r of [0.8, 0.77]) {
    g.beginPath();
    g.arc(0, 0, r * R, 0, TAU);
    g.stroke();
  }
  // dark well beneath the spinning disc
  g.fillStyle = "#0a0604";
  g.beginPath();
  g.arc(0, 0, 0.775 * R, 0, TAU);
  g.fill();
  g.restore();
  return c;
}

/* ------------------------------ the spinning disc (top-down, zero at 12 o'clock) ------------------------------ */
function buildDisc(R: number): { c: HTMLCanvasElement; r: number } {
  const half = Math.ceil(0.785 * R) + 2;
  const c = mk(half * 2, half * 2);
  const g = ctxOf(c);
  g.translate(half, half);
  const u = R;
  const rnd = rng(23);
  const step = TAU / N;

  g.fillStyle = "#0a0604";
  g.beginPath();
  g.arc(0, 0, 0.78 * u, 0, TAU);
  g.fill();

  // pockets
  const grads: Record<string, CanvasGradient> = {};
  const mkGrad = (inner: string, outer: string) => {
    const gr = g.createRadialGradient(0, 0, 0.56 * u, 0, 0, 0.76 * u);
    gr.addColorStop(0, inner);
    gr.addColorStop(1, outer);
    return gr;
  };
  grads.red = mkGrad("#620b10", "#c41c24");
  grads.black = mkGrad("#050506", "#26262c");
  grads.green = mkGrad("#07381b", "#139a4c");
  for (let i = 0; i < N; i++) {
    const a0 = (i - 0.5) * step - Math.PI / 2;
    g.beginPath();
    g.arc(0, 0, 0.76 * u, a0, a0 + step);
    g.arc(0, 0, 0.56 * u, a0 + step, a0, true);
    g.closePath();
    g.fillStyle = grads[colorOf(POCKETS[i])];
    g.fill();
  }
  // the pockets are dished: shade the outer wall and the inner floor
  const wall = g.createRadialGradient(0, 0, 0.66 * u, 0, 0, 0.76 * u);
  wall.addColorStop(0, "rgba(0,0,0,0)");
  wall.addColorStop(1, "rgba(0,0,0,.4)");
  ring(g, 0.76 * u, 0.66 * u, wall);
  const floor = g.createRadialGradient(0, 0, 0.56 * u, 0, 0, 0.62 * u);
  floor.addColorStop(0, "rgba(0,0,0,.4)");
  floor.addColorStop(1, "rgba(0,0,0,0)");
  ring(g, 0.62 * u, 0.56 * u, floor);

  // numbers, upright toward the outside of the ring
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = `700 ${(0.05 * u).toFixed(1)}px Georgia, "Times New Roman", serif`;
  for (let i = 0; i < N; i++) {
    g.save();
    g.rotate(i * step);
    g.translate(0, -0.705 * u);
    g.fillStyle = "rgba(0,0,0,.55)";
    g.fillText(String(POCKETS[i]), 0.004 * u, 0.004 * u);
    g.fillStyle = "#f6efdc";
    g.fillText(String(POCKETS[i]), 0, 0);
    g.restore();
  }

  // brass frets between pockets
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) * step - Math.PI / 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    g.beginPath();
    g.moveTo(ca * 0.555 * u, sa * 0.555 * u);
    g.lineTo(ca * 0.775 * u, sa * 0.775 * u);
    g.strokeStyle = "#8a6a26";
    g.lineWidth = Math.max(1.4, 0.0085 * u);
    g.stroke();
    g.strokeStyle = "#f6e2a0";
    g.lineWidth = Math.max(0.7, 0.003 * u);
    g.stroke();
  }
  // brass lips around the pocket ring
  g.save();
  ring(g, 0.78 * u, 0.757 * u, conic(g, 0.4, BRASS, "#c9a24a"));
  ring(g, 0.565 * u, 0.538 * u, conic(g, 1.1, BRASS, "#c9a24a"));
  g.restore();

  // wooden cone
  const cone = g.createRadialGradient(0, 0, 0.14 * u, 0, 0, 0.545 * u);
  for (const [o, col] of [[0, "#7a4420"], [0.35, "#9a5a2c"], [0.75, "#6a3416"], [1, "#2c1209"]] as [number, string][]) cone.addColorStop(o, col);
  g.fillStyle = cone;
  g.beginPath();
  g.arc(0, 0, 0.54 * u, 0, TAU);
  g.fill();
  grain(g, rnd, 0.16 * u, 0.53 * u, 130, "30,12,4", "255,200,140", Math.max(0.8, 0.003 * u));
  const facets: [number, string][] = [];
  for (let i = 0; i <= 16; i++) facets.push([i / 16, i % 2 === 0 ? "rgba(255,214,160,.13)" : "rgba(0,0,0,.2)"]);
  facets[16] = [1, facets[0][1]];
  g.fillStyle = conic(g, 0.2, facets, "rgba(0,0,0,0)");
  g.beginPath();
  g.arc(0, 0, 0.54 * u, 0, TAU);
  g.fill();
  const coneShade = g.createRadialGradient(0, 0, 0.45 * u, 0, 0, 0.54 * u);
  coneShade.addColorStop(0, "rgba(0,0,0,0)");
  coneShade.addColorStop(1, "rgba(0,0,0,.5)");
  ring(g, 0.54 * u, 0.45 * u, coneShade);

  // brass spokes
  for (let i = 0; i < 4; i++) {
    g.save();
    g.rotate((i * Math.PI) / 2 + Math.PI / 4);
    g.beginPath();
    g.moveTo(-0.032 * u, -0.13 * u);
    g.lineTo(0.032 * u, -0.13 * u);
    g.lineTo(0.017 * u, -0.54 * u);
    g.lineTo(-0.017 * u, -0.54 * u);
    g.closePath();
    const sp = g.createLinearGradient(-0.032 * u, 0, 0.032 * u, 0);
    sp.addColorStop(0, "#6b4c16");
    sp.addColorStop(0.35, "#f3dc94");
    sp.addColorStop(0.6, "#b88a30");
    sp.addColorStop(1, "#5a3f10");
    g.fillStyle = sp;
    g.fill();
    g.strokeStyle = "rgba(255,250,225,.65)";
    g.lineWidth = Math.max(0.7, 0.003 * u);
    g.beginPath();
    g.moveTo(-0.008 * u, -0.14 * u);
    g.lineTo(-0.006 * u, -0.53 * u);
    g.stroke();
    g.restore();
  }

  // polished hub
  const hub = g.createRadialGradient(-0.05 * u, -0.06 * u, 0.01 * u, 0, 0, 0.17 * u);
  for (const [o, col] of [[0, "#fff6d6"], [0.35, "#e0bb62"], [0.75, "#9b7125"], [1, "#4f3910"]] as [number, string][]) hub.addColorStop(o, col);
  g.fillStyle = hub;
  g.beginPath();
  g.arc(0, 0, 0.17 * u, 0, TAU);
  g.fill();
  g.strokeStyle = "rgba(30,18,4,.7)";
  g.lineWidth = Math.max(1, 0.004 * u);
  g.beginPath();
  g.arc(0, 0, 0.17 * u, 0, TAU);
  g.stroke();
  return { c, r: half };
}

/* ------------------------------ warm light on top of the wood and brass (half resolution) ------------------------------ */
function buildGlare(Wd: number, Hd: number, R: number, cx: number, cy: number, k: number): HTMLCanvasElement {
  const c = mk(Wd / 2, Hd / 2);
  const g = ctxOf(c);
  g.scale(0.5, 0.5);
  g.save();
  g.beginPath();
  g.ellipse(cx, cy, 1.16 * R, 1.16 * R * k, 0, 0, TAU);
  g.clip();
  g.translate(cx, cy);
  g.scale(1, k);
  const soft = g.createRadialGradient(-0.38 * R, -0.5 * R, 0, -0.38 * R, -0.5 * R, 1.0 * R);
  soft.addColorStop(0, "rgba(255,236,200,.20)");
  soft.addColorStop(0.5, "rgba(255,226,180,.07)");
  soft.addColorStop(1, "rgba(255,226,180,0)");
  g.fillStyle = soft;
  g.fillRect(-1.2 * R, -1.2 * R, 2.4 * R, 2.4 * R);
  // a curved reflection of the overhead lights along the upper-left of the rim
  for (const [w, a] of [[0.05, 0.05], [0.026, 0.07], [0.01, 0.16]] as [number, number][]) {
    g.strokeStyle = `rgba(255,238,205,${a})`;
    g.lineWidth = w * R;
    g.beginPath();
    g.arc(0, 0, 1.115 * R, -2.75, -1.75);
    g.stroke();
  }
  // warm points of light on the brass band
  for (const [a, rr] of [[-2.2, 0.026], [-1.9, 0.018], [-0.9, 0.014]] as [number, number][]) {
    const x = Math.cos(a) * 1.057 * R;
    const y = Math.sin(a) * 1.057 * R;
    const sp = g.createRadialGradient(x, y, 0, x, y, rr * R * 2.4);
    sp.addColorStop(0, "rgba(255,248,225,.75)");
    sp.addColorStop(1, "rgba(255,230,170,0)");
    g.fillStyle = sp;
    g.beginPath();
    g.arc(x, y, rr * R * 2.4, 0, TAU);
    g.fill();
  }
  g.restore();
  return c;
}

/* ------------------------------ the upright brass turret ------------------------------ */
function buildTurret(R: number, k: number, thPx: number): { c: HTMLCanvasElement; hubX: number; hubY: number } {
  const lw = Math.ceil(0.4 * R);
  const lh = Math.ceil(thPx + 0.16 * R);
  const c = mk(lw, lh);
  const g = ctxOf(c);
  const hubX = lw / 2;
  const hubY = lh - 0.08 * R;

  // a long soft shadow cast onto the wheel
  g.save();
  g.translate(hubX, hubY);
  g.scale(1, Math.max(0.2, k));
  const cast = g.createLinearGradient(0, 0, 0.2 * R, 0.1 * R);
  cast.addColorStop(0, "rgba(0,0,0,.45)");
  cast.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = cast;
  g.beginPath();
  g.ellipse(0.07 * R, 0.03 * R, 0.17 * R, 0.05 * R, 0.4, 0, TAU);
  g.fill();
  g.restore();

  // base plate lying on the hub
  g.save();
  g.translate(hubX, hubY);
  g.scale(1, Math.max(0.2, k));
  const plate = g.createRadialGradient(-0.03 * R, -0.03 * R, 0, 0, 0, 0.12 * R);
  plate.addColorStop(0, "#fff0c0");
  plate.addColorStop(0.6, "#b88a30");
  plate.addColorStop(1, "#5a3f10");
  g.fillStyle = plate;
  g.beginPath();
  g.arc(0, 0, 0.115 * R, 0, TAU);
  g.fill();
  g.restore();

  // stem: a turned profile (height as a fraction of the turret, half width in R)
  const prof: [number, number][] = [
    [0, 0.085], [0.03, 0.07], [0.07, 0.045], [0.13, 0.034], [0.19, 0.054], [0.235, 0.064], [0.285, 0.046], [0.33, 0.03],
    [0.6, 0.026], [0.645, 0.046], [0.69, 0.05], [0.73, 0.03], [0.8, 0.026],
  ];
  const X = (hw: number, sign: number) => hubX + sign * hw * R;
  const Y = (h: number) => hubY - h * thPx;
  g.beginPath();
  g.moveTo(X(prof[0][1], -1), Y(prof[0][0]));
  for (let i = 1; i < prof.length; i++) {
    const [h, hw] = prof[i];
    const [ph, phw] = prof[i - 1];
    g.quadraticCurveTo(X(phw, -1), Y((ph + h) / 2), X(hw, -1), Y(h));
  }
  for (let i = prof.length - 1; i >= 0; i--) {
    const [h, hw] = prof[i];
    if (i === prof.length - 1) g.lineTo(X(hw, 1), Y(h));
    else {
      const [nh, nhw] = prof[i + 1];
      g.quadraticCurveTo(X(nhw, 1), Y((nh + h) / 2), X(hw, 1), Y(h));
    }
  }
  g.closePath();
  const cyl = g.createLinearGradient(hubX - 0.09 * R, 0, hubX + 0.09 * R, 0);
  for (const [o, col] of [[0, "#4a3410"], [0.18, "#b48a35"], [0.38, "#fbe9b0"], [0.5, "#fff6d6"], [0.62, "#e0bb62"], [0.85, "#7c5a1c"], [1, "#3a280c"]] as [number, string][]) cyl.addColorStop(o, col);
  g.fillStyle = cyl;
  g.fill();
  // collar rings
  g.strokeStyle = "rgba(40,26,6,.55)";
  g.lineWidth = Math.max(1, 0.004 * R);
  for (const h of [0.07, 0.13, 0.33, 0.6, 0.73]) {
    const hw = prof.find((p) => p[0] >= h)?.[1] ?? 0.03;
    g.beginPath();
    g.moveTo(X(hw, -1), Y(h));
    g.lineTo(X(hw, 1), Y(h));
    g.stroke();
  }
  // finial: a polished ball and a slim spike
  const by = Y(0.865);
  const brad = 0.055 * R;
  const ball = g.createRadialGradient(hubX - brad * 0.35, by - brad * 0.4, brad * 0.05, hubX, by, brad);
  ball.addColorStop(0, "#fffbe8");
  ball.addColorStop(0.35, "#ecc86c");
  ball.addColorStop(1, "#6a4a14");
  g.fillStyle = ball;
  g.beginPath();
  g.arc(hubX, by, brad, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(hubX - 0.014 * R, by - brad * 0.8);
  g.lineTo(hubX + 0.014 * R, by - brad * 0.8);
  g.lineTo(hubX + 0.004 * R, Y(1));
  g.lineTo(hubX - 0.004 * R, Y(1));
  g.closePath();
  g.fillStyle = cyl;
  g.fill();
  // specular streak down the stem
  const streak = g.createLinearGradient(hubX - 0.03 * R, 0, hubX - 0.01 * R, 0);
  streak.addColorStop(0, "rgba(255,255,255,0)");
  streak.addColorStop(0.5, "rgba(255,255,255,.55)");
  streak.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = streak;
  g.fillRect(hubX - 0.03 * R, Y(0.58), 0.02 * R, 0.5 * thPx);
  return { c, hubX, hubY };
}

/* ------------------------------ ball sprites ------------------------------ */
function buildBall(rad: number): HTMLCanvasElement {
  const S = Math.ceil(rad * 2) + 4;
  const c = mk(S, S);
  const g = ctxOf(c);
  const m = S / 2;
  const body = g.createRadialGradient(m - rad * 0.35, m - rad * 0.4, rad * 0.05, m, m, rad);
  body.addColorStop(0, "#ffffff");
  body.addColorStop(0.3, "#fbf6e6");
  body.addColorStop(0.75, "#d9cfb2");
  body.addColorStop(1, "#8f8566");
  g.fillStyle = body;
  g.beginPath();
  g.arc(m, m, rad, 0, TAU);
  g.fill();
  g.fillStyle = "rgba(255,255,255,.95)";
  g.beginPath();
  g.arc(m - rad * 0.38, m - rad * 0.42, rad * 0.2, 0, TAU);
  g.fill();
  return c;
}

function buildShadow(rad: number): HTMLCanvasElement {
  const S = Math.ceil(rad * 5);
  const c = mk(S, S);
  const g = ctxOf(c);
  const m = S / 2;
  const sh = g.createRadialGradient(m, m, 0, m, m, rad * 2.4);
  sh.addColorStop(0, "rgba(0,0,0,.62)");
  sh.addColorStop(0.45, "rgba(0,0,0,.3)");
  sh.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sh;
  g.fillRect(0, 0, S, S);
  return c;
}

function buildLayers(widthCss: number, tilt: number, dpr: number): Layers {
  const L = layout(tilt);
  const Wd = Math.round(widthCss * dpr);
  const R = Wd / 2.4;
  const Hd = Math.round(L.h * R);
  const cx = Wd / 2;
  const cy = L.top * R;
  const disc = buildDisc(R);
  const thPx = L.th * R;
  const tur = buildTurret(R, L.k, Math.max(1, thPx));
  const ballRad = 0.034 * R;
  return {
    Wd,
    Hd,
    R,
    cx,
    cy,
    k: L.k,
    s: L.s,
    back: buildBack(Wd, Hd, R, cx, cy, L.k, L.s),
    disc: disc.c,
    discR: disc.r,
    glare: buildGlare(Wd, Hd, R, cx, cy, L.k),
    turret: tur.c,
    tx: cx - tur.hubX,
    ty: cy - tur.hubY,
    ball: buildBall(ballRad),
    ballRad,
    shadow: buildShadow(ballRad),
    shadowRad: ballRad,
  };
}

/* ------------------------------ the component ------------------------------ */
export const RouletteWheel = forwardRef<WheelHandle, { tilt?: number; className?: string }>(function RouletteWheel({ tilt = 56, className }, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const layers = useRef<Layers | null>(null);
  const frame = useRef<WheelFrame>({ wheel: 0, ball: 0, ballR: BALL_POCKET_R, lift: 0 });
  const L = layout(tilt);

  const paint = useCallback(() => {
    const c = cv.current;
    const l = layers.current;
    if (!c || !l) return;
    const g = c.getContext("2d");
    if (!g) return;
    const f = frame.current;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, l.Wd, l.Hd);
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = "medium";
    g.drawImage(l.back, 0, 0);

    // the pocket disc: rotate in the wheel plane, then squash for the tilt
    g.save();
    g.translate(l.cx, l.cy);
    g.scale(1, l.k);
    g.rotate(f.wheel);
    g.drawImage(l.disc, -l.discR, -l.discR);
    g.restore();

    g.drawImage(l.glare, 0, 0, l.Wd, l.Hd);

    // the ball: polar position in the wheel plane, projected with the same squash
    const pr = clamp(f.ballR, 0.3, 1) * l.R;
    const bx = l.cx + pr * Math.sin(f.ball);
    const by = l.cy - pr * Math.cos(f.ball) * l.k;
    const lift = clamp(f.lift, 0, 1);
    const up = lift * 0.075 * l.R * Math.max(0.35, l.s);
    const sc = 1 + lift * 0.22;
    // contact shadow stays on the surface and drifts away as the ball rises
    const ss = l.shadowRad * (1 + lift * 0.5);
    g.save();
    g.globalAlpha = 1 - lift * 0.55;
    g.translate(bx + lift * 0.012 * l.R, by + lift * 0.01 * l.R);
    g.scale(1, Math.max(0.4, l.k));
    g.drawImage(l.shadow, -ss * 2.5, -ss * 2.5, ss * 5, ss * 5);
    g.restore();
    const br = l.ballRad * sc;
    g.drawImage(l.ball, bx - br - 2 * sc, by - up - br - 2 * sc, (br + 2 * sc) * 2, (br + 2 * sc) * 2);

    // the turret stands in front of everything
    g.drawImage(l.turret, l.tx, l.ty);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      draw(next: WheelFrame) {
        frame.current = next;
        paint();
      },
    }),
    [paint],
  );

  useEffect(() => {
    const el = cv.current;
    if (!el) return;
    let lastW = 0;
    const build = () => {
      const w = el.clientWidth;
      if (!w) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1, 2400 / w);
      const key = Math.round(w * dpr);
      if (key === lastW && layers.current) return;
      lastW = key;
      layers.current = buildLayers(w, tilt, dpr);
      el.width = layers.current.Wd;
      el.height = layers.current.Hd;
      paint();
    };
    lastW = 0;
    build();
    const ro = new ResizeObserver(build);
    ro.observe(el);
    return () => {
      ro.disconnect();
      layers.current = null;
    };
  }, [tilt, paint]);

  return <canvas ref={cv} className={className} aria-hidden style={{ display: "block", width: "100%", height: "auto", aspectRatio: `2.4 / ${L.h.toFixed(4)}` }} />;
});
