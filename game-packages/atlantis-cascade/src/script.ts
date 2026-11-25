/**
 * The demo script: a fixed rotation of outcomes so every session shows the whole game
 * (quiet spins, cascades, every win tier, the free-spins gate). Seeds were picked offline with
 * `buildSpin` so each entry lands in the tier named beside it.
 */
import { buildSpin, type Spec, type Spin, type Tier } from "./engine";

interface Entry {
  seed: number;
  spec: Spec;
  /** What this entry is meant to show (checked by nothing at runtime; for readers). */
  note: Tier | "tease" | "bonus";
}

const s = (scatters: number, clump: number, wilds: number, maxSteps: number): Spec => ({ scatters, clump, wilds, maxSteps });

export const BASE_SCRIPT: Entry[] = [
  { seed: 1, spec: s(0, 0.4, 0.01, 1), note: "normal" },
  { seed: 3, spec: s(0, 0.2, 0, 6), note: "none" },
  { seed: 8, spec: s(0, 0.5, 0.01, 6), note: "normal" },
  { seed: 20004, spec: s(0, 0.2, 0, 6), note: "none" },
  { seed: 2, spec: s(3, 0.2, 0, 6), note: "tease" },
  { seed: 2, spec: s(0, 0.55, 0.02, 10), note: "big" },
  { seed: 4, spec: s(0, 0.45, 0.01, 6), note: "normal" },
  { seed: 9, spec: s(4, 0.3, 0, 6), note: "bonus" },
  { seed: 3, spec: s(0, 0.6, 0.02, 10), note: "super" },
  { seed: 7, spec: s(0, 0.2, 0, 6), note: "none" },
  { seed: 6, spec: s(0, 0.62, 0.02, 12), note: "mega" },
  { seed: 5, spec: s(0, 0.5, 0.01, 6), note: "normal" },
  { seed: 2, spec: s(0, 0.66, 0.02, 12), note: "jackpot" },
];

/** Free spins play these in order, then loop. They never contain scatters. */
export const FREE_SCRIPT: Entry[] = [
  { seed: 1, spec: s(0, 0.45, 0.02, 6), note: "normal" },
  { seed: 2, spec: s(0, 0.5, 0.02, 8), note: "big" },
  { seed: 3, spec: s(0, 0.2, 0, 6), note: "none" },
  { seed: 1, spec: s(0, 0.55, 0.02, 8), note: "normal" },
  { seed: 3, spec: s(0, 0.55, 0.02, 10), note: "mega" },
  { seed: 6, spec: s(0, 0.45, 0.02, 6), note: "mega" },
  { seed: 2, spec: s(0, 0.5, 0.02, 8), note: "big" },
  { seed: 4, spec: s(0, 0.45, 0.02, 6), note: "normal" },
];

const cache = new Map<string, Spin>();
function make(e: Entry): Spin {
  const k = `${e.seed}:${JSON.stringify(e.spec)}`;
  let v = cache.get(k);
  if (!v) {
    v = buildSpin(e.seed, e.spec);
    cache.set(k, v);
  }
  return v;
}

export const baseSpin = (i: number): Spin => make(BASE_SCRIPT[i % BASE_SCRIPT.length]);
export const freeSpin = (i: number): Spin => make(FREE_SCRIPT[i % FREE_SCRIPT.length]);

/** The opening board shown before the first spin: a calm, win-free layout. */
export const RESTING_BOARD: Spin = buildSpin(3, s(0, 0.2, 0, 6));
