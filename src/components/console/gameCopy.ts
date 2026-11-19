import { Flame, Gauge, Layers, Orbit, Repeat, Sparkles, Sun, Swords, TrendingUp, Waves, Zap, type LucideIcon } from "lucide-react";
import type { GameId } from "@/data/types";

export interface Feature {
  title: string;
  text: string;
  icon: LucideIcon;
}

/** Plain-language feature notes for each launch world. Used by Explore and the detail screen. */
export const FEATURES: Record<GameId, Feature[]> = {
  "pharaohs-fortune": [
    { title: "5×3 classic reels", text: "Five reels, three rows and the clean, readable play of a true classic.", icon: Layers },
    { title: "Expanding wilds", text: "A wild that lands can stretch to fill its reel and light up more lines.", icon: Sun },
    { title: "Free spins", text: "Find the hidden chamber to open a run of bonus spins.", icon: Sparkles },
  ],
  "atlantis-cascade": [
    { title: "Cascades", text: "Winning symbols vanish and new ones tumble in, so a single spin can chain.", icon: Waves },
    { title: "Rising multiplier", text: "Every step of a chain lifts the multiplier a little higher.", icon: Gauge },
    { title: "Tumble wins", text: "A 6×5 grid gives the tide plenty of room to turn.", icon: Layers },
  ],
  "neon-overdrive": [
    { title: "Hold & Respin", text: "Glowing orbs lock in place while the rest of the board respins.", icon: Repeat },
    { title: "Orb tiers", text: "Each orb carries a point value that climbs through jackpot-style tiers.", icon: Orbit },
    { title: "Turbo mode", text: "Shorter animations for players who like the night to move fast.", icon: Zap },
  ],
  skyfall: [
    { title: "Two independent bet panels", text: "Set up two bets with their own stakes. Cashing out one never touches the other.", icon: Layers },
    { title: "Auto cash-out", text: "Pick a multiplier and let the panel cash out for you before the sky falls.", icon: Zap },
    { title: "Rising multiplier", text: "The multiplier climbs as the aircraft flies. Cash out before it crashes.", icon: TrendingUp },
  ],
  "tiger-clash": [
    { title: "Three selections", text: "Back the Tiger, back the Dragon, or call a Tie before the cards are drawn.", icon: Swords },
    { title: "Cinematic card reveal", text: "Each card flips in turn, with a pause before the Dragon's card turns over.", icon: Sparkles },
    { title: "Character victory animations", text: "The winner roars and breathes fire, the loser reels, and a tie clashes both together.", icon: Flame },
  ],
};

/** Explore filters mapped onto the categories the three launch games actually have. */
export const EXPLORE_FILTERS = [
  { id: "all", label: "All games" },
  { id: "classic", label: "Classic reels", category: "Classic Slots" },
  { id: "cascade", label: "Cascade games", category: "Cascading Reels" },
  { id: "bonus", label: "Bonus experiences", category: "Hold & Respin" },
  { id: "recent", label: "Recently played" },
  { id: "favorites", label: "Favorites" },
] as const;

export type ExploreFilter = (typeof EXPLORE_FILTERS)[number]["id"];
