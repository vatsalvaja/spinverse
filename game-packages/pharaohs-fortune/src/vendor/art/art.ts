import { assetUrl } from "@spinverse/game-sdk";

/** Baked artwork. The world has three parallax layers (trimmed to the layers this game uses). */
export interface WorldAssets {
  back: string;
  mid: string;
  front: string;
}

export const ART: Record<"pharaohs-fortune", WorldAssets> = {
  "pharaohs-fortune": {
    back: assetUrl("assets/art/pharaoh/back.webp"),
    mid: assetUrl("assets/art/pharaoh/mid.webp"),
    front: assetUrl("assets/art/pharaoh/front.webp"),
  },
};
