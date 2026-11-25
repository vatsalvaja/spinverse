/**
 * Atlantis Cascade rules engine (frontend demo only).
 *
 * A spin is a *scripted* demo outcome: a seed plus a few generator knobs. The generator is fully deterministic,
 * so the same script entry always produces the same board, the same clusters and the same cascades. Wins are
 * evaluated for real by the cluster finder below, so what the player sees is always consistent with the paytable.
 * No randomness is used at runtime and nothing here touches balances or the network.
 */

export const COLS = 6;
export const ROWS = 5;
export const MIN_CLUSTER = 5;

export type SymId = "pearl" | "trident" | "crown" | "eye" | "amphora" | "conch" | "crystal" | "scale" | "wild" | "scatter";
export type PayId = Exclude<SymId, "wild" | "scatter">;

/** High to low. The cluster finder walks this order, so rarer symbols claim shared wilds first. */
export const PAYING: PayId[] = ["pearl", "trident", "crown", "eye", "amphora", "conch", "crystal", "scale"];

/** Pay in multiples of the bet for clusters of 5-6, 7-8, 9-11, 12-14 and 15+ symbols. */
export const PAY: Record<PayId, [number, number, number, number, number]> = {
  pearl: [1.5, 4, 12, 40, 120],
  trident: [1.2, 3, 9, 30, 90],
  crown: [1, 2.5, 7, 22, 70],
  eye: [0.8, 2, 5, 16, 50],
  amphora: [0.5, 1.2, 3, 10, 30],
  conch: [0.4, 1, 2.5, 8, 24],
  crystal: [0.3, 0.8, 2, 6, 18],
  scale: [0.2, 0.5, 1.5, 4, 12],
};

export const SIZE_BUCKETS = ["5-6", "7-8", "9-11", "12-14", "15+"] as const;

export function bucketOf(size: number): number {
  return size >= 15 ? 4 : size >= 12 ? 3 : size >= 9 ? 2 : size >= 7 ? 1 : 0;
}
export function payFor(sym: PayId, size: number): number {
  return PAY[sym][bucketOf(size)];
}

export type Grid = SymId[][]; // [col][row], row 0 is the top
export type Cell = [number, number]; // [col, row]

export interface Cluster {
  sym: PayId;
  cells: Cell[];
  size: number;
  /** Pay in multiples of the bet, before any cascade multiplier. */
  pay: number;
}

export interface Step {
  clusters: Cluster[];
  /** New symbols dropped into each column after the clusters vanish, topmost first. */
  fills: SymId[][];
}

export interface Spin {
  initial: Grid;
  steps: Step[];
  scatters: number;
}

export interface Spec {
  scatters: number;
  clump: number;
  wilds: number;
  maxSteps: number;
}

/* ------------------------------ rng ------------------------------ */
export function rngFrom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const WEIGHTS: [PayId, number][] = [
  ["scale", 16],
  ["crystal", 15],
  ["conch", 14],
  ["amphora", 13],
  ["eye", 10],
  ["crown", 8],
  ["trident", 7],
  ["pearl", 6],
];
const WEIGHT_SUM = WEIGHTS.reduce((s, [, w]) => s + w, 0);

function pickSym(rng: () => number, spec: Spec, near: (SymId | undefined)[]): SymId {
  if (rng() < spec.wilds) return "wild";
  const ok = near.filter((s): s is PayId => !!s && s !== "wild" && s !== "scatter");
  if (ok.length && rng() < spec.clump) return ok[Math.floor(rng() * ok.length)];
  let r = rng() * WEIGHT_SUM;
  for (const [s, w] of WEIGHTS) {
    r -= w;
    if (r <= 0) return s;
  }
  return "scale";
}

