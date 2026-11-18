"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { preloadWorld } from "@/components/art/art";
import { GAMES } from "@/data/games";
import type { GameId } from "@/data/types";

export interface Origin {
  /** Viewport percentages (0–100) where the next world "opens" from. */
  x: number;
  y: number;
}

interface ConsoleValue {
  selected: GameId;
  origin: Origin;
  /** 1 when the player moved forward through the worlds, −1 when they moved back. */
  dir: 1 | -1;
  select: (id: GameId, origin?: Origin) => void;
  step: (delta: 1 | -1, ids?: GameId[]) => void;
}

const ConsoleContext = createContext<ConsoleValue | null>(null);

const ORDER = GAMES.map((g) => g.id);

/**
 * Shared frontend state for the console experience: the world the player has selected.
 * Home, Explore and the detail screen all read it, so choosing a world once carries across pages.
 */
export function ConsoleProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ selected: GameId; origin: Origin; dir: 1 | -1 }>({ selected: "neon-overdrive", origin: { x: 50, y: 88 }, dir: 1 });

  useEffect(() => {
    ORDER.forEach((id) => {
      void preloadWorld(id);
    });
  }, []);

  const select = useCallback((id: GameId, origin?: Origin) => {
    setState((s) => {
      if (s.selected === id) return s;
      return { selected: id, origin: origin ?? s.origin, dir: ORDER.indexOf(id) >= ORDER.indexOf(s.selected) ? 1 : -1 };
    });
  }, []);

  const step = useCallback((delta: 1 | -1, ids: GameId[] = ORDER) => {
    setState((s) => {
      if (!ids.length) return s;
      const at = ids.indexOf(s.selected);
      const next = ids[(at + delta + ids.length) % ids.length] ?? ids[0];
      if (next === s.selected) return s;
      return { ...s, selected: next, dir: delta };
    });
  }, []);

  const value = useMemo<ConsoleValue>(() => ({ ...state, select, step }), [state, select, step]);
  return <ConsoleContext.Provider value={value}>{children}</ConsoleContext.Provider>;
}

export function useConsole() {
  const ctx = useContext(ConsoleContext);
  if (!ctx) throw new Error("useConsole must be used inside ConsoleProvider");
  return ctx;
}

/** Centre of an element as viewport percentages: where a world "opens" from. */
export function originOf(el: Element | null | undefined): Origin | undefined {
  if (!el || typeof window === "undefined") return undefined;
  const r = el.getBoundingClientRect();
  return { x: ((r.left + r.width / 2) / window.innerWidth) * 100, y: ((r.top + r.height / 2) / window.innerHeight) * 100 };
}
