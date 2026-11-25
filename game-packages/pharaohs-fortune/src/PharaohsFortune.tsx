import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Motes } from "./vendor/art/Stage";
import { WorldArt } from "./vendor/art/WorldArt";
import { useGameHost } from "@spinverse/game-sdk";

import { cn, formatPoints, useReduceMotion } from "@spinverse/game-sdk";
import { PharaohAudio } from "./audio";
import { BonusOverlay, type BonusAnnouncement } from "./BonusOverlay";
import { ControlDeck } from "./ControlDeck";
import { TempleColumn } from "./Decor";
import { FxCanvas, type FxHandle, type PaletteName } from "./FxCanvas";
import { InfoPanel } from "./InfoPanel";
import { BASE_SEQUENCE, BET_STEPS, DEFAULT_BET_INDEX, FREE_SEQUENCE, REELS, ROWS, START_ROWS, gridByReel, lineCells, nextOutcome, scatterCells, scatterReward, winCells, type Outcome, type WinLevel } from "./mock";
import { PaylineOverlay } from "./PaylineOverlay";
import type { CellState } from "./Reel";
import { SlotMachine, type MachineHandle } from "./SlotMachine";
import { SymbolArt } from "./SymbolArt";
import { TopBar } from "./TopBar";
import { useTween } from "./useTween";
import { WinCelebration, type BigLevel } from "./WinCelebration";

type Lamp = { text: string; tone: "info" | "win" | "scatter" };
type Active = { line: number; count: number; key: number };
type Shake = { cab: string; stage: string };

const blankStates = (): CellState[][] => Array.from({ length: REELS }, () => Array.from({ length: ROWS }, () => "idle" as CellState));

/** Resting look after a result: winners keep a calm glow, scarabs pulse, the rest recede slightly. */
function settledStates(o: Outcome): CellState[][] {
  const wins = winCells(o);
  const scat = o.scatters >= 2 ? scatterCells(o) : new Set<string>();
  const any = wins.size > 0 || scat.size > 0;
  return Array.from({ length: REELS }, (_, reel) =>
    Array.from({ length: ROWS }, (_, row): CellState => {
      const key = `${reel}:${row}`;
      if (!any) return "idle";
      if (wins.has(key)) return "win";
      if (scat.has(key)) return "scatter";
      return "dim";
    }),
  );
}

/** One winning line is being presented: its cells come forward, everything else drops back. */
function presentedStates(o: Outcome, cells: Set<string>): CellState[][] {
  const scat = o.scatters >= 2 ? scatterCells(o) : new Set<string>();
  return Array.from({ length: REELS }, (_, reel) =>
    Array.from({ length: ROWS }, (_, row): CellState => {
      const key = `${reel}:${row}`;
      return cells.has(key) ? "front" : scat.has(key) ? "scatter" : "dim";
    }),
  );
}

const SHAKE_MS = [0, 700, 1200, 1800, 2700];
const isBig = (l: WinLevel): l is BigLevel => l === "big" || l === "super" || l === "mega" || l === "jackpot";

/** Major-win tuning: quake strength (1-4), how far the interface dims, fireworks, confetti, and how long the show runs. */
const MAJOR: Record<BigLevel, { n: 1 | 2 | 3 | 4; dim: number; rockets: number; confetti: number; coins: number; palettes: PaletteName[]; ms: number }> = {
  big: { n: 1, dim: 0.74, rockets: 8, confetti: 90, coins: 70, palettes: ["gold", "white", "ember"], ms: 5800 },
  super: { n: 2, dim: 0.8, rockets: 13, confetti: 150, coins: 120, palettes: ["gold", "teal", "white"], ms: 6800 },
  mega: { n: 3, dim: 0.84, rockets: 19, confetti: 220, coins: 180, palettes: ["gold", "ruby", "ember", "white"], ms: 7800 },
  jackpot: { n: 4, dim: 0.88, rockets: 30, confetti: 340, coins: 280, palettes: ["gold", "white", "teal", "ruby", "ember"], ms: 10800 },
};

