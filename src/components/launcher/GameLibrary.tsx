"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Heart, Search } from "lucide-react";
import { usePlay } from "@/components/site/PlayModal";
import { GAMES, type Game } from "@/data/games";
import { useSession } from "@/lib/session";
import { GameTile } from "./GameTile";
import { useLauncherSearch } from "./LauncherShell";

export type LibraryView = "all" | "favorites" | "recent";

const TITLE: Record<LibraryView, string> = { all: "All games", favorites: "Favorites", recent: "Recently played" };

/** The game library: compact, fixed-size tiles that wrap into as many columns as fit, for 3 games or 300. */
export function GameLibrary({ view = "all" }: { view?: LibraryView }) {
  const play = usePlay();
  const { favorites, recent, toggleFavorite } = useSession();
  const { query, setQuery } = useLauncherSearch();
  const [selected, setSelected] = useState<string>(GAMES[0]?.id ?? "");
  const gridRef = useRef<HTMLDivElement>(null);

  const visible = useMemo<Game[]>(() => {
    let list: Game[] = GAMES;
    if (view === "favorites") list = GAMES.filter((g) => favorites.includes(g.id));
    if (view === "recent") list = recent.map((id) => GAMES.find((g) => g.id === id)).filter((g): g is Game => !!g);
    const q = query.trim().toLowerCase();
    if (q) list = list.filter((g) => [g.name, g.theme, g.category, g.concept, ...g.tags].join(" ").toLowerCase().includes(q));
    return list;
  }, [view, query, favorites, recent]);

  // keep the active selection pointing at something on screen
  useEffect(() => {
    if (visible.length && !visible.some((g) => g.id === selected)) setSelected(visible[0].id);
  }, [visible, selected]);

  const onGridKey = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step || !visible.length) return;
    e.preventDefault();
    const i = Math.max(0, visible.findIndex((g) => g.id === selected));
    const next = visible[(i + step + visible.length) % visible.length];
    setSelected(next.id);
    const el = gridRef.current?.querySelector<HTMLElement>(`[data-select="${next.id}"]`);
    el?.focus();
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  };

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 pb-6 pt-4 sm:px-8 sm:pt-6">
      <div className="mb-4 flex items-baseline gap-2.5 sm:mb-6">
        <h1 className="sv-display text-[1.05rem] font-semibold text-white sm:text-[1.2rem]">{query ? `Results for “${query}”` : TITLE[view]}</h1>
        <span className="font-num text-sm text-white/40">{visible.length}</span>
      </div>

      <AnimatePresence mode="wait">
        {visible.length ? (
          <motion.div
            key={view + (query ? "q" : "")}
            ref={gridRef}
            onKeyDown={onGridKey}
            role="group"
            aria-label={TITLE[view]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            className="lx-grid-wrap"
          >
            <div className="lx-lib">
              {visible.map((g, i) => (
                <GameTile key={g.id} game={g} index={i} selected={selected === g.id} favorite={favorites.includes(g.id)} onSelect={() => setSelected(g.id)} onPlay={() => play(g.id)} onFavorite={() => toggleFavorite(g.id)} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-sm flex-col items-center py-20 text-center">
            <span className="lx-chip mb-5 h-14 w-14 rounded-2xl">{query ? <Search className="h-6 w-6" /> : view === "favorites" ? <Heart className="h-6 w-6" /> : <Clock3 className="h-6 w-6" />}</span>
            <p className="sv-display text-lg font-semibold">{query ? `No games match “${query}”` : view === "favorites" ? "No favorites yet" : "Nothing played yet"}</p>
            <p className="mt-2 text-sm text-white/55">{query ? "Try a different name." : view === "favorites" ? "Tap the heart on a game to keep it here." : "Games you open will appear here."}</p>
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="lx-play mt-6 !h-11 !w-auto px-6 text-sm">Clear search</button>
            ) : (
              <Link href="/dashboard" className="lx-play mt-6 !h-11 !w-auto px-6 text-sm">Browse all games</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
