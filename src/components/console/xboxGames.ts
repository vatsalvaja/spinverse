export interface XboxGameItem {
  id: "pharaohs-fortune" | "atlantis-cascade" | "neon-overdrive";
  title: string;
  tagline: string;
  subtitle: string;
  tileImg: string;
  wallpaper: string;
  accent: string;
  genre: string;
  category: "Classic Slots" | "Cascading Reels" | "Hold & Respin";
  grid: string;
  volatility: "Low" | "Medium" | "High";
  rating: number;
  playersNow: number;
  tags: string[];
  playable: true;
  spinverseId: "pharaohs-fortune" | "atlantis-cascade" | "neon-overdrive";
}

/**
 * Strict SPINVERSE launch lineup: EXACTLY 3 finalized games.
 * 1. Pharaoh's Fortune
 * 2. Atlantis Cascade
 * 3. Neon Overdrive
 */
export const XBOX_GAMES: XboxGameItem[] = [
  {
    id: "pharaohs-fortune",
    title: "Pharaoh's Fortune",
    tagline: "Wake the golden sun over the Nile.",
    subtitle: "Classic 5×3 slot · Expanding Wilds & Tomb Bonus",
    tileImg: "/art/pharaoh/poster.webp",
    wallpaper: "/art/pharaoh/poster.webp",
    accent: "#f0b84a",
    genre: "Ancient Egypt",
    category: "Classic Slots",
    grid: "5×3",
    volatility: "Medium",
    rating: 4.8,
    playersNow: 1284,
    tags: ["5×3 reels", "Expanding wilds", "Free spins"],
    playable: true,
    spinverseId: "pharaohs-fortune",
  },
  {
    id: "atlantis-cascade",
    title: "Atlantis Cascade",
    tagline: "Every win sends the tide higher.",
    subtitle: "Cascading symbols · Rising Multipliers & Pearl Drops",
    tileImg: "/art/atlantis/poster.webp",
    wallpaper: "/art/atlantis/poster.webp",
    accent: "#4fe3d4",
    genre: "Underwater Fantasy",
    category: "Cascading Reels",
    grid: "6×5",
    volatility: "High",
    rating: 4.7,
    playersNow: 962,
    tags: ["Cascades", "Rising multiplier", "Tumble wins"],
    playable: true,
    spinverseId: "atlantis-cascade",
  },
  {
    id: "neon-overdrive",
    title: "Neon Overdrive",
    tagline: "Lock the glow. Respin the night.",
    subtitle: "Hold & Respin · Turbo Jackpot Tiers",
    tileImg: "/art/neon/poster.webp",
    wallpaper: "/art/neon/poster.webp",
    accent: "#ff4fd8",
    genre: "Futuristic Cyberpunk",
    category: "Hold & Respin",
    grid: "5×4",
    volatility: "High",
    rating: 4.9,
    playersNow: 1531,
    tags: ["Hold & Respin", "Orb tiers", "Turbo mode"],
    playable: true,
    spinverseId: "neon-overdrive",
  },
];
