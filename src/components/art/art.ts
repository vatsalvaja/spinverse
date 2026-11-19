import type { GameId } from "@/data/types";

/** Baked artwork (see scripts/art). Each world has three parallax layers plus a flat composite poster. */
export interface WorldAssets {
  back: string;
  mid: string;
  front: string;
  poster: string;
  thumb: string;
}

const make = (dir: string): WorldAssets => ({
  back: `/art/${dir}/back.webp`,
  mid: `/art/${dir}/mid.webp`,
  front: `/art/${dir}/front.webp`,
  poster: `/art/${dir}/poster.webp`,
  thumb: `/art/${dir}/thumb.webp`,
});

export const ART: Record<GameId, WorldAssets> = {
  "pharaohs-fortune": make("pharaoh"),
  "atlantis-cascade": make("atlantis"),
  "neon-overdrive": make("neon"),
  skyfall: make("skyfall"),
  "tiger-clash": make("tiger-clash"),
  roulette: make("roulette"),
};

export const VAULT_ART = { door: "/art/vault/door.webp", wheel: "/art/vault/wheel.webp" };

const cache = new Map<string, Promise<void>>();
function loadImage(src: string): Promise<void> {
  let p = cache.get(src);
  if (!p) {
    p = new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    });
    cache.set(src, p);
  }
  return p;
}

/** Warm the browser cache for a world's layered artwork. */
export function preloadWorld(id: GameId): Promise<void> {
  const a = ART[id];
  return Promise.all([a.back, a.mid, a.front].map(loadImage)).then(() => undefined);
}
