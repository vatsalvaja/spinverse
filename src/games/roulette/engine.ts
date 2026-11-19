/**
 * European Roulette engine. Pure TypeScript with no React or DOM.
 *
 * - 37 pockets in the European wheel order, single zero. Colours: 0 green, 18 red, 18 black.
 * - The winning number is drawn from a secure random source at the moment SPIN is accepted. The draw is a plain
 *   uniform pick over the 37 pockets and never looks at the bets, and the animation only ever replays that result.
 * - Bets are evaluated against the winning number, never against anything the wheel animation does.
 * - The stake is deducted once when the spin starts and the round settles exactly once.
 *
 * Phases: betting -> spinning -> result -> betting. Free demo credits only: nothing here touches a wallet.
 */

/** The European wheel, clockwise from the zero. */
export const POCKETS: readonly number[] = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
export const POCKET_COUNT = POCKETS.length;

const RED_LIST = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
export const RED: ReadonlySet<number> = new Set(RED_LIST);
export type Color = "green" | "red" | "black";
export const colorOf = (n: number): Color => (n === 0 ? "green" : RED.has(n) ? "red" : "black");
export const pocketIndex = (n: number) => POCKETS.indexOf(n);

export type BetType = "straight" | "split" | "street" | "corner" | "sixline" | "dozen" | "column" | "red" | "black" | "odd" | "even" | "low" | "high";

/** Net winnings per unit staked (the winning stake itself is returned on top of this). */
export const PAYOUT: Record<BetType, number> = {
  straight: 35,
  split: 17,
  street: 11,
  corner: 8,
  sixline: 5,
  dozen: 2,
  column: 2,
  red: 1,
  black: 1,
  odd: 1,
  even: 1,
  low: 1,
  high: 1,
};

export const CHIPS = [1, 5, 10, 25, 100] as const;
export const MAX_PER_POSITION = 10000;
export const SPIN_MS = 9000;
export const RESULT_MS = 4600;
export const HISTORY_MAX = 20;

