"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Lock, Search, SearchX, X } from "lucide-react";
import { GameTitle } from "@/components/art/GameTitle";
import { WORLD } from "@/components/art/worlds";
import { LiveArt } from "@/components/art/WorldArt";
import { originOf, useConsole } from "@/components/console/ConsoleContext";
import { FeaturedPanel } from "@/components/console/FeaturedPanel";
import { EXPLORE_FILTERS, type ExploreFilter } from "@/components/console/gameCopy";
import { useArrowKeys, useSnapCarousel } from "@/components/console/useSnapCarousel";
import { WorldBackdrop } from "@/components/console/WorldBackdrop";
import { FavoriteButton } from "@/components/site/GameCard";
import { usePlay } from "@/components/site/PlayModal";
import { Btn, PlayButton } from "@/components/site/ui";
import { useToast } from "@/components/ui/toast";
import { COMING_SOON, GAMES, type Game } from "@/data/games";
import type { GameId } from "@/data/types";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
] as const;

const STAGGER = ["lg:mt-0", "lg:mt-10", "lg:mt-5"];

/** A world in the collection: its own silhouette, lit when chosen, with Play and Favorite always at hand. */
function CollectionCard({ game, index, on, onSelect }: { game: Game; index: number; on: boolean; onSelect: (id: GameId, origin?: ReturnType<typeof originOf>) => void }) {
  const play = usePlay();
  const w = WORLD[game.id];
  return (
    <div className={cn("shrink-0 snap-center transition-[filter] duration-500", STAGGER[index % STAGGER.length])} style={{ filter: on ? `drop-shadow(0 26px 34px ${w.glow})` : undefined }}>
      <article
        data-parallax-root
        className={cn("group relative isolate h-[min(62vh,430px)] min-h-[360px] w-[min(76vw,296px)] overflow-hidden bg-black transition duration-500 ease-[cubic-bezier(.2,.7,.2,1)]", w.shapeClass, on ? "-translate-y-3 scale-[1.03]" : "scale-[0.96] hover:-translate-y-1")}
      >
        <div className={cn("absolute inset-0 -z-10 transition duration-500", on ? "brightness-100" : "brightness-[.62] group-hover:brightness-90")}><LiveArt gameId={game.id} /></div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/45 to-transparent to-75%" />
        <div className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-500" style={{ opacity: on ? 1 : 0.35, background: `radial-gradient(90% 55% at 30% 100%, ${w.glow}, transparent 70%)` }} />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,.15)]" style={{ borderRadius: "inherit" }} />

        <button onClick={(e) => onSelect(game.id, originOf(e.currentTarget))} aria-pressed={on} aria-label={`Select ${game.name}`} className="absolute inset-0 z-0 cursor-pointer" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-5 pt-24">
          <p className="sv-serif text-[1.15rem]" style={{ color: w.primary }}>{game.category}</p>
          <GameTitle gameId={game.id} as="h3" className="text-balance text-[2rem]" />
          <p className="mt-2 line-clamp-2 text-[13.5px] leading-snug text-obsidian-100">{game.tagline}</p>
          <div className="pointer-events-auto mt-4 flex items-center gap-2.5">
            <PlayButton gameId={game.id} size="md" onClick={() => play(game.id)} aria-label={`Play ${game.name}`}>Play</PlayButton>
            <FavoriteButton game={game} />
          </div>
        </div>
      </article>
    </div>
  );
}

