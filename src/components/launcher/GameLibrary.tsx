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
import { CategoryTabs, ContinueCard } from "./libraryParts";

export type LibraryView = "all" | "favorites" | "recent";

const TITLE: Record<LibraryView, string> = { all: "Library", favorites: "Favorites", recent: "Recently played" };

/** The game library workspace: compact fixed-size tiles that wrap into as many columns as fit, for 3 games or 300. */
export function GameLibrary({ view = "all" }: { view?: LibraryView }) {
  const play = usePlay();
  const { favorites, recent, toggleFavorite } = useSession();
  const { query, setQuery } = useLauncherSearch();
  const [selected, setSelected] = useState<string>(GAMES[0]?.id ?? "");
  const [category, setCategory] = useState("all");
  const gridRef = useRef<HTMLDivElement>(null);

  const base = useMemo<Game[]>(() => {
    if (view === "favorites") return GAMES.filter((g) => favorites.includes(g.id));
    if (view === "recent") return recent.map((id) => GAMES.find((g) => g.id === id)).filter((g): g is Game => !!g);
    return GAMES;
  }, [view, favorites, recent]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return base.filter((g) => (category === "all" || g.category === category) && (!q || [g.name, g.theme, g.category, g.concept, ...g.tags].join(" ").toLowerCase().includes(q)));
  }, [base, category, query]);

  const continuing = useMemo(() => recent.map((id) => GAMES.find((g) => g.id === id)).filter((g): g is Game => !!g).slice(0, 4), [recent]);

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

  const showContinue = view === "all" && !query && continuing.length > 0;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
      {showContinue && (
        <section aria-label="Continue playing" className="mb-6">
          <div className="lx-section"><h2>Continue playing</h2></div>
          <div className="lx-scroll -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {continuing.map((g) => (
              <ContinueCard key={g.id} game={g} onPlay={() => play(g.id)} />
            ))}
          </div>
        </section>
      )}

      <div className="lx-section flex-wrap">
        <div className="flex min-w-0 items-center gap-3">
          <h2 className="shrink-0">{query ? `Results for “${query}”` : TITLE[view]}</h2>
          <span className="font-num">{visible.length}</span>
        </div>
        {base.length > 1 && <CategoryTabs games={base} value={category} onChange={setCategory} />}
      </div>

      <AnimatePresence mode="wait">
        {visible.length ? (
          <motion.div
            key={view + category + (query ? "q" : "")}
            ref={gridRef}
            onKeyDown={onGridKey}
            role="group"
            aria-label={TITLE[view]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
            className="mt-1"
          >
            <div className="lx-lib" style={{ justifyContent: "start" }}>
              {visible.map((g, i) => (
                <GameTile key={g.id} game={g} index={i} selected={selected === g.id} favorite={favorites.includes(g.id)} onSelect={() => setSelected(g.id)} onPlay={() => play(g.id)} onFavorite={() => toggleFavorite(g.id)} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="empty" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
            <span className="lx-chip mb-4 h-12 w-12 rounded-xl">{query ? <Search className="h-5 w-5" /> : view === "favorites" ? <Heart className="h-5 w-5" /> : <Clock3 className="h-5 w-5" />}</span>
            <p className="sv-display text-base font-semibold">{query ? `No games match “${query}”` : view === "favorites" ? "No favorites yet" : view === "recent" ? "Nothing played yet" : "No games in this category"}</p>
            <p className="mt-1.5 text-sm text-white/50">{query ? "Try a different name." : view === "favorites" ? "Tap the heart on a game to keep it here." : view === "recent" ? "Games you open will appear here." : "Pick another category."}</p>
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="lx-mini mt-5 !h-10 px-5">Clear search</button>
            ) : view === "all" ? (
              <button type="button" onClick={() => setCategory("all")} className="lx-mini mt-5 !h-10 px-5">Show all</button>
            ) : (
              <Link href="/dashboard" className="lx-mini mt-5 !h-10 px-5">Browse the library</Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
