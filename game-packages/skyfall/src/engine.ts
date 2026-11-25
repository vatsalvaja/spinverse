/**
 * SKYFALL round engine. Pure TypeScript, no React, no DOM: a small state machine plus bet settlement.
 *
 *   waiting -> takeoff -> flying -> crashed -> results -> (next round) waiting
 *
 * Outcomes are scripted demo values (CRASH_SCRIPT). The multiplier on screen is just a presentation curve of
 * elapsed time that is capped at the scripted crash point, so what a round pays is decided before it starts and
 * never by the animation. Everything is free demo credits: nothing here touches a wallet or any real money.
 */

export type Phase = "waiting" | "takeoff" | "flying" | "crashed" | "results";
export type PanelId = 0 | 1;
export type BetStatus = "idle" | "armed" | "active" | "cashed" | "lost";

export const COUNTDOWN_MS = 6000;
export const TAKEOFF_MS = 1500;
export const CRASH_MS = 1800;
export const RESULTS_MS = 3200;
/** exp growth per second of flight: 2x at ~6.6s, 10x at ~22s, 50x at ~37s */
export const GROWTH = 0.105;
export const MIN_STAKE = 1;
export const MAX_STAKE = 10000;

/** Scripted demo crash multipliers, played in order and repeated. 1.00 is an instant crash. */
export const CRASH_SCRIPT: number[] = [
  1.84, 3.27, 1.12, 2.45, 7.9, 1.0, 5.61, 2.02, 1.37, 12.4, 3.9, 1.65, 26.7, 2.88, 1.21, 4.4, 1.93, 9.15, 1.05, 2.31, 6.2, 1.58, 3.05, 1.0, 15.8, 2.6, 1.31, 4.95,
  1.77, 8.3, 2.18, 1.09, 3.6, 51.2, 1.46, 2.74, 5.1, 1.18, 10.6, 2.0,
];

export const crashPointFor = (round: number) => CRASH_SCRIPT[(((round - 1) % CRASH_SCRIPT.length) + CRASH_SCRIPT.length) % CRASH_SCRIPT.length];
const round2 = (n: number) => Math.round(n * 100) / 100;
const floor2 = (n: number) => Math.floor(n * 100 + 1e-9) / 100;

/** The raw (unrounded) multiplier after `sec` seconds of flight. */
export const rawMultiplier = (sec: number) => Math.exp(GROWTH * Math.max(0, sec));
/** Seconds of flight needed to reach a multiplier. */
export const timeToReach = (m: number) => Math.log(Math.max(1, m)) / GROWTH;

export interface Settled {
  round: number;
  result: "cashed" | "lost";
  stake: number;
  /** multiplier it was cashed at, or the crash point it was lost at */
  mult: number;
  payout: number;
}

export interface PanelState {
  id: PanelId;
  /** the stake in the input */
  stake: number;
  autoOn: boolean;
  autoAt: number;
  status: BetStatus;
  /** the stake currently in play or reserved for the next round */
  locked: number;
  /** result of the round that just finished, until the next round starts */
  cashedAt: number | null;
  payout: number;
  /** the most recent settled bet from this panel, kept for display */
  last: Settled | null;
  /** short message under the panel (validation, status) */
  note: string;
}

export interface HistoryItem {
  round: number;
  mult: number;
}

export interface BetRecord extends Settled {
  id: number;
  panel: PanelId;
  auto: boolean;
  ts: number;
}

export interface Snapshot {
  v: number;
  phase: Phase;
  round: number;
  /** whole seconds left in the countdown (waiting phase) */
  countdown: number;
  /** 0..1 progress through the countdown */
  countdownProgress: number;
  /** current multiplier (floored to 2dp) */
  mult: number;
  /** the scripted crash point, revealed only once the round has crashed */
  crashAt: number | null;
  balance: number;
  panels: [PanelState, PanelState];
  history: HistoryItem[];
  bets: BetRecord[];
  /** previous round's crash point */
  prev: HistoryItem | null;
}

export type EngineEvent =
  | { type: "countdown"; n: number }
  | { type: "takeoff" }
  | { type: "liftoff" }
  | { type: "cashout"; panel: PanelId; mult: number; payout: number; auto: boolean }
  | { type: "crash"; mult: number }
  | { type: "results"; net: number; won: boolean }
  | { type: "newround"; round: number }
  | { type: "bet"; panel: PanelId }
  | { type: "cancel"; panel: PanelId };

const blankPanel = (id: PanelId, stake: number, autoOn: boolean, autoAt: number): PanelState => ({
  id,
  stake,
  autoOn,
  autoAt,
  status: "idle",
  locked: 0,
  cashedAt: null,
  payout: 0,
  last: null,
  note: "",
});

