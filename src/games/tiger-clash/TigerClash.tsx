"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BookOpen, Music2, Volume2, VolumeX } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { TigerClashAudio } from "./audio";
import { Arena, type ArenaHandle } from "./Arena";
import { BottomPanels, PickBar } from "./Controls";
import { PAYOUT, TigerClashEngine, rankLabel, type Side } from "./engine";
import { CHARACTER_CSS } from "./Sprites";
import { TIGER_CLASH_CSS } from "./styles";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function TigerClash() {
  const { player } = useSession();
  const calm = useReduceMotion();

  // the demo balance starts from the player's points and is never written back
  const startBalance = useRef(Math.max(500, player?.balance ?? 5000));
  const engineRef = useRef<TigerClashEngine | null>(null);
  if (!engineRef.current) engineRef.current = new TigerClashEngine(startBalance.current);
  const engine = engineRef.current;
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);

  const audio = useRef<TigerClashAudio | null>(null);
  const arena = useRef<ArenaHandle>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [audioRunning, setAudioRunning] = useState(false);
  const [banner, setBanner] = useState<Side | null>(null);
  const [shake, setShake] = useState(false);
  const [rules, setRules] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  /* ------------------------------ audio lifecycle ------------------------------ */
  useEffect(() => {
    const a = new TigerClashAudio();
    audio.current = a;
    try {
      if (localStorage.getItem("sv-tc-music") === "off") {
        a.musicOn = false;
        setMusicOn(false);
      }
      if (localStorage.getItem("sv-tc-sound") === "off") {
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
      localStorage.setItem("sv-tc-music", next ? "on" : "off");
    } catch {}
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audio.current?.unlock();
    audio.current?.setSound(next);
    if (next) audio.current?.click();
    try {
      localStorage.setItem("sv-tc-sound", next ? "on" : "off");
    } catch {}
  };

  /* ------------------------------ round events: sound and effects hang off the engine ------------------------------ */
  useEffect(() => {
    engine.onEvent = (e) => {
      const a = audio.current;
      const ar = arena.current;
      const fx = ar?.fx;
      switch (e.type) {
        case "selectionStart":
          setBanner(null);
          a?.setMusicEnergy(0.3);
          break;
        case "tick":
          a?.tick(e.n);
          break;
        case "pick":
          a?.select(e.side);
          break;
        case "place":
          a?.chip();
          break;
        case "cancel":
          a?.click();
          break;
        case "lock":
          a?.lock();
          a?.setMusicEnergy(0.55);
          break;
        case "tigerReveal":
        case "dragonReveal":
          a?.cardFlip();
          break;
        case "impact":
          a?.cardImpact();
          ar?.flash(e.who === "tiger" ? "rgba(224,166,62,.35)" : "rgba(61,184,255,.35)");
          break;
        case "suspense":
          a?.suspense();
          a?.setMusicEnergy(0.85);
          break;
        case "beat": {
          const w = e.winner;
          if (e.name === "announce") {
            a?.announce(w);
            setBanner(w);
          } else if (e.name === "roar") {
            if (w === "tiger" || w === "tie") a?.tigerRoar();
            if (w === "dragon" || w === "tie") a?.dragonRoar();
            if (w === "tiger" || w === "tie") {
              const m = ar?.mouth("tiger");
              if (m) fx?.ring(m.x, m.y, "#f3cd82", 0.14);
            }
            if (w === "dragon" || w === "tie") {
              const m = ar?.mouth("dragon");
              if (m) fx?.ring(m.x, m.y, "#9be4ff", 0.14);
            }
          } else if (e.name === "fire" && w !== "tie") {
            a?.fireBlast(w === "tiger" ? "gold" : "blue");
            const m = ar?.mouth(w);
            const feet = ar?.feet(w);
            if (m) fx?.breath(m.x, m.y, w === "tiger" ? 1 : -1, w === "tiger" ? "gold" : "blue", 3000);
            if (feet) {
              fx?.ring(feet.x, feet.y, w === "tiger" ? "#e0a63e" : "#3db8ff", 0.2);
              fx?.dust(feet.x, feet.y, w === "tiger" ? "#ffb347" : "#7cd0ff");
            }
            ar?.flash(w === "tiger" ? "rgba(224,150,40,.55)" : "rgba(61,184,255,.55)");
            if (!calm) {
              setShake(true);
              later(() => setShake(false), 700);
            }
          } else if ((e.name === "lightning1" || e.name === "lightning2") && w === "dragon") {
            a?.lightning();
            const m = ar?.mouth("dragon");
            if (m) for (let i = 0; i < 4; i++) fx?.bolt(m.x, m.y - 0.04, Math.max(0.25, m.x - 0.1 - Math.random() * 0.3), 0.15 + Math.random() * 0.45, "#3db8ff");
            for (let i = 0; i < 2; i++) fx?.bolt(0.7 + Math.random() * 0.25, 0.04, 0.78 + Math.random() * 0.2, 0.3 + Math.random() * 0.2, "#6cc4ff");
            ar?.flash("rgba(150,220,255,.4)");
          } else if (e.name === "defeat" && w !== "tie") {
            a?.defeat(w === "tiger" ? "dragon" : "tiger");
            const net = engine.getSnapshot().last?.net ?? 0;
            const picked = engine.getSnapshot().last?.pick;
            if (picked) (net > 0 ? a?.win() : a?.lose());
          } else if (e.name === "clash" && w === "tie") {
            a?.tieClash();
            const c = ar?.center();
            if (c) fx?.clash(c.x, c.y);
            // both creatures breathe toward the middle as the energy collides
            const mt = ar?.mouth("tiger");
            const md = ar?.mouth("dragon");
            if (mt) fx?.breath(mt.x, mt.y, 1, "gold", 1200);
            if (md) fx?.breath(md.x, md.y, -1, "blue", 1200);
            ar?.flash("rgba(255,236,190,.7)");
            if (!calm) {
              setShake(true);
              later(() => setShake(false), 700);
            }
          } else if (e.name === "fanfare" && w !== "tie") {
            if (w === "tiger") a?.tigerVictory();
            else a?.dragonVictory();
          }
          break;
        }
        case "nextRound":
          a?.nextRound();
          a?.setMusicEnergy(0.3);
          setBanner(null);
          fx?.clear();
          break;
        default:
          break;
      }
    };
    return () => {
      engine.onEvent = undefined;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [engine, calm, later]);

  // the clock: a light interval that only advances the state machine (rendering is driven by snapshots)
  useEffect(() => {
    engine.tick(performance.now());
    const id = setInterval(() => engine.tick(performance.now()), 50);
    return () => clearInterval(id);
  }, [engine]);

  const needsEnable = !audioRunning && (musicOn || soundOn);
  const canReset = !snap.bet && snap.balance < Math.max(1, snap.stake);

  return (
    <div className="tc-root fixed inset-0 z-50 overflow-y-auto overflow-x-hidden" onPointerDown={wake} onKeyDown={wake}>
      <style dangerouslySetInnerHTML={{ __html: TIGER_CLASH_CSS + CHARACTER_CSS }} />

      <div className="tc-ui">
        <Arena ref={arena} snap={snap} calm={calm} banner={banner} shake={shake} />

        <header className="tc-head">
          <div className="tc-head-l">
            <Link href="/dashboard" className="tc-btn" aria-label="Back to lobby">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Lobby</span>
            </Link>
          </div>

          <h1 className="tc-title">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/art/tiger-clash/ui/title.webp" alt="TIGER CLASH: The Ultimate Mythical Card Duel" draggable={false} />
          </h1>

          <div className="tc-head-r">
            {needsEnable && (
              <button type="button" className="tc-pill" onClick={wake}>
                <Volume2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Enable sound</span>
                <span className="sm:hidden">Sound</span>
              </button>
            )}
            {canReset && (
              <button type="button" className="tc-btn" onClick={() => engine.resetBalance(startBalance.current)}>
                Reset credits
              </button>
            )}
            <div className="tc-bal" aria-label={`Demo balance ${money(snap.balance)}`}>
              <span className="tc-coin" aria-hidden />
              <span className="tc-num text-[15px] font-bold tabular-nums text-[#f6dca0]">{money(snap.balance)}</span>
            </div>
            <button type="button" className="tc-icon" aria-pressed={musicOn} aria-label={musicOn ? "Turn music off" : "Turn music on"} title="Music" onClick={toggleMusic}>
              <Music2 className="h-[18px] w-[18px]" />
            </button>
            <button type="button" className="tc-icon" aria-pressed={soundOn} aria-label={soundOn ? "Turn sound effects off" : "Turn sound effects on"} title="Sound effects" onClick={toggleSound}>
              {soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
            </button>
            <button type="button" className="tc-btn" onClick={() => setRules(true)} aria-haspopup="dialog">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Rules</span>
            </button>
          </div>
        </header>

        {/* the latest 15 results, newest first */}
        <div className="tc-results" role="list" aria-label="Latest 15 results">
          <span className="tc-results-l">Recent Results:</span>
          {snap.history.length === 0 && <span className="text-[12.5px] text-[#8a93ab]">Appear after each round</span>}
          <AnimatePresence initial={false}>
            {snap.history.slice(0, 15).map((r) => (
              <motion.span
                key={r.round}
                role="listitem"
                layout
                initial={{ opacity: 0, scale: 0.3, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                className="tc-coinbadge"
                title={`Round ${r.round}: Tiger ${rankLabel(r.tiger.rank)}, Dragon ${rankLabel(r.dragon.rank)}`}
                aria-label={`Round ${r.round}: ${r.winner === "tie" ? "Tie" : r.winner === "tiger" ? "Tiger wins" : "Dragon wins"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/art/tiger-clash/ui/coin-${r.winner}.webp`} alt="" draggable={false} />
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        <div className="tc-grow" />
        <PickBar engine={engine} snap={snap} />
        <BottomPanels engine={engine} snap={snap} />
        <p className="tc-foot">Demo credits only: free, no cash value, can’t be bought, withdrawn or exchanged. Cards are drawn before you choose, so your selection never changes the result. 18+.</p>
      </div>

      <Modal open={rules} onClose={() => setRules(false)} title="How TIGER CLASH works" description="A two-sided mythical card duel played with free demo credits." size="lg" footer={<button type="button" className="tc-place !static !w-auto px-8" data-k="place" onClick={() => setRules(false)}><span>GOT IT</span></button>}>
        <div className="space-y-4 text-[14px] leading-relaxed text-obsidian-100">
          <p>Each round, one card is drawn for the <b className="text-[#f3cd82]">Tiger</b> and one for the <b className="text-[#9be4ff]">Dragon</b> from a standard 52-card deck. The higher rank wins; equal ranks are a <b>Tie</b>.</p>
          <p>Card values: 2 to 10 count as their number, Jack 11, Queen 12, King 13 and Ace 14. Suits don’t matter.</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Choose Tiger, Dragon or Tie before the 5-second timer ends, set a demo stake and press Place bet. One selection per round.</li>
            <li>Tiger or Dragon returns {PAYOUT.win}x your stake when it wins. If the cards tie, those selections get half the stake back.</li>
            <li>Tie returns {PAYOUT.tie}x your stake (8 to 1).</li>
            <li>You can cancel for a full refund until the timer ends. After that the selections lock and the cards are revealed.</li>
          </ul>
          <p>The two cards are drawn from a shuffled deck at the start of every round, before anything is selected, and a card can’t repeat until the deck runs out and is reshuffled. What you pick never changes the result.</p>
          <p className="rounded-xl bg-white/[0.05] p-3 text-[13px] text-obsidian-200">Demo credits are free, can’t be bought, withdrawn, transferred or exchanged, and have no cash value. This game involves no real money.</p>
        </div>
      </Modal>
    </div>
  );
}
