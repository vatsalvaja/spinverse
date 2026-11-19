"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Info, Users } from "lucide-react";
import { APP_CSS } from "@/components/launcher/appStyles";
import { useSession } from "@/lib/session";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { cn } from "@/lib/utils";
import { SkyfallAudio } from "./audio";
import { BetPanel } from "./BetPanel";
import { SkyfallEngine } from "./engine";
import { Header } from "./Header";
import { HistoryStrip } from "./HistoryStrip";
import { Scene, type SceneHandle } from "./Scene";
import { Sidebar } from "./Sidebar";
import { SKYFALL_CSS } from "./styles";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
type Toast = { id: number; text: string };

export function Skyfall() {
  const router = useRouter();
  const { player, signOut } = useSession();
  const calm = useReduceMotion();

  // the demo balance starts from the player's points and is never written back
  const startBalance = useRef(Math.max(500, player?.balance ?? 5000));
  const engineRef = useRef<SkyfallEngine | null>(null);
  if (!engineRef.current) engineRef.current = new SkyfallEngine(startBalance.current);
  const engine = engineRef.current;
  const snap = useSyncExternalStore(engine.subscribe, engine.getSnapshot, engine.getServerSnapshot);

  const audio = useRef<SkyfallAudio | null>(null);
  const scene = useRef<SceneHandle>(null);
  const [musicOn, setMusicOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [audioRunning, setAudioRunning] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [sideOpen, setSideOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const toastId = useRef(0);

  /* ------------------------------ audio lifecycle ------------------------------ */
  useEffect(() => {
    const a = new SkyfallAudio();
    audio.current = a;
    try {
      if (localStorage.getItem("sv-sky-music") === "off") {
        a.musicOn = false;
        setMusicOn(false);
      }
      if (localStorage.getItem("sv-sky-sound") === "off") {
        a.soundOn = false;
        setSoundOn(false);
      }
    } catch {}
    a.onStateChange = () => setAudioRunning(a.running);
    // try to start straight away; browsers that block autoplay keep it suspended until the first gesture
    a.unlock();
    a.startMusic();
    setAudioRunning(a.running);
    const onVis = () => (document.hidden ? a.suspend() : a.resume());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      a.onStateChange = undefined;
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
      localStorage.setItem("sv-sky-music", next ? "on" : "off");
    } catch {}
  };
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    audio.current?.unlock();
    audio.current?.setSound(next);
    if (next) audio.current?.click();
    try {
      localStorage.setItem("sv-sky-sound", next ? "on" : "off");
    } catch {}
  };

  /* ------------------------------ round events ------------------------------ */
  useEffect(() => {
    const pushToast = (text: string) => {
      const id = ++toastId.current;
      setToasts((t) => [...t.slice(-1), { id, text }]);
      timers.current.push(setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2400));
    };
    engine.onEvent = (e) => {
      const a = audio.current;
      switch (e.type) {
        case "countdown":
          a?.countdown(e.n);
          break;
        case "takeoff":
          a?.engineStart();
          setSummary(null);
          break;
        case "liftoff":
          a?.takeoff();
          a?.flightStart();
          a?.setMusicEnergy(0.85);
          break;
        case "cashout":
          a?.cashout(e.mult);
          scene.current?.cashBurst();
          pushToast(`${e.panel === 0 ? "Bet A" : "Bet B"}${e.auto ? " auto" : ""} cashed out at ${money(e.mult)}x  +${money(e.payout)}`);
          break;
        case "crash":
          a?.flightStop();
          a?.crash();
          a?.setMusicEnergy(0.2);
          break;
        case "results": {
          if (engine.hadBet) {
            a?.results(e.won);
            const sign = e.net > 0 ? `You won +${money(e.net)}` : e.net < 0 ? `You lost −${money(Math.abs(e.net))}` : "Break-even";
            setSummary(`Round ${engine.roundNumber} crashed at ${engine.crashPoint.toFixed(2)}x. ${sign} demo credits.`);
          } else setSummary(`Round ${engine.roundNumber} crashed at ${engine.crashPoint.toFixed(2)}x.`);
          break;
        }
        case "newround":
          a?.roundTransition();
          a?.setMusicEnergy(0.3);
          setSummary(null);
          break;
        case "bet":
          a?.bet();
          break;
        case "cancel":
          a?.cancel();
          break;
      }
    };
    return () => {
      engine.onEvent = undefined;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [engine]);

  // flying ambience follows the live multiplier; the interval only exists while the aircraft is in the air
  useEffect(() => {
    if (snap.phase !== "flying") return;
    const id = setInterval(() => audio.current?.flightUpdate(engine.liveRaw), 60);
    return () => clearInterval(id);
  }, [snap.phase, engine]);

  const logout = () => {
    signOut();
    router.push("/login");
  };

  const busy = snap.panels.some((p) => p.status === "armed" || p.status === "active");
  const canReset = !busy && snap.balance < Math.max(1, Math.min(snap.panels[0].stake, snap.panels[1].stake));

  return (
    <div className={cn("sf-root fixed inset-0 z-50 flex flex-col overflow-y-auto overflow-x-hidden")} onPointerDown={wake} onKeyDown={wake}>
      <style dangerouslySetInnerHTML={{ __html: APP_CSS + SKYFALL_CSS + ".sf-stage{position:absolute;inset:0}.sf-side{height:100%}" }} />
      <Header
        balance={snap.balance}
        musicOn={musicOn}
        soundOn={soundOn}
        audioRunning={audioRunning}
        onMusic={toggleMusic}
        onSound={toggleSound}
        onEnableAudio={wake}
        onLogout={logout}
        canReset={canReset}
        onReset={() => engine.resetBalance(startBalance.current)}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2 md:grid md:h-[calc(100dvh-56px)] md:min-h-[640px] md:grid-cols-[264px_minmax(0,1fr)] md:gap-3 md:p-3 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* players, bets, ratings: a fixed column on larger screens */}
        <div className="hidden min-h-0 md:block">
          <Sidebar snap={snap} userName={player?.name ?? "Player"} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-2 md:gap-3">
          <HistoryStrip history={snap.history} />

          <div className="relative h-[clamp(250px,44vh,400px)] shrink-0 md:h-auto md:min-h-[240px] md:flex-1">
            <Scene ref={scene} engine={engine} snap={snap} calm={calm} summary={summary} />
            <div className="pointer-events-none absolute left-1/2 top-[6%] z-[5] flex -translate-x-1/2 flex-col items-center gap-2">
              <AnimatePresence>
                {toasts.map((t) => (
                  <motion.p key={t.id} initial={{ opacity: 0, y: -12, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} className="sf-toast" style={{ position: "static", transform: "none" }}>
                    {t.text}
                  </motion.p>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid shrink-0 grid-cols-1 gap-2 min-[600px]:grid-cols-2 md:gap-3">
            <BetPanel engine={engine} snap={snap} id={0} mode="manual" title="Bet A · Manual" />
            <BetPanel engine={engine} snap={snap} id={1} mode="auto" title="Bet B · Auto" />
          </div>

          <p className="flex shrink-0 items-start gap-2 px-1 pb-1 text-[11.5px] leading-snug text-[#6f84a8]">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Demo mode: free demo credits with no cash value. Rounds follow a scripted demo sequence and other players are simulated. Nothing here can be bought, withdrawn or exchanged. 18+.
          </p>
        </div>

        {/* the same sidebar, collapsed under the game on phones */}
        <div className="md:hidden">
          <button type="button" onClick={() => setSideOpen((o) => !o)} aria-expanded={sideOpen} className="sf-back w-full !justify-between !px-4" style={{ height: 46 }}>
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Players, bets and ratings (demo)</span>
            <ChevronDown className={cn("h-4 w-4 transition-transform", sideOpen && "rotate-180")} />
          </button>
          {sideOpen && (
            <div className="mt-2 h-[62vh]">
              <Sidebar snap={snap} userName={player?.name ?? "Player"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