export class SkyfallEngine {
  onEvent?: (e: EngineEvent) => void;
  /** live multiplier for the renderer, updated every tick (unrounded, capped at the crash point) */
  liveRaw = 1;
  /** seconds since the flight began */
  flightSec = 0;
  /** ms since the current phase began (renderer helper) */
  phaseMs = 0;

  private listeners = new Set<() => void>();
  private snap: Snapshot;
  private phase: Phase = "waiting";
  private phaseStart = 0;
  private flyStart = 0;
  private started = false;
  private round = 1;
  private crash = crashPointFor(1);
  private crashRevealed = false;
  private balance: number;
  private panels: [PanelState, PanelState];
  private history: HistoryItem[];
  private bets: BetRecord[] = [];
  private betSeq = 0;
  private lastCountdown = -1;
  private lastNotify = 0;
  private v = 0;
  private roundNet = 0;
  private roundHadBet = false;

  constructor(startBalance: number) {
    this.balance = round2(startBalance);
    this.panels = [blankPanel(0, 100, false, 2), blankPanel(1, 50, true, 2)];
    // seed the strip with the rounds "before" round 1
    this.history = Array.from({ length: 14 }, (_, i) => ({ round: -i, mult: crashPointFor(-i) }));
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

  private build(now: number): Snapshot {
    const cdLeft = Math.max(0, COUNTDOWN_MS - (now - this.phaseStart));
    return {
      v: this.v,
      phase: this.phase,
      round: this.round,
      countdown: this.phase === "waiting" ? Math.ceil(cdLeft / 1000) : 0,
      countdownProgress: this.phase === "waiting" && this.started ? 1 - cdLeft / COUNTDOWN_MS : 0,
      mult: this.phase === "flying" || this.phase === "takeoff" ? floor2(this.liveRaw) : this.crashRevealed ? this.crash : 1,
      crashAt: this.crashRevealed ? this.crash : null,
      balance: this.balance,
      panels: [{ ...this.panels[0] }, { ...this.panels[1] }],
      history: this.history,
      bets: this.bets,
      prev: this.history[0] ?? null,
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
      this.lastCountdown = -1;
      this.emit(now);
    }
    let changed = false;
    // a long gap (hidden tab) can cross several phases; walk through them in order
    for (let guard = 0; guard < 8; guard++) {
      const elapsed = now - this.phaseStart;
      this.phaseMs = elapsed;
      if (this.phase === "waiting") {
        const left = COUNTDOWN_MS - elapsed;
        const n = Math.ceil(left / 1000);
        if (n !== this.lastCountdown && n <= 3 && n >= 1) this.fire({ type: "countdown", n });
        this.lastCountdown = n;
        if (left > 0) break;
        this.startRound(this.phaseStart + COUNTDOWN_MS);
        changed = true;
      } else if (this.phase === "takeoff") {
        if (elapsed < TAKEOFF_MS) break;
        this.enter("flying", this.phaseStart + TAKEOFF_MS);
        this.flyStart = this.phaseStart;
        this.fire({ type: "liftoff" });
        changed = true;
      } else if (this.phase === "flying") {
        this.flightSec = (now - this.flyStart) / 1000;
        const raw = rawMultiplier(this.flightSec);
        const capped = Math.min(raw, this.crash);
        this.liveRaw = capped;
        // auto cash-outs fire at exactly their threshold, never at an overshoot, and only if the plane gets there
        for (const p of this.panels) {
          if (p.status === "active" && p.autoOn && p.autoAt <= this.crash && p.autoAt <= capped) {
            this.cash(p.id, round2(p.autoAt), true);
            changed = true;
          }
        }
        if (raw >= this.crash) {
          this.doCrash(this.flyStart + timeToReach(this.crash) * 1000);
          changed = true;
          continue;
        }
        this.emit(now, false);
        break;
      } else if (this.phase === "crashed") {
        if (elapsed < CRASH_MS) break;
        this.toResults(this.phaseStart + CRASH_MS);
        changed = true;
      } else {
        if (elapsed < RESULTS_MS) break;
        this.newRound(this.phaseStart + RESULTS_MS);
        changed = true;
      }
    }
    this.phaseMs = now - this.phaseStart;
    if (changed) this.emit(now);
    else if (this.phase === "waiting") this.emit(now, false);
  }

  private enter(p: Phase, at: number) {
    this.phase = p;
    this.phaseStart = at;
    this.phaseMs = 0;
  }

  private startRound(at: number) {
    this.crashRevealed = false;
    this.liveRaw = 1;
    this.flightSec = 0;
    this.roundNet = 0;
    this.roundHadBet = false;
    for (const p of this.panels) {
      if (p.status === "armed") {
        p.status = "active";
        p.note = "";
        this.roundHadBet = true;
      }
    }
    this.enter("takeoff", at);
    this.fire({ type: "takeoff" });
  }

  private doCrash(at: number) {
    this.liveRaw = this.crash;
    this.crashRevealed = true;
    this.enter("crashed", at);
    // anything still in the air is lost; each bet leaves "active" exactly once
    for (const p of this.panels) if (p.status === "active") this.settle(p, "lost", this.crash, 0, false);
    this.fire({ type: "crash", mult: this.crash });
  }

  private toResults(at: number) {
    this.enter("results", at);
    this.history = [{ round: this.round, mult: this.crash }, ...this.history].slice(0, 40);
    this.fire({ type: "results", net: round2(this.roundNet), won: this.roundNet > 0 });
  }

  private newRound(at: number) {
    this.round++;
    this.crash = crashPointFor(this.round);
    this.crashRevealed = false;
    this.liveRaw = 1;
    this.flightSec = 0;
    for (const p of this.panels) {
      if (p.status === "cashed" || p.status === "lost") {
        p.status = "idle";
        p.cashedAt = null;
        p.payout = 0;
        p.locked = 0;
        p.note = "";
      }
    }
    this.lastCountdown = -1;
    this.enter("waiting", at);
    this.fire({ type: "newround", round: this.round });
  }

  /* ------------------------------ settlement ------------------------------ */
  private settle(p: PanelState, result: "cashed" | "lost", mult: number, payout: number, auto: boolean) {
    if (p.status !== "active") return; // never settle twice
    const stake = p.locked;
    p.status = result;
    p.cashedAt = result === "cashed" ? mult : null;
    p.payout = payout;
    p.note = "";
    const rec: Settled = { round: this.round, result, stake, mult, payout };
    p.last = rec;
    this.bets = [{ ...rec, id: ++this.betSeq, panel: p.id, auto, ts: Date.now() }, ...this.bets].slice(0, 60);
    this.roundNet += payout - stake;
  }

  private cash(id: PanelId, mult: number, auto: boolean) {
    const p = this.panels[id];
    if (p.status !== "active" || this.phase !== "flying") return false;
    const payout = round2(p.locked * mult);
    this.balance = round2(this.balance + payout);
    this.settle(p, "cashed", mult, payout, auto);
    this.fire({ type: "cashout", panel: id, mult, payout, auto });
    return true;
  }

  /* ------------------------------ player actions ------------------------------ */
  setStake(id: PanelId, value: number) {
    const p = this.panels[id];
    if (p.status === "armed" || p.status === "active") return;
    const v = Math.min(MAX_STAKE, Math.max(MIN_STAKE, Math.round(Number.isFinite(value) ? value : MIN_STAKE)));
    p.stake = v;
    p.note = "";
    this.emit(performance.now());
  }

  setAuto(id: PanelId, on: boolean, at?: number) {
    const p = this.panels[id];
    p.autoOn = on;
    if (at !== undefined && Number.isFinite(at)) p.autoAt = Math.min(1000, Math.max(1.01, round2(at)));
    this.emit(performance.now());
  }

  /** Reserve a stake for the next takeoff. Rejects duplicates and stakes the balance can't cover. */
  placeBet(id: PanelId): boolean {
    const p = this.panels[id];
    if (p.status === "armed" || p.status === "active") return false;
    if (p.stake < MIN_STAKE || p.stake > this.balance) {
      p.note = "Not enough demo credits for that stake.";
      this.emit(performance.now());
      return false;
    }
    this.balance = round2(this.balance - p.stake);
    p.locked = p.stake;
    p.status = "armed";
    p.cashedAt = null;
    p.payout = 0;
    p.note = "";
    this.fire({ type: "bet", panel: id });
    this.emit(performance.now());
    return true;
  }

  /** Take back a stake that hasn't taken off yet. */
  cancelBet(id: PanelId): boolean {
    const p = this.panels[id];
    if (p.status !== "armed") return false;
    this.balance = round2(this.balance + p.locked);
    p.locked = 0;
    p.status = "idle";
    p.note = "";
    this.fire({ type: "cancel", panel: id });
    this.emit(performance.now());
    return true;
  }

  /** Manual cash-out at the live multiplier. Brings the clock up to date first, so a plane that has already crashed pays nothing. */
  cashOut(id: PanelId): boolean {
    this.tick(performance.now());
    if (this.phase !== "flying") return false;
    const mult = Math.max(1, floor2(Math.min(this.liveRaw, this.crash)));
    const ok = this.cash(id, mult, false);
    if (ok) this.emit(performance.now());
    return ok;
  }

  /** Reset the demo balance (used by the reset button when the player runs dry). */
  resetBalance(to: number) {
    if (this.panels.some((p) => p.status === "armed" || p.status === "active")) return;
    this.balance = round2(to);
    this.emit(performance.now());
  }

  get currentPhase() {
    return this.phase;
  }
  get roundNumber() {
    return this.round;
  }
  get crashPoint() {
    return this.crash;
  }
  get hadBet() {
    return this.roundHadBet;
  }
}
