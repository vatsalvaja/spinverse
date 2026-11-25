/**
 * Scripted demo outcomes for Pharaoh's Fortune.
 *
 * Nothing here is random or a real game algorithm: the screen plays these predefined grids in order so every
 * kind of moment (no win, line wins, a scatter tease, the bonus, each celebration level up to the jackpot)
 * can be seen. `evaluate` only reads a fixed grid and works out which paylines it completes, so the grids
 * and their results can never disagree. A real result source can later replace `nextOutcome` without any
 * change to the UI, which only reads the `Outcome` shape.
 */
import type { SymbolId } from "./symbols";

export const REELS = 5;
export const ROWS = 3;

export const BET_STEPS = [10, 20, 50, 100, 250, 500];
export const DEFAULT_BET_INDEX = 1;

/** Five paylines. Each lists the row (0 top, 2 bottom) used on every reel. */
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // 1 middle
  [0, 0, 0, 0, 0], // 2 top
  [2, 2, 2, 2, 2], // 3 bottom
  [0, 1, 2, 1, 0], // 4 V
  [2, 1, 0, 1, 2], // 5 inverted V
];

type Paying = Exclude<SymbolId, "pharaoh" | "scarab">;

/** Demo multipliers of the bet for 3, 4 and 5 matching symbols (left to right, Pharaoh substitutes). */
export const PAYTABLE: Record<Paying, Record<3 | 4 | 5, number>> = {
  anubis: { 3: 4, 4: 12, 5: 40 },
  horus: { 3: 4, 4: 12, 5: 40 },
  sphinx: { 3: 4, 4: 12, 5: 40 },
  temple: { 3: 2, 4: 5, 5: 15 },
  coin: { 3: 2, 4: 5, 5: 15 },
  jewel: { 3: 2, 4: 5, 5: 15 },
};

/** Five Pharaohs on one payline: the demo jackpot. */
export const JACKPOT_MULTIPLIER = 1000;

/** Demo scatter rewards by number of Golden Scarabs on screen. */
export const SCATTER_TABLE: Record<3 | 4, { multiplier: number; freeSpins: number }> = {
  3: { multiplier: 5, freeSpins: 10 },
  4: { multiplier: 20, freeSpins: 15 },
};

export type OutcomeKind = "none" | "win" | "scatter-tease" | "bonus";
export type WinLevel = "none" | "nice" | "big" | "super" | "mega" | "jackpot";

/** Celebration level by total line-win multiplier of the bet. */
export const LEVEL_THRESHOLDS: { level: WinLevel; from: number }[] = [
  { level: "jackpot", from: JACKPOT_MULTIPLIER },
  { level: "mega", from: 80 },
  { level: "super", from: 30 },
  { level: "big", from: 10 },
  { level: "nice", from: 0.0001 },
];

export interface LineWin {
  symbol: SymbolId;
  /** Matching symbols counted from the first reel. */
  count: 3 | 4 | 5;
  /** Index into PAYLINES. */
  line: number;
  multiplier: number;
}

export interface Outcome {
  id: string;
  kind: OutcomeKind;
  /** Row-major grid: rows[row][reel]. */
  rows: SymbolId[][];
  lineWins: LineWin[];
  /** Number of Golden Scarabs in the grid. */
  scatters: number;
  /** Total line-win multiplier of the bet (scatter prizes are separate). */
  multiplier: number;
  level: WinLevel;
  headline: string;
}

const K: Record<string, SymbolId> = { P: "pharaoh", S: "scarab", A: "anubis", H: "horus", X: "sphinx", T: "temple", C: "coin", J: "jewel" };
const grid = (...lines: string[]): SymbolId[][] => lines.map((l) => l.split(" ").map((c) => K[c]));

/** Which paylines does this grid complete? Pharaoh substitutes for everything except the Scarab. */
export function evaluate(rows: SymbolId[][]): LineWin[] {
  const out: LineWin[] = [];
  PAYLINES.forEach((pl, line) => {
    const syms = pl.map((row, reel) => rows[row][reel]);
    if (syms[0] === "scarab") return;
    if (syms.every((s) => s === "pharaoh")) {
      out.push({ symbol: "pharaoh", count: 5, line, multiplier: JACKPOT_MULTIPLIER });
      return;
    }
    const base = syms.find((s) => s !== "pharaoh");
    if (!base || base === "scarab") return;
    let count = 0;
    for (const s of syms) {
      if (s === base || s === "pharaoh") count++;
      else break;
    }
    if (count >= 3) out.push({ symbol: base, count: count as 3 | 4 | 5, line, multiplier: PAYTABLE[base as Paying][count as 3 | 4 | 5] });
  });
  return out;
}

const WORD = ["", "", "Two", "Three", "Four", "Five"];
const PLURAL: Record<SymbolId, string> = { pharaoh: "Pharaohs", scarab: "Golden Scarabs", anubis: "Anubis", horus: "Eyes of Horus", sphinx: "Golden Sphinxes", temple: "Ancient Temples", coin: "Golden Coins", jewel: "Ancient Jewels" };

