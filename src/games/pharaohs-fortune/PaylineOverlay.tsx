"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PAYLINES, REELS } from "./mock";

/**
 * Draws one winning payline across the reel window. The window is always 5:3, so a 500×300 viewBox keeps
 * every cell a clean 100-unit square and the stroke is never distorted.
 */
export function PaylineOverlay({ active }: { active: { line: number; count: number; key: number } | null }) {
  return (
    <svg viewBox="0 0 500 300" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-[6] h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="pf-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff6d2" />
          <stop offset=".5" stopColor="#ffd46a" />
          <stop offset="1" stopColor="#fff0b0" />
        </linearGradient>
      </defs>
      <AnimatePresence>
        {active && (() => {
          const rows = PAYLINES[active.line];
          const pts: [number, number][] = [[0, rows[0] * 100 + 50]];
          for (let r = 0; r < active.count; r++) pts.push([r * 100 + 50, rows[r] * 100 + 50]);
          const end = active.count < REELS ? active.count * 100 : 500;
          pts.push([end, rows[Math.min(active.count, REELS) - 1] * 100 + 50]);
          const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
          return (
            <motion.g key={active.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <motion.path d={d} fill="none" stroke="rgba(255,190,60,.38)" strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" pathLength={1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, ease: "easeOut" }} />
              <motion.path d={d} fill="none" stroke="url(#pf-line-grad)" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.55, ease: "easeOut" }} />
              <circle cx={16} cy={rows[0] * 100 + 50} r={13} fill="#1a1006" stroke="#ffd46a" strokeWidth={3} />
              <text x={16} y={rows[0] * 100 + 55} textAnchor="middle" fontSize={15} fontWeight={800} fill="#ffe9a0" style={{ fontFamily: "var(--font-num), sans-serif" }}>{active.line + 1}</text>
            </motion.g>
          );
        })()}
      </AnimatePresence>
    </svg>
  );
}