export default function ExplorePage() {
  const toast = useToast();
  const { favorites, recent } = useSession();
  const { selected, origin, dir, select, step } = useConsole();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ExploreFilter>("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("popular");
  const [notify, setNotify] = useState<string[]>([]);
  const rail = useRef<HTMLDivElement>(null);

  const matches = useCallback(
    (g: Game, f: ExploreFilter) => {
      const def = EXPLORE_FILTERS.find((x) => x.id === f);
      if (f === "recent") return recent.includes(g.id);
      if (f === "favorites") return favorites.includes(g.id);
      if (def && "category" in def) return g.category === def.category;
      return true;
    },
    [recent, favorites],
  );

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
  }, [query, filter, sort, matches]);

  const ids = useMemo(() => list.map((g) => g.id), [list]);
  const viewId: GameId = ids.includes(selected) ? selected : ids[0] ?? selected;
  const view = list.find((g) => g.id === viewId);
  const index = Math.max(0, ids.indexOf(viewId));

  const onStep = useCallback((d: 1 | -1) => ids.length && step(d, ids), [ids, step]);
  useArrowKeys(onStep);
  const pick = useCallback((i: number, el: HTMLElement | null) => ids[i] && select(ids[i], originOf(el)), [ids, select]);
  useSnapCarousel(rail, index, pick);


  return (
    <div data-parallax-root className="relative isolate min-h-[100dvh]">
      <div className="fixed inset-0 -z-10" aria-hidden>
        <WorldBackdrop gameId={viewId} origin={origin} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050a]/90 via-[#05050a]/50 to-[#05050a]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/50 to-transparent to-70%" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#05050a]/80 to-transparent" />
        <div className="sv-vignette absolute inset-0" />
      </div>

      <div className="mx-auto w-full max-w-[1480px] px-4 pt-[64px] sm:px-8 sm:pt-[72px]">
        {/* search, categories and sorting: one compact console strip */}
        <div className="sv-glass flex flex-col gap-1.5 rounded-2xl p-1.5 md:flex-row md:items-center">
          <div className="relative md:w-60 md:shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-300" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, theme or feature" aria-label="Search games" className="h-10 w-full rounded-xl border border-white/10 bg-black/35 pl-10 pr-9 text-sm text-white placeholder:text-obsidian-300 transition focus:border-gold-200/60 focus:outline-none focus:ring-4 focus:ring-gold-300/10" />
            {query && <button onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-obsidian-200 hover:bg-white/10 hover:text-white"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="sv-scroll-x flex min-w-0 flex-1 gap-1 overflow-x-auto" role="tablist" aria-label="Categories">
            {EXPLORE_FILTERS.map((f) => {
              const count = f.id === "all" ? GAMES.length : GAMES.filter((g) => matches(g, f.id)).length;
              const on = filter === f.id;
              return (
                <button key={f.id} role="tab" aria-selected={on} onClick={() => setFilter(f.id)} className={cn("relative flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-[13px] font-medium transition-colors", on ? "text-white" : "text-obsidian-200 hover:text-white")}>
                  {on && <motion.span layoutId="explore-filter" className="absolute inset-0 rounded-xl bg-white/[0.1] ring-1 ring-gold-200/45" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
                  <span className="relative">{f.label}</span>
                  <span className={cn("sv-num relative text-[11px]", on ? "text-gold-200" : "text-obsidian-300")}>{count}</span>
                </button>
              );
            })}
          </div>
          <label className="relative flex items-center md:shrink-0">
            <span className="sr-only">Sort games</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 w-full appearance-none rounded-xl border border-white/10 bg-black/35 pl-3.5 pr-9 text-sm text-white focus:border-gold-200/60 focus:outline-none md:w-auto">
              {SORTS.map((s) => <option key={s.value} value={s.value} className="bg-obsidian-900">{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-obsidian-200" />
          </label>
        </div>

        {/* featured showcase */}
        <div className="flex min-h-[calc(100dvh-340px)] items-end pb-8 pt-10 sm:min-h-[calc(100dvh-300px)]">
          {view ? (
            <FeaturedPanel game={view} dir={dir} rich />
          ) : (
            <div className="sv-panel mx-auto flex w-full max-w-xl flex-col items-center px-6 py-14 text-center">
              <SearchX className="h-9 w-9 text-gold-300" />
              <p className="sv-display mt-4 text-xl font-semibold text-white">
                {filter === "favorites" ? "No favorites yet" : filter === "recent" ? "Nothing played yet" : `No worlds match “${query}”`}
              </p>
              <p className="mt-2 text-sm text-obsidian-200">
                {filter === "favorites" ? "Tap the heart on any world to pin it here." : filter === "recent" ? "Start any world and it will appear here." : "Try another keyword or switch category."}
              </p>
              <Btn variant="outline" className="mt-6" onClick={() => { setQuery(""); setFilter("all"); }}>Show all games</Btn>
            </div>
          )}
        </div>

        {/* the collection */}
        {list.length > 0 && (
          <section aria-label="Game collection">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[15px] font-semibold text-white">
                The collection <span className="sv-num ml-1.5 text-xs font-normal text-obsidian-200">{list.length} {list.length === 1 ? "world" : "worlds"}</span>
              </h2>
              <div className="flex gap-1.5">
                {([-1, 1] as const).map((d) => (
                  <button key={d} onClick={() => onStep(d)} aria-label={d === -1 ? "Previous world" : "Next world"} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:border-white/50 hover:bg-white/15 active:scale-90">
                    {d === -1 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
            <div ref={rail} className="sv-scroll-x -mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[calc(50%-min(38vw,148px))] pb-10 pt-8 sm:-mx-8 sm:px-[calc(50%-148px)] lg:mx-0 lg:px-4 xl:justify-center">
              {list.map((g, i) => (
                <CollectionCard key={g.id} game={g} index={i} on={g.id === viewId} onSelect={select} />
              ))}
            </div>
          </section>
        )}

        {/* what is arriving next */}
        <section aria-label="Coming soon" className="pb-6">
          <p className="px-1 text-[15px] font-semibold text-white">Opening soon</p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-3">
            {COMING_SOON.map((c) => {
              const on = notify.includes(c.id);
              return (
                <li key={c.id} className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-black/45 p-3.5 backdrop-blur">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]"><Lock className="h-4 w-4 text-obsidian-200" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">{c.name}</span>
                    <span className="block truncate text-xs text-obsidian-200">{c.theme} · {c.eta}</span>
                  </span>
                  <Btn
                    size="sm"
                    variant={on ? "dark" : "outline"}
                    aria-pressed={on}
                    onClick={() => {
                      setNotify((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]));
                      toast(on ? `Reminder removed for ${c.name}.` : `We’ll let you know when ${c.name} opens.`, "info");
                    }}
                  >
                    <Bell className="h-3.5 w-3.5" /> {on ? "On" : "Remind me"}
                  </Btn>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
