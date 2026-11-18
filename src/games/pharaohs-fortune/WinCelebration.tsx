"use client";

import { animate, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn, formatPoints } from "@/lib/utils";

export type BigLevel = "big" | "super" | "mega" | "jackpot";

interface Look {
  label: string;
  seconds: number;
  grad: string;
  glow: string;
  beam: string;
  /** Title size: scales with the shorter screen side but never wider than the screen. */
  size: string;
  amount: string;
}

export const LOOKS: Record<BigLevel, Look> = {
  big: { label: "BIG WIN!", seconds: 2.8, grad: "linear-gradient(180deg,#fffbe6 0%,#ffe08a 38%,#e0a23a 68%,#fff0b0 100%)", glow: "255,200,80", beam: "rgba(255,214,110,.55)", size: "min(15vmin, 11.5vw)", amount: "min(12vmin, 12vw)" },
  super: { label: "SUPER WIN!", seconds: 3.8, grad: "linear-gradient(180deg,#f2fffd 0%,#8ff7ea 38%,#1fb7ac 68%,#d8fffa 100%)", glow: "70,240,220", beam: "rgba(95,240,222,.55)", size: "min(15.5vmin, 9.8vw)", amount: "min(13vmin, 12vw)" },
  mega: { label: "MEGA WIN!", seconds: 4.8, grad: "linear-gradient(180deg,#fff0f2 0%,#ff9aae 36%,#e02a52 68%,#ffd2da 100%)", glow: "255,80,110", beam: "rgba(255,90,120,.55)", size: "min(17vmin, 10.6vw)", amount: "min(14vmin, 12vw)" },
  jackpot: { label: "JACKPOT!", seconds: 7, grad: "linear-gradient(180deg,#ffffff 0%,#fff0a8 30%,#ffb52e 60%,#fff6cf 100%)", glow: "255,210,90", beam: "rgba(255,226,140,.65)", size: "min(20vmin, 12.2vw)", amount: "min(15vmin, 13vw)" },
};

/**
 * The foreground announcement for Big, Super and Mega wins and the Jackpot: an enormous title that slams in,
 * shock rings and light beams, and a dramatic counter. It sits above the dimming scrim and is never dimmed
 * itself. A click skips ahead.
 */
export function WinCelebration({ level, amount, reduced, skipSignal, onCounted, onSkip }: { level: BigLevel; amount: number; reduced: boolean; skipSignal: number; onCounted: () => void; onSkip: () => void }) {
  const look = LOOKS[level];
  const [shown, setShown] = useState(0);
  const [counted, setCounted] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  const done = useRef(false);
  const cb = useRef(onCounted);
  cb.current = onCounted;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    stop.current?.();
    setShown(amount);
    setCounted(true);
    cb.current();
  };

  useEffect(() => {
    if (reduced) {
      const t = setTimeout(finish, 400);
      return () => clearTimeout(t);
    }
    const c = animate(0, amount, { duration: look.seconds, delay: 0.35, ease: [0.3, 0.6, 0.3, 1], onUpdate: (v) => setShown(Math.round(v)), onComplete: finish });
    stop.current = () => c.stop();
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (skipSignal > 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipSignal]);

  const letters = look.label.split("");
  const jack = level === "jackpot";

  return (
    <motion.div
      role="dialog"
      aria-label={`${look.label} ${formatPoints(amount)} demo points`}
      onClick={onSkip}
      className="absolute inset-0 z-40 flex cursor-pointer items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.5 }}
    >
      {/* impact: a white-gold flash, then shock rings from the centre */}
      {!reduced && (
        <>
          <motion.div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,250,225,.95),rgba(255,214,110,.5)_45%,transparent_75%)]" initial={{ opacity: 0.95 }} animate={{ opacity: 0 }} transition={{ duration: 0.55, ease: "easeOut" }} aria-hidden />
          {[0, 0.14, 0.3].map((d, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute left-1/2 top-1/2 rounded-full border-[3px]"
              style={{ x: "-50%", y: "-50%", borderColor: `rgba(${look.glow},.9)`, boxShadow: `0 0 40px rgba(${look.glow},.7), inset 0 0 40px rgba(${look.glow},.5)` }}
              initial={{ width: "6vmin", height: "6vmin", opacity: 0.95 }}
              animate={{ width: "190vmin", height: "190vmin", opacity: 0 }}
              transition={{ duration: 1.1, delay: d, ease: "easeOut" }}
              aria-hidden
            />
          ))}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] -translate-x-1/2 -translate-y-1/2 animate-[pf-rays_30s_linear_infinite] opacity-70 [mask-image:radial-gradient(circle,black_0%,transparent_24%)]" style={{ background: `repeating-conic-gradient(from 0deg, ${look.beam} 0deg 7deg, transparent 7deg 22deg)` }} aria-hidden />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[200vmax] w-[200vmax] -translate-x-1/2 -translate-y-1/2 animate-[pf-rays_18s_linear_infinite_reverse] opacity-55 [mask-image:radial-gradient(circle,black_0%,transparent_18%)]" style={{ background: `repeating-conic-gradient(from 11deg, ${look.beam} 0deg 4deg, transparent 4deg 18deg)` }} aria-hidden />
        </>
      )}
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(52% 46% at 50% 48%, rgba(${look.glow},.5), transparent 72%)` }} aria-hidden />

      <div className="relative z-10 flex max-w-full flex-col items-center px-3 text-center">
        <motion.div
          className={cn("flex max-w-full", !reduced && "pf-title-pulse")}
          style={{ ["--g" as string]: look.glow }}
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: reduced ? 0 : 0.055, delayChildren: 0.08 } } }}
        >
          {letters.map((ch, i) => (
            <motion.span
              key={i}
              className="title-pharaoh inline-block leading-[0.95]"
              style={{ fontSize: look.size, backgroundImage: look.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", filter: "none", whiteSpace: "pre", WebkitTextStroke: "0.01em rgba(70,36,0,.55)" }}
              variants={{
                hidden: reduced ? { opacity: 0 } : { opacity: 0, y: -160, scale: 3.4, rotate: i % 2 ? 14 : -14 },
                show: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 320, damping: 13, mass: 0.9 } },
              }}
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40, scale: 0.6 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 240, damping: 16 }} className="mt-[1.5vmin]">
          <motion.p
            animate={reduced || counted ? { scale: 1 } : { scale: [1, 1.06, 1] }}
            transition={{ duration: 0.5, repeat: reduced || counted ? 0 : Infinity }}
            className="sv-num font-extrabold leading-none text-white"
            style={{ fontSize: look.amount, textShadow: `0 0 24px rgba(${look.glow},.95), 0 0 60px rgba(${look.glow},.7), 0 4px 0 rgba(0,0,0,.45)` }}
          >
            +{formatPoints(shown)}
          </motion.p>
          <p className="mt-[0.6vmin] text-[clamp(.8rem,2vmin,1.15rem)] font-semibold tracking-wide text-[#ffe9b0]">demo points</p>
        </motion.div>

        <p className={cn("mt-[3vmin] text-[clamp(.7rem,1.7vmin,1rem)] text-[#ffe9b0]/85 transition-opacity", counted || jack ? "opacity-100" : "opacity-0")}>{counted ? "Tap to continue" : "Tap to skip"}</p>
      </div>
    </motion.div>
  );
}
