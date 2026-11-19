/**
 * Neon Overdrive: game rules and scripted demo outcomes (frontend only, no real randomness or money).
 *
 * Base game: 5 reels x 4 rows, 12 paylines, wild reactors, Overdrive Cores (orbs) that carry point values.
 * Six or more cores trigger Hold & Respin. Ten locked cores engage OVERDRIVE (x2). A full grid pays the Grand.
 * Every outcome is predefined: the grid is built from a small recipe and the filler is verified against the
 * evaluator so it never adds an accidental win.
 */

export const REELS = 5;
export const ROWS = 4;
export const CELLS = REELS * ROWS;
export const HOLD_TRIGGER = 6;
export const OVERDRIVE_AT = 10;
export const GRAND_BONUS = 100;
export const START_RESPINS = 3;

export type SymId = "cell" | "chip" | "crystal" | "visor" | "drone" | "reactor" | "orb";
export type PaySym = Exclude<SymId, "orb">;
export type Grid = SymId[][]; // [reel][row]

export const SYMBOL_META: Record<SymId, { name: string; color: string; note: string }> = {
  cell: { name: "Plasma Cell", color: "#2fd8ff", note: "Charged fluid cell" },
  chip: { name: "Quantum Chip", color: "#a77bff", note: "Q-core processor" },
  crystal: { name: "Circuit Crystal", color: "#2ef2c0", note: "Data-etched shard" },
  visor: { name: "Holo Visor", color: "#ff4fd8", note: "Augmented lens" },
  drone: { name: "Cyber Drone", color: "#5aa8ff", note: "Scout unit" },
  reactor: { name: "Arc Reactor", color: "#bff6ff", note: "Wild" },
  orb: { name: "Overdrive Core", color: "#ff4fd8", note: "Hold & Respin" },
};

export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 0, 0, 0, 0],
  [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0],
  [3, 2, 1, 2, 3],
  [1, 0, 0, 0, 1],
  [2, 3, 3, 3, 2],
  [0, 0, 1, 2, 3],
  [3, 3, 2, 1, 0],
  [1, 2, 3, 2, 1],
  [2, 1, 0, 1, 2],
];

/** Pays for 3 / 4 / 5 in a row, as a multiple of the total bet. */
export const PAYS: Record<PaySym, [number, number, number]> = {
  cell: [0.4, 1.2, 3],
  chip: [0.6, 2, 5],
  crystal: [1, 4, 10],
  visor: [2, 8, 25],
  drone: [4, 15, 50],
  reactor: [5, 25, 100],
};
export const PAY_ORDER: PaySym[] = ["reactor", "drone", "visor", "crystal", "chip", "cell"];

export const BET_STEPS = [10, 20, 50, 100, 200, 500];
export const DEFAULT_BET_INDEX = 1;

export type WinLevel = "none" | "win" | "big" | "super" | "mega" | "jackpot";
export type BigLevel = "big" | "super" | "mega" | "jackpot";

export function levelOf(mult: number): WinLevel {
  if (mult >= 90) return "jackpot";
  if (mult >= 40) return "mega";
  if (mult >= 14) return "super";
  if (mult >= 6) return "big";
  return mult > 0 ? "win" : "none";
}
export const isBig = (l: WinLevel): l is BigLevel => l === "big" || l === "super" || l === "mega" || l === "jackpot";

/* --------------------------------- orbs --------------------------------- */
export type Tier = "mini" | "minor" | "major" | "grand";
export const TIERS: Record<Tier, { label: string; main: string; light: string; deep: string }> = {
  mini: { label: "MINI", main: "#35e8ff", light: "#c9fbff", deep: "#0a6fd8" },
  minor: { label: "MINOR", main: "#a98bff", light: "#e6dcff", deep: "#4b24c9" },
  major: { label: "MAJOR", main: "#ff4fd8", light: "#ffd2f6", deep: "#a4108f" },
  grand: { label: "GRAND", main: "#ffcf5a", light: "#fff6cf", deep: "#d9780b" },
};
export const tierOf = (v: number): Tier => (v >= 30 ? "grand" : v >= 10 ? "major" : v >= 4 ? "minor" : "mini");
export const cellKey = (reel: number, row: number) => `${reel}:${row}`;

/* -------------------------------- evaluator -------------------------------- */
export interface LineWin {
  line: number;
  sym: PaySym;
  count: number;
  mult: number;
}

