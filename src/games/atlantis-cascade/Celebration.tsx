"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion } from "framer-motion";
import { formatPoints } from "@/lib/utils";

export type BigLevel = "big" | "super" | "mega" | "jackpot";

const TITLE: Record<BigLevel, string> = { big: "Big Win", super: "Super Win", mega: "Mega Win", jackpot: "Jackpot" };
const META: Record<BigLevel, string> = {
  big: "The tide is rising",
  super: "A surge from the deep",
  mega: "The deep gives way",
  jackpot: "The treasury of Atlantis opens",
};
export const COUNT_SECONDS: Record<BigLevel, number> = { big: 3.4, super: 4.6, mega: 5.8, jackpot: 7.6 };

export function Emblem() {
  return (
    <svg viewBox="0 0 100 100" className="ac-cele-emblem" overflow="visible" aria-hidden>
      <defs>
        <linearGradient id="acc-em" x1="0" x2="1">
          <stop offset="0" stopColor="#7a4a12" />
          <stop offset=".45" stopColor="#fff2b0" />
          <stop offset="1" stopColor="#8a5a12" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="#06283c" stroke="url(#acc-em)" strokeWidth="5" />
      <circle cx="50" cy="50" r="36" fill="none" stroke="#5ff7ef" strokeOpacity=".5" strokeWidth="1.2" />
      <g transform="translate(50 52) scale(.62) translate(-50 -50)" fill="url(#acc-em)">
        <path d="M47 44 L53 44 L52 92 L50 98 L48 92Z" />
        <path d="M27 8 L33 22 L29 22 L29 30 C29 38 38 42 47 42 L47 48 C32 48 23 40 23 29 L23 22 L20 22Z" />
        <path d="M73 8 L67 22 L71 22 L71 30 C71 38 62 42 53 42 L53 48 C68 48 77 40 77 29 L77 22 L80 22Z" />
        <path d="M50 3 C56 12 59 20 56 26 L53 26 L53 46 L47 46 L47 26 L44 26 C41 20 44 12 50 3Z" />
      </g>
    </svg>
  );
}

export function Celebration({
  level,
  amount,
  multiple,
  skipSignal,
  onCounted,
  onSkip,
  onTick,
}: {
  level: BigLevel;
  amount: number;
  multiple: number;
  skipSignal: number;
  onCounted: () => void;
  onSkip: () => void;
  onTick: () => void;
}) {
  const [shown, setShown] = useState(0);
  const done = useRef(false);
  const ctl = useRef<ReturnType<typeof animate> | null>(null);
  const lastTick = useRef(0);
  const cb = useRef({ onCounted, onTick });
  cb.current = { onCounted, onTick };

  useEffect(() => {
    ctl.current = animate(0, amount, {
      duration: COUNT_SECONDS[level],
      delay: 0.9,
      ease: [0.25, 0.6, 0.3, 1],
      onUpdate: (v) => {
        setShown(Math.round(v));
        const now = performance.now();
        if (now - lastTick.current > 70) {
          lastTick.current = now;
          cb.current.onTick();
        }
      },
      onComplete: () => {
        setShown(amount);
        if (!done.current) {
          done.current = true;
          cb.current.onCounted();
        }
      },
    });
    return () => ctl.current?.stop();
  }, [amount, level]);

  useEffect(() => {
    if (!skipSignal || done.current) return;
    ctl.current?.stop();
    setShown(amount);
    done.current = true;
    cb.current.onCounted();
  }, [skipSignal, amount]);

  const letters = TITLE[level].split("");
  return (
    <motion.div className="ac-cele" data-level={level} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.8 } }} transition={{ duration: 0.5 }} onClick={onSkip} role="status" aria-live="polite">
      <div className="rays" />
      <div className="halo" />
      {(level === "mega" || level === "jackpot") && (
        <svg className="wave" viewBox="0 0 1200 300" preserveAspectRatio="none" aria-hidden>
          <defs>
            <linearGradient id="acc-wv" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#bffcff" stopOpacity=".75" />
              <stop offset="1" stopColor="#0a5f92" stopOpacity=".1" />
            </linearGradient>
          </defs>
          <path d="M0 90 C150 30 300 150 450 90 S750 30 900 90 S1100 140 1200 80 V300 H0Z" fill="url(#acc-wv)" />
          <path d="M0 140 C150 90 300 190 450 140 S750 90 900 140 S1100 190 1200 130 V300 H0Z" fill="url(#acc-wv)" opacity=".7" />
        </svg>
      )}
      <div className="crest">
        <Emblem />
      </div>
      <div className="title" aria-label={TITLE[level]}>
        {letters.map((ch, i) => (
          <span key={i} className="ch" style={{ animationDelay: `${i * 0.07}s, ${1 + i * 0.12}s`, width: ch === " " ? "0.4em" : undefined }}>
            {ch}
          </span>
        ))}
      </div>
      <div className="amount ac-num">{formatPoints(shown)}</div>
      <div className="meta">
        {META[level]} · x{multiple >= 100 ? Math.round(multiple) : multiple.toFixed(1).replace(/\.0$/, "")} bet
      </div>
      <div className="hint">{shown >= amount ? "Tap to continue" : "Tap to skip the count"}</div>
    </motion.div>
  );
}
