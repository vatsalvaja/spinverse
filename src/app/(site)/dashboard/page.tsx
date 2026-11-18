"use client";

import { XboxDashboard } from "@/components/console/XboxDashboard";

/**
 * Authentic Xbox Series X|S Console Dashboard
 * Matches the user reference layout with:
 * - Xbox Top bar: Gamerpic, Gamertag, ULTIMATE badge, Gamerscore, Utility icons, Clock
 * - Full-bleed dynamic cinematic game wallpaper
 * - Middle shelf: Game & App tiles with signature Xbox Green glowing focus box
 * - Bottom shelf: 4 Wide Featured Cards (Browse your games, Customize your Home, Forza Horizon 5, Play like a Pro)
 * - Gamepad & Keyboard navigation with authentic sound effects
 */
export default function HomePage() {
  const handleOpenUniverseMenu = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("sv-open-universe-menu"));
    }
  };

  return <XboxDashboard onOpenUniverseMenu={handleOpenUniverseMenu} />;
}
