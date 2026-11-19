import type { GameId } from "./types";

export interface Game {
  id: GameId;
  name: string;
  tagline: string;
  description: string;
  theme: string;
  concept: string;
  category: "Classic Slots" | "Cascading Reels" | "Hold & Respin" | "Crash";
  tags: string[];
  grid: string;
  volatility: "Low" | "Medium" | "High";
  rating: number;
  playersNow: number;
  releasedAt: string;
  featured: boolean;
  isNew: boolean;
  accent: string; // CSS colour for glows & chips
  accentSoft: string;
}

export const GAMES: Game[] = [
  {
    id: "pharaohs-fortune",
    name: "Pharaoh's Fortune",
    tagline: "Wake the golden sun over the Nile.",
    description:
      "Descend into a sun-struck tomb where scarabs, ankhs and gilded masks line five reels of classic slot play. Expanding wilds and a hidden chamber bonus reward the curious.",
    theme: "Ancient Egypt",
    concept: "Classic 5×3 slot",
    category: "Classic Slots",
    tags: ["5×3 reels", "Expanding wilds", "Free spins"],
    grid: "5×3",
    volatility: "Medium",
    rating: 4.8,
    playersNow: 1284,
    releasedAt: "2026-09-12",
    featured: true,
    isNew: false,
    accent: "#e0a93a",
    accentSoft: "rgba(224,169,58,.25)",
  },
  {
    id: "atlantis-cascade",
    name: "Atlantis Cascade",
    tagline: "Every win sends the tide higher.",
    description:
      "Glowing pearls, coral crowns and ancient tridents tumble through a sunken city. Winning symbols vanish and new ones cascade in, so one spin can unfold into a chain of surprises.",
    theme: "Underwater fantasy",
    concept: "Cascading symbols",
    category: "Cascading Reels",
    tags: ["Cascades", "Rising multiplier", "Tumble wins"],
    grid: "6×5",
    volatility: "High",
    rating: 4.7,
    playersNow: 962,
    releasedAt: "2026-10-03",
    featured: true,
    isNew: false,
    accent: "#2fb8b0",
    accentSoft: "rgba(47,184,176,.25)",
  },
  {
    id: "neon-overdrive",
    name: "Neon Overdrive",
    tagline: "Lock the glow. Respin the night.",
    description:
      "Race through a rain-slick cyberpunk skyline. Land glowing orbs, hold them in place and respin for jackpot-style point tiers. Fast, electric and made for night owls.",
    theme: "Futuristic cyberpunk",
    concept: "Hold & Respin",
    category: "Hold & Respin",
    tags: ["Hold & Respin", "Orb tiers", "Turbo mode"],
    grid: "5×4",
    volatility: "High",
    rating: 4.9,
    playersNow: 1531,
    releasedAt: "2026-11-05",
    featured: true,
    isNew: true,
    accent: "#c24fd1",
    accentSoft: "rgba(194,79,209,.25)",
  },
  {
    id: "skyfall",
    name: "SKYFALL",
    tagline: "Ride the multiplier. Cash out before the sky falls.",
    description:
      "Watch a sleek aircraft climb above a midnight city while the multiplier rises. Run two independent demo bet panels, cash out by hand or set an auto cash-out, and play with free demo points only.",
    theme: "Futuristic night city",
    concept: "Crash multiplier",
    category: "Crash",
    tags: ["Crash multiplier", "Two bet panels", "Auto cash-out"],
    grid: "Crash",
    volatility: "High",
    rating: 4.6,
    playersNow: 842,
    releasedAt: "2026-11-18",
    featured: true,
    isNew: true,
    accent: "#22d3ee",
    accentSoft: "rgba(34,211,238,.25)",
  },
];

export const GAME_BY_ID: Record<GameId, Game> = Object.fromEntries(GAMES.map((g) => [g.id, g])) as Record<GameId, Game>;

export const COMING_SOON: { id: string; name: string; theme: string; eta: string }[] = [];
