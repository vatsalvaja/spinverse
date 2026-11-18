"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, X } from "lucide-react";
import { GameTitle } from "@/components/art/GameTitle";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import { Btn } from "@/components/site/ui";
import { GAME_BY_ID } from "@/data/games";
import type { GameId } from "@/data/types";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const PlayContext = createContext<{ play: (id: GameId) => void } | null>(null);

/** Opens a cinematic "entering the world" overlay. The playable tables arrive in PART 3. */
export function PlayProvider({ children }: { children: ReactNode }) {
  const [gameId, setGameId] = useState<GameId | null>(null);
  const [progress, setProgress] = useState(0);
  const { markPlayed, favorites, toggleFavorite } = useSession();

  const play = useCallback(
    (id: GameId) => {
      markPlayed(id);
      setProgress(0);
      setGameId(id);
    },
    [markPlayed],
  );
  const value = useMemo(() => ({ play }), [play]);

  useEffect(() => {
    if (!gameId) return;
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4 + Math.random() * 6)), 120);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setGameId(null);
    document.addEventListener("keydown", esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearInterval(t);
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = prev;
    };
  }, [gameId]);

  const game = gameId ? GAME_BY_ID[gameId] : null;
  const world = gameId ? WORLD[gameId] : null;
  const ready = progress >= 100;
  const fav = game ? favorites.includes(game.id) : false;

  return (
    <PlayContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {game && world && (
          <motion.div
            key={game.id}
            role="dialog"
            aria-modal="true"
            aria-label={`Entering ${game.name}`}
            className="fixed inset-0 z-[90] overflow-hidden bg-black"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
            data-parallax-root
          >
            <WorldArt gameId={game.id} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/30" />
            <div className="sv-vignette absolute inset-0" />
            <button onClick={() => setGameId(null)} aria-label="Close" className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur hover:bg-white/15 sm:right-6 sm:top-6">
              <X className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-0 mx-auto flex max-w-3xl flex-col items-center px-6 pb-14 text-center sm:pb-20">
              <p className="sv-serif text-2xl" style={{ color: world.primary }}>{world.kicker}</p>
              <GameTitle gameId={game.id} as="h2" className="mt-1 text-[clamp(2.4rem,9vw,5.5rem)]" />
              <div className="mt-8 w-full max-w-md">
                <div className="h-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full transition-[width] duration-150" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${world.secondary}, ${world.primary})`, boxShadow: `0 0 16px ${world.glow}` }} />
                </div>
                <p className="mt-3 text-sm text-obsidian-200" aria-live="polite">
                  {ready ? "The table opens in the next release. This world is waiting on your Recently played shelf." : "Entering the world…"}
                </p>
              </div>
              <div className={cn("mt-6 flex flex-wrap items-center justify-center gap-3 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}>
                <Btn variant="dark" onClick={() => toggleFavorite(game.id)}>
                  <Heart className={cn("h-4 w-4", fav && "fill-rose-400 text-rose-400")} /> {fav ? "Favorited" : "Add to favorites"}
                </Btn>
                <Btn onClick={() => setGameId(null)}>Back to the lobby</Btn>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PlayContext.Provider>
  );
}

export function usePlay() {
  const ctx = useContext(PlayContext);
  if (!ctx) throw new Error("usePlay must be used inside PlayProvider");
  return ctx.play;
}
