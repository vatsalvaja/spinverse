import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatPoints } from "@spinverse/game-sdk";
import { Burst } from "./Burst";
import { SymbolArt } from "./SymbolArt";

export type BonusAnnouncement = { type: "bonus"; count: number; freeSpins: number; amount: number } | { type: "end"; total: number };

/** Full-screen announcement for the demo bonus: rays, a large Golden Scarab and a spray of gold. */
export function BonusOverlay({ data, onContinue }: { data: BonusAnnouncement; onContinue: () => void }) {
  const reduce = useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);
  const bonus = data.type === "bonus";

  useEffect(() => {
    const t = setTimeout(() => btn.current?.focus(), 350);
    const key = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "Enter") && onContinue();
    document.addEventListener("keydown", key);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", key);
    };
  }, [onContinue]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={bonus ? "Bonus unlocked" : "Bonus complete"}
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black/80 px-5 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      {!reduce && <div className="pointer-events-none absolute left-1/2 top-1/2 h-[190vmax] w-[190vmax] -translate-x-1/2 -translate-y-1/2 animate-[pf-rays_40s_linear_infinite] opacity-40 [background:repeating-conic-gradient(from_0deg,rgba(255,214,110,.5)_0deg_6deg,transparent_6deg_24deg)] [mask-image:radial-gradient(circle,black_0%,transparent_30%)]" aria-hidden />}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_50%_45%,rgba(255,190,70,.28),transparent_70%)]" aria-hidden />

      <motion.div className="relative z-10 flex max-w-xl flex-col items-center text-center" initial={reduce ? false : { scale: 0.7, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.1 }}>
        <div className="relative">
          <motion.div animate={reduce ? undefined : { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="relative h-[clamp(130px,26vh,220px)] w-[clamp(130px,26vh,220px)]">
            <SymbolArt id="scarab" className="h-full w-full drop-shadow-[0_0_30px_rgba(255,200,80,.8)]" />
          </motion.div>
          {!reduce && <Burst count={bonus ? 56 : 26} radius={260} seed={11} size={[3, 7]} />}
        </div>

        <h2 className="title-pharaoh mt-3 text-balance text-[clamp(2rem,7vw,3.6rem)] leading-[1.02]">{bonus ? "Chamber unlocked" : "Chamber closed"}</h2>
        {bonus ? (
          <>
            <p className="mt-3 text-lg text-[#fff1b8]">
              {data.count} Golden Scarabs award <b className="sv-num text-white">{data.freeSpins}</b> demo free spins
            </p>
            <p className="mt-1 text-sm text-obsidian-200">Scarab prize: +{formatPoints(data.amount)} demo points. Free spins cost nothing.</p>
          </>
        ) : (
          <p className="mt-3 text-lg text-[#fff1b8]">
            Bonus total <b className="sv-num text-white">+{formatPoints(data.total)}</b> demo points
          </p>
        )}
        <button ref={btn} onClick={onContinue} className="sv-shine sv-display mt-7 h-12 rounded-full bg-gradient-to-b from-[#fff1b8] via-[#e3b951] to-[#a8731a] px-9 text-sm font-bold tracking-[0.12em] text-[#2a1805] shadow-[0_12px_34px_-6px_rgba(240,184,74,.7)] transition hover:brightness-110 active:scale-95">
          {bonus ? "ENTER THE CHAMBER" : "BACK TO THE REELS"}
        </button>
        <p className="mt-4 text-[11px] text-obsidian-300">Demo only. Points have no cash value.</p>
      </motion.div>
    </motion.div>
  );
}
