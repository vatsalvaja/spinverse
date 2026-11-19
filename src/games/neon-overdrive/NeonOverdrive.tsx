"use client";

import { useCallback, useEffect, useLayoutEffect as useReactLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { cn, formatPoints } from "@/lib/utils";
import { Ambient } from "./Ambient";
import { NeonAudio } from "./audio";
import { Banner, WinCelebration, type BannerKind } from "./Celebration";
import {
  BET_STEPS, CELLS, DEFAULT_BET_INDEX, GRAND_BONUS, HOLD_TRIGGER, IDLE_GRID, OVERDRIVE_AT, REELS, ROWS, START_RESPINS, SYMBOL_META,
  cellKey, isBig, levelOf, lineCells, nextOutcome, randomFiller, tierOf, winCells,
  type BigLevel, type Grid, type OrbSpot, type Outcome,
} from "./engine";
import { FxCanvas, type FxHandle, type Palette } from "./FxCanvas";
import { EnergyMeter, HoldCell, LineBeam, Reel, type CellState, type ReelHandle } from "./parts";
import { ControlDeck, InfoPanel, TopBar } from "./Panels";
import { NEON_CSS } from "./styles";
import { NeonDefs } from "./symbols";

const useLayoutEffect = typeof window !== "undefined" ? useReactLayoutEffect : useEffect;
const ABORT = Symbol("abort");

type Lamp = { text: string; tone: "info" | "win" | "bonus" };
type Beam = { line: number; count: number; key: number; color: string };

const MAJOR: Record<BigLevel, { n: 1 | 2 | 3 | 4; dim: number; bolts: number; rain: number; bursts: number; pal: Palette[]; after: number }> = {
  big: { n: 1, dim: 0.62, bolts: 8, rain: 40, bursts: 3, pal: ["cyan", "white"], after: 1500 },
  super: { n: 2, dim: 0.7, bolts: 14, rain: 70, bursts: 5, pal: ["violet", "cyan", "white"], after: 1700 },
  mega: { n: 3, dim: 0.76, bolts: 22, rain: 110, bursts: 8, pal: ["magenta", "fire", "white"], after: 1900 },
  jackpot: { n: 4, dim: 0.8, bolts: 36, rain: 170, bursts: 13, pal: ["gold", "mix", "white", "magenta"], after: 2600 },
};
const SHAKE_MS = [0, 700, 1200, 1800, 2700];
const TIER_PAL: Record<string, Palette> = { mini: "cyan", minor: "violet", major: "magenta", grand: "gold" };

const blankStates = (): CellState[][] => Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => "idle" as CellState));

function settledStates(o: Outcome): CellState[][] {
  const wins = winCells(o.wins);
  const orbs = o.kind === "tease" ? new Set(Object.keys(o.orbs)) : new Set<string>();
  const any = wins.size > 0;
  return Array.from({ length: REELS }, (_, reel) =>
    Array.from({ length: ROWS }, (_, row): CellState => {
      const k = cellKey(reel, row);
      if (wins.has(k)) return "win";
      if (orbs.has(k)) return "win";
      return any ? "dim" : "idle";
    }),
  );
}
function presentedStates(o: Outcome, cells: Set<string>): CellState[][] {
  return Array.from({ length: REELS }, (_, reel) =>
    Array.from({ length: ROWS }, (_, row): CellState => {
      const k = cellKey(reel, row);
      return cells.has(k) ? "front" : o.orbs[k] !== undefined ? "win" : "dim";
    }),
  );
}
const cleanGrid = (g: Grid): Grid => g.map((col, r) => col.map((s, i) => (s === "orb" || s === "reactor" ? randomFiller(r * 5 + i) : s)));