export function evaluate(grid: (SymId | null)[][]): LineWin[] {
  const wins: LineWin[] = [];
  PAYLINES.forEach((rows, line) => {
    let base: PaySym | null = null;
    let count = 0;
    for (let reel = 0; reel < REELS; reel++) {
      const s = grid[reel][rows[reel]];
      if (!s || s === "orb") break;
      if (s !== "reactor") {
        if (base && s !== base) break;
        base = s;
      }
      count++;
    }
    if (count >= 3) {
      const sym: PaySym = base ?? "reactor";
      wins.push({ line, sym, count, mult: PAYS[sym][count - 3] });
    }
  });
  return wins;
}

export function lineCells(w: LineWin): Set<string> {
  const out = new Set<string>();
  for (let r = 0; r < w.count; r++) out.add(cellKey(r, PAYLINES[w.line][r]));
  return out;
}
export function winCells(wins: LineWin[]): Set<string> {
  const out = new Set<string>();
  wins.forEach((w) => lineCells(w).forEach((c) => out.add(c)));
  return out;
}

/* --------------------------------- scripts --------------------------------- */
export interface OrbSpot {
  reel: number;
  row: number;
  v: number;
}
export interface BonusScript {
  /** the cores that triggered the feature; they are also visible in the base grid */
  initial: OrbSpot[];
  /** what lands on each respin (empty array = nothing landed) */
  steps: OrbSpot[][];
}
export interface Outcome {
  grid: Grid;
  orbs: Record<string, number>;
  wins: LineWin[];
  mult: number;
  level: WinLevel;
  kind: "spin" | "tease" | "bonus";
  headline: string;
  bonus?: BonusScript;
}

type Spot = [number, number, number]; // reel, row, value
interface Spec {
  lines?: { line: number; sym: PaySym; n: number; wild?: number[] }[];
  orbs?: Spot[];
  headline?: string;
  bonus?: { steps: Spot[][] };
}

const FILL: PaySym[] = ["cell", "chip", "crystal", "visor", "drone"];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(spec: Spec, seed: number): Outcome {
  const g: (SymId | null)[][] = Array.from({ length: REELS }, () => Array<SymId | null>(ROWS).fill(null));
  const orbs: Record<string, number> = {};
  spec.lines?.forEach((l) => {
    for (let r = 0; r < l.n; r++) g[r][PAYLINES[l.line][r]] = l.wild?.includes(r) ? "reactor" : l.sym;
  });
  spec.orbs?.forEach(([reel, row, v]) => {
    g[reel][row] = "orb";
    orbs[cellKey(reel, row)] = v;
  });
  const baseline = JSON.stringify(evaluate(g));
  const rand = rng(seed);
  for (let reel = 0; reel < REELS; reel++) {
    for (let row = 0; row < ROWS; row++) {
      if (g[reel][row]) continue;
      const order = [...FILL].sort(() => rand() - 0.5);
      let placed = false;
      for (const s of order) {
        g[reel][row] = s;
        if (JSON.stringify(evaluate(g)) === baseline) {
          placed = true;
          break;
        }
      }
      if (!placed) g[reel][row] = "orb"; // never expected; kept so a bad recipe cannot crash the game
    }
  }
  const grid = g as Grid;
  const wins = evaluate(grid);
  const mult = wins.reduce((a, w) => a + w.mult, 0);
  const orbCount = Object.keys(orbs).length;
  const kind: Outcome["kind"] = spec.bonus ? "bonus" : orbCount >= 3 ? "tease" : "spin";
  const bonus: BonusScript | undefined = spec.bonus
    ? {
        initial: (spec.orbs ?? []).map(([reel, row, v]) => ({ reel, row, v })),
        steps: spec.bonus.steps.map((s) => s.map(([reel, row, v]) => ({ reel, row, v }))),
      }
    : undefined;
  const best = [...wins].sort((a, b) => b.mult - a.mult)[0];
  const headline =
    spec.headline ??
    (kind === "bonus"
      ? "Overdrive Cores online. Hold & Respin"
      : best
        ? `${wins.length > 1 ? `${wins.length} lines. ` : ""}${best.count} × ${SYMBOL_META[best.sym].name}`
        : kind === "tease"
          ? `${orbCount} cores charged. ${HOLD_TRIGGER} start Hold & Respin`
          : "No win");
  return { grid, orbs, wins, mult, level: levelOf(mult), kind, headline, bonus };
}

