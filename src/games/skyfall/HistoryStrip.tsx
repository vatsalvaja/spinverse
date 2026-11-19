"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { HistoryItem } from "./engine";

const tier = (m: number) => (m < 1.1 ? "bust" : m < 2 ? "low" : m < 10 ? "mid" : "high");

/** Compact strip of recent crash multipliers, newest on the left. New results slide in. */
export function HistoryStrip({ history }: { history: HistoryItem[] }) {
  return (
    <div className="sf-hist" role="list" aria-label="Previous round results (demo)">
      <AnimatePresence initial={false}>
        {history.map((h) => (
          <motion.span
            key={h.round}
            role="listitem"
            layout
            initial={{ opacity: 0, scale: 0.5, x: -24 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="sf-chip"
            data-t={tier(h.mult)}
            title={`Round ${h.round}`}
          >
            {h.mult.toFixed(2)}x
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
