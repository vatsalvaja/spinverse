"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, List, SearchX } from "lucide-react";
import { GameTile } from "@/components/launcher/GameTile";
import { useLauncherSearch } from "@/components/launcher/LauncherShell";
import { CategoryTabs, GameRow } from "@/components/launcher/libraryParts";
import type { Game } from "@/data/games";
import { useCatalogue } from "@/features/game-management/player/catalogue";
import type { InstallProps } from "@/features/game-management/player/components/InstallActions";
import { useInstallFlow } from "@/features/game-management/player/download-manager/useInstallFlow";
import { useSession } from "@/lib/session";

const SORTS = [
  { value: "popular", label: "Most popular" },
  { value: "rating", label: "Top rated" },
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name A–Z" },
] as const;

type Layout = "grid" | "list";

/** Explore: every game, with category tabs, sorting and a grid or list view. */
export default function ExplorePage() {
  const flow = useInstallFlow();
  const { games: GAMES, byId } = useCatalogue();
  const { favorites, toggleFavorite } = useSession();
  const { query, setQuery } = useLauncherSearch();
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<(typeof SORTS)[number]["value"]>("popular");
  const [layout, setLayout] = useState<Layout>("grid");
  const [selected, setSelected] = useState("");

  // remember the chosen layout between visits
  useEffect(() => {
    try {
      const v = localStorage.getItem("sv-explore-layout");
      if (v === "list" || v === "grid") setLayout(v);
    } catch {}
  }, []);
  const chooseLayout = (l: Layout) => {
    setLayout(l);
    try {
      localStorage.setItem("sv-explore-layout", l);
    } catch {}
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((g) => (category === "all" || g.category === category) && (!q || [g.name, g.theme, g.concept, g.category, ...g.tags].join(" ").toLowerCase().includes(q))).sort((a, b) => {
      switch (sort) {
        case "rating": return b.rating - a.rating;
        case "newest": return b.releasedAt.localeCompare(a.releasedAt);
        case "name": return a.name.localeCompare(b.name);
        default: return b.playersNow - a.playersNow;
      }
    });
  }, [GAMES, query, category, sort]);

  const play = (g: Game) => {
    const entry = byId[g.id as string];
    if (entry) flow.handlePlay(entry);
  };
  const installFor = (g: Game): InstallProps | undefined => {
    const entry = byId[g.id as string];
    if (!entry) return undefined;
    return { status: entry.info.status, progress: entry.info.download?.progress, maintenanceMessage: entry.info.maintenanceMessage, onInstall: () => flow.requestInstall(entry), onUpdate: () => flow.requestUpdate(entry) };
  };

  useEffect(() => {
    if (list.length && !list.some((g) => g.id === selected)) setSelected(list[0].id);
  }, [list, selected]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
      <div className="lx-section flex-wrap">
        <div className="flex items-center gap-3">
          <h2>Explore games</h2>
          <span className="font-num">{list.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="lx-select relative flex h-8 items-center">
            <span className="sr-only">Sort games</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-full cursor-pointer appearance-none bg-transparent pl-3 pr-8 text-[13px] text-white focus:outline-none">
              {SORTS.map((s) => <option key={s.value} value={s.value} className="bg-[#0b0d18]">{s.label}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-white/50" />
          </label>
          <div className="lx-seg" role="group" aria-label="View">
            <button type="button" aria-pressed={layout === "grid"} aria-label="Grid view" onClick={() => chooseLayout("grid")}><LayoutGrid className="h-4 w-4" /></button>
            <button type="button" aria-pressed={layout === "list"} aria-label="List view" onClick={() => chooseLayout("list")}><List className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <CategoryTabs games={GAMES} value={category} onChange={setCategory} />
      </div>

      {list.length === 0 ? (
        <div className="mx-auto flex max-w-sm flex-col items-center py-16 text-center">
          <span className="lx-chip mb-4 h-12 w-12 rounded-xl"><SearchX className="h-5 w-5" /></span>
          <p className="sv-display text-base font-semibold text-white">{query ? `No games match “${query}”` : "No games in this category"}</p>
          <p className="mt-1.5 text-sm text-white/50">Try another keyword or category.</p>
          <button type="button" onClick={() => { setQuery(""); setCategory("all"); }} className="lx-mini mt-5 !h-10 px-5">Show all games</button>
        </div>
      ) : layout === "grid" ? (
        <div className="lx-lib" style={{ justifyContent: "start" }}>
          {list.map((g, i) => (
            <GameTile key={g.id} game={g} index={i} selected={selected === g.id} favorite={favorites.includes(g.id)} onSelect={() => setSelected(g.id)} onPlay={() => play(g)} onFavorite={() => toggleFavorite(g.id)} install={installFor(g)} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((g) => (
            <GameRow key={g.id} game={g} selected={selected === g.id} favorite={favorites.includes(g.id)} onSelect={() => setSelected(g.id)} onPlay={() => play(g)} onFavorite={() => toggleFavorite(g.id)} install={installFor(g)} />
          ))}
        </div>
      )}
      {flow.dialogs}
    </div>
  );
}
