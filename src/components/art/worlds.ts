import type { GameId } from "@/data/types";

export interface WorldTheme {
  titleClass: string;
  shapeClass: string;
  primary: string;
  secondary: string;
  deep: string;
  glow: string;
  kicker: string;
  mood: string;
  ctaText: string;
}

/** Visual identity per world: every game gets its own title face, silhouette and colour logic. */
export const WORLD: Record<GameId, WorldTheme> = {
  "pharaohs-fortune": {
    titleClass: "title-pharaoh",
    shapeClass: "shape-pharaoh",
    primary: "#f0b84a",
    secondary: "#ff8f2a",
    deep: "#1a0b07",
    glow: "rgba(240,184,74,.45)",
    kicker: "Temple of the Sun",
    mood: "Warm gold and desert fire",
    ctaText: "#2a1405",
  },
  "atlantis-cascade": {
    titleClass: "title-atlantis",
    shapeClass: "shape-atlantis",
    primary: "#4fe3d4",
    secondary: "#2a8cff",
    deep: "#021a2e",
    glow: "rgba(79,227,212,.4)",
    kicker: "The Drowned Kingdom",
    mood: "Turquoise depths and pearl light",
    ctaText: "#032a33",
  },
  "neon-overdrive": {
    titleClass: "title-neon",
    shapeClass: "shape-neon",
    primary: "#ff4fd8",
    secondary: "#6ff2ff",
    deep: "#0b0426",
    glow: "rgba(255,79,216,.45)",
    kicker: "District Zero",
    mood: "Electric violet and rain-slick neon",
    ctaText: "#1a0230",
  },
};
