/**
 * The wheel and ball motion for one spin, as a pure function of time.
 *
 * It is given the pocket index the ENGINE already chose and works backwards so the ball comes to rest in exactly
 * that pocket. It never decides or alters a result: change the number and the same motion simply ends elsewhere.
 *
 * Angles: radians, 0 = 12 o'clock, clockwise positive. The wheel turns counter-clockwise, the ball clockwise.
 *
 *   0 .. T1      the ball races round the outer track, slowing as it loses energy
 *   T1 .. TE     it drops off the track and falls inward, bouncing over the frets with smaller and smaller hops,
 *                its speed (relative to the wheel) easing to zero exactly on the winning pocket (Hermite spline,
 *                continuous in position and velocity at T1)
 *   TE ..        it rides in the pocket with the wheel, which keeps slowing
 */

import { POCKET_COUNT } from "./engine";

export const STEP = (Math.PI * 2) / POCKET_COUNT;
const TAU = Math.PI * 2;

/** time the ball leaves the track, and the moment it settles (ms) */
export const T1 = 4600;
export const TE = 8200;

const W_OMEGA = 2.9; // wheel start speed, rad/s (counter-clockwise)
const W_TAU = 3.0; // seconds
const B_OMEGA = 13; // ball start speed, rad/s (clockwise)
const B_TAU = 2.2;

export interface AnimFrame {
  wheel: number;
  ball: number;
  ballR: number;
  lift: number;
  /** wheel speed, 1 at launch down to 0 */
  wheelSpeed: number;
  /** ball speed against the track or pockets, 1 at launch down to 0 */
  ballSpeed: number;
  /** the ball has dropped into the wheel's pockets */
  settled: boolean;
}

export interface AnimEvent {
  /** ms from the start of the spin */
  t: number;
  kind: "bounce" | "land";
  /** 0..1 */
  strength: number;
}

export interface SpinMotion {
  at(tMs: number): AnimFrame;
  events: AnimEvent[];
  /** when the result should be revealed on screen (ms) */
  revealMs: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const mod = (a: number, m: number) => ((a % m) + m) % m;

/** hops over the frets: [start of hop, end of hop, height 0..1] as fractions of the drop phase */
const HOPS: [number, number, number][] = [
  [0.3, 0.52, 0.9],
  [0.52, 0.7, 0.55],
  [0.7, 0.83, 0.32],
  [0.83, 0.93, 0.17],
  [0.93, 1, 0.07],
];

export function planSpin(index: number, trackR: number, pocketR: number): SpinMotion {
  const wheelAngle = (sec: number) => -W_OMEGA * W_TAU * (1 - Math.exp(-sec / W_TAU));
  const wheelRate = (sec: number) => -W_OMEGA * Math.exp(-sec / W_TAU);
  const ballFree = (sec: number) => B_OMEGA * B_TAU * (1 - Math.exp(-sec / B_TAU));
  const ballFreeRate = (sec: number) => B_OMEGA * Math.exp(-sec / B_TAU);

  const t1 = T1 / 1000;
  const D = (TE - T1) / 1000;
  // ball angle relative to the wheel when it leaves the track, and how fast it is moving against the wheel
  const psi1 = ballFree(t1) - wheelAngle(t1);
  const v1 = ballFreeRate(t1) - wheelRate(t1);
  const m0 = v1 * D;
  const target = index * STEP;
  // travel far enough that the speed eases to zero, landing exactly on the pocket: the smallest such travel
  const dMin = Math.max(m0 * 0.5, 3);
  const k = Math.ceil((dMin + psi1 - target) / TAU);
  const dTot = target + TAU * k - psi1;
  const psi2 = psi1 + dTot;

  const hermite = (s: number) => {
    const s2 = s * s;
    const s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * psi1 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * psi2;
  };
  const hermiteRate = (s: number) => {
    const s2 = s * s;
    return ((6 * s2 - 6 * s) * psi1 + (3 * s2 - 4 * s + 1) * m0 + (-6 * s2 + 6 * s) * psi2) / D;
  };

  const hop = (s: number) => {
    for (const [a, b, h] of HOPS) if (s >= a && s < b) return h * Math.sin((Math.PI * (s - a)) / (b - a));
    return 0;
  };

  const at = (tMs: number): AnimFrame => {
    const sec = Math.max(0, tMs) / 1000;
    const wheel = wheelAngle(sec);
    const wheelSpeed = Math.abs(wheelRate(sec)) / W_OMEGA;
    if (sec <= t1) {
      return {
        wheel,
        ball: ballFree(sec),
        ballR: trackR - 0.003 * (1 + Math.sin(sec * 9)) * 0.5,
        lift: 0.04 * (0.5 + 0.5 * Math.sin(sec * 23)),
        wheelSpeed,
        ballSpeed: ballFreeRate(sec) / B_OMEGA,
        settled: false,
      };
    }
    const s = clamp((sec - t1) / D, 0, 1);
    const psi = s >= 1 ? psi2 : hermite(s);
    const h = hop(s);
    const g = 1 - smooth(0, 0.34, s);
    return {
      wheel,
      ball: psi + wheel,
      ballR: pocketR + (trackR - pocketR) * (g + 0.26 * h),
      lift: Math.max(h, 0.5 * g * (1 - g) * 0.0),
      wheelSpeed,
      ballSpeed: s >= 1 ? 0 : Math.abs(hermiteRate(s)) / B_OMEGA,
      settled: s > 0.34,
    };
  };

  const events: AnimEvent[] = HOPS.map(([a, , h]) => ({ t: T1 + a * (TE - T1), kind: "bounce" as const, strength: h }));
  events.push({ t: TE, kind: "land", strength: 1 });

  return { at, events, revealMs: TE + 450 };
}

/** The pocket angle test used by the check script: where the ball must be, given a frame. */
export const pocketAngleAt = (wheel: number, index: number) => wheel + index * STEP;
export const angleError = (ball: number, wheel: number, index: number) => {
  const e = mod(ball - pocketAngleAt(wheel, index) + Math.PI, TAU) - Math.PI;
  return Math.abs(e);
};
