"use client";

import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { Cpu, Crown, Flame, Heart, Lock, Sun, Target, Waves, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const TIER = {
  Bronze: { name: "Common", a: "#ffe0bd", b: "#c9803f", c: "#5c2f10", rib: "#9a3a2a", glow: "rgba(208,140,79,.5)" },
  Silver: { name: "Rare", a: "#ffffff", b: "#b4bbd2", c: "#4b5163", rib: "#2f5fae", glow: "rgba(150,195,255,.5)" },
  Gold: { name: "Legendary", a: "#fff3c4", b: "#e8bd55", c: "#7a5110", rib: "#7a1f3a", glow: "rgba(240,200,100,.6)" },
} as const;
export type TierName = keyof typeof TIER;

export const MEDAL_ICON: Record<string, ReactNode> = {
  a1: <Zap />, a2: <Sun />, a3: <Waves />, a4: <Cpu />, a5: <Flame />, a6: <Crown />, a7: <Target />, a8: <Heart />,
};

/** Scalloped medal edge as a path. */
function scallop(cx: number, cy: number, r: number, teeth: number, depth: number) {
  let d = "";
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 ? r - depth : r;
    d += `${i ? "L" : "M"}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return d + "Z";
}

/** A collectible medal: ribbon, scalloped metal edge, laurel wreath and an embossed icon. */
export function Medal({ tier, unlocked, icon, size = 132, delay = 0, className }: { tier: TierName; unlocked: boolean; icon: ReactNode; size?: number; delay?: number; className?: string }) {
  const u = "md" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const t = TIER[tier];
  const reduce = useReduceMotion();
  const leaves = Array.from({ length: 11 }, (_, i) => {
    const ang = 200 + i * 14;
    return ang;
  });
  const wreath = (flip: boolean) =>
    leaves.map((ang, i) => {
      const rad = ((flip ? 540 - ang : ang) * Math.PI) / 180;
      const x = 60 + Math.cos(rad) * 29;
      const y = 92 + Math.sin(rad) * 29;
      return <ellipse key={i} cx={x} cy={y} rx="6.4" ry="2.6" fill={t.a} opacity={0.85} transform={`rotate(${(flip ? 540 - ang : ang) + 90 + (flip ? 25 : -25)} ${x} ${y})`} />;
    });
  return (
    <motion.div
      className={cn("relative mx-auto", className)}
      style={{ width: size, height: size * 1.25 }}
      initial={reduce ? false : { opacity: 0, scale: 0.55, rotate: -14, y: 18 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 140, damping: 13, delay }}
    >
      {unlocked && (
        <>
          <div className="absolute left-1/2 top-[62%] h-[85%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" style={{ background: t.glow }} aria-hidden />
          {!reduce && <span className="sv-burst pointer-events-none absolute left-1/2 top-[62%] aspect-square w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ borderColor: t.b, animationDelay: `${delay + 0.35}s` }} aria-hidden />}
        </>
      )}
      <svg viewBox="0 0 120 150" className={cn("relative h-full w-full drop-shadow-[0_14px_14px_rgba(0,0,0,.65)]", !unlocked && "opacity-55 grayscale")} aria-hidden>
        <defs>
          <linearGradient id={`${u}m`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={t.a} />
            <stop offset=".45" stopColor={t.b} />
            <stop offset="1" stopColor={t.c} />
          </linearGradient>
          <linearGradient id={`${u}w`} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.a} />
            <stop offset=".5" stopColor={t.b} />
            <stop offset="1" stopColor={t.c} />
          </linearGradient>
          <radialGradient id={`${u}d`} cx=".4" cy=".3" r=".9">
            <stop offset="0" stopColor={t.b} />
            <stop offset="1" stopColor={t.c} />
          </radialGradient>
          <linearGradient id={`${u}r`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={t.rib} />
            <stop offset="1" stopColor="#12060a" />
          </linearGradient>
        </defs>
        <path d="M32,0 L60,0 L72,58 L46,52Z" fill={`url(#${u}r)`} />
        <path d="M88,0 L60,0 L48,58 L74,52Z" fill={`url(#${u}r)`} opacity=".92" />
        <path d="M60,0 L60,40" stroke="#000" strokeOpacity=".25" />
        <path d={scallop(60, 92, 49, 22, 3.4)} fill={`url(#${u}m)`} />
        <circle cx="60" cy="92" r="43" fill="none" stroke="#000" strokeOpacity=".35" strokeWidth="2" />
        <circle cx="60" cy="92" r="41" fill={`url(#${u}w)`} />
        <circle cx="60" cy="92" r="35" fill={`url(#${u}d)`} stroke="#fff" strokeOpacity=".4" />
        <g>{wreath(false)}{wreath(true)}</g>
        <path d="M30,76 A36,36 0 0 1 64,58" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
      <span className={cn("absolute left-1/2 top-[61.5%] -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-[0_2px_2px_rgba(0,0,0,.6)]", !unlocked && "opacity-0")} style={{ width: size * 0.3, height: size * 0.3 }}>
        <span className="flex h-full w-full items-center justify-center [&>svg]:h-full [&>svg]:w-full">{icon}</span>
      </span>
      {!unlocked && (
        <span className="absolute left-1/2 top-[61.5%] -translate-x-1/2 -translate-y-1/2 text-obsidian-200">
          <Lock style={{ width: size * 0.26, height: size * 0.26 }} />
        </span>
      )}
    </motion.div>
  );
}
