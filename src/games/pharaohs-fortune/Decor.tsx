"use client";

import { cn } from "@/lib/utils";

/** Gold winged sun disc: the crest of the title and the cabinet. */
export function WingedSun({ className, flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 44" className={cn("overflow-visible", className)} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden focusable="false">
      <defs>
        <linearGradient id="pf-ws" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6d2" />
          <stop offset=".5" stopColor="#e8b84a" />
          <stop offset="1" stopColor="#8a5a12" />
        </linearGradient>
      </defs>
      <g fill="url(#pf-ws)" stroke="#5a3709" strokeWidth="1.1" strokeLinejoin="round">
        <path d="M2 24C16 8 38 6 52 16L50 22C38 16 22 18 12 28Z" />
        <path d="M6 30C20 18 36 18 48 25L46 30C36 25 22 26 14 34Z" />
        <path d="M12 36C24 28 36 28 46 33L44 37C36 33 26 34 20 40Z" />
        <circle cx="60" cy="22" r="13" />
      </g>
      <circle cx="60" cy="22" r="6" fill="#d4213f" stroke="#5a3709" strokeWidth="1" />
    </svg>
  );
}

/** A temple pillar with a glowing brazier on top. Pure decoration, placed at the screen edges on wide displays. */
export function TempleColumn({ className, side }: { className?: string; side: "left" | "right" }) {
  return (
    <div className={cn("pointer-events-none absolute bottom-0 top-[6%] w-[9vw] max-w-[190px]", side === "left" ? "left-[1.2%]" : "right-[1.2%]", className)} aria-hidden>
      <div className="absolute -top-[6%] left-1/2 h-[16%] w-[180%] -translate-x-1/2 animate-[pf-flame_2.6s_ease-in-out_infinite] bg-[radial-gradient(closest-side,rgba(255,190,80,.7),rgba(255,120,30,.25)_55%,transparent)] blur-[2px]" />
      <div className="absolute -top-[3.2%] left-1/2 h-[5%] w-[34%] -translate-x-1/2 animate-[pf-flame_1.3s_ease-in-out_infinite] rounded-[50%_50%_40%_40%] bg-gradient-to-t from-[#ff7a1a] via-[#ffc24a] to-[#fff3b0]" />
      <svg viewBox="0 0 120 600" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" focusable="false">
        <defs>
          <linearGradient id={`pf-col-${side}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#120b06" />
            <stop offset=".28" stopColor="#5a4128" />
            <stop offset=".55" stopColor="#3a2a1a" />
            <stop offset="1" stopColor="#0e0804" />
          </linearGradient>
          <linearGradient id="pf-col-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff1b8" />
            <stop offset=".5" stopColor="#c0892a" />
            <stop offset="1" stopColor="#6b4310" />
          </linearGradient>
        </defs>
        <path d="M30 60H90L96 96H24Z" fill="url(#pf-col-gold)" stroke="#3a2406" strokeWidth="2" />
        <rect x="32" y="96" width="56" height="440" fill={`url(#pf-col-${side})`} />
        <g stroke="rgba(0,0,0,.45)" strokeWidth="2">
          <path d="M46 96V536M60 96V536M74 96V536" />
        </g>
        <g fill="none" stroke="rgba(243,203,98,.55)" strokeWidth="2.4" strokeLinecap="round">
          <path d="M44 150h32M44 164h14M62 164h14M44 190c8-10 24-10 32 0M60 206v22M50 240l10 14 10-14M44 290h32M50 304h20M60 318v26M44 380c10 10 22 10 32 0M52 410h16M60 420v30M46 470h28" />
        </g>
        <rect x="26" y="150" width="68" height="8" fill="url(#pf-col-gold)" stroke="#3a2406" strokeWidth="1.5" />
        <rect x="26" y="336" width="68" height="8" fill="url(#pf-col-gold)" stroke="#3a2406" strokeWidth="1.5" />
        <rect x="26" y="500" width="68" height="8" fill="url(#pf-col-gold)" stroke="#3a2406" strokeWidth="1.5" />
        <path d="M20 536H100L108 600H12Z" fill="url(#pf-col-gold)" stroke="#3a2406" strokeWidth="2" />
      </svg>
    </div>
  );
}
