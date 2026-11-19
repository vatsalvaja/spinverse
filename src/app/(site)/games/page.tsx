"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, SearchX } from "lucide-react";
import { EXPLORE_FILTERS, type ExploreFilter } from "@/components/console/gameCopy";
import { GameTile } from "@/components/launcher/GameTile";
import { useLauncherSearch } from "@/components/launcher/LauncherShell";
import { usePlay } from "@/components/site/PlayModal";
import { PageBanner, Wrap } from "@/components/site/ui";
import { GAMES, type Game } from "@/data/games";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
] as const;

/** Explore: the whole library with category filters and sorting, in the same compact tiles as Home. */
export default function ExplorePage() {
  const play = usePlay();
  const { favorites, recent, toggleFavorite } = useSession();
  const { query, setQuery } = useLauncherSearch();
  const [filter, setFilter] = useState<ExploreFilter>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("popular");
  const [selected, setSelected] = useState<string>("");

  const matches = (g: Game, f: ExploreFilter) => {
    const def = EXPLORE_FILTERS.find((x) => x.id === f);
    if (f === "recent") return recent.includes(g.id);
    if (f === "favorites") return favorites.includes(g.id);
    if (def && "category" in def) return g.category === def.category;
    return true;
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((g) => matches(g, filter) && (!q || [g.name, g.theme, g.concept, g.category, ...g.tags].join(" ").toLowerCase().includes(q))).sort((a, b) => {
      switch (sort) {
        case "rating": return b.rating - a.rating;
        case "newest": return b.releasedAt.localeCompare(a.releasedAt);
        case "name": return a.name.localeCompare(b.name);
        default: return b.playersNow - a.playersNow;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter, sort, favorites, recent]);

  useEffect(() => {
    if (list.length && !list.some((g) => g.id === selected)) setSelected(list[0].id);
  }, [list, selected]);

  return (
    <div className="pb-6">
      <PageBanner title="Explore games" subtitle="Browse the whole library by style, or sort it your way." />
      <Wrap>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="lx-scroll -mx-1 flex min-w-0 gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Categories">
            {EXPLORE_FILTERS.map((f) => {
              const count = f.id === "all" ? GAMES.length : GAMES.filter((g) => matches(g, f.id)).length;
              const on = filter === f.id;
              return (
                <button key={f.id} role="tab" aria-selected={on} onClick={() => setFilter(f.id)} className={cn("lx-navbtn !w-auto shrink-0 !flex-row !gap-2 !rounded-xl !px-3.5 !py-2.5 text-[13px] font-medium")} data-active={on}>
                  {on && <motion.span layoutId="explore-filter" className="absolute inset-0 rounded-xl bg-[linear-gradient(180deg,rgba(230,193,112,.16),rgba(230,193,112,.04))] shadow-[inset_0_0_0_1px_rgba(230,193,112,.35)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
                  <span className="relative">{f.label}</span>
                  <span className="relative font-num text-[11px] opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
          <label className="lx-search relative flex h-11 shrink-0 items-center rounded-2xl sm:w-48">
            <span className="sr-only">Sort games</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-full w-full cursor-pointer appearance-none bg-transparent pl-3.5 pr-9 text-sm text-white focus:outline-none">
              {SORTS.map((s) => <option key={s.value} value={s.value} className="bg-[#0b0d18]">{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-white/50" />
          </label>
        </div>

        {list.length ? (
          <div className="lx-lib">
            {list.map((g, i) => (
              <GameTile key={g.id} game={g} index={i} selected={selected === g.id} favorite={favorites.includes(g.id)} onSelect={() => setSelected(g.id)} onPlay={() => play(g.id)} onFavorite={() => toggleFavorite(g.id)} />
            ))}
          </div>
        ) : (
          <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
            <span className="lx-chip mb-5 h-14 w-14 rounded-2xl"><SearchX className="h-6 w-6" /></span>
            <p className="sv-display text-lg font-semibold text-white">{filter === "favorites" ? "No favorites yet" : filter === "recent" ? "Nothing played yet" : query ? `No games match “${query}”` : "No games here"}</p>
            <p className="mt-2 text-sm text-white/55">{filter === "favorites" ? "Tap the heart on a game to keep it here." : filter === "recent" ? "Games you open will appear here." : "Try another keyword or category."}</p>
            <button type="button" onClick={() => { setQuery(""); setFilter("all"); }} className="lx-play mt-6 !h-11 !w-auto px-6 text-sm">Show all games</button>
          </div>
        )}
      </Wrap>
    </div>
  );
}