export function PharaohsFortune() {
  const host = useGameHost();
  // The celebration is the point of this screen, so it always plays. When the system asks for reduced motion
  // we run it "calm": the same show, with the machine shake dampened and the decorative dust left out.
  const calm = useReduceMotion();

  // demo balance: starts from the player's points but never writes back to them
  const startBalance = useRef(host.player?.demoBalance ?? 5000);
  const [balance, setBalance] = useState(startBalance.current);
  const [betIndex, setBetIndex] = useState(DEFAULT_BET_INDEX);
  const [spinning, setSpinning] = useState(false);
  const [states, setStates] = useState<CellState[][]>(blankStates);
  const [lamp, setLamp] = useState<Lamp>({ text: "Press SPIN to play. Demo points only.", tone: "info" });
  const [lastWin, setLastWin] = useState(0);
  const [winLabel, setWinLabel] = useState("LAST WIN");
  const [glow, setGlow] = useState<"idle" | "win" | "bonus">("idle");
  const [freeSpins, setFreeSpins] = useState(0);
  const [announce, setAnnounce] = useState<BonusAnnouncement | null>(null);
  const [tease, setTease] = useState(false);
  const [anticipating, setAnticipating] = useState(false);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [active, setActive] = useState<Active | null>(null);
  const [shake, setShake] = useState<Shake>({ cab: "", stage: "" });
  const [flashKey, setFlashKey] = useState(0);
  const [celebration, setCelebration] = useState<{ level: BigLevel; amount: number; key: number } | null>(null);
  const [skipSignal, setSkipSignal] = useState(0);
  const [dim, setDim] = useState(0);

  const machine = useRef<MachineHandle>(null);
  const fx = useRef<FxHandle>(null);
  const audio = useRef<PharaohAudio | null>(null);
  const spinIdx = useRef(0);
  const freeIdx = useRef(0);
  const spinCount = useRef(0);
  const bonusTotal = useRef(0);
  const runId = useRef(0);
  const skipped = useRef(false);
  const wake = useRef<(() => void) | null>(null);
  const counted = useRef(false);
  const majorLevel = useRef<BigLevel | null>(null);
  const celebrationDone = useRef<(() => void) | null>(null);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lineKey = useRef(0);
  const musicStarted = useRef(false);

  if (!audio.current && typeof window !== "undefined") audio.current = new PharaohAudio();

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /** Sleep that a skip can cut short. Returns false when it was cut short. */
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

  /* ---------------------------- settings and lifecycle ---------------------------- */
  useEffect(() => {
    const a = audio.current;
    try {
      if (localStorage.getItem("sv-pf-music") === "off") {
        setMusicOn(false);
        if (a) a.musicOn = false;
      }
      if (localStorage.getItem("sv-pf-sound") === "off") {
        setSoundOn(false);
        if (a) a.soundOn = false;
      }
    } catch {}
    const onVis = () => (document.hidden ? audio.current?.suspend() : audio.current?.resume());
    document.addEventListener("visibilitychange", onVis);
    const pending = timers.current;
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      pending.forEach(clearTimeout);
      clearTimeout(shakeTimer.current);
      fx.current?.clear();
      audio.current?.destroy();
    };
  }, []);

  /** The first touch or key press anywhere starts the music (browsers require a gesture). */
  const wakeAudio = useCallback(() => {
    const a = audio.current;
    if (!a || musicStarted.current) return;
    musicStarted.current = true;
    a.unlock();
    a.preload();
    void a.startMusic();
  }, []);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    const a = audio.current;
    if (a) {
      a.unlock();
      a.setMusic(next);
      if (next) musicStarted.current = true;
    }
    try {
      localStorage.setItem("sv-pf-music", next ? "on" : "off");
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
      localStorage.setItem("sv-pf-sound", next ? "on" : "off");
    } catch {}
  };

  const bet = BET_STEPS[betIndex];
  const free = freeSpins > 0;
  const broke = !free && balance < bet;
  const isFavorite = host.favorite;
  const shownBalance = useTween(balance, 0.7);
  const shownWin = useTween(lastWin, lastWin > 0 ? 1.2 : 0.2);

  /* ---------------------------- physical feedback ---------------------------- */
  const shakeNow = useCallback((level: 1 | 2 | 3 | 4) => {
    clearTimeout(shakeTimer.current);
    setShake({ cab: `pf-shake-${level}`, stage: level >= 2 ? `pf-stage-shake-${level}` : "" });
    shakeTimer.current = setTimeout(() => setShake({ cab: "", stage: "" }), SHAKE_MS[level]);
    audio.current?.impact(level);
  }, []);

  const flash = useCallback((times: number) => {
    for (let i = 0; i < times; i++) later(() => setFlashKey((k) => k + 1), i * 520);
  }, [later]);

  /** A small win: a few coins and a light nudge. */
  const smallWinEffects = useCallback(() => {
    fx.current?.fountain(0.5, 0.5, 16, 0.7);
    audio.current?.coins(5, 0.5);
    shakeNow(1);
  }, [shakeNow]);

  /** Sustained, multi-directional quake of the whole machine; strength by level. */
  const quakeStart = useCallback((n: 1 | 2 | 3 | 4) => {
    clearTimeout(shakeTimer.current);
    setShake({ cab: `pf-qc-${n}`, stage: `pf-q-${n}` });
  }, []);
  const quakeEnd = useCallback((n: 1 | 2 | 3 | 4) => {
    setShake({ cab: `pf-qc-out-${n}`, stage: `pf-q-out-${n}` });
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShake({ cab: "", stage: "" }), 950);
  }, []);

  const closeCelebration = useCallback(() => {
    setCelebration(null);
    setDim(0);
    if (majorLevel.current) quakeEnd(MAJOR[majorLevel.current].n);
    majorLevel.current = null;
    celebrationDone.current?.();
    celebrationDone.current = null;
  }, [quakeEnd]);

  /**
   * The major-win show, in order: the machine slams and quakes, the interface darkens, fireworks and confetti
   * burst around the machine, the announcement slams in, the amount counts up, then everything fades out.
   * Resolves when the show has closed.
   */
  const runMajor = useCallback(
    (level: BigLevel, amount: number) =>
      new Promise<void>((resolve) => {
        const cfg = MAJOR[level];
        const snd = audio.current;
        const f = fx.current;
        counted.current = false;
        majorLevel.current = level;
        celebrationDone.current = resolve;
        setSkipSignal(0);

        // 1-2. the slam: the whole machine starts shaking hard
        quakeStart(cfg.n);
        snd?.impact(cfg.n);
        snd?.rumble(cfg.ms / 1000 - 1, cfg.n);
        snd?.sting(level);
        f?.flare(0.5, 0.5, 1.4);
        flash(level === "jackpot" ? 3 : 2);

        // 3. the atmosphere darkens
        later(() => setDim(cfg.dim), 150);

        // 4. fireworks, crackers, confetti and coins around the machine
        later(() => {
          f?.confetti(cfg.confetti, cfg.ms / 1000 - 1.2);
          f?.shower(cfg.coins, cfg.ms / 1000 - 1.6);
          snd?.coins(10 + cfg.n * 6, cfg.ms / 1000 - 1.5);
        }, 450);
        const span = cfg.ms - 1900;
        for (let i = 0; i < cfg.rockets; i++) {
          const at = 500 + (i / cfg.rockets) * span + Math.random() * 160;
          later(() => {
            const zone = Math.random();
            const x1 = zone < 0.36 ? 0.05 + Math.random() * 0.22 : zone < 0.72 ? 0.73 + Math.random() * 0.22 : 0.3 + Math.random() * 0.4;
            const y1 = zone < 0.72 ? 0.2 + Math.random() * 0.4 : 0.1 + Math.random() * 0.2;
            const pal = [cfg.palettes[Math.floor(Math.random() * cfg.palettes.length)], "gold" as PaletteName];
            f?.rocket(Math.min(0.95, Math.max(0.05, x1 + (Math.random() - 0.5) * 0.2)), 1, x1, y1, pal, 0.8 + cfg.n * 0.18);
            if (Math.random() < 0.5) f?.flare(x1, y1, 0.6);
          }, at);
        }
        // keep the machine alive with fresh slams on the bigger wins
        if (cfg.n >= 3) later(() => quakeStart(cfg.n), 3200);

        // 5-6. the announcement and the counting amount
        later(() => {
          snd?.voice(level);
          setCelebration({ level, amount, key: ++lineKey.current });
        }, 900);
      }),
    [quakeStart, flash, later],
  );

  const onCounted = useCallback(
    (level: BigLevel) => {
      counted.current = true;
      audio.current?.tally();
      later(closeCelebration, level === "jackpot" ? 2600 : 1600);
    },
    [closeCelebration, later],
  );

  const onCelebrationClick = useCallback(() => {
    if (counted.current) closeCelebration();
    else setSkipSignal((n) => n + 1);
  }, [closeCelebration]);

  /* --------------------------------- the spin --------------------------------- */
  const spin = useCallback(async () => {
    if (spinning || announce || infoOpen || locked || celebration) return;
    const snd = audio.current;
    wakeAudio();
    snd?.unlock();
    if (!free && balance < bet) {
      setLamp({ text: "Not enough demo points for this bet. Lower it or reset your demo points.", tone: "info" });
      return;
    }

    // a quick tap during a small win presentation ends it and moves on
    skipPresentation();
    const me = ++runId.current;
    skipped.current = false;
    const stale = () => runId.current !== me;

    const outcome = free ? nextOutcome(FREE_SEQUENCE, freeIdx.current++) : nextOutcome(BASE_SEQUENCE, spinIdx.current++);
    const freeLeft = free ? freeSpins - 1 : 0;
    const win = outcome.multiplier * bet;
    const reward = scatterReward(outcome);
    const scatterPrize = reward ? reward.multiplier * bet : 0;
    const total = win + scatterPrize;
    let credited = false;
    const credit = () => {
      if (credited || total <= 0) return;
      credited = true;
      setBalance((b) => b + total);
    };

    spinCount.current++;
    setSpinning(true);
    setStates(blankStates());
    setActive(null);
    setGlow("idle");
    setTease(false);
    setLastWin(0);
    setWinLabel("WIN");
    setLamp({ text: free ? "Free spin…" : "Good luck…", tone: "info" });
    if (free) setFreeSpins(freeLeft);
    else setBalance((b) => b - bet);
    snd?.spinStart();
    if ((spinCount.current - 1) % 4 === 0 && !free) snd?.voice("goodLuck");

    const byReel = gridByReel(outcome);
    const earlyScatters = byReel.slice(0, REELS - 1).flat().filter((s) => s === "scarab").length;
    const anticipate = earlyScatters >= 2 && byReel[REELS - 1].includes("scarab");
    if (anticipate) setAnticipating(true);

    const options = byReel.map((_, i) => (
      { duration: 1450 + i * 330 + (anticipate && i === REELS - 1 ? 1600 : 0), fillers: 14 + i * 4 + (anticipate && i === REELS - 1 ? 14 : 0) }
    ));

    let landed = 0;
    await machine.current?.spinAll(byReel, options, (i) => {
      snd?.reelStop(i);
      const rows = byReel[i].map((s, r) => (s === "scarab" ? r : -1)).filter((r) => r >= 0);
      if (rows.length) {
        landed += rows.length;
        snd?.scatter(landed);
        setStates((prev) => prev.map((col, ci) => (ci === i ? col.map((c, r) => (rows.includes(r) ? "land" : c)) : col)));
      }
      if (i === REELS - 1) snd?.spinEnd();
    });
    setAnticipating(false);
    snd?.spinEnd();

    // ------------------------------- result -------------------------------
    setSpinning(false);
    setStates(settledStates(outcome));

    // scatter outcomes
    if (outcome.kind === "bonus" && reward) {
      setLocked(true);
      setGlow("bonus");
      setLamp({ text: `${outcome.headline}. +${formatPoints(scatterPrize)}`, tone: "scatter" });
      credit();
      later(() => {
        snd?.sting("freeSpins");
        snd?.voice("freeSpins");
        shakeNow(2);
        flash(2);
        fx.current?.sparks(0.5, 0.45, 40, 1.4);
        bonusTotal.current = scatterPrize;
        setFreeSpins(reward.freeSpins);
        setAnnounce({ type: "bonus", count: outcome.scatters, freeSpins: reward.freeSpins, amount: scatterPrize });
      }, 1100);
      return;
    }
    if (outcome.kind === "scatter-tease") {
      setGlow("win");
      setLamp({ text: "Two Golden Scarabs. One more opens the chamber.", tone: "scatter" });
      setTease(true);
      later(() => setTease(false), 2600);
      setLastWin(0);
      setWinLabel("LAST WIN");
      return;
    }
    if (!outcome.lineWins.length) {
      setLamp({ text: free ? "No win on that free spin." : "No win this time. Spin again.", tone: "info" });
      setWinLabel("LAST WIN");
      if (free && freeLeft === 0) endBonus();
      return;
    }

    // line wins: present each winning line in turn, then celebrate by level
    setGlow("win");
    setLamp({ text: `${outcome.headline}. +${formatPoints(win)}`, tone: "win" });
    const level = outcome.level;
    if (isBig(level)) {
      // a major win: the reels have just stopped. Bring the winning line forward for a beat, then the show starts.
      setLocked(true);
      setStates(presentedStates(outcome, winCells(outcome)));
      const best = [...outcome.lineWins].sort((x, y) => y.multiplier - x.multiplier)[0];
      setActive({ line: best.line, count: best.count, key: ++lineKey.current });
      snd?.lineChime(0);
      await wait(450);
      if (stale()) {
        setLocked(false);
        return credit();
      }
      await runMajor(level, win);
      fx.current?.clear();
      setActive(null);
      setStates(settledStates(outcome));
      setLocked(false);
    } else {
      snd?.sting("nice");
      snd?.voice("nice");
      smallWinEffects();
      for (let k = 0; k < outcome.lineWins.length; k++) {
        const w = outcome.lineWins[k];
        setStates(presentedStates(outcome, lineCells(w)));
        setActive({ line: w.line, count: w.count, key: ++lineKey.current });
        snd?.lineChime(k);
        const ok = await wait(outcome.lineWins.length > 1 ? 1500 : 1700);
        if (stale()) return credit();
        if (!ok) break;
      }
      setActive(null);
      setStates(settledStates(outcome));
    }

    credit();
    setLastWin(total);
    setWinLabel("LAST WIN");
    if (!stale()) setGlow("idle");
    if (free && freeLeft === 0) {
      bonusTotal.current += win;
      endBonus();
    } else if (free) {
      bonusTotal.current += win;
    }

    function endBonus() {
      setLocked(true);
      later(() => {
        snd?.sting("big");
        snd?.voice("big");
        shakeNow(2);
        flash(2);
        setGlow("bonus");
        setAnnounce({ type: "end", total: bonusTotal.current });
      }, 1200);
    }
  }, [spinning, announce, infoOpen, locked, celebration, free, freeSpins, balance, bet, later, wait, skipPresentation, runMajor, smallWinEffects, shakeNow, flash, wakeAudio]);

  // Space spins (or skips a celebration), as long as nothing else has the keyboard
  const spinRef = useRef(spin);
  spinRef.current = spin;
  const celebrationRef = useRef(celebration);
  celebrationRef.current = celebration;
  const clickRef = useRef(onCelebrationClick);
  clickRef.current = onCelebrationClick;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("button, a, input, select, textarea, [role=dialog]") || t.isContentEditable)) return;
      e.preventDefault();
      if (celebrationRef.current) clickRef.current();
      else void spinRef.current();
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  const closeAnnouncement = useCallback(() => {
    if (!announce) return;
    if (announce.type === "bonus") setLamp({ text: `${announce.freeSpins} free spins. Press SPIN.`, tone: "scatter" });
    else {
      setLamp({ text: `Bonus complete. +${formatPoints(announce.total)} demo points.`, tone: "win" });
      setGlow("idle");
      setLastWin(announce.total);
      setWinLabel("BONUS");
    }
    setAnnounce(null);
    setLocked(false);
  }, [announce]);

  const changeBet = (d: 1 | -1) => {
    setBetIndex((i) => Math.min(BET_STEPS.length - 1, Math.max(0, i + d)));
    wakeAudio();
    audio.current?.click();
  };

  return (
    <div
      data-parallax-root
      onPointerDown={wakeAudio}
      className={cn("pf-root fixed inset-0 z-50 flex select-none flex-col overflow-hidden bg-[#050302]", calm && "pf-calm")}
    >
      {/* ---------- the treasure chamber (static backdrop) ---------- */}
      <div className="absolute inset-0 -z-0" aria-hidden>
        <div className="absolute inset-0 opacity-[0.8]"><WorldArt gameId="pharaohs-fortune" particles={false} /></div>
        <div className="absolute inset-0 bg-[radial-gradient(75%_65%_at_50%_44%,transparent,rgba(4,2,1,.82)_85%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050302] via-[#050302]/40 to-[#050302]/60" />
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: glow === "idle" ? 0.55 : 1, background: "radial-gradient(55% 45% at 50% 46%, rgba(240,184,74,.28), transparent 72%)" }} />
        <div className="pf-beams absolute inset-0" />
        <TempleColumn side="left" className="hidden [@media(min-aspect-ratio:3/2)]:block" />
        <TempleColumn side="right" className="hidden [@media(min-aspect-ratio:3/2)]:block" />
        {!calm && <Motes count={26} color="rgba(255,217,160,.9)" kind="drift" seed={31} size={[1.2, 3.2]} />}
        {/* gold pooled on the floor in front of the machine */}
        <div className="absolute inset-x-[14%] bottom-[calc(var(--deck)-2%)] h-[10%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(240,184,74,.35),transparent)] blur-md" />
      </div>

      {/* ---------- the machine (this is what shakes) ---------- */}
      <div className={cn("relative z-10 flex min-h-0 flex-1 flex-col", shake.stage)}>
        <TopBar favorite={isFavorite} onFavorite={() => host.toggleFavorite()} onInfo={() => setInfoOpen(true)} musicOn={musicOn} onMusic={toggleMusic} soundOn={soundOn} onSound={toggleSound} />

        <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center" style={{ paddingBlock: "var(--vpad)" }}>
          {free && (
            <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="absolute left-1/2 top-0 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#7ff5e6]/45 bg-[#062a2a]/85 px-4 py-1 text-[clamp(10px,1.6dvh,13px)] font-semibold text-[#9ffcf0] backdrop-blur">
              Free spins · {freeSpins} left · bonus so far +{formatPoints(bonusTotal.current)}
            </motion.p>
          )}
          <SlotMachine
            ref={machine}
            initialRows={START_ROWS}
            states={states}
            anticipating={anticipating}
            glow={glow}
            free={free}
            shake={shake.cab}
            overlay={
              <>
                <PaylineOverlay active={active} />
                <AnimatePresence>
                  {tease && (
                    <motion.div key="tease" initial={{ opacity: 0, scale: 0.8, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pointer-events-none absolute inset-x-0 top-[5%] z-10 flex justify-center">
                      <span className="flex items-center gap-2 rounded-full border border-[#7ff5e6]/50 bg-black/85 py-1.5 pl-2 pr-4 text-[clamp(11px,2.4cqw,18px)] font-semibold text-[#9ffcf0] shadow-[0_0_30px_rgba(60,230,210,.45)] backdrop-blur">
                        <SymbolArt id="scarab" className="h-[1.9em] w-[1.9em]" /> Two scarabs. One more opens the chamber.
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            }
          />
        </div>

        <ControlDeck
          balance={shownBalance}
          bet={bet}
          betLocked={spinning || free || locked}
          canLower={betIndex > 0}
          canRaise={betIndex < BET_STEPS.length - 1}
          onBet={changeBet}
          win={shownWin}
          winLabel={winLabel}
          freeSpins={freeSpins}
          spinning={spinning}
          spinDisabled={spinning || !!announce || locked || !!celebration || broke}
          onSpin={() => void spin()}
          broke={broke}
          onReset={() => {
            setBalance(startBalance.current);
            setLamp({ text: "Demo points reset. Press SPIN.", tone: "info" });
          }}
          lamp={
            <span className={cn("text-[clamp(11px,1.9dvh,15px)] font-medium", lamp.tone === "win" ? "text-[#fff1b8]" : lamp.tone === "scatter" ? "text-[#9ffcf0]" : "text-[#d9c28a]")}>{lamp.text}</span>
          }
        />
      </div>

      {/* dims everything normal during a major win; the celebration layers above it stay fully bright */}
      <div className="pointer-events-none absolute inset-0 z-[30] bg-black transition-opacity ease-out" style={{ opacity: dim, transitionDuration: dim > 0 ? "900ms" : "1000ms" }} aria-hidden />
      <div className="pointer-events-none absolute inset-0 z-[30] transition-opacity duration-1000" style={{ opacity: dim > 0 ? 1 : 0, background: "radial-gradient(60% 55% at 50% 48%, rgba(255,190,70,.14), transparent 70%)" }} aria-hidden />

      {/* ---------- effects and announcements (steady while the machine shakes) ---------- */}
      <FxCanvas ref={fx} reduced={false} />
      <div key={flashKey} className={cn("pointer-events-none absolute inset-0 z-[36]", flashKey > 0 && "pf-flash")} aria-hidden />
      <AnimatePresence>
        {celebration && <WinCelebration key={celebration.key} level={celebration.level} amount={celebration.amount} reduced={false} skipSignal={skipSignal} onCounted={() => onCounted(celebration.level)} onSkip={onCelebrationClick} />}
      </AnimatePresence>
      <AnimatePresence>{announce && <BonusOverlay key={announce.type} data={announce} onContinue={closeAnnouncement} />}</AnimatePresence>
      <AnimatePresence>{infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}</AnimatePresence>
    </div>
  );
}
