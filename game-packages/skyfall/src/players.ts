/**
 * Simulated demo players. Everything here is scripted sample data generated from the round number, so the same
 * round always shows the same list. None of these are real people and none of it reflects live activity; the UI
 * labels it as demo data everywhere it appears.
 */
import type { Phase } from "./engine";

export interface SimPlayer {
  id: string;
  name: string;
  hue: number;
  stake: number;
  /** the multiplier this demo player intends to cash out at */
  plan: number;
}

export type SimState = "waiting" | "flying" | "cashed" | "lost";
export interface SimView {
  state: SimState;
  mult: number | null;
  payout: number;
}

const HANDLES = [
  "NovaDrift", "Quill7", "Halcyon", "Brisk_Fox", "Orbit9", "MintLeaf", "Zephyr_K", "Cobalt", "Lumen", "Rook42", "Tidewalker", "Ashgrove",
  "Pixel_Moth", "Sable", "Vantage", "Driftwood", "Kestrel", "Marlow", "Nimbus", "Ember_J", "Fathom", "Glimmer", "Hollis", "Ivory_Tide",
  "Juniper", "Kilo_Echo", "Larkspur", "Mosaic", "Northwind", "Opal_Run", "Perihelion", "Quartz", "Riverlight", "Skylark", "Tangent", "Umber",
  "Vesper", "Wren_21", "Xenon_X", "Yarrow", "Zinnia", "Altair", "Beacon", "Cinder_5", "Dusk_Lark", "Eclipse", "Flint", "Gale_9",
];
const STAKES = [5, 10, 20, 25, 50, 75, 100, 150, 250, 500];
const PLANS = [1.15, 1.3, 1.5, 1.75, 2.0, 2.3, 2.8, 3.4, 4.5, 6.2, 9.0];

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The demo players for a round. 18 entries, deterministic per round. */
export function playersForRound(round: number): SimPlayer[] {
  const rnd = mulberry32(round * 7919 + 13);
  const used = new Set<number>();
  return Array.from({ length: 18 }, (_, i) => {
    let h = Math.floor(rnd() * HANDLES.length);
    while (used.has(h)) h = (h + 1) % HANDLES.length;
    used.add(h);
    const plan = Math.round(PLANS[Math.floor(rnd() * PLANS.length)] * (0.92 + rnd() * 0.18) * 100) / 100;
    return { id: `${round}-${i}`, name: HANDLES[h], hue: Math.floor(rnd() * 360), stake: STAKES[Math.floor(rnd() * STAKES.length)], plan: Math.max(1.05, plan) };
  }).sort((a, b) => b.stake - a.stake);
}

/** What a demo player is doing right now, derived from the round state alone. */
export function viewOf(p: SimPlayer, phase: Phase, mult: number, crashAt: number | null): SimView {
  if (phase === "waiting" || phase === "takeoff") return { state: "waiting", mult: null, payout: 0 };
  const wins = crashAt !== null ? p.plan <= crashAt : false;
  if (phase === "flying") {
    if (p.plan <= mult) return { state: "cashed", mult: p.plan, payout: Math.round(p.stake * p.plan * 100) / 100 };
    return { state: "flying", mult: null, payout: 0 };
  }
  return wins ? { state: "cashed", mult: p.plan, payout: Math.round(p.stake * p.plan * 100) / 100 } : { state: "lost", mult: null, payout: 0 };
}

export interface RatingRow {
  name: string;
  hue: number;
  rounds: number;
  best: number;
  net: number;
}

/** Demo leaderboard. Sample statistics, not real players. */
export const DEMO_RATINGS: RatingRow[] = [
  { name: "Perihelion", hue: 200, rounds: 412, best: 48.2, net: 18420 },
  { name: "NovaDrift", hue: 280, rounds: 388, best: 31.7, net: 14980 },
  { name: "Halcyon", hue: 160, rounds: 301, best: 26.4, net: 11240 },
  { name: "Kestrel", hue: 30, rounds: 455, best: 22.9, net: 9310 },
  { name: "Vesper", hue: 330, rounds: 264, best: 19.5, net: 7760 },
  { name: "Orbit9", hue: 210, rounds: 340, best: 17.1, net: 6125 },
  { name: "Tangent", hue: 90, rounds: 219, best: 14.8, net: 4890 },
  { name: "Lumen", hue: 50, rounds: 372, best: 12.6, net: 3410 },
  { name: "Skylark", hue: 250, rounds: 198, best: 11.3, net: 2275 },
  { name: "Cobalt", hue: 190, rounds: 281, best: 9.9, net: 1180 },
];
