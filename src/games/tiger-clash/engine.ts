/**
 * TIGER CLASH game engine. Pure TypeScript with no React or DOM, so it can be reasoned about (and tested) alone.
 *
 * Rules: one card for Tiger, one for Dragon, from a standard 52-card deck. Ace is high (2-10 face value, J 11,
 * Q 12, K 13, A 14). Higher rank wins, equal rank is a Tie. The player backs Tiger, Dragon or Tie with free demo
 * credits. The cards are drawn from a shuffled deck at the START of each round, before any selection is made,
 * and nothing in the engine ever reads the selection when drawing, so the result cannot depend on it.
 *
 * Round state machine (one timer-driven walk, so phases can never overlap):
 *   waiting -> selection -> locked -> tigerReveal -> suspense -> dragonReveal -> result -> nextRound -> selection ...
 */

export type Side = "tiger" | "dragon" | "tie";
export type Suit = "S" | "H" | "D" | "C";
export type Phase = "waiting" | "selection" | "locked" | "tigerReveal" | "suspense" | "dragonReveal" | "result" | "nextRound";

export interface Card {
  id: string;
  rank: number; // 2..14
  suit: Suit;
}

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANK_LABEL: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
export const RANK_NAME: Record<number, string> = { 11: "Jack", 12: "Queen", 13: "King", 14: "Ace" };
export const rankLabel = (r: number) => RANK_LABEL[r] ?? String(r);
export const rankName = (r: number) => RANK_NAME[r] ?? String(r);

/** Phase lengths in ms. A full round is about 19 seconds. */
export const T = {
  waiting: 1500,
  selection: 5000,
  locked: 1300,
  tigerReveal: 1500,
  suspense: 1700,
  dragonReveal: 1500,
  result: 7000,
  nextRound: 1200,
} as const;

/** Moments inside the result phase (ms after it begins) that the sound and effects hang on. */
export const BEATS = {
  announce: 500,
  roar: 700,
  fire: 1200,
  lightning1: 1400,
  lightning2: 2500,
  defeat: 800,
  clash: 1900,
  fanfare: 3700,
} as const;

export const MIN_STAKE = 1;
export const MAX_STAKE = 10000;
/** payouts, as a multiple of the stake returned */
export const PAYOUT = { win: 2, tie: 9, tieSurrender: 0.5 } as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ------------------------------ deck and draw ------------------------------ */

/** Uniform random integer in [0, n) from the platform's secure generator (falls back to Math.random if unavailable). */
export function secureInt(n: number): number {
  const c = typeof globalThis !== "undefined" ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (c?.getRandomValues) {
    // rejection sampling so there is no modulo bias
    const max = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do c.getRandomValues(buf);
    while (buf[0] >= max);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}

export function freshDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (let rank = 2; rank <= 14; rank++) deck.push({ id: `${rank}${suit}`, rank, suit });
  return deck;
}