function levelFor(m: number, jackpot: boolean): WinLevel {
  if (jackpot) return "jackpot";
  return LEVEL_THRESHOLDS.find((t) => m >= t.from)?.level ?? "none";
}

function make(id: string, rows: SymbolId[][]): Outcome {
  const lineWins = evaluate(rows);
  const scatters = rows.flat().filter((s) => s === "scarab").length;
  const multiplier = lineWins.reduce((s, w) => s + w.multiplier, 0);
  const jackpot = lineWins.some((w) => w.symbol === "pharaoh");
  const best = [...lineWins].sort((a, b) => b.multiplier - a.multiplier)[0];
  const kind: OutcomeKind = scatters >= 3 ? "bonus" : scatters === 2 ? "scatter-tease" : lineWins.length ? "win" : "none";
  const headline =
    kind === "bonus"
      ? `${WORD[scatters]} Golden Scarabs open the chamber`
      : kind === "scatter-tease"
        ? "Two Golden Scarabs"
        : best
          ? lineWins.length > 1
            ? `${lineWins.length} winning lines`
            : `${WORD[best.count]} ${PLURAL[best.symbol]}`
          : "No win this time";
  return { id, kind, rows, lineWins, scatters, multiplier, level: levelFor(multiplier, jackpot), headline };
}

/** What the reels show before the first spin. */
export const START_ROWS = grid("H T A J C", "X S P T A", "J C T H X");

const COINS = make("coins-3", grid("A T J H X", "C P C X J", "H J T A T"));
const QUIET_A = make("quiet-a", grid("T H J C A", "X A T J H", "J C X T C"));
const TEASE = make("scarab-tease", grid("J S X C T", "A H C T J", "T X J S A"));
const ANUBIS4 = make("anubis-4", grid("A A P A J", "T H X C T", "J C T X H"));
const BONUS_3 = make("bonus-3", grid("S H T X A", "C J S T H", "X A J C S"));
const QUIET_B = make("quiet-b", grid("H X T A J", "J T C H X", "C A H J T"));
const VLINE = make("v-line", grid("T J C A H", "X T H J C", "A H T X J"));
const SPHINX5 = make("sphinx-5", grid("T J A C H", "H T J A C", "X X X P X"));
const TWO_LINES = make("two-lines", grid("J J P T A", "X A H J T", "C C C T J"));
const BONUS_4 = make("bonus-4", grid("T S H A J", "S C X T S", "J A S H C"));
const MEGA = make("mega-double", grid("H H H P H", "C T J X T", "A A A A A"));
const QUIET_C = make("quiet-c", grid("J X H C T", "T A X J H", "H C J T A"));
const JACKPOT = make("jackpot", grid("A T H X J", "P P P P P", "J C T A H"));

/** The base game plays these in order, then starts over. */
export const BASE_SEQUENCE: Outcome[] = [COINS, QUIET_A, TEASE, ANUBIS4, BONUS_3, QUIET_B, VLINE, SPHINX5, TWO_LINES, BONUS_4, MEGA, QUIET_C, JACKPOT];

/** Free spins play these in order. They never contain scatters, so the bonus cannot retrigger. */
export const FREE_SEQUENCE: Outcome[] = [TWO_LINES, VLINE, QUIET_B, ANUBIS4, COINS, QUIET_A];

export function nextOutcome(sequence: Outcome[], index: number): Outcome {
  return sequence[index % sequence.length];
}

/** Outcome grid by reel: byReel[reel][row]. */
export function gridByReel(o: Outcome): SymbolId[][] {
  return Array.from({ length: REELS }, (_, reel) => o.rows.map((row) => row[reel]));
}

export function scatterReward(o: Outcome): { multiplier: number; freeSpins: number } | null {
  if (o.scatters >= 4) return SCATTER_TABLE[4];
  if (o.scatters === 3) return SCATTER_TABLE[3];
  return null;
}

/** Cells ("reel:row") that one winning line covers. */
export function lineCells(w: LineWin): Set<string> {
  const out = new Set<string>();
  for (let reel = 0; reel < w.count; reel++) out.add(`${reel}:${PAYLINES[w.line][reel]}`);
  return out;
}

/** Cells ("reel:row") covered by any winning line. */
export function winCells(o: Outcome): Set<string> {
  const out = new Set<string>();
  o.lineWins.forEach((w) => lineCells(w).forEach((c) => out.add(c)));
  return out;
}

/** Cells ("reel:row") that hold a Golden Scarab. */
export function scatterCells(o: Outcome): Set<string> {
  const out = new Set<string>();
  o.rows.forEach((row, r) => row.forEach((s, reel) => s === "scarab" && out.add(`${reel}:${r}`)));
  return out;
}