export interface BetDef {
  id: string;
  type: BetType;
  numbers: number[];
  label: string;
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const sortNum = (a: number[]) => [...a].sort((x, y) => x - y);
const street = (n: number) => Math.ceil(n / 3);

const NAMES: Partial<Record<BetType, string>> = { red: "Red", black: "Black", odd: "Odd", even: "Even", low: "1 to 18", high: "19 to 36" };

/** Resolve a bet id to the numbers it covers, or null if it isn't a legal position on a European layout. */
export function betDef(id: string): BetDef | null {
  const [kind, arg = ""] = id.split(":");
  const nums = arg ? arg.split("-").map(Number) : [];
  if (nums.some((n) => !Number.isInteger(n))) return null;
  switch (kind) {
    case "straight":
      return nums.length === 1 && nums[0] >= 0 && nums[0] <= 36 ? { id: `straight:${nums[0]}`, type: "straight", numbers: [nums[0]], label: `Straight ${nums[0]}` } : null;
    case "split": {
      if (nums.length !== 2) return null;
      const [a, b] = sortNum(nums);
      const ok = a === 0 ? b >= 1 && b <= 3 : a >= 1 && b <= 36 && (b - a === 3 || (b - a === 1 && street(a) === street(b)));
      return ok ? { id: `split:${a}-${b}`, type: "split", numbers: [a, b], label: `Split ${a}/${b}` } : null;
    }
    case "street": {
      const a = nums[0];
      return nums.length === 1 && a >= 1 && a <= 34 && a % 3 === 1 ? { id: `street:${a}`, type: "street", numbers: range(a, a + 2), label: `Street ${a}-${a + 2}` } : null;
    }
    case "corner": {
      const a = nums[0];
      return nums.length === 1 && a >= 1 && a <= 32 && a % 3 !== 0 ? { id: `corner:${a}`, type: "corner", numbers: [a, a + 1, a + 3, a + 4], label: `Corner ${a}/${a + 1}/${a + 3}/${a + 4}` } : null;
    }
    case "sixline": {
      const a = nums[0];
      return nums.length === 1 && a >= 1 && a <= 31 && a % 3 === 1 ? { id: `sixline:${a}`, type: "sixline", numbers: range(a, a + 5), label: `Six line ${a}-${a + 5}` } : null;
    }
    case "dozen": {
      const d = nums[0];
      return nums.length === 1 && d >= 1 && d <= 3 ? { id: `dozen:${d}`, type: "dozen", numbers: range(d * 12 - 11, d * 12), label: ["1st 12", "2nd 12", "3rd 12"][d - 1] } : null;
    }
    case "column": {
      const c = nums[0];
      return nums.length === 1 && c >= 1 && c <= 3 ? { id: `column:${c}`, type: "column", numbers: range(1, 36).filter((n) => n % 3 === c % 3), label: `${["1st", "2nd", "3rd"][c - 1]} column` } : null;
    }
    case "red":
      return { id: "red", type: "red", numbers: RED_LIST.slice(), label: NAMES.red! };
    case "black":
      return { id: "black", type: "black", numbers: range(1, 36).filter((n) => !RED.has(n)), label: NAMES.black! };
    case "odd":
      return { id: "odd", type: "odd", numbers: range(1, 36).filter((n) => n % 2 === 1), label: NAMES.odd! };
    case "even":
      return { id: "even", type: "even", numbers: range(1, 36).filter((n) => n % 2 === 0), label: NAMES.even! };
    case "low":
      return { id: "low", type: "low", numbers: range(1, 18), label: NAMES.low! };
    case "high":
      return { id: "high", type: "high", numbers: range(19, 36), label: NAMES.high! };
    default:
      return null;
  }
}

/** Uniform random integer in [0, n) from the platform's secure generator (Math.random only if there is none). */
export function secureInt(n: number): number {
  const c = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (c?.getRandomValues) {
    const max = Math.floor(0x100000000 / n) * n; // rejection sampling: no modulo bias
    const buf = new Uint32Array(1);
    do c.getRandomValues(buf);
    while (buf[0] >= max);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Placement {
  id: string;
  amount: number;
}

export interface SettledLine {
  id: string;
  label: string;
  type: BetType;
  amount: number;
  won: boolean;
  /** net winnings on this bet (0 if lost) */
  winnings: number;
  /** what comes back to the player for this bet: stake + winnings, or 0 */
  returned: number;
}

export interface Settlement {
  round: number;
  winning: number;
  color: Color;
  totalStake: number;
  totalReturned: number;
  net: number;
  lines: SettledLine[];
}

export type Phase = "betting" | "spinning" | "result";

export interface Snapshot {
  v: number;
  phase: Phase;
  round: number;
  balance: number;
  chip: number;
  /** current positions with the total chips on each, in the order first placed */
  bets: Placement[];
  totalStake: number;
  /** newest first, at most HISTORY_MAX */
  history: number[];
  /** known only once the round has settled */
  result: Settlement | null;
  /** the most recent settled round, kept for the Last Win panel */
  last: Settlement | null;
  canRepeat: boolean;
  note: string;
}

export interface SpinPlan {
  winning: number;
  /** index of the winning pocket in POCKETS */
  index: number;
  startedAt: number;
}

export type EngineEvent =
  | { type: "chip" }
  | { type: "undo" }
  | { type: "clear" }
  | { type: "reject" }
  | { type: "spin"; plan: SpinPlan }
  | { type: "result"; result: Settlement }
  | { type: "open" };

export class RouletteEngine {
  onEvent?: (e: EngineEvent) => void;

  private listeners = new Set<() => void>();
  private snap: Snapshot;
  private phase: Phase = "betting";
  private phaseStart = 0;
  private started = false;
  private round = 1;
  private balance: number;
  private chip: number = CHIPS[1];
  /** every chip placed this round, in order (undo pops from here) */
  private stack: Placement[] = [];
  private lastRound: Placement[] = [];
  private history: number[] = [];
  private plan: SpinPlan | null = null;
  private result: Settlement | null = null;
  private last: Settlement | null = null;
  private note = "";
  private v = 0;
  private settled = false;
  private rand: (n: number) => number;

  constructor(startBalance: number, rand: (n: number) => number = secureInt) {
    this.balance = round2(startBalance);
    this.rand = rand;
    this.snap = this.build();
  }

  /* ---------------------------- React bridge ---------------------------- */
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getSnapshot = () => this.snap;
  getServerSnapshot = () => this.snap;

  private aggregate(): Placement[] {
    const m = new Map<string, number>();
    for (const p of this.stack) m.set(p.id, round2((m.get(p.id) ?? 0) + p.amount));
    return Array.from(m, ([id, amount]) => ({ id, amount }));
  }
  private total() {
    return round2(this.stack.reduce((s, p) => s + p.amount, 0));
  }

  private build(): Snapshot {
    return {
      v: this.v,
      phase: this.phase,
      round: this.round,
      balance: this.balance,
      chip: this.chip,
      bets: this.aggregate(),
      totalStake: this.total(),
      history: this.history,
      result: this.phase === "result" ? this.result : null,
      last: this.last,
      canRepeat: this.phase === "betting" && this.lastRound.length > 0,
      note: this.note,
    };
  }
  private emit() {
    this.v++;
    this.snap = this.build();
    this.listeners.forEach((l) => l());
  }
  private fire(e: EngineEvent) {
    this.onEvent?.(e);
  }

  /* ------------------------------ the clock ------------------------------ */
  /** Advance the machine to `now` (a performance.now() timestamp). Safe to call as often as you like. */
  tick(now: number) {
    if (!this.started) {
      this.started = true;
      this.phaseStart = now;
    }
    let changed = false;
    for (let guard = 0; guard < 4; guard++) {
      const elapsed = now - this.phaseStart;
      if (this.phase === "spinning" && elapsed >= SPIN_MS) {
        this.settle(this.phaseStart + SPIN_MS);
        changed = true;
      } else if (this.phase === "result" && elapsed >= RESULT_MS) {
        this.reopen(this.phaseStart + RESULT_MS);
        changed = true;
      } else break;
    }
    if (changed) this.emit();
  }

  /** Milliseconds since the spin began (0 outside a spin). The animation reads this; it never writes anything back. */
  spinElapsed(now: number) {
    return this.phase === "spinning" || this.phase === "result" ? now - (this.plan?.startedAt ?? now) : 0;
  }
  get currentSpin() {
    return this.plan;
  }
  get currentPhase() {
    return this.phase;
  }

  /* ------------------------------ settlement ------------------------------ */
  /** Evaluate every bet against the winning number and pay out. Runs once per round (guarded). */
  private settle(at: number) {
    if (this.settled || !this.plan) return;
    this.settled = true;
    const winning = this.plan.winning;
    const lines: SettledLine[] = [];
    for (const p of this.aggregate()) {
      const def = betDef(p.id);
      if (!def) continue;
      const won = def.numbers.includes(winning);
      const winnings = won ? round2(p.amount * PAYOUT[def.type]) : 0;
      lines.push({ id: p.id, label: def.label, type: def.type, amount: p.amount, won, winnings, returned: won ? round2(p.amount + winnings) : 0 });
    }
    const totalStake = round2(lines.reduce((s, l) => s + l.amount, 0));
    const totalReturned = round2(lines.reduce((s, l) => s + l.returned, 0));
    this.balance = round2(this.balance + totalReturned);
    const result: Settlement = { round: this.round, winning, color: colorOf(winning), totalStake, totalReturned, net: round2(totalReturned - totalStake), lines };
    this.result = result;
    this.last = result;
    this.history = [winning, ...this.history].slice(0, HISTORY_MAX);
    this.lastRound = this.stack.map((p) => ({ ...p }));
    this.phase = "result";
    this.phaseStart = at;
    this.note = "";
    this.fire({ type: "result", result });
  }

  private reopen(at: number) {
    this.stack = [];
    this.plan = null;
    this.result = null;
    this.settled = false;
    this.round++;
    this.phase = "betting";
    this.phaseStart = at;
    this.note = "";
    this.fire({ type: "open" });
  }

  /* ------------------------------ player actions ------------------------------ */
  private get open() {
    return this.phase === "betting";
  }

  setChip(value: number) {
    if ((CHIPS as readonly number[]).includes(value)) {
      this.chip = value;
      this.emit();
    }
  }

  /** Put the selected chip on a position. Refused once betting has closed or if it would overspend. */
  place(id: string, amount: number = this.chip): boolean {
    const def = betDef(id);
    if (!this.open || !def || !(amount > 0)) return this.reject("");
    const onSpot = this.aggregate().find((p) => p.id === def.id)?.amount ?? 0;
    if (onSpot + amount > MAX_PER_POSITION) return this.reject("That position is at the table limit.");
    if (this.total() + amount > this.balance) return this.reject("Not enough demo credits for that chip.");
    this.stack.push({ id: def.id, amount });
    this.note = "";
    this.fire({ type: "chip" });
    this.emit();
    return true;
  }

  undo(): boolean {
    if (!this.open || !this.stack.length) return false;
    this.stack.pop();
    this.note = "";
    this.fire({ type: "undo" });
    this.emit();
    return true;
  }

  clear(): boolean {
    if (!this.open || !this.stack.length) return false;
    this.stack = [];
    this.note = "";
    this.fire({ type: "clear" });
    this.emit();
    return true;
  }

  /** Replace the table with last round's bets, if the balance still covers them. */
  repeat(): boolean {
    if (!this.open || !this.lastRound.length) return false;
    const total = round2(this.lastRound.reduce((s, p) => s + p.amount, 0));
    if (total > this.balance) return this.reject("Not enough demo credits to repeat those bets.");
    this.stack = this.lastRound.map((p) => ({ ...p }));
    this.note = "";
    this.fire({ type: "chip" });
    this.emit();
    return true;
  }

  /**
   * Close betting and spin. The stake leaves the balance once, here, and the winning number is drawn here,
   * before any animation, from a plain uniform pick that does not look at the bets.
   */
  spin(now: number): boolean {
    this.tick(now);
    if (!this.open) return false;
    const stake = this.total();
    if (stake <= 0) return this.reject("Place at least one chip before spinning.");
    if (stake > this.balance) return this.reject("Not enough demo credits for that stake.");
    const winning = POCKETS[this.rand(POCKET_COUNT)];
    this.balance = round2(this.balance - stake);
    this.plan = { winning, index: pocketIndex(winning), startedAt: now };
    this.result = null;
    this.settled = false;
    this.phase = "spinning";
    this.phaseStart = now;
    this.note = "";
    this.fire({ type: "spin", plan: this.plan });
    this.emit();
    return true;
  }

  resetBalance(to: number) {
    if (!this.open || this.stack.length) return;
    this.balance = round2(to);
    this.emit();
  }

  private reject(note: string) {
    if (note) {
      this.note = note;
      this.emit();
    }
    this.fire({ type: "reject" });
    return false;
  }
}