const SPECS: Spec[] = [
  /* 0 */ { lines: [{ line: 1, sym: "crystal", n: 3 }] },
  /* 1 */ {},
  /* 2 */ { lines: [{ line: 2, sym: "cell", n: 4 }, { line: 5, sym: "chip", n: 3 }] },
  /* 3 */ { orbs: [[0, 1, 2], [2, 2, 1], [4, 0, 3]] },
  /* 4 BONUS A: reaches OVERDRIVE */
  {
    orbs: [[0, 0, 2], [1, 2, 1], [2, 1, 3], [3, 3, 2], [4, 0, 1], [2, 3, 5]],
    bonus: {
      steps: [
        [[1, 0, 1], [3, 1, 1]],
        [],
        [[4, 2, 3]],
        [[0, 3, 2], [2, 0, 2], [3, 2, 10]],
        [[1, 3, 1]],
        [],
        [],
        [],
      ],
    },
  },
  /* 5 */ { lines: [{ line: 0, sym: "visor", n: 4, wild: [1] }] },
  /* 6 */ {},
  /* 7 */ { lines: [{ line: 3, sym: "drone", n: 3 }, { line: 4, sym: "visor", n: 3 }] },
  /* 8 */ { lines: [{ line: 4, sym: "cell", n: 3 }], orbs: [[0, 2, 1], [1, 3, 2], [3, 0, 2], [4, 1, 5]] },
  /* 9 */ {},
  /* 10 BONUS B: a short feature */
  {
    orbs: [[0, 1, 1], [1, 1, 2], [2, 2, 3], [3, 0, 1], [4, 3, 10], [1, 3, 2], [3, 2, 5]],
    bonus: { steps: [[[0, 2, 2]], [], [[2, 0, 4]], [], [], []] },
  },
  /* 11 */ { lines: [{ line: 11, sym: "crystal", n: 5 }] },
  /* 12 */ { lines: [{ line: 0, sym: "drone", n: 4, wild: [2] }] },
  /* 13 */ {},
  /* 14 */ { lines: [{ line: 1, sym: "chip", n: 3 }, { line: 6, sym: "cell", n: 3 }] },
  /* 15 */ { lines: [{ line: 2, sym: "drone", n: 5 }] },
  /* 16 */ { orbs: [[0, 0, 1], [1, 2, 3], [2, 3, 2], [3, 1, 5], [4, 2, 1]] },
  /* 17 BONUS C: fills the grid for the Grand */
  {
    orbs: [[0, 0, 2], [0, 1, 3], [1, 0, 5], [1, 1, 2], [2, 2, 8], [2, 3, 3], [3, 2, 4], [3, 3, 2]],
    bonus: {
      steps: [
        [[0, 2, 2], [1, 2, 4]],
        [[0, 3, 3]],
        [[1, 3, 6], [2, 0, 3]],
        [[2, 1, 10], [3, 0, 2]],
        [[3, 1, 4], [4, 0, 3]],
        [[4, 1, 2], [4, 2, 40]],
        [[4, 3, 5]],
      ],
    },
  },
  /* 18 */ { lines: [{ line: 1, sym: "reactor", n: 5 }] },
  /* 19 */ {},
];

export const OUTCOMES: Outcome[] = SPECS.map((s, i) => build(s, 7919 * (i + 3)));

export function nextOutcome(i: number): Outcome {
  return OUTCOMES[i % OUTCOMES.length];
}

/** Total of a feature (core values x bet, doubled by Overdrive, plus the Grand for a full grid). */
export function bonusMultiplier(values: number[], overdrive: boolean, full: boolean): number {
  return values.reduce((a, b) => a + b, 0) * (overdrive ? 2 : 1) + (full ? GRAND_BONUS : 0);
}

/** A calm, good-looking grid for the idle machine (no wins). */
export const IDLE_GRID: Grid = [
  ["crystal", "drone", "cell", "visor"],
  ["chip", "reactor", "visor", "cell"],
  ["visor", "cell", "drone", "chip"],
  ["cell", "visor", "crystal", "drone"],
  ["drone", "chip", "reactor", "crystal"],
];

export function randomFiller(seed: number): PaySym {
  return FILL[Math.abs(Math.floor(seed)) % FILL.length];
}