/** Fisher-Yates shuffle. */
export function shuffle(cards: Card[], rand: (n: number) => number = secureInt): Card[] {
  const a = cards.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function compareCards(tiger: Card, dragon: Card): Side {
  return tiger.rank > dragon.rank ? "tiger" : tiger.rank < dragon.rank ? "dragon" : "tie";
}

/** What a bet returns to the player (not net): 0 for a loss. */
export function payoutFor(pick: Side, stake: number, winner: Side): number {
  if (pick === winner) return round2(stake * (pick === "tie" ? PAYOUT.tie : PAYOUT.win));
  if (winner === "tie") return round2(stake * PAYOUT.tieSurrender); // Tiger/Dragon bets lose half when the cards tie
  return 0;
}

/* ------------------------------ state ------------------------------ */

export interface Bet {
  side: Side;
  stake: number;
}

export interface RoundRecord {
  round: number;
  tiger: Card;
  dragon: Card;
  winner: Side;
  pick: Side | null;
  stake: number;
  payout: number;
  net: number;
}

export interface Snapshot {
  v: number;
  phase: Phase;
  round: number;
  /** whole seconds left to choose (selection phase) */
  countdown: number;
  /** 0..1 of the selection window used */
  countdownProgress: number;
  /** cards are on the table face-down (from lock until the round ends) */
  dealt: boolean;
  /** only filled in once that card has been revealed */
  tigerCard: Card | null;
  dragonCard: Card | null;
  /** known only once both cards are up (result phase onward) */
  winner: Side | null;
  pending: Side | null;
  stake: number;
  bet: Bet | null;
  balance: number;
  history: RoundRecord[];
  /** settled result of the round that just finished (shown in the summary) */
  last: RoundRecord | null;
  deckLeft: number;
  note: string;
}

export type EngineEvent =
  | { type: "selectionStart"; round: number }
  | { type: "tick"; n: number }
  | { type: "pick"; side: Side }
  | { type: "place"; bet: Bet }
  | { type: "cancel" }
  | { type: "lock"; hasBet: boolean }
  | { type: "tigerReveal" }
  | { type: "suspense" }
  | { type: "dragonReveal" }
  | { type: "impact"; who: "tiger" | "dragon" }
  | { type: "result"; winner: Side; record: RoundRecord }
  | { type: "beat"; name: keyof typeof BEATS; winner: Side }
  | { type: "nextRound" }
  | { type: "shuffle" };

export class TigerClashEngine {
  onEvent?: (e: EngineEvent) => void;
  /** ms since the current phase began (for renderers) */
  phaseMs = 0;

  private listeners = new Set<() => void>();
  private snap: Snapshot;
  private phase: Phase = "waiting";
  private phaseStart = 0;
  private started = false;
  private round = 0;
  private deck: Card[] = [];
  /** the hidden pair for this round, drawn when the round opens and never touched by the player's choices */
  private tiger: Card | null = null;
  private dragon: Card | null = null;
  private winner: Side | null = null;
  private pending: Side | null = null;
  private stake = 50;
  private bet: Bet | null = null;
  private balance: number;
  private history: RoundRecord[] = [];
  private last: RoundRecord | null = null;
  private note = "";
  private v = 0;
  private lastCountdown = -1;
  private lastNotify = 0;
  private flags = { tigerImpact: false, dragonImpact: false, beats: new Set<string>() };
  private settled = false;
  private recorded = false;
  private rand: (n: number) => number;

  constructor(startBalance: number, rand: (n: number) => number = secureInt) {
    this.balance = round2(startBalance);
    this.rand = rand;
    this.deck = shuffle(freshDeck(), this.rand);
    this.snap = this.build(0);
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

  private revealedTiger() {
    return this.phase === "tigerReveal" || this.phase === "suspense" || this.phase === "dragonReveal" || this.phase === "result" || this.phase === "nextRound";
  }
  private revealedDragon() {
    return this.phase === "dragonReveal" || this.phase === "result" || this.phase === "nextRound";
  }

  private build(now: number): Snapshot {
    const left = Math.max(0, T.selection - (now - this.phaseStart));
    const inRound = this.phase !== "waiting" && this.phase !== "selection";
    return {
      v: this.v,
      phase: this.phase,
      round: this.round,
      countdown: this.phase === "selection" ? Math.ceil(left / 1000) : 0,
      countdownProgress: this.phase === "selection" && this.started ? 1 - left / T.selection : 0,
      dealt: inRound && this.phase !== "nextRound",
      tigerCard: this.revealedTiger() ? this.tiger : null,
      dragonCard: this.revealedDragon() ? this.dragon : null,
      winner: this.phase === "result" || this.phase === "nextRound" ? this.winner : null,
      pending: this.pending,
      stake: this.stake,
      bet: this.bet,
      balance: this.balance,
      history: this.history,
      last: this.last,
      deckLeft: this.deck.length,
      note: this.note,
    };
  }

  private emit(now: number, force = true) {
    if (!force && now - this.lastNotify < 80) return;
    this.lastNotify = now;
    this.v++;
    this.snap = this.build(now);
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
      this.emit(now);
    }
    let changed = false;
    for (let guard = 0; guard < 12; guard++) {
      const elapsed = now - this.phaseStart;
      this.phaseMs = elapsed;
      const len = T[this.phase];
      if (this.phase === "selection") {
        const n = Math.ceil((T.selection - elapsed) / 1000);
        if (n !== this.lastCountdown && n >= 1 && n <= 3) this.fire({ type: "tick", n });
        this.lastCountdown = n;
      }
      if (this.phase === "tigerReveal" && !this.flags.tigerImpact && elapsed >= 650) {
        this.flags.tigerImpact = true;
        this.fire({ type: "impact", who: "tiger" });
      }
      if (this.phase === "dragonReveal" && !this.flags.dragonImpact && elapsed >= 650) {
        this.flags.dragonImpact = true;
        this.fire({ type: "impact", who: "dragon" });
      }
      if (this.phase === "result") {
        for (const [name, at] of Object.entries(BEATS)) {
          if (elapsed >= at && !this.flags.beats.has(name)) {
            this.flags.beats.add(name);
            if (this.winner) this.fire({ type: "beat", name: name as keyof typeof BEATS, winner: this.winner });
          }
        }
      }
      if (elapsed < len) break;
      this.advance(this.phaseStart + len);
      changed = true;
    }
    this.phaseMs = now - this.phaseStart;
    if (changed) this.emit(now);
    else if (this.phase === "selection") this.emit(now, false);
  }

  private enter(p: Phase, at: number) {
    this.phase = p;
    this.phaseStart = at;
    this.phaseMs = 0;
  }

  private advance(at: number) {
    switch (this.phase) {
      case "waiting":
      case "nextRound":
        this.openRound(at);
        break;
      case "selection":
        this.lock(at);
        break;
      case "locked":
        this.enter("tigerReveal", at);
        this.flags.tigerImpact = false;
        this.fire({ type: "tigerReveal" });
        break;
      case "tigerReveal":
        this.enter("suspense", at);
        this.fire({ type: "suspense" });
        break;
      case "suspense":
        this.enter("dragonReveal", at);
        this.flags.dragonImpact = false;
        this.fire({ type: "dragonReveal" });
        break;
      case "dragonReveal":
        this.toResult(at);
        break;
      case "result":
        this.toNext(at);
        break;
    }
  }

  /** A round opens: draw its two cards (independent of any selection), reset the table, start the selection window. */
  private openRound(at: number) {
    this.round++;
    if (this.deck.length < 2) {
      this.deck = shuffle(freshDeck(), this.rand);
      this.fire({ type: "shuffle" });
    }
    // two distinct cards off the top of one deck: a card can't repeat until the deck is rebuilt
    this.tiger = this.deck.pop() ?? null;
    this.dragon = this.deck.pop() ?? null;
    this.winner = null;
    this.bet = null;
    this.pending = null;
    this.settled = false;
    this.recorded = false;
    this.note = "";
    this.flags = { tigerImpact: false, dragonImpact: false, beats: new Set<string>() };
    this.lastCountdown = -1;
    this.enter("selection", at);
    this.fire({ type: "selectionStart", round: this.round });
  }

  private lock(at: number) {
    this.enter("locked", at);
    this.fire({ type: "lock", hasBet: !!this.bet });
  }

  /** Both cards are up: decide the winner and settle the bet, exactly once. */
  private toResult(at: number) {
    this.enter("result", at);
    if (!this.tiger || !this.dragon) return;
    this.winner = compareCards(this.tiger, this.dragon);
    if (this.settled) return;
    this.settled = true;
    const bet = this.bet;
    const payout = bet ? payoutFor(bet.side, bet.stake, this.winner) : 0;
    if (payout > 0) this.balance = round2(this.balance + payout);
    const record: RoundRecord = {
      round: this.round,
      tiger: this.tiger,
      dragon: this.dragon,
      winner: this.winner,
      pick: bet?.side ?? null,
      stake: bet?.stake ?? 0,
      payout,
      net: bet ? round2(payout - bet.stake) : 0,
    };
    this.last = record;
    this.fire({ type: "result", winner: this.winner, record });
  }

  private toNext(at: number) {
    this.enter("nextRound", at);
    if (!this.recorded && this.last) {
      this.recorded = true;
      this.history = [this.last, ...this.history].slice(0, 60);
    }
    this.fire({ type: "nextRound" });
  }

  /* ------------------------------ player actions ------------------------------ */
  private get open() {
    return this.phase === "selection" && !this.bet;
  }

  pick(side: Side) {
    if (!this.open) return false;
    this.pending = side;
    this.note = "";
    this.fire({ type: "pick", side });
    this.emit(performance.now());
    return true;
  }

  setStake(value: number) {
    if (this.bet) return;
    this.stake = Math.min(MAX_STAKE, Math.max(MIN_STAKE, Math.round(Number.isFinite(value) ? value : MIN_STAKE)));
    this.note = "";
    this.emit(performance.now());
  }

  /** Commit the chosen side and stake. Only once per round, only while the selection window is open. */
  place(): boolean {
    this.tick(performance.now());
    if (!this.open) return false;
    if (!this.pending) {
      this.note = "Choose Tiger, Dragon or Tie first.";
      this.emit(performance.now());
      return false;
    }
    if (this.stake > this.balance) {
      this.note = "Not enough demo credits for that stake.";
      this.emit(performance.now());
      return false;
    }
    this.balance = round2(this.balance - this.stake);
    this.bet = { side: this.pending, stake: this.stake };
    this.note = "";
    this.fire({ type: "place", bet: this.bet });
    this.emit(performance.now());
    return true;
  }

  /** Take the selection back for a refund while the window is still open. */
  cancel(): boolean {
    this.tick(performance.now());
    if (this.phase !== "selection" || !this.bet) return false;
    this.balance = round2(this.balance + this.bet.stake);
    this.bet = null;
    this.note = "";
    this.fire({ type: "cancel" });
    this.emit(performance.now());
    return true;
  }

  resetBalance(to: number) {
    if (this.bet) return;
    this.balance = round2(to);
    this.emit(performance.now());
  }

  get currentPhase() {
    return this.phase;
  }
  get currentWinner() {
    return this.winner;
  }
}
