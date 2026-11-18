"use client";

import { useEffect, useRef, useState } from "react";
import type { GameId } from "@/data/types";
import { cn } from "@/lib/utils";
import { ART, preloadWorld } from "./art";
import { AtlantisFx } from "./fx/AtlantisFx";
import { NeonFx } from "./fx/NeonFx";
import { PharaohFx } from "./fx/PharaohFx";
import { Layer, Motes, ParallaxStage, SceneSvg } from "./Stage";

function Img({ src, priority, className }: { src: string; priority?: boolean; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" aria-hidden draggable={false} decoding="async" loading={priority ? "eager" : "lazy"} {...(priority ? { fetchPriority: "high" as const } : {})} className={cn("h-full w-full select-none object-cover", className)} />
  );
}

function Fx({ gameId }: { gameId: GameId }) {
  return <SceneSvg>{gameId === "pharaohs-fortune" ? <PharaohFx /> : gameId === "atlantis-cascade" ? <AtlantisFx /> : <NeonFx />}</SceneSvg>;
}

/**
 * Cinematic artwork for a world, from baked WebP layers (public/art).
 * - full (default): three depth layers with pointer parallax, animated effects and particles.
 * - lite: a single flat poster (or the smaller thumb) for cards, thumbnails and lists.
 * Wrap in an element with data-parallax-root to make the full layers react to the pointer.
 */
export function WorldArt({ gameId, lite = false, thumb = false, priority = false, className, particles = true }: { gameId: GameId; lite?: boolean; thumb?: boolean; priority?: boolean; className?: string; particles?: boolean }) {
  const a = ART[gameId];
  if (lite) {
    return (
      <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
        <div className="absolute inset-[-3%]">
          <Img src={thumb ? a.thumb : a.poster} priority={priority} />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      <ParallaxStage>
        <Layer depth={0.25}><Img src={a.back} priority={priority} /></Layer>
        <Layer depth={0.7}><Img src={a.mid} priority={priority} /></Layer>
        <Layer depth={1}><Fx gameId={gameId} /></Layer>
        <Layer depth={1.6}><Img src={a.front} priority={priority} /></Layer>
      </ParallaxStage>
      {particles && (
        <>
          {gameId === "pharaohs-fortune" && <Motes count={34} color="#ffd9a0" kind="drift" seed={3} size={[1.4, 3.6]} />}
          {gameId === "atlantis-cascade" && <Motes count={26} color="rgba(214,255,250,.85)" kind="rise" seed={5} size={[3, 10]} />}
          {gameId === "neon-overdrive" && <Motes count={44} color="rgba(170,205,255,.75)" kind="rain" seed={9} />}
        </>
      )}
    </div>
  );
}

/** Flat poster that comes alive (layers, parallax, motion) once its container is hovered or focused. */
export function LiveArt({ gameId, className, thumb = false }: { gameId: GameId; className?: string; thumb?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const root = (el.closest("[data-parallax-root]") as HTMLElement | null) ?? el.parentElement;
    if (!root) return;
    let cancelled = false;
    const on = () => {
      preloadWorld(gameId).then(() => !cancelled && setLive(true));
    };
    const off = () => setLive(false);
    root.addEventListener("pointerenter", on);
    root.addEventListener("pointerleave", off);
    root.addEventListener("focusin", on);
    root.addEventListener("focusout", off);
    return () => {
      cancelled = true;
      root.removeEventListener("pointerenter", on);
      root.removeEventListener("pointerleave", off);
      root.removeEventListener("focusin", on);
      root.removeEventListener("focusout", off);
    };
  }, [gameId]);

  return (
    <div ref={ref} className={cn("absolute inset-0", className)}>
      <WorldArt gameId={gameId} lite={!live} thumb={thumb && !live} />
    </div>
  );
}
