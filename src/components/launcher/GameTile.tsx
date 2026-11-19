"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { motion } from "framer-motion";
import { Heart, Play } from "lucide-react";
import { ART } from "@/components/art/art";
import type { Game } from "@/data/games";
import { cn } from "@/lib/utils";

/**
 * Official cover art for a game. The art folders are named after the world ("pharaoh", "atlantis", "neon"),
 * not after the game id, so we resolve through the shared ART table. A future game can ship `cover` on its
 * record or add itself to ART; anything else falls back to /art/<id>/poster.webp.
 */
export function coverFor(g: Game): string {
  const withCover = g as Game & { cover?: string };
  return withCover.cover ?? (ART as Record<string, { poster: string } | undefined>)[g.id]?.poster ?? `/art/${g.id}/poster.webp`;
}

interface Props {
  game: Game;
  index: number;
  selected: boolean;
  favorite: boolean;
  onSelect: () => void;
  onPlay: () => void;
  onFavorite: () => void;
}

export function GameTile({ game, index, selected, favorite, onSelect, onPlay, onFavorite }: Props) {
  const ref = useRef<HTMLElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [hover, setHover] = useState(false);
  const [ready, setReady] = useState(false);
  const [broken, setBroken] = useState(false);

  // the image can finish loading before React attaches onLoad (cached or server-rendered), so check on mount
  useEffect(() => {
    const el = img.current;
    if (el?.complete) (el.naturalWidth > 0 ? setReady(true) : setBroken(true));
  }, []);

  // a light 3D tilt for mouse users only; touch and keyboard get the same states without it
  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
    ref.current.style.setProperty("--rx", `${(-py * 7).toFixed(2)}deg`);
  };
  const reset = () => {
    setHover(false);
    ref.current?.style.setProperty("--rx", "0deg");
    ref.current?.style.setProperty("--ry", "0deg");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: Math.min(0.5, 0.06 + index * 0.05), ease: [0.2, 0.8, 0.2, 1] }}
    >
      <article
        ref={ref}
        className="lx-tile"
        data-selected={selected}
        data-hover={hover}
        data-game={game.id}
        style={{ "--ac": game.accent } as CSSProperties}
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
        onPointerMove={onMove}
        onPointerLeave={reset}
      >
        <div className={cn("lx-face aspect-[4/5]")}>
          {/* always something to look at: a tinted backdrop sits under the poster until it has loaded (or if it cannot) */}
          <div className="absolute inset-0" style={{ background: `radial-gradient(90% 70% at 50% 30%, ${game.accentSoft}, #090a14 78%)` }} />
          {!broken && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              ref={img}
              src={coverFor(game)}
              alt={`${game.name} poster`}
              draggable={false}
              decoding="async"
              loading={index < 6 ? "eager" : "lazy"}
              data-ready={ready}
              className="lx-art"
              onLoad={() => setReady(true)}
              onError={() => setBroken(true)}
            />
          )}
          {broken && (
            <div className="absolute inset-0 flex items-start justify-center pt-[22%]">
              <span className="sv-display select-none text-[3.2rem] font-bold leading-none opacity-40" style={{ color: game.accent }} aria-hidden>{game.name.charAt(0)}</span>
            </div>
          )}
          <div className="lx-shade" />
          <div className="lx-shine" />
          <div className="lx-gloss" />

          {/* the whole cover selects the game; the controls above it stay independently reachable */}
          <button type="button" aria-label={`Select ${game.name}`} aria-pressed={selected} data-select={game.id} onClick={onSelect} onDoubleClick={onPlay} className="absolute inset-0 z-[1] cursor-pointer rounded-[inherit] focus-visible:outline-none" />

          <div className="pointer-events-none absolute inset-x-2 top-2 z-[2] flex items-start justify-between gap-1.5 sm:inset-x-2.5 sm:top-2.5">
            <span className="lx-badge hidden max-w-[calc(100%-2.5rem)] truncate rounded-full px-2.5 py-[3px] text-[10.5px] font-semibold text-white/90 sm:inline-block">{game.category}</span>
            <button type="button" data-on={favorite} aria-pressed={favorite} aria-label={favorite ? `Remove ${game.name} from favorites` : `Add ${game.name} to favorites`} onClick={onFavorite} className="lx-heart pointer-events-auto ml-auto h-9 w-9">
              <Heart className={cn("h-4 w-4", favorite && "fill-current")} />
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-2 bottom-2 z-[2] sm:inset-x-2.5 sm:bottom-2.5">
            <h2 className="sv-display line-clamp-2 text-balance text-[0.86rem] font-bold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,.95)] sm:text-[0.92rem]">{game.name}</h2>
            <p className="mb-2 mt-0.5 font-num text-[11px] text-white/65">
              <span style={{ color: game.accent }}>{game.grid}</span> · {game.volatility}
            </p>
            <button type="button" onClick={onPlay} className="lx-play pointer-events-auto text-[13px]">
              <Play className="h-3.5 w-3.5 fill-current" /> Play
            </button>
          </div>
        </div>
      </article>
    </motion.div>
  );
}
