"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, animate } from "framer-motion";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { cn, formatPoints } from "@/lib/utils";
import { AtlantisAudio, type CelebrateLevel } from "./audio";
import { Board, type Highlight, type TileData, type TileState } from "./Board";
import { Celebration, Emblem, type BigLevel } from "./Celebration";
import { COLS, ROWS, FREE_MULT_CAP, FREE_SPINS_FOR, baseMult, tierOf, type Cell, type Spin, type SymId } from "./engine";
import { Environment } from "./Environment";
import { Fx, type FxHandle } from "./Fx";
import { BonusIn, BonusOut, Deck, Hud, InfoPanel, Intro, TopBar, type FreeState } from "./Panels";
import { RESTING_BOARD, baseSpin, freeSpin } from "./script";
import { AC_CSS } from "./styles";
import { SYMBOL_NAME, SymbolArt, SymbolDefs } from "./SymbolArt";

const BET_STEPS = [10, 25, 50, 100, 250, 500, 1000];
const DEFAULT_BET = 2;

const HUE: Record<SymId, number> = { pearl: 320, trident: 45, crown: 45, eye: 80, amphora: 175, conch: 340, crystal: 185, scale: 270, wild: 175, scatter: 305 };

type Lamp = { text: string; tone: "info" | "win" | "scatter" };
type Overlay = { type: "in"; spins: number } | { type: "out"; total: number; spins: number } | null;

const MAJOR: Record<BigLevel, { n: 1 | 2 | 3 | 4; dim: number; pearls: number; coins: number; bubbles: number; fireworks: number; seconds: number }> = {
  big: { n: 1, dim: 0.5, pearls: 50, coins: 0, bubbles: 50, fireworks: 2, seconds: 5.5 },
  super: { n: 2, dim: 0.6, pearls: 80, coins: 60, bubbles: 70, fireworks: 5, seconds: 7 },
  mega: { n: 3, dim: 0.68, pearls: 110, coins: 140, bubbles: 100, fireworks: 9, seconds: 8.5 },
  jackpot: { n: 4, dim: 0.74, pearls: 170, coins: 280, bubbles: 170, fireworks: 16, seconds: 11 },
};
const TITLE: Record<BigLevel, string> = { big: "Big win", super: "Super win", mega: "Mega win", jackpot: "Jackpot" };

/** Eases a shown number toward its target. */
function useCount(target: number, seconds: number) {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (from.current === target) return;
    const c = animate(from.current, target, {
      duration: seconds,
      ease: "easeOut",
      onUpdate: (v) => {
        from.current = v;
        setShown(Math.round(v));
      },
      onComplete: () => {
        from.current = target;
        setShown(target);
      },
    });
    return () => c.stop();
  }, [target, seconds]);
  return shown;
}

const keyOf = (c: number, r: number) => `${c}:${r}`;

