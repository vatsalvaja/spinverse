"use client";

import { Heart, Play, Star, Users } from "lucide-react";
import { GameTitle } from "@/components/art/GameTitle";
import { WORLD } from "@/components/art/worlds";
import { LiveArt } from "@/components/art/WorldArt";
import { usePlay } from "@/components/site/PlayModal";
import type { Game } from "@/data/games";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function FavoriteButton({ game, className }: { game: Game; className?: string }) {
  const { favorites, toggleFavorite } = useSession();
  const fav = favorites.includes(game.id);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); toggleFavorite(game.id); }}
      aria-pressed={fav}
      aria-label={fav ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`}
      className={cn("flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/45 backdrop-blur transition hover:scale-110 hover:bg-black/70", className)}
    >
      <Heart className={cn("h-[18px] w-[18px] transition", fav ? "fill-rose-400 text-rose-400" : "text-white")} />
    </button>
  );
}

/** Tall, world-shaped poster. Each world keeps its own silhouette, title face and accent. */
export function WorldPoster({ game, className, rank, titleSize = "text-[2rem] sm:text-[2.4rem]" }: { game: Game; className?: string; rank?: number; titleSize?: string }) {
  const play = usePlay();
  const w = WORLD[game.id];
  return (
    <article data-parallax-root className={cn("group relative isolate flex flex-col justify-end overflow-hidden bg-black", w.shapeClass, className)}>
      <div className="absolute inset-0 transition-transform duration-[1400ms] ease-out group-hover:scale-[1.06]">
        <LiveArt gameId={game.id} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 opacity-70 transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(90% 70% at 30% 100%, ${w.glow}, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]" style={{ borderRadius: "inherit" }} />

      {rank != null && (
        <span className="sv-num pointer-events-none absolute left-6 top-5 select-none text-[6.5rem] font-extrabold leading-none text-transparent sm:text-[7.5rem]" style={{ WebkitTextStroke: `2px ${w.primary}`, opacity: 0.85 }} aria-hidden>
          {rank}
        </span>
      )}
      <div className={cn("absolute right-5 top-5 flex items-center gap-2", rank != null && "right-5")}>
        <FavoriteButton game={game} />
      </div>

      <div className="relative z-10 p-6 pt-28 sm:p-7">
        <p className="sv-serif text-xl sm:text-2xl" style={{ color: w.primary }}>{w.kicker}</p>
        <GameTitle gameId={game.id} className={titleSize} />
        <p className="mt-2.5 max-w-xs text-[15px] leading-relaxed text-obsidian-100">{game.tagline}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5 text-[13px] text-obsidian-100">
            <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-gold-300 text-gold-300" /><b className="sv-num font-bold">{game.rating}</b> rating</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-obsidian-200" /><b className="sv-num font-bold">{game.playersNow.toLocaleString("en-US")}</b> playing</span>
          </div>
          <button
            onClick={() => play(game.id)}
            aria-label={`Play ${game.name}`}
            className="group/p relative flex h-14 items-center gap-2.5 rounded-full pl-2 pr-6 font-display text-[13px] font-bold uppercase tracking-[0.12em] transition active:scale-95"
            style={{ background: `linear-gradient(135deg, ${w.primary}, ${w.secondary})`, color: w.ctaText, boxShadow: `0 10px 30px -6px ${w.glow}` }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/80 text-white transition group-hover/p:scale-110"><Play className="h-4 w-4 translate-x-px fill-current" /></span>
            Play
          </button>
        </div>
      </div>
    </article>
  );
}
