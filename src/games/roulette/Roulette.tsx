"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Music2, Repeat2, Trash2, Undo2, Volume2, VolumeX } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { RouletteAudio } from "./audio";
import { Board } from "./Board";
import { Chip, compact } from "./Chip";
import { CHIPS, PAYOUT, POCKETS, RouletteEngine, colorOf, pocketIndex, type Settlement } from "./engine";
import { planSpin, STEP, type SpinMotion } from "./spinAnim";
import { ROULETTE_CSS } from "./styles";
import { BALL_POCKET_R, BALL_TRACK_R, RouletteWheel, type WheelHandle } from "./Wheel";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
/** width / height of the wheel canvas for a tilt in degrees (mirrors the formula in Wheel.tsx) */
const wheelAspect = (tilt: number) => {
  const r = (tilt * Math.PI) / 180;
  const k = Math.cos(r);
  const s = Math.sin(r);
  const e = 1.16 * k;
  const top = Math.max(e, 0.78 * s + 0.04) + 0.03;
  const bottom = e + 0.18 * s + 0.05;
  return 2.4 / (top + bottom);
};
const COLOR_NAME = { red: "Red", black: "Black", green: "Green" } as const;

/** true on phones and small portrait tablets, where the table is turned upright */
function useUpright() {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(max-width: 900px)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(max-width: 900px)").matches,
    () => false,
  );
}

function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id="rl-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0bd" />
          <stop offset=".5" stopColor="#d9ab4a" />
          <stop offset="1" stopColor="#8a5f16" />
        </linearGradient>
      </defs>
      <path d="M6 34 L10 12 L22 24 L32 6 L42 24 L54 12 L58 34 Z" fill="url(#rl-crown)" stroke="#6b4a10" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="8" y="34" width="48" height="4" rx="1.5" fill="url(#rl-crown)" stroke="#6b4a10" strokeWidth="1" />
      {[10, 32, 54].map((x, i) => (
        <circle key={x} cx={x} cy={i === 1 ? 5 : 11} r="2.6" fill="#fff6d8" stroke="#8a5f16" strokeWidth=".8" />
      ))}
    </svg>
  );
}