export function AtlantisCascade() {
  const { player, favorites, toggleFavorite } = useSession();
  const calm = useReduceMotion();

  /* ------------------------------ state ------------------------------ */
  const startBalance = useRef(player?.balance ?? 5000);
  const [phase, setPhase] = useState<"intro" | "play">("intro");
  const [introOut, setIntroOut] = useState(false);
  const [introGone, setIntroGone] = useState(false);
  const [tiles, setTiles] = useState<TileData[]>([]);
  const [hl, setHl] = useState<Highlight | null>(null);
  const [balance, setBalanceState] = useState(startBalance.current);
  const [betIndex, setBetIndex] = useState(DEFAULT_BET);
  const [busy, setBusy] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [winLabel, setWinLabel] = useState("WIN");
  const [mult, setMult] = useState(0);
  const [scatters, setScatters] = useState(0);
  const [free, setFreeState] = useState<FreeState | null>(null);
  const [lamp, setLamp] = useState<Lamp>({ text: "Press SPIN to play. Demo points only.", tone: "info" });
  const [glow, setGlow] = useState<"idle" | "win" | "bonus">("idle");
  const [shake, setShake] = useState("");
  const [dim, setDim] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [celebration, setCelebration] = useState<{ level: BigLevel; amount: number; multiple: number; key: number } | null>(null);
  const [skipSignal, setSkipSignal] = useState(0);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [info, setInfo] = useState(false);
  const [tease, setTease] = useState(false);
  const [turbo, setTurbo] = useState(false);
  const [auto, setAuto] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [arrived, setArrived] = useState(false);

  /* ------------------------------ refs (the orchestration reads these, never stale state) ------------------------------ */
  const tilesRef = useRef<TileData[]>([]);
  const nid = useRef(1);
  const bal = useRef(startBalance.current);
  const betIdx = useRef(DEFAULT_BET);
  const freeRef = useRef<FreeState | null>(null);
  const busyRef = useRef(false);
  const turboRef = useRef(false);
  const alive = useRef(true);
  const spinIdx = useRef(0);
  const freeIdx = useRef(0);
  const hlKey = useRef(0);
  const celeKey = useRef(0);
  const counted = useRef(false);
  const majorLevel = useRef<BigLevel | null>(null);
  const celebrationDone = useRef<(() => void) | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>();
  const audio = useRef<AtlantisAudio | null>(null);
  const fx = useRef<FxHandle>(null);
  const boardEl = useRef<HTMLDivElement>(null);
  const scatterOn = useRef(false);
  const overlayRef = useRef<Overlay>(null);

  const getAudio = () => (audio.current ??= new AtlantisAudio());

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const k = () => (turboRef.current ? 0.6 : 1);
  const sleep = useCallback(
    (ms: number) =>
      new Promise<void>((res) => {
        timers.current.push(setTimeout(res, ms * (turboRef.current ? 0.6 : 1)));
      }),
    [],
  );

  const setBal = (fn: (b: number) => number) => {
    bal.current = fn(bal.current);
    setBalanceState(bal.current);
  };
  const setFree = (f: FreeState | null) => {
    freeRef.current = f;
    setFreeState(f);
  };
  const setT = (fn: (t: TileData[]) => TileData[]) => {
    tilesRef.current = fn(tilesRef.current);
    setTiles(tilesRef.current);
  };

  /* ------------------------------ lifecycle and audio ------------------------------ */
  useEffect(() => {
    alive.current = true;
    const a = getAudio();
    try {
      if (localStorage.getItem("sv-ac-music") === "off") {
        setMusicOn(false);
        a.musicOn = false;
      }
      if (localStorage.getItem("sv-ac-sound") === "off") {
        setSoundOn(false);
        a.soundOn = false;
      }
    } catch {}
    // Try to start right away. Browsers usually hold the context until a gesture, in which case the first touch starts it.
    a.unlock();
    void a.startMusic();
    const gesture = () => {
      const g = getAudio();
      g.unlock();
      void g.startMusic();
    };
    window.addEventListener("pointerdown", gesture, { passive: true });
    window.addEventListener("keydown", gesture);
    window.addEventListener("touchstart", gesture, { passive: true });
    const onVis = () => (document.hidden ? audio.current?.suspend() : audio.current?.resume());
    document.addEventListener("visibilitychange", onVis);
    const pending = timers.current;
    return () => {
      alive.current = false;
      window.removeEventListener("pointerdown", gesture);
      window.removeEventListener("keydown", gesture);
      window.removeEventListener("touchstart", gesture);
      document.removeEventListener("visibilitychange", onVis);
      pending.forEach(clearTimeout);
      pending.length = 0;
      clearTimeout(shakeTimer.current);
      fx.current?.clear();
      audio.current?.destroy();
      audio.current = null;
    };
  }, []);

  useEffect(() => {
    audio.current?.setMode(free ? "bonus" : "normal");
  }, [free]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    const a = getAudio();
    a.unlock();
    a.setMusic(next);
    if (next) void a.startMusic();
    try {
      localStorage.setItem("sv-ac-music", next ? "on" : "off");
    } catch {}
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    const a = getAudio();
    a.unlock();
    a.setSound(next);
    if (next) a.click();
    try {
      localStorage.setItem("sv-ac-sound", next ? "on" : "off");
    } catch {}
  };

  const bet = BET_STEPS[betIndex];
  const isFree = !!free && free.left > 0;
  const broke = !free && balance < bet;
  const shownBalance = useCount(balance, 0.7);
  const shownWin = useCount(lastWin, lastWin > 0 ? 1.1 : 0.2);

  /* ------------------------------ tile choreography ------------------------------ */
  const restState = (t: TileData): TileState => (t.sym === "scatter" && scatterOn.current ? "scat" : "idle");

  /** Every old symbol is swept down and away. */
  const clearOut = () => {
    setT((ts) =>
      ts.map((t) => ({ ...t, state: "idle", from: t.row, row: t.row + ROWS + 2, dur: 0.46 * k(), delay: (t.col * 0.025 + (ROWS - 1 - t.row) * 0.03) * k(), ease: "out", land: 0 })),
    );
  };

  /** A whole new board rains in, column by column. Returns how long it takes in seconds. */
  const dropGrid = (grid: SymId[][]) => {
    const f = k();
    let total = 0;
    const fresh: TileData[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const delay = (c * 0.085 + (ROWS - 1 - r) * 0.04) * f;
        const dur = 0.52 * f;
        total = Math.max(total, delay + dur);
        fresh.push({ id: nid.current++, sym: grid[c][r], col: c, row: r, from: r - ROWS - 1, dur, delay, ease: "fall", state: "idle", land: 1, ld: delay + dur * 0.8 });
      }
    }
    setT(() => fresh);
    for (let c = 0; c < COLS; c++) later(() => audio.current?.land(c), (c * 0.085 + 0.52 * 0.82) * 1000 * f);
    return total;
  };

  const showStates = (cells: Cell[] | null) => {
    const set = cells ? new Set(cells.map(([c, r]) => keyOf(c, r))) : null;
    setT((ts) =>
      ts.map((t) => {
        const st: TileState = !set ? restState(t) : set.has(keyOf(t.col, t.row)) ? "front" : "dim";
        return t.state === st ? t : { ...t, state: st };
      }),
    );
  };

  const cellPx = (c: number, r: number) => {
    const el = boardEl.current;
    if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const b = el.getBoundingClientRect();
    return { x: b.left + ((c + 0.5) / COLS) * b.width, y: b.top + ((r + 0.5) / ROWS) * b.height };
  };

  /** Clusters vanish, survivors settle under gravity and new symbols fall in. Returns seconds until everything lands. */
  const refill = (fills: SymId[][]) => {
    const f = k();
    let total = 0;
    const next: TileData[] = [];
    const landed: number[] = [];
    for (let c = 0; c < COLS; c++) {
      const col = tilesRef.current.filter((t) => t.col === c).sort((a, b) => a.row - b.row);
      const gap = ROWS - col.length;
      col.forEach((t, i) => {
        const row = gap + i;
        if (row === t.row) {
          next.push({ ...t, state: restState(t) });
          return;
        }
        const dist = row - t.row;
        const dur = (0.3 + dist * 0.06) * f;
        const delay = c * 0.02 * f;
        total = Math.max(total, delay + dur);
        landed.push(c);
        next.push({ ...t, row, dur, delay, ease: "fall", state: restState(t), land: t.land + 1, ld: delay + dur * 0.8 });
      });
      fills[c].forEach((sym, j) => {
        const dist = gap + 1;
        const dur = (0.34 + dist * 0.06) * f;
        const delay = (c * 0.025 + (gap - 1 - j) * 0.035) * f;
        total = Math.max(total, delay + dur);
        next.push({ id: nid.current++, sym, col: c, row: j, from: j - gap - 1, dur, delay, ease: "fall", state: "idle", land: 1, ld: delay + dur * 0.8 });
        if (!landed.includes(c)) landed.push(c);
      });
    }
    setT(() => next);
    [...new Set(landed)].forEach((c, i) => later(() => audio.current?.land(c), (total * 0.82 + i * 0.03) * 1000));
    return total;
  };

  /* ------------------------------ physical feedback ------------------------------ */
  const shakeNow = useCallback((n: 1 | 2) => {
    clearTimeout(shakeTimer.current);
    setShake(`ac-shake-${n}`);
    shakeTimer.current = setTimeout(() => setShake(""), n === 1 ? 520 : 950);
    audio.current?.impact(n);
  }, []);
  const quakeStart = useCallback((n: 1 | 2 | 3 | 4) => {
    clearTimeout(shakeTimer.current);
    setShake(`ac-quake-${n}`);
  }, []);
  const quakeEnd = useCallback(() => {
    clearTimeout(shakeTimer.current);
    setShake("ac-shake-1");
    shakeTimer.current = setTimeout(() => setShake(""), 520);
  }, []);
  const flash = useCallback(
    (times: number) => {
      for (let i = 0; i < times; i++) later(() => setFlashKey((n) => n + 1), i * 520);
    },
    [later],
  );

  /* ------------------------------ the big celebrations ------------------------------ */
  const closeCelebration = useCallback(() => {
    setCelebration(null);
    setDim(0);
    quakeEnd();
    getAudio().stopCelebration();
    later(() => fx.current?.clear(), 900);
    majorLevel.current = null;
    celebrationDone.current?.();
    celebrationDone.current = null;
  }, [quakeEnd, later]);

  const runMajor = useCallback(
    (level: BigLevel, amount: number, multiple: number) =>
      new Promise<void>((resolve) => {
        const cfg = MAJOR[level];
        const a = getAudio();
        const f = fx.current;
        counted.current = false;
        majorLevel.current = level;
        celebrationDone.current = resolve;
        setSkipSignal(0);

        // the slam: the whole machine shudders and the light flares
        quakeStart(cfg.n);
        a.impact(cfg.n);
        a.rumble(cfg.seconds - 2, cfg.n);
        a.celebrate(level as CelebrateLevel);
        flash(level === "jackpot" ? 3 : 2);
        later(() => setDim(cfg.dim), 150);
        later(() => a.say(`${TITLE[level]}!`), 900);
        if (level === "mega" || level === "jackpot") later(() => a.choir([293.66, 369.99, 440, 587.33], 5, 1), 500);

        // the sea answers: bubbles surge up, pearls and coins rain down
        later(() => {
          f?.surge(cfg.bubbles, cfg.seconds - 1.5);
          f?.rain("pearl", cfg.pearls, cfg.seconds - 1.8);
          if (cfg.coins) f?.rain("coin", cfg.coins, cfg.seconds - 1.8);
          if (level !== "big") f?.rain("shard", Math.round(cfg.pearls * 0.5), cfg.seconds - 2);
          a.pearls(10 + cfg.n * 6, cfg.seconds - 2);
        }, 450);
        // bursts of light around the machine
        for (let i = 0; i < cfg.fireworks; i++) {
          const at = 600 + (i / Math.max(1, cfg.fireworks)) * (cfg.seconds * 1000 - 2400) + Math.random() * 200;
          later(() => {
            const x = window.innerWidth * (0.12 + Math.random() * 0.76);
            const y = window.innerHeight * (0.16 + Math.random() * 0.42);
            const hue = [185, 45, 320, 160, 270][Math.floor(Math.random() * 5)];
            f?.burst(x, y, "spark", 34, 1.3, hue);
            f?.burst(x, y, "bubble", 10, 0.8);
          }, at);
        }
        if (cfg.n >= 3) later(() => quakeStart(cfg.n), 3400);
        later(() => setCelebration({ level, amount, multiple, key: ++celeKey.current }), 900);
      }),
    [quakeStart, flash, later],
  );

  const onCounted = useCallback(
    (level: BigLevel) => {
      counted.current = true;
      getAudio().tally();
      later(closeCelebration, level === "jackpot" ? 2800 : 1800);
    },
    [closeCelebration, later],
  );
  const onCelebrationClick = useCallback(() => {
    if (counted.current) closeCelebration();
    else setSkipSignal((n) => n + 1);
  }, [closeCelebration]);

  /* ------------------------------ the spin ------------------------------ */
  const alivePause = async (ms: number) => {
    await sleep(ms);
    return alive.current;
  };

  const runSpin = async () => {
    if (busyRef.current) return;
    const a = getAudio();
    a.unlock();
    void a.startMusic();
    const f0 = freeRef.current;
    const inFree = !!f0 && f0.left > 0;
    const stake = BET_STEPS[betIdx.current];
    if (!inFree && bal.current < stake) {
      setLamp({ text: "Not enough demo points for this bet. Lower it or reset your demo points.", tone: "info" });
      setAuto(false);
      return;
    }
    busyRef.current = true;
    setBusy(true);
    const spin: Spin = inFree ? freeSpin(freeIdx.current++) : baseSpin(spinIdx.current++);
    scatterOn.current = false;
    setTease(false);
    setHl(null);
    setGlow(inFree ? "bonus" : "idle");
    setScatters(0);
    setLastWin(0);
    setWinLabel("WIN");
    setMult(0);
    setLamp({ text: inFree ? "Free spin…" : "The tide turns…", tone: "info" });
    if (inFree && f0) setFree({ ...f0, left: f0.left - 1 });
    else setBal((b) => b - stake);

    // 1. sweep the old board away, rain a new one in
    a.spinStart();
    clearOut();
    if (!(await alivePause(520))) return;
    const dropTime = dropGrid(spin.initial);
    if (!(await alivePause(dropTime * 1000 + 160))) return;

    // 2. scatters reveal themselves one by one
    const scatCells: Cell[] = [];
    spin.initial.forEach((col, c) => col.forEach((s, r) => s === "scatter" && scatCells.push([c, r])));
    if (scatCells.length) {
      scatterOn.current = scatCells.length >= 3;
      for (let i = 0; i < scatCells.length; i++) {
        const [c, r] = scatCells[i];
        if (i === 2) {
          a.anticipate(1.3);
          if (!(await alivePause(1300))) return;
        }
        a.scatterLand(i);
        setScatters(i + 1);
        setT((ts) => ts.map((t) => (t.col === c && t.row === r ? { ...t, state: "scat" } : t)));
        const p = cellPx(c, r);
        fx.current?.burst(p.x, p.y, "spark", 14, 0.7, 305);
        if (!(await alivePause(260))) return;
      }
    }

    // 3. cascades
    let running = 0;
    let totalX = 0;
    let freeMult = f0 ? f0.mult : 1;
    for (let i = 0; i < spin.steps.length; i++) {
      const st = spin.steps[i];
      const m = inFree ? Math.min(FREE_MULT_CAP, freeMult) : baseMult(i);
      setMult(m);
      if (m > 1) a.multiplier(m);
      for (let ci = 0; ci < st.clusters.length; ci++) {
        const cl = st.clusters[ci];
        const pts = Math.round(cl.pay * m * stake);
        running += pts;
        totalX += cl.pay * m;
        showStates(cl.cells);
        setHl({ key: ++hlKey.current, cells: cl.cells, sym: cl.sym, label: `+${formatPoints(pts)}`, sub: `${cl.size} ${SYMBOL_NAME[cl.sym]}${m > 1 ? ` · x${m}` : ""}` });
        setGlow("win");
        setLastWin(running);
        setWinLabel("WIN");
        a.highlight(i + ci);
        const cx = cl.cells.reduce((s, [c]) => s + c, 0) / cl.cells.length;
        const cy = cl.cells.reduce((s, [, r]) => s + r, 0) / cl.cells.length;
        const pp = cellPx(cx, cy);
        fx.current?.burst(pp.x, pp.y, "spark", 12, 0.6, HUE[cl.sym]);
        if (!(await alivePause(st.clusters.length > 1 ? 820 : 1050))) return;
      }
      setLamp({ text: `Cascade ${i + 1}${m > 1 ? ` · x${m} multiplier` : ""}. +${formatPoints(running)}`, tone: "win" });

      // the winners burst
      setHl(null);
      const gone = new Set(st.clusters.flatMap((cl) => cl.cells.map(([c, r]) => keyOf(c, r))));
      setT((ts) => ts.map((t) => (gone.has(keyOf(t.col, t.row)) ? { ...t, state: "pop" } : t.state === "front" || t.state === "dim" ? { ...t, state: restState(t) } : t)));
      a.pop(i, gone.size);
      shakeNow(1);
      st.clusters.forEach((cl) => cl.cells.forEach(([c, r]) => {
        const p = cellPx(c, r);
        fx.current?.pop(p.x, p.y, HUE[cl.sym], cl.size);
      }));
      if (!(await alivePause(440))) return;
      setT((ts) => ts.filter((t) => !gone.has(keyOf(t.col, t.row))));

      // gravity and refill
      const fall = refill(st.fills);
      if (inFree) {
        freeMult += 1;
        const cur = freeRef.current;
        if (cur) setFree({ ...cur, mult: Math.min(FREE_MULT_CAP, freeMult) });
      }
      if (!(await alivePause(fall * 1000 + 200))) return;
    }
    showStates(null);
    setHl(null);

    // 4. pay out and celebrate
    const tier = tierOf(totalX);
    if (running > 0) {
      setLamp({ text: `${spin.steps.length} cascade${spin.steps.length > 1 ? "s" : ""}. Total +${formatPoints(running)}`, tone: "win" });
      if (tier === "big" || tier === "super" || tier === "mega" || tier === "jackpot") {
        await runMajor(tier, running, totalX);
        if (!alive.current) return;
      } else {
        a.tally();
        a.pearls(8, 0.6);
        shakeNow(1);
        const p = cellPx(COLS / 2 - 0.5, ROWS / 2 - 0.5);
        fx.current?.burst(p.x, p.y, "pearl", 16, 0.8);
        if (!(await alivePause(700))) return;
      }
      setBal((b) => b + running);
      setLastWin(running);
      setWinLabel("LAST WIN");
      const cur = freeRef.current;
      if (inFree && cur) setFree({ ...cur, total: cur.total + running });
    } else {
      setLamp({ text: inFree ? "No win on that free spin." : spin.scatters === 3 ? "Three hearts. One more opens the gate." : "No win this time. Spin again.", tone: spin.scatters === 3 ? "scatter" : "info" });
      setWinLabel("LAST WIN");
      if (spin.scatters === 3) {
        setTease(true);
        later(() => setTease(false), 2800);
      }
    }
    setGlow(inFree ? "bonus" : "idle");

    // 5. bonus doors
    if (!inFree && spin.scatters >= 4) {
      const spins = FREE_SPINS_FOR(spin.scatters);
      setGlow("bonus");
      a.bonus();
      a.say("Free spins!");
      shakeNow(2);
      flash(2);
      const p = cellPx(COLS / 2 - 0.5, ROWS / 2 - 0.5);
      fx.current?.burst(p.x, p.y, "spark", 60, 1.5, 305);
      fx.current?.burst(p.x, p.y, "bubble", 30, 1.2);
      if (!(await alivePause(1500))) return;
      a.portal();
      setOverlay({ type: "in", spins });
    } else if (inFree) {
      const cur = freeRef.current;
      if (cur && cur.left === 0) {
        if (!(await alivePause(500))) return;
        a.bonus();
        setOverlay({ type: "out", total: cur.total, spins: FREE_SPINS_FOR(4) });
      }
    }
    busyRef.current = false;
    setBusy(false);
  };

  const spinRef = useRef(runSpin);
  spinRef.current = runSpin;

  overlayRef.current = overlay;
  const closeBonusIn = useCallback(() => {
    const o = overlayRef.current;
    if (o?.type !== "in") return;
    overlayRef.current = null;
    setOverlay(null);
    setFree({ left: o.spins, mult: 1, total: 0 });
    freeIdx.current = 0;
    setScatters(0);
    scatterOn.current = false;
    showStates(null);
    setLamp({ text: "Free spins begin. Every cascade raises the multiplier.", tone: "scatter" });
  }, []);

  const closeBonusOut = useCallback(() => {
    setOverlay(null);
    setFree(null);
    setGlow("idle");
    setScatters(0);
    setLamp({ text: "Back at the surface. Press SPIN.", tone: "info" });
  }, []);

  // free spins play themselves
  useEffect(() => {
    if (phase !== "play" || !free || free.left <= 0 || busy || overlay || celebration || info) return;
    const id = setTimeout(() => void spinRef.current(), 900);
    return () => clearTimeout(id);
  }, [phase, free, busy, overlay, celebration, info]);

  // autoplay in the base game
  useEffect(() => {
    if (!auto || phase !== "play" || free || busy || overlay || celebration || info) return;
    const id = setTimeout(() => void spinRef.current(), 700);
    return () => clearTimeout(id);
  }, [auto, phase, free, busy, overlay, celebration, info, balance]);

  // space spins (or skips a celebration) unless something else owns the keyboard
  const celebrationRef = useRef(celebration);
  celebrationRef.current = celebration;
  const clickRef = useRef(onCelebrationClick);
  clickRef.current = onCelebrationClick;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const lockRef = useRef(false);
  lockRef.current = !!overlay || info;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || phaseRef.current !== "play" || lockRef.current) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("button, a, input, select, textarea, [role=dialog]") || t.isContentEditable)) return;
      e.preventDefault();
      if (celebrationRef.current) clickRef.current();
      else if (!freeRef.current) void spinRef.current();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  /* ------------------------------ entrance ------------------------------ */
  const enter = useCallback(() => {
    if (phaseRef.current !== "intro") return;
    const a = getAudio();
    a.unlock();
    void a.startMusic();
    a.portal();
    phaseRef.current = "play";
    setIntroOut(true);
    setArrived(true);
    later(() => setPhase("play"), 700);
    later(() => setIntroGone(true), 2000);
    later(() => {
      const t = dropGrid(RESTING_BOARD.initial);
      void t;
    }, 1500);
  }, [later]);

  useEffect(() => {
    if (phase !== "intro") return;
    const id = setTimeout(enter, 9000);
    return () => clearTimeout(id);
  }, [phase, enter]);

  const changeBet = (d: 1 | -1) => {
    const n = Math.min(BET_STEPS.length - 1, Math.max(0, betIdx.current + d));
    betIdx.current = n;
    setBetIndex(n);
    getAudio().click();
  };

  const spinDisabled = busy || !!overlay || !!celebration || info || phase !== "play" || isFree;
  const betLocked = busy || !!free;
  const isFav = favorites.includes("atlantis-cascade");

  return (
    <div className={cn("ac-root fixed inset-0 z-50 flex select-none flex-col overflow-hidden bg-[#02121c]", calm && "ac-calm")}>
      <style dangerouslySetInnerHTML={{ __html: AC_CSS }} />
      <SymbolDefs />
      <Environment mode={free ? "bonus" : "normal"} calm={calm} />

      {/* ---------- the machine (this is what shakes) ---------- */}
      <div className={cn("relative z-10 flex min-h-0 flex-1 flex-col", shake)}>
        <div className={cn("flex min-h-0 flex-1 flex-col", arrived && "ac-arrive")}>
          <TopBar favorite={isFav} onFavorite={() => toggleFavorite("atlantis-cascade")} onInfo={() => setInfo(true)} musicOn={musicOn} onMusic={toggleMusic} soundOn={soundOn} onSound={toggleSound} />

          <div className="ac-mid">
            <div className="ac-mid-in">
              <Hud mult={mult} scatters={scatters} free={free} />
              <div className={cn("ac-cab", arrived && "ac-rise")} data-glow={glow} style={{ order: 2 }}>
                <div className="ac-crest" aria-hidden>
                  <Emblem />
                </div>
                {(["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"] as const).map((pos, i) => (
                  <span key={i} className={cn("ac-pearl-corner", pos)} style={{ transform: `translate(${pos.includes("left") ? "-30%" : "30%"}, ${pos.includes("top") ? "-30%" : "30%"})`, animationDelay: `${-i}s` }} aria-hidden />
                ))}
                <Board ref={boardEl} tiles={tiles} hl={hl} />
                {tease && (
                  <div className="ac-tease">
                    <SymbolArt id="scatter" className="h-[1.9em] w-[1.9em]" /> Three hearts. One more opens the gate.
                  </div>
                )}
              </div>
            </div>
          </div>

          <Deck
            lamp={
              <p className="ac-lamp" data-tone={lamp.tone} aria-live="polite">
                {lamp.text}
              </p>
            }
            balance={shownBalance}
            bet={bet}
            canLower={betIndex > 0}
            canRaise={betIndex < BET_STEPS.length - 1}
            betLocked={betLocked}
            onBet={changeBet}
            win={shownWin}
            winLabel={winLabel}
            freeLeft={isFree ? free.left : null}
            spinning={busy}
            spinDisabled={spinDisabled || broke}
            onSpin={() => void runSpin()}
            broke={broke && !busy}
            onReset={() => {
              setBal(() => startBalance.current);
              setLamp({ text: "Demo points reset. Press SPIN.", tone: "info" });
            }}
            turbo={turbo}
            onTurbo={() => {
              turboRef.current = !turbo;
              setTurbo(!turbo);
              getAudio().click();
            }}
            auto={auto}
            onAuto={() => {
              setAuto(!auto);
              getAudio().click();
            }}
          />
        </div>
      </div>

      {/* dims the room during a major win; the celebration layers above stay bright */}
      <div className="pointer-events-none absolute inset-0 z-[30] bg-black transition-opacity ease-out" style={{ opacity: dim, transitionDuration: dim > 0 ? "900ms" : "1000ms" }} aria-hidden />

      <Fx ref={fx} calm={calm} />
      <div key={flashKey} className={cn("pointer-events-none absolute inset-0 z-[36]", flashKey > 0 && "ac-flash")} aria-hidden />

      <AnimatePresence>
        {celebration && (
          <Celebration key={celebration.key} level={celebration.level} amount={celebration.amount} multiple={celebration.multiple} skipSignal={skipSignal} onCounted={() => onCounted(celebration.level)} onSkip={onCelebrationClick} onTick={() => audio.current?.tick()} />
        )}
      </AnimatePresence>
      {overlay?.type === "in" && <BonusIn spins={overlay.spins} onGo={closeBonusIn} />}
      {overlay?.type === "out" && <BonusOut total={overlay.total} spins={overlay.spins} onGo={closeBonusOut} />}
      {info && <InfoPanel onClose={() => setInfo(false)} />}
      {!introGone && <Intro out={introOut} onEnter={enter} />}
    </div>
  );
}

