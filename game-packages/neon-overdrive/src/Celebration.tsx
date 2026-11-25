"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { formatPoints } from "@spinverse/game-sdk";
import type { BigLevel } from "./engine";

export const LEVEL_FX: Record<BigLevel, { title: string; sub: string; c: string; c2: string; ray: string; ms: number; size: string }> = {
  big: { title: "BIG WIN", sub: "Power surge", c: "#35e8ff", c2: "#8f5bff", ray: "rgba(53,232,255,.35)", ms: 3200, size: "clamp(3rem,13vw,9rem)" },
  super: { title: "SUPER WIN", sub: "Overload", c: "#b79bff", c2: "#35e8ff", ray: "rgba(143,91,255,.4)", ms: 4200, size: "clamp(2.8rem,12vw,8.6rem)" },
  mega: { title: "MEGA WIN", sub: "Core meltdown", c: "#ff4fd8", c2: "#ffae2e", ray: "rgba(255,63,208,.42)", ms: 5200, size: "clamp(3rem,13vw,9rem)" },
  jackpot: { title: "JACKPOT", sub: "Neon Overdrive", c: "#ffd36a", c2: "#ff3fd0", ray: "rgba(255,207,90,.5)", ms: 7000, size: "clamp(3.2rem,15vw,10.5rem)" },
};

/** The full-screen major-win show: rays, glitching title, a counting amount. Click or tap to skip the count. */
export function WinCelebration({ level, amount, skipSignal, onCounted, onSkip, onTick }: { level: BigLevel; amount: number; skipSignal: number; onCounted: () => void; onSkip: () => void; onTick?: () => void }) {
  const fx = LEVEL_FX[level];
  const [shown, setShown] = useState(0);
  const [done, setDone] = useState(false);
  const ctl = useRef<ReturnType<typeof animate> | null>(null);
  const counted = useRef(onCounted);
  counted.current = onCounted;
  const finished = useRef(false);

  useEffect(() => {
    ctl.current = animate(0, amount, {
      duration: fx.ms / 1000,
      ease: [0.25, 0.6, 0.3, 1],
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => {
        if (finished.current) return;
        finished.current = true;
        setShown(amount);
        setDone(true);
        counted.current();
      },
    });
    return () => ctl.current?.stop();
  }, [amount, fx.ms]);

  useEffect(() => {
    if (skipSignal > 0 && !finished.current) {
      finished.current = true;
      ctl.current?.stop();
      setShown(amount);
      setDone(true);
      counted.current();
    }
  }, [skipSignal, amount]);

  useEffect(() => {
    if (done) onTick?.();
  }, [done, onTick]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      onClick={onSkip}
      className="absolute inset-0 z-[38] flex cursor-pointer flex-col items-center justify-center overflow-hidden px-4 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      style={{ ["--ray" as string]: fx.ray, ["--gb" as string]: fx.c, ["--cc" as string]: fx.c }}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(60% 50% at 50% 50%, ${fx.c}33, transparent 70%)` }} />
      <div className="no-rays" />
      <div className="no-glitchbars">
        {[12, 31, 52, 70, 86].map((t, i) => (
          <i key={t} style={{ top: `${t}%`, animationDelay: `${i * 0.31}s` }} />
        ))}
      </div>
      <p className="no-disp relative mb-1 uppercase text-white/80" style={{ fontSize: "clamp(.85rem,2.6vw,1.6rem)", letterSpacing: ".5em", textShadow: `0 0 14px ${fx.c}` }}>{fx.sub}</p>
      <h2 className="no-title relative" data-t={fx.title} style={{ fontSize: fx.size, filter: `drop-shadow(0 0 14px ${fx.c}) drop-shadow(0 0 46px ${fx.c2})`, backgroundImage: `linear-gradient(180deg,#fff 30%,${fx.c} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {fx.title}
      </h2>
      <div className="no-amount no-num relative mt-3 font-black text-white" style={{ fontSize: "clamp(2.2rem,9vw,6.4rem)", lineHeight: 1, transform: done ? "scale(1.06)" : "scale(1)", transition: "transform .3s" }}>
        {formatPoints(shown)}
      </div>
      <p className="relative mt-2 text-white/70" style={{ fontSize: "clamp(.7rem,1.8vw,1rem)", letterSpacing: ".3em" }}>DEMO POINTS</p>
      <p className="absolute bottom-[5%] text-white/45" style={{ fontSize: "clamp(.65rem,1.6vw,.85rem)" }}>{done ? "Tap to continue" : "Tap to skip the count"}</p>
    </motion.div>
  );
}

export type BannerKind = "hold" | "overdrive" | "grand" | "collect";
const BANNER: Record<BannerKind, { title: string; sub: string; c: string }> = {
  hold: { title: "HOLD & RESPIN", sub: "Cores locked. Empty slots respin.", c: "#35e8ff" },
  overdrive: { title: "OVERDRIVE", sub: "All core values ×2", c: "#ff4fd8" },
  grand: { title: "GRAND", sub: "Full grid. +100× bet", c: "#ffd36a" },
  collect: { title: "COLLECT", sub: "Discharging every core", c: "#8f5bff" },
};

/** Cinematic title card used when the machine changes mode. It never blocks input. */
export function Banner({ kind }: { kind: BannerKind }) {
  const b = BANNER[kind];
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-[37] flex flex-col items-center justify-center overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }} style={{ ["--c1" as string]: b.c }}>
      <div className="no-warp" />
      <div className="no-speed" />
      <div className="absolute inset-x-0 top-1/2 h-[26%] -translate-y-1/2" style={{ background: `linear-gradient(90deg,transparent,${b.c}44,transparent)` }} />
      <h2 className="no-title no-bannerin relative" data-t={b.title} style={{ fontSize: "clamp(2.4rem,11vw,8rem)", filter: `drop-shadow(0 0 16px ${b.c}) drop-shadow(0 0 50px ${b.c})`, backgroundImage: `linear-gradient(180deg,#fff 25%,${b.c} 100%)`, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        {b.title}
      </h2>
      <p className="no-disp relative mt-2 text-white/85" style={{ fontSize: "clamp(.8rem,2.4vw,1.4rem)", letterSpacing: ".25em", textShadow: `0 0 12px ${b.c}` }}>{b.sub}</p>
    </motion.div>
  );
}