/* ------------------------------ clusters ------------------------------ */
const DIRS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function findClusters(grid: Grid): Cluster[] {
  const out: Cluster[] = [];
  const claimedWild = new Set<string>();
  for (const sym of PAYING) {
    const seen = new Set<string>();
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const k0 = `${c}:${r}`;
        if (grid[c][r] !== sym || seen.has(k0)) continue;
        const cells: Cell[] = [];
        const stack: Cell[] = [[c, r]];
        seen.add(k0);
        const wilds: string[] = [];
        while (stack.length) {
          const [x, y] = stack.pop() as Cell;
          cells.push([x, y]);
          for (const [dx, dy] of DIRS) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
            const k = `${nx}:${ny}`;
            if (seen.has(k)) continue;
            const s = grid[nx][ny];
            if (s === sym || (s === "wild" && !claimedWild.has(k))) {
              seen.add(k);
              if (s === "wild") wilds.push(k);
              stack.push([nx, ny]);
            }
          }
        }
        if (cells.length >= MIN_CLUSTER) {
          wilds.forEach((k) => claimedWild.add(k));
          out.push({ sym, cells, size: cells.length, pay: payFor(sym, cells.length) });
        } else {
          // a wild that did not make a cluster stays free for another symbol
          wilds.forEach((k) => seen.delete(k));
        }
      }
    }
  }
  return out;
}

/* ------------------------------ simulation ------------------------------ */
export function buildSpin(seed: number, spec: Spec): Spin {
  const rng = rngFrom(seed);
  const scatterAt = new Set<string>();
  while (scatterAt.size < spec.scatters) scatterAt.add(`${Math.floor(rng() * COLS)}:${Math.floor(rng() * ROWS)}`);

  const grid: Grid = Array.from({ length: COLS }, () => Array<SymId>(ROWS).fill("scale"));
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS; r++) {
      grid[c][r] = scatterAt.has(`${c}:${r}`) ? "scatter" : pickSym(rng, spec, [c > 0 ? grid[c - 1][r] : undefined, r > 0 ? grid[c][r - 1] : undefined]);
    }
  }
  const initial = grid.map((col) => col.slice());
  const steps: Step[] = [];
  let cur = grid;
  for (let i = 0; i < spec.maxSteps; i++) {
    const clusters = findClusters(cur);
    if (!clusters.length) break;
    const gone = new Set(clusters.flatMap((cl) => cl.cells.map(([c, r]) => `${c}:${r}`)));
    const next: Grid = [];
    const fills: SymId[][] = [];
    for (let c = 0; c < COLS; c++) {
      const survivors = cur[c].filter((_, r) => !gone.has(`${c}:${r}`));
      const k = ROWS - survivors.length;
      const col: SymId[] = [];
      for (let j = 0; j < k; j++) {
        const left = c > 0 ? next[c - 1][j] : undefined;
        const above = j > 0 ? col[j - 1] : undefined;
        col.push(pickSym(rng, spec, [left, above]));
      }
      fills.push(col.slice());
      next.push(col.concat(survivors));
    }
    steps.push({ clusters, fills });
    cur = next;
  }
  return { initial, steps, scatters: spec.scatters };
}

/* ------------------------------ payout ------------------------------ */
export type Tier = "none" | "normal" | "big" | "super" | "mega" | "jackpot";

export function tierOf(x: number): Tier {
  return x >= 100 ? "jackpot" : x >= 50 ? "mega" : x >= 25 ? "super" : x >= 10 ? "big" : x > 0 ? "normal" : "none";
}

/** The cascade multiplier a winning step is paid at in the base game: x1, x2, x3 ... capped at x10. */
export const baseMult = (stepIndex: number) => Math.min(10, stepIndex + 1);
export const FREE_MULT_CAP = 25;

/** Total win in multiples of the bet. In free spins the multiplier carries over and grows by one per winning step. */
export function totalX(spin: Spin, startMult = 0): number {
  let m = startMult;
  let total = 0;
  spin.steps.forEach((s, i) => {
    const mult = startMult ? Math.min(FREE_MULT_CAP, m) : baseMult(i);
    total += s.clusters.reduce((a, c) => a + c.pay, 0) * mult;
    m++;
  });
  return total;
}

export function pointsOf(x: number, bet: number): number {
  return Math.round(x * bet);
}

export const FREE_SPINS_FOR = (scatters: number) => (scatters >= 6 ? 15 : scatters === 5 ? 12 : 8);
