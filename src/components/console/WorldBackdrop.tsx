"use client";

import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import type { GameId } from "@/data/types";
import { GAMES } from "@/data/games";
import { cn } from "@/lib/utils";
import type { Origin } from "./ConsoleContext";

const EASE = [0.65, 0, 0.2, 1] as const;
const DURATION = 1.15;

/**
 * Full-bleed cinematic world. When the world changes, the new one opens like an iris from the
 * tile that was chosen, led by a thin ring of the world's accent colour. The previous world is
 * held underneath until the iris has covered it.
 */
export function WorldBackdrop({ gameId, origin, className }: { gameId: GameId; origin: Origin; className?: string }) {
  const reduce = useReducedMotion();
  const at = `${origin.x.toFixed(1)}% ${origin.y.toFixed(1)}%`;
  const w = WORLD[gameId];
  // the accent ring only plays for a change of world, not on first paint
  const first = useRef(gameId);
  const changed = first.current !== gameId;

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-[#05050a]", className)} aria-hidden>
      <AnimatePresence initial={false}>
        <motion.div
          key={gameId}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { clipPath: `circle(0% at ${at})` }}
          animate={reduce ? { opacity: 1 } : { clipPath: `circle(150% at ${at})` }}
          exit={{ opacity: 0.999, transition: { duration: reduce ? 0.3 : DURATION } }}
          transition={{ duration: reduce ? 0.35 : DURATION, ease: EASE }}
        >
          <motion.div className="absolute inset-0" initial={reduce ? false : { scale: 1.1 }} animate={{ scale: 1 }} transition={{ duration: DURATION + 0.4, ease: EASE }}>
            <WorldArt gameId={gameId} priority />
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {!reduce && changed && (
        <motion.span
          key={`ring-${gameId}`}
          className="pointer-events-none absolute rounded-full"
          style={{ left: `${origin.x}%`, top: `${origin.y}%`, x: "-50%", y: "-50%", border: `2px solid ${w.primary}`, boxShadow: `0 0 40px 4px ${w.glow}, inset 0 0 40px 2px ${w.glow}` }}
          initial={{ width: 0, height: 0, opacity: 0.95 }}
          animate={{ width: "260vmax", height: "260vmax", opacity: 0 }}
          transition={{ duration: DURATION, ease: EASE }}
        />
      )}

      {/* accent atmosphere follows the selected world */}
      {GAMES.map((g) => (
        <div key={g.id} className={cn("absolute inset-0 transition-opacity duration-[1100ms]", gameId === g.id ? "opacity-100" : "opacity-0")} style={{ background: `radial-gradient(60% 55% at 14% 100%, ${WORLD[g.id].glow}, transparent 72%)` }} />
      ))}
    </div>
  );
}