export function NeonOverdrive() {
  const { player, favorites, toggleFavorite } = useSession();
  const calm = useReduceMotion();

  const startBalance = useRef(player?.balance ?? 5000);
  const [balance, setBalance] = useState(startBalance.current);
  const [betIndex, setBetIndex] = useState(DEFAULT_BET_INDEX);
  const [spinning, setSpinning] = useState(false);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<"base" | "hold">("base");
  const [od, setOd] = useState(false);
  const [grid, setGrid] = useState<Grid>(IDLE_GRID);
  const [orbVals, setOrbVals] = useState<Record<string, number>>({});
  const [states, setStates] = useState<CellState[][]>(blankStates);
  const [hold, setHold] = useState<Record<string, number>>({});
  const [holdStates, setHoldStates] = useState<Record<string, CellState>>({});
  const [spinKeys, setSpinKeys] = useState<string[]>([]);
  const [pops, setPops] = useState<Record<string, string>>({});
  const [respins, setRespins] = useState(START_RESPINS);
  const [meter, setMeter] = useState(0);
  const [beam, setBeam] = useState<Beam | null>(null);
  const [anticipating, setAnticipating] = useState(false);
  const [lamp, setLamp] = useState<Lamp>({ text: "Press SPIN. Free demo points only.", tone: "info" });
  const [lastWin, setLastWin] = useState(0);
  const [winLabel, setWinLabel] = useState("LAST WIN");
  const [glow, setGlow] = useState<"idle" | "win" | "bonus">("idle");
  const [celebration, setCelebration] = useState<{ level: BigLevel; amount: number; key: number } | null>(null);
  const [skipSignal, setSkipSignal] = useState(0);
  const [banner, setBanner] = useState<BannerKind | null>(null);
  const [shake, setShake] = useState({ cab: "", stage: "" });
  const [flashKey, setFlashKey] = useState(0);
  const [dim, setDim] = useState(0);
  const [infoOpen, setInfoOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [booted, setBooted] = useState(false);
  const [powerUp, setPowerUp] = useState(true);
  const [dims, setDims] = useState({ w: 0, h: 0, cs: 72 });

  const stageRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const reelRefs = useRef<(ReelHandle | null)[]>([]);
  const fx = useRef<FxHandle>(null);
  const audio = useRef<NeonAudio | null>(null);
  const alive = useRef(true);
  const spinIdx = useRef(0);
  const runId = useRef(0);
  const skipped = useRef(false);
  const wake = useRef<(() => void) | null>(null);
  const counted = useRef(false);
  const celebrationDone = useRef<(() => void) | null>(null);
  const majorLevel = useRef<BigLevel | null>(null);
  const modeAfter = useRef<"base" | "overdrive">("base");
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lineKey = useRef(0);
  const csRef = useRef(72);
  const started = useRef(false);
  const bootSound = useRef(false);

  if (!audio.current && typeof window !== "undefined") audio.current = new NeonAudio();
  csRef.current = dims.cs;

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  /** Plain delay for scripted sequences. Throws once the player has left the game. */
  const nap = useCallback(async (ms: number) => {
    await new Promise<void>((r) => setTimeout(r, ms));
    if (!alive.current) throw ABORT;
  }, []);
  /** Delay that a skip can cut short. Returns false when it was cut short. */
  const wait = useCallback(
    (ms: number) =>
      new Promise<boolean>((resolve) => {
        if (skipped.current) return resolve(false);
        const t = setTimeout(() => {
          wake.current = null;
          resolve(true);
        }, ms);
        wake.current = () => {
          clearTimeout(t);
          wake.current = null;
          resolve(false);
        };
      }),
    [],
  );
  const skipPresentation = useCallback(() => {
    skipped.current = true;
    wake.current?.();
  }, []);

  /* ------------------------------- layout ------------------------------- */
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const cs = Math.max(40, Math.min(210, Math.floor(Math.min(r.width / 5.45, r.height / 5.2))));
      setDims((d) => (d.cs === cs && d.w === Math.round(r.width) && d.h === Math.round(r.height) ? d : { w: Math.round(r.width), h: Math.round(r.height), cs }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* --------------------------- audio and lifecycle --------------------------- */
  const wakeAudio = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    a.unlock();
    a.startMusic();
    const boot = () => {
      if (!bootSound.current && a.running) {
        bootSound.current = true;
        a.boot();
      }
    };
    boot();
    if (!bootSound.current) setTimeout(boot, 250);
    started.current = true;
  }, []);

  useEffect(() => {
    alive.current = true;
    const a = audio.current;
    try {
      if (localStorage.getItem("sv-no-music") === "off") {
        setMusicOn(false);
        if (a) a.musicOn = false;
      }
      if (localStorage.getItem("sv-no-sound") === "off") {
        setSoundOn(false);
        if (a) a.soundOn = false;
      }
    } catch {}
    // try to start straight away; the browser may hold the context until the first gesture
    wakeAudio();
    const once = () => wakeAudio();
    window.addEventListener("pointerdown", once);
    window.addEventListener("keydown", once);
    window.addEventListener("touchstart", once);
    const onVis = () => (document.hidden ? audio.current?.suspend() : audio.current?.resume());
    document.addEventListener("visibilitychange", onVis);
    const b1 = setTimeout(() => setBooted(true), 2500);
    const b2 = setTimeout(() => setPowerUp(false), 4200);
    const pending = timers.current;
    return () => {
      alive.current = false;
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("keydown", once);
      window.removeEventListener("touchstart", once);
      document.removeEventListener("visibilitychange", onVis);
      clearTimeout(b1);
      clearTimeout(b2);
      pending.forEach(clearTimeout);
      clearTimeout(shakeTimer.current);
      fx.current?.clear();
      audio.current?.destroy();
    };
  }, [wakeAudio]);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    const a = audio.current;
    if (a) {
      a.unlock();
      a.setMusic(next);
    }
    try {
      localStorage.setItem("sv-no-music", next ? "on" : "off");
    } catch {}
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    const a = audio.current;
    if (a) {
      a.unlock();
      a.setSound(next);
      if (next) a.click();
    }
    try {
      localStorage.setItem("sv-no-sound", next ? "on" : "off");
    } catch {}
  };

  // gentle machine tilt that follows the pointer
  const onPointerMove = (e: React.PointerEvent) => {
    if (calm || !tiltRef.current || e.pointerType === "touch") return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    tiltRef.current.style.transform = `perspective(1600px) rotateY(${x * 3}deg) rotateX(${-y * 2.4}deg)`;
  };

  const bet = BET_STEPS[betIndex];
  const broke = balance < bet;
  const isFavorite = favorites.includes("neon-overdrive");
  const [shownBalance, shownWin] = [useTweenNum(balance, 0.7), useTweenNum(lastWin, lastWin > 0 ? 1.1 : 0.2)];

  /* ----------------------------- physical feedback ----------------------------- */
  const shakeNow = useCallback((level: 1 | 2 | 3 | 4) => {
    clearTimeout(shakeTimer.current);
    setShake({ cab: `no-sh${level}`, stage: "" });
    shakeTimer.current = setTimeout(() => setShake({ cab: "", stage: "" }), SHAKE_MS[level]);
    audio.current?.impact(level);
  }, []);
  const quakeStart = useCallback((n: 1 | 2 | 3 | 4) => {
    clearTimeout(shakeTimer.current);
    setShake({ cab: `no-qk-${n}`, stage: "" });
  }, []);
  const quakeEnd = useCallback(() => {
    clearTimeout(shakeTimer.current);
    setShake({ cab: "", stage: "" });
  }, []);
  const flash = useCallback((times: number) => {
    for (let i = 0; i < times; i++) later(() => setFlashKey((k) => k + 1), i * 520);
  }, [later]);
  const cellPos = useCallback((reel: number, row: number) => {
    const r = winRef.current?.getBoundingClientRect();
    if (!r) return { x: 0.5, y: 0.5 };
    return { x: (r.left + (reel + 0.5) * csRef.current) / window.innerWidth, y: (r.top + (row + 0.5) * csRef.current) / window.innerHeight };
  }, []);

  /* ------------------------------ major-win show ------------------------------ */
  const closeCelebration = useCallback(() => {
    setCelebration(null);
    setDim(0);
    quakeEnd();
    majorLevel.current = null;
    audio.current?.setMode(modeAfter.current);
    celebrationDone.current?.();
    celebrationDone.current = null;
  }, [quakeEnd]);

  const runMajor = useCallback(
    (level: BigLevel, amount: number) =>
      new Promise<void>((resolve) => {
        const cfg = MAJOR[level];
        const a = audio.current;
        const f = fx.current;
        counted.current = false;
        majorLevel.current = level;
        celebrationDone.current = resolve;
        setSkipSignal(0);
        const showMs = level === "jackpot" ? 7000 : level === "mega" ? 5200 : level === "super" ? 4200 : 3200;

        quakeStart(cfg.n);
        a?.impact(cfg.n);
        a?.rumble(showMs / 1000, cfg.n);
        a?.sting(level);
        a?.setMode("celebrate");
        a?.crackle(Math.min(4, showMs / 1000), 6);
        flash(level === "jackpot" ? 3 : 2);
        f?.burst(0.5, 0.5, cfg.pal[0], 1.2);
        later(() => setDim(cfg.dim), 150);
        later(() => {
          f?.rain(cfg.rain, showMs / 1000 - 1.2, cfg.pal[0]);
          f?.storm(cfg.bolts, showMs / 1000 - 1, cfg.pal[cfg.pal.length - 1]);
        }, 400);
        for (let i = 0; i < cfg.bursts; i++) {
          later(() => {
            const x = 0.12 + Math.random() * 0.76;
            const y = 0.18 + Math.random() * 0.5;
            f?.burst(x, y, cfg.pal[Math.floor(Math.random() * cfg.pal.length)], 0.8 + cfg.n * 0.15);
          }, 600 + (i / cfg.bursts) * (showMs - 1500));
        }
        if (cfg.n >= 3) later(() => quakeStart(cfg.n), 3200);
        later(() => {
          a?.voice(level);
          a?.countTicks(showMs / 1000);
          setCelebration({ level, amount, key: ++lineKey.current });
        }, 900);
      }),
    [quakeStart, flash, later],
  );
  const onCounted = useCallback(
    (level: BigLevel) => {
      counted.current = true;
      audio.current?.tally();
      later(closeCelebration, MAJOR[level].after);
    },
    [closeCelebration, later],
  );
  const onCelebrationClick = useCallback(() => {
    if (counted.current) closeCelebration();
    else setSkipSignal((n) => n + 1);
  }, [closeCelebration]);

  /* -------------------------------- hold & respin -------------------------------- */
  const runBonus = useCallback(
    async (outcome: Outcome, betNow: number) => {
      const a = audio.current;
      const f = fx.current;
      const script = outcome.bonus!;
      const lockedMap: Record<string, number> = {};
      let n = 0;
      let odOn = false;
      let respinsLeft = START_RESPINS;
      const sleepStates = (key: string) => later(() => setHoldStates((p) => { const c = { ...p }; delete c[key]; return c; }), 900);

      const lockCell = (o: OrbSpot) => {
        const key = cellKey(o.reel, o.row);
        lockedMap[key] = o.v;
        n++;
        setHold({ ...lockedMap });
        setHoldStates((p) => ({ ...p, [key]: "lockin" }));
        sleepStates(key);
        setMeter(n);
        a?.orbLock(n - 1);
        a?.charge(n / CELLS);
        const p = cellPos(o.reel, o.row);
        const pal = TIER_PAL[tierOf(o.v)];
        f?.sparks(p.x, p.y, 24, 0.8, pal);
        f?.ring(p.x, p.y, pal, 0.7);
        if (o.v >= 10) shakeNow(1);
      };

      try {
        setLocked(true);
        setGlow("bonus");
        setLamp({ text: `${Object.keys(outcome.orbs).length} Overdrive Cores. Hold & Respin`, tone: "bonus" });
        a?.bonusTrigger();
        a?.voice("bonus");
        shakeNow(2);
        flash(2);
        f?.burst(0.5, 0.5, "mix", 1);
        // the triggering cores come forward
        setStates((prev) => prev.map((col, r) => col.map((_, row) => (outcome.orbs[cellKey(r, row)] !== undefined ? "front" : "dim"))));
        await nap(1100);
        setBanner("hold");
        f?.storm(7, 1.5, "cyan");
        await nap(1000);

        // morph into the hold grid, cores lock one by one
        setPhase("hold");
        setMeter(0);
        setRespins(START_RESPINS);
        setBeam(null);
        for (const o of script.initial) {
          lockCell(o);
          await nap(130);
        }
        await nap(700);
        setBanner(null);
        setLamp({ text: `Respins left: ${respinsLeft}`, tone: "bonus" });

        let stepIdx = 0;
        let pendingOd = false;
        for (;;) {
          if (pendingOd && !odOn) {
            odOn = true;
            pendingOd = false;
            modeAfter.current = "overdrive";
            setOd(true);
            setBanner("overdrive");
            a?.overdrive();
            a?.voice("overdrive");
            a?.setMode("overdrive");
            shakeNow(3);
            flash(3);
            f?.storm(16, 2.2, "fire");
            f?.burst(0.5, 0.5, "fire", 1.4);
            setLamp({ text: "OVERDRIVE engaged. Every core ×2", tone: "bonus" });
            await nap(2600);
            setBanner(null);
            respinsLeft = START_RESPINS;
            setRespins(respinsLeft);
          }
          await nap(650);

          // respin: every empty slot spins, then stops one after another
          const empty: { key: string; reel: number; row: number; dur: number }[] = [];
          for (let r = 0; r < REELS; r++) for (let row = 0; row < ROWS; row++) if (lockedMap[cellKey(r, row)] === undefined) empty.push({ key: cellKey(r, row), reel: r, row, dur: 850 + r * 170 + row * 55 });
          setSpinKeys(empty.map((e) => e.key));
          a?.respin();
          setLamp({ text: `Respin. ${respinsLeft} left`, tone: "bonus" });
          const landing = new Map((script.steps[stepIdx++] ?? []).map((o) => [cellKey(o.reel, o.row), o]));
          let at = 0;
          for (const c of [...empty].sort((x, y) => x.dur - y.dur)) {
            await nap(c.dur - at);
            at = c.dur;
            setSpinKeys((p) => p.filter((k) => k !== c.key));
            const hit = landing.get(c.key);
            if (hit) lockCell(hit);
          }
          await nap(350);
          if (landing.size) {
            respinsLeft = START_RESPINS;
            if (!odOn && n >= OVERDRIVE_AT) pendingOd = true;
          } else respinsLeft--;
          setRespins(respinsLeft);
          if (n >= CELLS || respinsLeft <= 0) break;
        }
        const full = n >= CELLS;
        setSpinKeys([]);
        await nap(500);

        // collect every core, left to right
        setBanner("collect");
        a?.voice("collect");
        await nap(1300);
        setBanner(null);
        setLamp({ text: "Collecting cores…", tone: "bonus" });
        setWinLabel("BONUS");
        const order = Object.keys(lockedMap).sort((x, y) => {
          const [xr, xw] = x.split(":").map(Number);
          const [yr, yw] = y.split(":").map(Number);
          return xr - yr || xw - yw;
        });
        let total = 0;
        for (let k = 0; k < order.length; k++) {
          const key = order[k];
          const [reel, row] = key.split(":").map(Number);
          const pts = Math.round(lockedMap[key] * (odOn ? 2 : 1) * betNow);
          total += pts;
          setHoldStates((p) => ({ ...p, [key]: "collect" }));
          setPops({ [key]: `+${formatPoints(pts)}` });
          setLastWin(total);
          a?.collectTick(k);
          const p = cellPos(reel, row);
          f?.bolt(p.x, p.y, 0.82, 0.93, odOn ? "fire" : "cyan", 2);
          f?.sparks(p.x, p.y, 10, 0.6, TIER_PAL[tierOf(lockedMap[key])]);
          await nap(k < 5 ? 300 : 190);
          setHoldStates((p2) => ({ ...p2, [key]: "collected" }));
        }
        setPops({});
        if (full) {
          setBanner("grand");
          a?.sting("jackpot");
          a?.voice("grand");
          shakeNow(3);
          flash(3);
          f?.storm(18, 2, "gold");
          f?.burst(0.5, 0.45, "gold", 1.4);
          total += GRAND_BONUS * betNow;
          setLastWin(total);
          await nap(2400);
          setBanner(null);
        }

        // payout
        modeAfter.current = "base";
        const level = levelOf(total / betNow);
        setLamp({ text: `Hold & Respin complete. +${formatPoints(total)}`, tone: "win" });
        if (isBig(level)) {
          await runMajor(level, total);
        } else {
          a?.sting("bonus");
          a?.setMode("base");
          await nap(900);
        }
        setBalance((b) => b + total);
        setLastWin(total);
        setWinLabel("BONUS");

        // back to the base game
        setBanner(null);
        setPhase("base");
        setOd(false);
        setHold({});
        setHoldStates({});
        setMeter(0);
        setOrbVals({});
        setGrid(cleanGrid(outcome.grid));
        setStates(blankStates());
        setGlow("idle");
        a?.setMode("base");
        setLamp({ text: "Cores discharged. Press SPIN.", tone: "info" });
        setLocked(false);
      } catch (e) {
        if (e !== ABORT) throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cellPos, flash, later, nap, runMajor, shakeNow],
  );

  /* ---------------------------------- the spin ---------------------------------- */
  const spin = useCallback(async () => {
    if (spinning || locked || celebration || infoOpen || phase !== "base") return;
    const a = audio.current;
    wakeAudio();
    if (balance < bet) {
      setLamp({ text: "Not enough demo points for this bet. Lower it or reset your demo points.", tone: "info" });
      return;
    }
    skipPresentation();
    const me = ++runId.current;
    skipped.current = false;
    const stale = () => runId.current !== me;

    const outcome = nextOutcome(spinIdx.current++);
    const win = Math.round(outcome.mult * bet);

    setSpinning(true);
    setBalance((b) => b - bet);
    setStates(blankStates());
    setBeam(null);
    setGlow("idle");
    setLastWin(0);
    setWinLabel("WIN");
    setMeter(0);
    setOrbVals(outcome.orbs);
    setLamp({ text: "Spinning…", tone: "info" });
    a?.spinStart();

    const cols = outcome.grid;
    const firstFour = cols.slice(0, 4).flat().filter((s) => s === "orb").length;
    const antic = outcome.kind !== "spin" && firstFour >= 3;
    let orbsSoFar = 0;
    try {
      await Promise.all(
        cols.map((col, i) =>
          (reelRefs.current[i] as ReelHandle).spin(col, { duration: 1000 + i * 250 + (antic && i === REELS - 1 ? 1800 : 0), fillers: 14 + i * 3 + (antic && i === REELS - 1 ? 14 : 0) }).then(() => {
            if (!alive.current) return;
            a?.reelStop(i);
            const rows = col.map((s, r) => (s === "orb" ? r : -1)).filter((r) => r >= 0);
            if (rows.length) {
              orbsSoFar += rows.length;
              a?.orbLand(orbsSoFar);
              setMeter(orbsSoFar);
              rows.forEach((r) => {
                const p = cellPos(i, r);
                fx.current?.sparks(p.x, p.y, 14, 0.6, TIER_PAL[tierOf(outcome.orbs[cellKey(i, r)] ?? 1)]);
                fx.current?.ring(p.x, p.y, "magenta", 0.5);
              });
            }
            setStates((prev) => prev.map((c, ci) => (ci === i ? c.map((_, r) => (col[r] === "orb" ? "landorb" : "land")) : c)));
            if (antic && i === REELS - 2) {
              setAnticipating(true);
              a?.anticipate(1.8);
            }
            if (i === REELS - 1) {
              setAnticipating(false);
              a?.spinEnd();
            }
          }),
        ),
      );
    } catch {
      a?.spinEnd();
      setAnticipating(false);
      setSpinning(false);
      return;
    }
    if (!alive.current) return;
    setAnticipating(false);
    a?.spinEnd();
    setSpinning(false);
    setGrid(cols);

    // ---------------------------------- result ----------------------------------
    if (outcome.kind === "bonus") {
      void runBonus(outcome, bet);
      return;
    }
    setStates(settledStates(outcome));
    if (!outcome.wins.length) {
      if (outcome.kind === "tease") {
        setGlow("win");
        setLamp({ text: `${Object.keys(outcome.orbs).length} cores charged. ${HOLD_TRIGGER} start Hold & Respin`, tone: "bonus" });
        a?.sting("win");
      } else setLamp({ text: "No win. Spin again.", tone: "info" });
      setWinLabel("LAST WIN");
      return;
    }

    setGlow("win");
    setLamp({ text: `${outcome.headline}. +${formatPoints(win)}`, tone: "win" });
    const level = outcome.level;
    const lineColor = (sym: keyof typeof SYMBOL_META) => SYMBOL_META[sym].color;
    if (isBig(level)) {
      setLocked(true);
      setStates(presentedStates(outcome, winCells(outcome.wins)));
      const best = [...outcome.wins].sort((x, y) => y.mult - x.mult)[0];
      setBeam({ line: best.line, count: best.count, key: ++lineKey.current, color: lineColor(best.sym) });
      a?.lineChime(0);
      await wait(500);
      if (stale()) {
        setBalance((b) => b + win);
        setLocked(false);
        return;
      }
      await runMajor(level, win);
      fx.current?.clear();
      setBeam(null);
      setStates(settledStates(outcome));
      setLocked(false);
      setBalance((b) => b + win);
    } else {
      setBalance((b) => b + win);
      a?.sting("win");
      fx.current?.sparks(0.5, 0.5, 18, 0.7, "cyan");
      shakeNow(1);
      for (let k = 0; k < outcome.wins.length; k++) {
        const w = outcome.wins[k];
        setStates(presentedStates(outcome, lineCells(w)));
        setBeam({ line: w.line, count: w.count, key: ++lineKey.current, color: lineColor(w.sym) });
        a?.lineChime(k);
        const first = cellPos(0, 1);
        fx.current?.sparks(first.x + 0.1, first.y, 8, 0.5, "cyan");
        const ok = await wait(outcome.wins.length > 1 ? 1500 : 1800);
        if (stale()) return;
        if (!ok) break;
      }
      setBeam(null);
      setStates(settledStates(outcome));
    }
    setLastWin(win);
    setWinLabel("LAST WIN");
    if (!stale()) setGlow("idle");
  }, [spinning, locked, celebration, infoOpen, phase, balance, bet, wakeAudio, skipPresentation, wait, runBonus, runMajor, shakeNow, cellPos]);

  // Space spins (or skips a celebration) unless something else has the keyboard
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const celRef = useRef(celebration);
  celRef.current = celebration;
  const clickRef = useRef(onCelebrationClick);
  clickRef.current = onCelebrationClick;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("button, a, input, select, textarea, [role=dialog]") || t.isContentEditable)) return;
      e.preventDefault();
      if (celRef.current) clickRef.current();
      else void spinRef.current();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const changeBet = (d: 1 | -1) => {
    setBetIndex((i) => Math.min(BET_STEPS.length - 1, Math.max(0, i + d)));
    wakeAudio();
    audio.current?.click();
  };

  /* --------------------------------- rendering --------------------------------- */
  const cs = dims.cs;
  const machineW = cs * 5.3;
  const showPylons = dims.w > machineW + cs * 1.7;
  const hasBeam = beam && phase === "base";
  const holdCount = Object.keys(hold).length;
  const meterCount = phase === "hold" ? holdCount : meter;
  const meterLabel = phase === "hold" ? (od ? "OVERDRIVE ×2" : "HOLD & RESPIN") : "CORE ENERGY";
  const spinLabel = phase === "hold" ? "HOLD" : spinning ? "…" : "SPIN";

  return (
    <div
      onPointerDown={wakeAudio}
      onPointerMove={onPointerMove}
      className={cn("no-root fixed inset-0 z-50 flex select-none flex-col overflow-hidden bg-[#04010e]", od && "no-od", calm && "no-calm")}
      style={{ ["--top" as string]: "clamp(46px,7.4dvh,64px)", ["--deck" as string]: "clamp(124px,23dvh,196px)", ["--sp" as string]: "clamp(72px,14.5dvh,120px)", ["--cs" as string]: `${cs}px` }}
    >
      <style dangerouslySetInnerHTML={{ __html: NEON_CSS }} />
      <NeonDefs />
      <Ambient calm={calm} od={od} />

      <div className={cn("relative z-10 flex min-h-0 flex-1 flex-col", shake.stage)}>
        <TopBar favorite={isFavorite} onFavorite={() => toggleFavorite("neon-overdrive")} onInfo={() => setInfoOpen(true)} musicOn={musicOn} onMusic={toggleMusic} soundOn={soundOn} onSound={toggleSound} />

        <div ref={stageRef} className="relative flex min-h-0 flex-1 items-center justify-center">
          {showPylons && (
            <>
              <div className="no-pylon" style={{ left: `calc(50% - ${machineW / 2 + cs * 0.55}px)` }} />
              <div className="no-pylon r" style={{ right: `calc(50% - ${machineW / 2 + cs * 0.55}px)` }} />
            </>
          )}
          <div ref={tiltRef} style={{ transition: "transform .25s ease-out", transformStyle: "preserve-3d" }}>
            <div className={cn("no-machine", shake.cab)} data-glow={glow} style={{ width: machineW, paddingBottom: cs * 0.1 }}>
              <div className="no-rim"><i /></div>
              <div className="no-body" />
              <div className="relative">
                <EnergyMeter count={meterCount} total={CELLS} od={od} hold={phase === "hold"} label={meterLabel} />
                <div ref={winRef} className={cn("no-window", powerUp && "no-powerup")} style={{ width: cs * 5, height: cs * 4 }}>
                  {phase === "base" ? (
                    <div className="relative flex" style={{ width: cs * 5, height: cs * 4 }}>
                      {Array.from({ length: REELS }, (_, i) => (
                        <Reel key={i} ref={(h) => { reelRefs.current[i] = h; }} index={i} initial={grid[i]} values={orbVals} states={states[i]} cs={cs} anticipating={anticipating && i === REELS - 1} />
                      ))}
                    </div>
                  ) : (
                    <div className="relative flex" style={{ width: cs * 5, height: cs * 4 }}>
                      {Array.from({ length: REELS }, (_, c) => (
                        <div key={c} className="no-col" style={{ width: cs }}>
                          {Array.from({ length: ROWS }, (_, r) => {
                            const key = cellKey(c, r);
                            return <HoldCell key={r} value={hold[key]} boost={od ? 2 : 1} state={holdStates[key] ?? "locked"} spinning={spinKeys.includes(key)} pop={pops[key]} />;
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                  {hasBeam && <LineBeam line={beam.line} count={beam.count} color={beam.color} beamKey={beam.key} />}
                  <div className="no-sheen" />
                </div>
                {/* footer strip */}
                <div className="flex items-center justify-between" style={{ height: cs * 0.26, paddingTop: cs * 0.06, fontSize: Math.max(8, cs * 0.1) }}>
                  {phase === "hold" ? (
                    <>
                      <div className="no-disp flex items-center gap-2 text-white/85">
                        RESPINS
                        <span className="flex gap-1">
                          {Array.from({ length: START_RESPINS }, (_, i) => (
                            <span key={i} className="inline-block rounded-full" style={{ width: cs * 0.11, height: cs * 0.11, background: i < respins ? "var(--c1)" : "rgba(140,160,255,.2)", boxShadow: i < respins ? "0 0 10px var(--c1)" : "none" }} />
                          ))}
                        </span>
                      </div>
                      <div className="no-disp" style={{ color: od ? "var(--c2)" : "#9fb0ff" }}>{od ? "OVERDRIVE ×2 ACTIVE" : `${OVERDRIVE_AT - Math.min(OVERDRIVE_AT, holdCount)} MORE FOR OVERDRIVE`}</div>
                    </>
                  ) : (
                    <>
                      <span className="no-disp text-[#8fa2ff]">12 PAYLINES · WINS PAY LEFT TO RIGHT</span>
                      <span className="no-disp text-[#8fa2ff]">{HOLD_TRIGGER}+ CORES = HOLD &amp; RESPIN</span>
                    </>
                  )}
                </div>
              </div>
              {[[-0.02, -0.02], [1.02, -0.02], [-0.02, 1.02], [1.02, 1.02]].map(([x, y], i) => (
                <i key={i} className="no-screw" style={{ left: `calc(${x * 100}% - var(--cs)*.05)`, top: `calc(${y * 100}% - var(--cs)*.05)`, animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
          </div>
        </div>

        <ControlDeck
          balance={shownBalance}
          bet={bet}
          betLocked={spinning || locked}
          canLower={betIndex > 0}
          canRaise={betIndex < BET_STEPS.length - 1}
          onBet={changeBet}
          win={shownWin}
          winLabel={winLabel}
          spinning={spinning}
          spinDisabled={spinning || locked || !!celebration || broke || phase !== "base"}
          spinLabel={spinLabel}
          onSpin={() => void spin()}
          broke={broke && !locked}
          onReset={() => {
            setBalance(startBalance.current);
            setLamp({ text: "Demo points reset. Press SPIN.", tone: "info" });
          }}
          lamp={<span className={cn("text-[clamp(11px,1.9dvh,15px)] font-medium", lamp.tone === "win" ? "text-[#ffe08a]" : lamp.tone === "bonus" ? "text-[#ff9aea]" : "text-[#a9b8ff]")}>{lamp.text}</span>}
        />
      </div>

      {/* dim everything except the show during major wins */}
      <div className="pointer-events-none absolute inset-0 z-[30] bg-black transition-opacity ease-out" style={{ opacity: dim, transitionDuration: dim > 0 ? "900ms" : "1000ms" }} aria-hidden />

      <FxCanvas ref={fx} calm={calm} />
      <div key={flashKey} className={cn("pointer-events-none absolute inset-0 z-[36] bg-white", flashKey > 0 ? "no-flashfx" : "opacity-0")} aria-hidden />
      <AnimatePresence>
        {celebration && (
          <WinCelebration key={celebration.key} level={celebration.level} amount={celebration.amount} skipSignal={skipSignal} onCounted={() => onCounted(celebration.level)} onSkip={onCelebrationClick} />
        )}
      </AnimatePresence>
      <AnimatePresence>{banner && <Banner key={banner} kind={banner} />}</AnimatePresence>
      <AnimatePresence>{infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}</AnimatePresence>

      <AnimatePresence>
        {!booted && (
          <motion.div key="boot" className="absolute inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-[#03000a] px-6" exit={{ opacity: 0, transition: { duration: 0.7 } }}>
            <div className="no-scanlines" />
            <p className="no-disp no-flicker text-[clamp(1.6rem,7vw,3.6rem)]" style={{ color: "var(--c1)", textShadow: "0 0 18px var(--c1), 0 0 50px var(--c3)", fontStyle: "italic" }}>NEON OVERDRIVE</p>
            <div className="w-full max-w-xs space-y-1 font-mono text-[11px] text-[#8fa2ff]">
              {["REACTOR .......... ONLINE", "PLASMA CELLS ..... CHARGED", "HOLD & RESPIN .... ARMED", "DEMO POINTS ONLY"].map((t, i) => (
                <p key={t} className="no-bootline" style={{ animationDelay: `${0.25 + i * 0.4}s` }}>&gt; {t}</p>
              ))}
            </div>
            <div className="no-bootbar w-full max-w-xs"><i /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Eases a displayed number toward its target. */
function useTweenNum(target: number, seconds: number): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (from.current === target) return;
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / (seconds * 1000));
      const v = start + (target - start) * (1 - Math.pow(1 - p, 3));
      from.current = v;
      setShown(Math.round(v));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        from.current = target;
        setShown(target);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, seconds]);
  return shown;
}

