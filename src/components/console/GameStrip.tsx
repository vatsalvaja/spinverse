"use client";

import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Heart } from "lucide-react";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import type { Game } from "@/data/games";
import type { GameId } from "@/data/types";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";
import { originOf, type Origin } from "./ConsoleContext";
import { useSnapCarousel } from "./useSnapCarousel";

/**
 * The console's world selector. Each tile keeps its world's own silhouette; the chosen one lifts,
 * brightens and wears a ring in the world's colours. Swipe on touch, arrow keys on a keyboard.
 */
export function GameStrip({ games, selected, onSelect, onStep }: { games: Game[]; selected: GameId; onSelect: (id: GameId, origin?: Origin) => void; onStep: (delta: 1 | -1) => void }) {
  const { favorites, recent } = useSession();
  const ref = useRef<HTMLDivElement>(null);
  const index = Math.max(0, games.findIndex((g) => g.id === selected));
  const pick = useCallback((i: number, el: HTMLElement | null) => games[i] && onSelect(games[i].id, originOf(el)), [games, onSelect]);
  useSnapCarousel(ref, index, pick);

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between px-1">
        <p className="text-[13px] font-semibold text-white">Your worlds</p>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 hidden items-center gap-1 text-[11px] text-obsidian-300 lg:flex" aria-hidden>
            <kbd className="rounded border border-white/15 px-1.5 py-px font-sans">←</kbd>
            <kbd className="rounded border border-white/15 px-1.5 py-px font-sans">→</kbd>
            to browse
          </span>
          {([-1, 1] as const).map((d) => (
            <button key={d} onClick={() => onStep(d)} aria-label={d === -1 ? "Previous world" : "Next world"} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur transition hover:border-white/50 hover:bg-white/15 active:scale-90">
              {d === -1 ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={ref}
        role="tablist"
        aria-label="Choose a world"
        className="sv-scroll-x -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-[calc(50%-min(32vw,110px))] pb-4 pt-6 sm:-mx-8 sm:gap-4 sm:px-[calc(50%-125px)] lg:mx-0 lg:px-3"
      >
        {games.map((g, i) => {
          const w = WORLD[g.id];
          const on = g.id === selected;
          const isRecent = recent.includes(g.id);
          const fav = favorites.includes(g.id);
          return (
            <div key={g.id} className="shrink-0 snap-center transition-[filter] duration-500 has-[:focus-visible]:[filter:drop-shadow(0_0_7px_#f2d48a)]" style={{ filter: on ? `drop-shadow(0 18px 22px ${w.glow})` : undefined }}>
              <button
                role="tab"
                aria-selected={on}
                aria-label={`${g.name}. ${g.concept}`}
                tabIndex={on ? 0 : -1}
                data-parallax-root
                onClick={(e) => onSelect(g.id, originOf(e.currentTarget))}
                className={cn("tile-" + w.shapeClass.replace("shape-", ""), "group relative block h-[128px] focus-visible:outline-none w-[min(64vw,220px)] origin-bottom p-[2px] text-left transition duration-500 ease-[cubic-bezier(.2,.7,.2,1)] sm:h-[146px] sm:w-[250px]", on ? "-translate-y-2 scale-[1.08]" : "scale-[0.93] hover:-translate-y-1 hover:scale-[0.97]")}
                style={{ background: on ? `linear-gradient(135deg, ${w.primary}, ${w.secondary})` : "rgba(255,255,255,.16)" }}
              >
                <span className={cn("tile-" + w.shapeClass.replace("shape-", ""), "relative block h-full w-full overflow-hidden bg-black")}>
                  <span className={cn("absolute inset-0 transition duration-500", on ? "brightness-100" : "brightness-[.5] saturate-[.8] group-hover:brightness-75")}>
                    <WorldArt gameId={g.id} lite />
                  </span>
                  <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <span className="absolute left-4 top-7 flex items-center gap-1.5">
                    {g.isNew && <span className="rounded-full bg-gradient-to-r from-[#f9e6a8] to-[#e3b951] px-2 py-0.5 text-[10px] font-bold text-[#2a1805]">New</span>}
                    {fav && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60" aria-label="Favorite"><Heart className="h-3 w-3 fill-rose-400 text-rose-400" /></span>}
                    {isRecent && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/60" aria-label="Recently played"><Clock className="h-3 w-3 text-obsidian-100" /></span>}
                  </span>
                  <span className="absolute inset-x-3 bottom-2.5 block">
                    <span className={cn(w.titleClass, "block text-balance text-[15px] leading-[1.05] sm:text-[17px]", g.id === "pharaohs-fortune" && "!text-[14px] sm:!text-[15px]")}>{g.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-obsidian-100">{g.concept}</span>
                  </span>
                </span>
                <span className="sr-only">{i + 1} of {games.length}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
