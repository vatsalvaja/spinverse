"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { GAME_BY_ID } from "@/data/games";
import { JACKPOT_MULTIPLIER, PAYTABLE, SCATTER_TABLE } from "./mock";
import { SymbolArt } from "./SymbolArt";
import { SYMBOLS, type SymbolId } from "./symbols";

const PAYING: Exclude<SymbolId, "pharaoh" | "scarab">[] = ["anubis", "horus", "sphinx", "temple", "coin", "jewel"];

/** Slide-over with the full rules. The always-visible info lives in InfoStrip; this holds the detail. */
export function InfoPanel({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const game = GAME_BY_ID["pharaohs-fortune"];

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <motion.div className="fixed inset-0 z-[75] flex justify-end bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label="Game information"
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-full max-w-md overflow-y-auto border-l border-[#d4af4f]/35 bg-gradient-to-b from-[#1a1108] to-[#0a0604] p-6 shadow-2xl"
        initial={reduce ? false : { x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 60, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
      >
        <button onClick={onClose} aria-label="Close game information" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10"><X className="h-4 w-4" /></button>
        <h2 className="title-pharaoh pr-10 text-3xl leading-tight">Pharaoh’s Fortune</h2>
        <p className="mt-1 text-sm text-[#d9c28a]">Classic 5×3 slot · {game.theme}</p>
        <p className="mt-4 text-[15px] leading-relaxed text-obsidian-100">{game.description}</p>

        <section className="mt-6 flex items-start gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-[#7ff5e6]/25">
          <SymbolArt id="scarab" className="h-16 w-16 shrink-0" />
          <div>
            <h3 className="text-[15px] font-semibold text-white">Golden Scarab · Scatter</h3>
            <p className="mt-1 text-sm leading-relaxed text-obsidian-200">
              Scarabs count anywhere on the reels. Three open the bonus chamber with {SCATTER_TABLE[3].freeSpins} free spins, four with {SCATTER_TABLE[4].freeSpins}. Two is a tease: one more and the chamber opens.
            </p>
          </div>
        </section>

        <section className="mt-3 flex items-start gap-4 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-[#f3cb62]/25">
          <SymbolArt id="pharaoh" className="h-16 w-16 shrink-0" />
          <div>
            <h3 className="text-[15px] font-semibold text-white">Pharaoh · Wild</h3>
            <p className="mt-1 text-sm leading-relaxed text-obsidian-200">{SYMBOLS.pharaoh.note}</p>
          </div>
        </section>

        <section className="mt-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10">
          <h3 className="text-[15px] font-semibold text-white">Paylines</h3>
          <p className="mt-1 text-sm leading-relaxed text-obsidian-200">Five lines: middle, top, bottom, V and inverted V. Matches count from the first reel. Five Pharaohs on one line is the demo jackpot ({JACKPOT_MULTIPLIER}× the bet).</p>
        </section>

        <h3 className="mt-7 text-[15px] font-semibold text-white">Symbol values</h3>
        <p className="mt-1 text-xs text-obsidian-300">Demo multipliers of your bet for matching symbols from the first reel.</p>
        <ul className="mt-3 divide-y divide-white/10 overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10">
          {PAYING.map((id) => (
            <li key={id} className="flex items-center gap-3 px-3 py-2">
              <SymbolArt id={id} className="h-10 w-10 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-sm text-white">{SYMBOLS[id].name}</span>
              <span className="sv-num flex gap-3 text-xs text-[#fff1b8]">
                {([3, 4, 5] as const).map((n) => (
                  <span key={n}><span className="text-obsidian-300">{n}×</span> {PAYTABLE[id][n]}</span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs leading-relaxed text-obsidian-300">
          This is a demonstration screen. Results are scripted and play in a fixed order. Demo virtual points have no cash value and can’t be bought, withdrawn or exchanged.
        </p>
      </motion.aside>
    </motion.div>
  );
}