export function Roulette() {
  const { player } = useSession();
  const calm = useReduceMotion();
  const upright = useUpright();

  // the demo balance starts from the player's points and is never written back
  const startBalance = useRef(Math.max(1000, player?.balance ?? 10000));
  const engineRef = useRef<RouletteEngine | null>(null);
  if (!engineRef.current) engineRef.current = new RouletteEngine(startBalance.current);
  const engine = engineRef.current;
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);

  const audio = useRef<RouletteAudio | null>(null);
  const wheel = useRef<WheelHandle>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [audioRunning, setAudioRunning] = useState(false);
  const [rules, setRules] = useState(false);
  /** the ball has landed: the number and colour are shown from here, a moment before the round settles */
  const [landed, setLanded] = useState<{ n: number } | null>(null);

  /* ------------------------------ audio lifecycle ------------------------------ */
  useEffect(() => {
    const a = new RouletteAudio();
    audio.current = a;
    try {
      if (localStorage.getItem("sv-rl-music") === "off") {
        a.musicOn = false;
        setMusicOn(false);
      }
      if (localStorage.getItem("sv-rl-sound") === "off") {
        a.soundOn = false;
        setSoundOn(false);
      }
    } catch {}
    a.onStateChange = () => setAudioRunning(a.running);
    a.unlock();
    a.startMusic();
    setAudioRunning(a.running);
    const onVis = () => (document.hidden ? a.suspend() : a.resume());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      a.onStateChange = undefined;
      a.stopAllSfx();
      a.destroy();
      audio.current = null;
    };
  }, []);

  const wake = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    a.unlock();
    a.startMusic();
    setAudioRunning(a.running);
  }, []);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    audio.current?.unlock();
    audio.current?.setMusic(next);
    try {
      localStorage.setItem("sv-rl-music", next ? "on" : "off");
    } catch {}
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audio.current?.unlock();
    audio.current?.setSound(next);
    if (next) audio.current?.click();
    try {
      localStorage.setItem("sv-rl-sound", next ? "on" : "off");
    } catch {}
  };

  /* ------------------------------ the wheel: animation and its sounds ------------------------------ */
  const motion_ = useRef<{ motion: SpinMotion | null; start: number; ev: number; revealed: boolean; ballOn: boolean; wheelAt: number; idx: number; openedAt: number }>({
    motion: null,
    start: 0,
    ev: 0,
    revealed: false,
    ballOn: false,
    wheelAt: 0.4,
    idx: pocketIndex(17),
    openedAt: 0,
  });

  useEffect(() => {
    const m = motion_.current;
    engine.onEvent = (e) => {
      const a = audio.current;
      switch (e.type) {
        case "chip":
          a?.chip();
          break;
        case "undo":
          a?.undo();
          break;
        case "clear":
          a?.clear();
          break;
        case "reject":
          a?.error();
          break;
        case "spin":
          // the engine has already chosen the number; the motion is built to end on its pocket
          m.motion = planSpin(e.plan.index, BALL_TRACK_R, BALL_POCKET_R);
          m.start = e.plan.startedAt;
          m.ev = 0;
          m.revealed = false;
          m.idx = e.plan.index;
          m.ballOn = true;
          setLanded(null);
          a?.spinStart();
          a?.ballRoll(true);
          break;
        case "result": {
          const r = e.result;
          if (r.totalStake > 0) (r.totalReturned > 0 ? a?.win(r.totalReturned) : a?.lose());
          break;
        }
        case "open":
          m.motion = null;
          m.openedAt = performance.now();
          m.revealed = false;
          setLanded(null);
          a?.wheelStop();
          break;
      }
    };
    return () => {
      engine.onEvent = undefined;
    };
  }, [engine]);

  useEffect(() => {
    const m = motion_.current;
    let raf = 0;
    let lastT = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      engine.tick(now);
      const a = audio.current;
      const phase = engine.currentPhase;
      if (m.motion && (phase === "spinning" || phase === "result")) {
        const t = now - m.start;
        lastT = t;
        const f = m.motion.at(t);
        m.wheelAt = f.wheel;
        wheel.current?.draw({ wheel: f.wheel, ball: f.ball, ballR: f.ballR, lift: f.lift });
        a?.wheelUpdate(f.wheelSpeed);
        if (m.ballOn) a?.ballUpdate(f.ballSpeed);
        const evs = m.motion.events;
        while (m.ev < evs.length && t >= evs[m.ev].t) {
          const ev = evs[m.ev++];
          if (ev.kind === "bounce") a?.ballBounce(ev.strength);
          else {
            a?.ballLand();
            a?.ballRoll(false);
            m.ballOn = false;
          }
        }
        if (!m.revealed && t >= m.motion.revealMs) {
          m.revealed = true;
          const n = engine.currentSpin?.winning ?? POCKETS[m.idx];
          setLanded({ n });
          const c = colorOf(n);
          a?.reveal(c);
        }
      } else {
        // betting: the wheel drifts slowly with the ball resting in its pocket
        const sec = (now - m.openedAt) / 1000;
        const w = m.wheelAt - 0.05 * sec;
        if (!m.motion) {
          wheel.current?.draw({ wheel: w, ball: w + m.idx * STEP, ballR: BALL_POCKET_R, lift: 0 });
        }
      }
      void lastT;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  const spin = () => {
    wake();
    engine.spin(performance.now());
  };

  const betting = snap.phase === "betting";
  const res: Settlement | null = snap.result;
  const winNum = landed?.n ?? null;
  const winColor = winNum === null ? null : colorOf(winNum);
  const needsEnable = !audioRunning && (musicOn || soundOn);
  const canReset = betting && snap.totalStake === 0 && snap.balance < 1;

  // what the left panel says
  const panel = (() => {
    if (snap.phase === "spinning") return { title: "No More Bets", text: "The wheel is spinning" };
    if (res) {
      const won = res.lines.filter((l) => l.won);
      return {
        title: `${res.winning} ${COLOR_NAME[res.color]}`,
        text: res.totalStake === 0 ? "No bets this round" : won.length ? `${won.length} winning bet${won.length > 1 ? "s" : ""}: ${res.net >= 0 ? "+" : "−"}${money(Math.abs(res.net))} net` : "No winning bets this round",
        lines: won.slice(0, 4),
      };
    }
    return { title: "Place Your Bets", text: "Select your chips and choose your bets" };
  })();

  const lastWin = snap.last ? snap.last.totalReturned : 0;

  return (
    <div className="rl-root fixed inset-0 z-50 overflow-y-auto overflow-x-hidden" onPointerDown={wake} onKeyDown={wake}>
      <style dangerouslySetInnerHTML={{ __html: ROULETTE_CSS }} />

      <div className="rl-room">
        <header className="rl-head">
          <div className="rl-head-l">
            <Link href="/dashboard" className="rl-btn" aria-label="Back to lobby">
              <ArrowLeft className="h-4 w-4" />
              <span>Lobby</span>
            </Link>
            <div className="rl-brand">
              <small>SPINVERSE</small>
              <Crown className="rl-crown" />
              <h1>Roulette</h1>
            </div>
          </div>

          <div className="rl-results" role="list" aria-label="Recent results">
            <span className="rl-results-l">Recent Results</span>
            <div className="rl-results-row">
              {snap.history.length === 0 && <span className="rl-results-empty">Numbers appear here after each spin</span>}
              <AnimatePresence initial={false}>
                {snap.history.map((n, i) => (
                  <motion.span
                    key={(snap.phase === "result" ? snap.round : snap.round - 1) - i}
                    role="listitem"
                    layout
                    initial={{ opacity: 0, scale: 0.4, x: -18 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className={`rl-num rl-n-${colorOf(n)}`}
                    aria-label={`${n} ${COLOR_NAME[colorOf(n)]}`}
                  >
                    {n}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="rl-head-r">
            {needsEnable && (
              <button type="button" className="rl-pill" onClick={wake}>
                <Volume2 className="h-3.5 w-3.5" /> Enable sound
              </button>
            )}
            {canReset && (
              <button type="button" className="rl-btn" onClick={() => engine.resetBalance(startBalance.current)}>
                Reset credits
              </button>
            )}
            <div className="rl-bal" aria-label={`Demo balance ${money(snap.balance)}`}>
              <small>Demo Balance</small>
              <span>
                <i className="rl-coin" aria-hidden />
                <b className="rl-numfont">{money(snap.balance)}</b>
              </span>
            </div>
            <button type="button" className="rl-icon" aria-pressed={soundOn} aria-label={soundOn ? "Turn sound effects off" : "Turn sound effects on"} title="Sound effects" onClick={toggleSound}>
              {soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" className="rl-icon" aria-pressed={musicOn} aria-label={musicOn ? "Turn music off" : "Turn music on"} title="Music" onClick={toggleMusic}>
              <Music2 className="h-[18px] w-[18px]" />
            </button>
            <button type="button" className="rl-btn" onClick={() => setRules(true)} aria-haspopup="dialog">
              <BookOpen className="h-4 w-4" />
              <span>Rules</span>
            </button>
          </div>
        </header>

        <section className="rl-stage">
          <aside className="rl-panel rl-status" aria-live="polite">
            <h2>{panel.title}</h2>
            <p>{panel.text}</p>
            {panel.lines && panel.lines.length > 0 && (
              <ul>
                {panel.lines.map((l) => (
                  <li key={l.id}>
                    <span>{l.label}</span>
                    <b>+{money(l.winnings)}</b>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <div className="rl-wheelzone">
            <div className="rl-wheelbox" style={{ ["--ar" as string]: wheelAspect(upright ? 50 : 56) } as React.CSSProperties}>
              <RouletteWheel ref={wheel} tilt={upright ? 50 : 56} />
              <div className="rl-reveal-wrap">
              <AnimatePresence>
                {landed && winColor && (
                  <motion.div key={`${snap.round}-${landed.n}`} className={`rl-reveal rl-n-${winColor}`} initial={{ opacity: 0, scale: 0.5, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 220, damping: 16 }} role="status" aria-label={`Winning number ${landed.n}, ${COLOR_NAME[winColor]}`}>
                    <b className="rl-numfont">{landed.n}</b>
                    <span>{COLOR_NAME[winColor]}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              </div>
            </div>
          </div>

          <aside className="rl-panel rl-total">
            <h2>Total Bet</h2>
            <p>
              <i className="rl-coin" aria-hidden />
              <b className="rl-numfont">{money(snap.totalStake)}</b>
            </p>
          </aside>
        </section>

        <section className="rl-tablezone" aria-label="Betting table">
          <Board
            orient={upright ? "v" : "h"}
            bets={snap.bets}
            disabled={!betting}
            onPlace={(id) => {
              wake();
              engine.place(id);
            }}
            winning={winNum}
            lines={res ? res.lines : null}
          />
          {snap.note && (
            <p role="alert" className="rl-note">
              {snap.note}
            </p>
          )}
        </section>

        <footer className="rl-dock">
          <div className="rl-panel rl-last">
            <h2>Last Win</h2>
            <p>
              <i className="rl-coin" aria-hidden />
              <b className="rl-numfont">{money(lastWin)}</b>
            </p>
          </div>

          <div className="rl-chips" role="group" aria-label="Chip value">
            {CHIPS.map((c) => (
              <button key={c} type="button" className="rl-chipbtn" aria-pressed={snap.chip === c} aria-label={`${c} credit chip`} onClick={() => engine.setChip(c)}>
                <Chip value={c} selected={snap.chip === c} />
              </button>
            ))}
          </div>

          <div className="rl-actions">
            <button type="button" className="rl-act" disabled={!betting || snap.bets.length === 0} onClick={() => engine.undo()}>
              <Undo2 className="h-5 w-5" /> <span>Undo</span>
            </button>
            <button type="button" className="rl-act" disabled={!betting || snap.bets.length === 0} onClick={() => engine.clear()}>
              <Trash2 className="h-5 w-5" /> <span>Clear</span>
            </button>
            <button type="button" className="rl-act" disabled={!snap.canRepeat} onClick={() => engine.repeat()}>
              <Repeat2 className="h-5 w-5" /> <span>Repeat</span>
            </button>
          </div>

          <div className="rl-total-m" aria-hidden>
            <small>Total</small> <b className="rl-numfont">{compact(snap.totalStake)}</b>
          </div>

          <button type="button" className="rl-spin" disabled={!betting || snap.totalStake <= 0} onClick={spin}>
            <span>{betting ? "SPIN" : snap.phase === "spinning" ? "SPINNING" : "RESULT"}</span>
          </button>
        </footer>

        <p className="rl-foot">Demo credits only: free, no cash value, can’t be bought, withdrawn or exchanged. The winning number is drawn when you press Spin and is not affected by your bets or by the animation. 18+.</p>
      </div>

      <Modal open={rules} onClose={() => setRules(false)} title="How Roulette works" description="European roulette with a single zero, played with free demo credits." size="lg" footer={<button type="button" className="rl-spin !static !h-11 !w-auto px-8 !text-base" onClick={() => setRules(false)}><span>GOT IT</span></button>}>
        <div className="space-y-4 text-[14px] leading-relaxed text-obsidian-100">
          <p>The wheel has 37 pockets: 0 (green), and 1 to 36 in red and black. Choose a chip, tap the positions you want to back, then press Spin. You can place several bets in one round. Once you spin, betting closes.</p>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-left text-[13px]">
              <tbody>
                {(
                  [
                    ["Straight (one number)", PAYOUT.straight],
                    ["Split (two numbers)", PAYOUT.split],
                    ["Street (three numbers)", PAYOUT.street],
                    ["Corner (four numbers)", PAYOUT.corner],
                    ["Six line (six numbers)", PAYOUT.sixline],
                    ["Dozen or column", PAYOUT.dozen],
                    ["Red or Black, Odd or Even, 1–18 or 19–36", PAYOUT.red],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <tr key={k} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2">{k}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[#e6c170]">{v} to 1</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Payouts are the winnings; your winning stake is returned on top. Zero loses every outside bet. Overlapping bets are each settled on their own.</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Splits sit on the line between two numbers, streets and six lines on the line below the numbers, and corners where four numbers meet.</li>
            <li>Undo removes your last chip, Clear removes all of them, and Repeat puts last round’s bets back.</li>
          </ul>
          <p className="rounded-xl bg-white/[0.05] p-3 text-[13px] text-obsidian-200">Demo credits are free, can’t be bought, withdrawn, transferred or exchanged, and have no cash value. This game involves no real money.</p>
        </div>
      </Modal>
    </div>
  );
}
