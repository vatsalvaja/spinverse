"use client";

import type { CSSProperties } from "react";
import { Heart, Play, Star, Users } from "lucide-react";
import type { Game } from "@/data/games";
import { cn } from "@/lib/utils";
import { coverFor } from "./GameTile";

/** Category tabs built from whatever categories the library actually has, so new games need no changes here. */
export function CategoryTabs({ games, value, onChange }: { games: Game[]; value: string; onChange: (c: string) => void }) {
  const categories = Array.from(new Set(games.map((g) => g.category)));
  const tabs = [{ id: "all", label: "All", count: games.length }, ...categories.map((c) => ({ id: c, label: c, count: games.filter((g) => g.category === c).length }))];
  return (
    <div className="lx-tabs" role="tablist" aria-label="Categories">
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)} className="lx-tab">
          {t.label}
          <small>{t.count}</small>
        </button>
      ))}
    </div>
  );
}

/** A small "pick up where you left off" card. */
export function ContinueCard({ game, onPlay }: { game: Game; onPlay: () => void }) {
  return (
    <div className="lx-card" style={{ "--ac": game.accent } as CSSProperties}>
      <span className="lx-thumb h-[52px] w-[84px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverFor(game)} alt="" draggable={false} loading="lazy" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-white">{game.name}</span>
        <span className="block truncate text-[11.5px] text-white/45">{game.category}</span>
      </span>
      <button type="button" onClick={onPlay} aria-label={`Play ${game.name}`} className="lx-mini">
        <Play className="h-3 w-3 fill-current" /> Play
      </button>
    </div>
  );
}

/** One game as a dense list row: cover, name, facts, favorite and play. */
export function GameRow({ game, selected, favorite, onSelect, onPlay, onFavorite }: { game: Game; selected: boolean; favorite: boolean; onSelect: () => void; onPlay: () => void; onFavorite: () => void }) {
  return (
    <div className="lx-row [grid-template-columns:auto_1fr_auto] md:[grid-template-columns:auto_minmax(0,1.6fr)_repeat(3,minmax(0,.7fr))_auto]" data-selected={selected} style={{ "--ac": game.accent } as CSSProperties} onClick={onSelect} onDoubleClick={onPlay}>
      <span className="lx-thumb h-[54px] w-[44px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverFor(game)} alt="" draggable={false} loading="lazy" style={{ objectPosition: "50% 45%" }} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold text-white">{game.name}</span>
        <span className="block truncate text-xs text-white/45">{game.category} · {game.grid}</span>
      </span>
      <span className="hidden items-center gap-1.5 text-[13px] text-white/70 md:flex"><Star className="h-3.5 w-3.5 fill-[#e6c170] text-[#e6c170]" /><b className="font-num font-semibold">{game.rating}</b></span>
      <span className="hidden text-[13px] text-white/70 md:block">{game.volatility} volatility</span>
      <span className="hidden items-center gap-1.5 text-[13px] text-white/70 md:flex"><Users className="h-3.5 w-3.5 text-white/40" /><b className="font-num font-semibold">{game.playersNow.toLocaleString("en-US")}</b></span>
      <span className="flex items-center gap-2">
        <button type="button" onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-pressed={favorite} aria-label={favorite ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`} className={cn("lx-heart h-8 w-8", "!bg-transparent")} data-on={favorite}>
          <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); onPlay(); }} aria-label={`Play ${game.name}`} className="lx-mini">
          <Play className="h-3 w-3 fill-current" /> Play
        </button>
      </span>
    </div>
  );
}
