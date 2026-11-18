"use client";

import { useCallback, useMemo } from "react";
import { Compass, Gift, Target, Trophy } from "lucide-react";
import { useConsole } from "@/components/console/ConsoleContext";
import { FeaturedPanel } from "@/components/console/FeaturedPanel";
import { GameStrip } from "@/components/console/GameStrip";
import { PlayerHud, QuickTile, ResumePill, type QuickTileData } from "@/components/console/HomeParts";
import { useArrowKeys } from "@/components/console/useSnapCarousel";
import { WorldBackdrop } from "@/components/console/WorldBackdrop";
import { WORLD } from "@/components/art/worlds";
import { recentGamesFor } from "@/data/derive";
import { buildLeaderboard, MISSIONS } from "@/data/engagement";
import { GAMES, GAME_BY_ID } from "@/data/games";
import { useDemoData } from "@/data/provider";
import type { GameId } from "@/data/types";
import { useSession } from "@/lib/session";
import { NOW, cn, timeAgo } from "@/lib/utils";

/**
 * Home is the console: the selected world fills the screen, its story sits bottom-left,
 * and everything else (worlds, shortcuts, player) is a compact HUD around it.
 */
export default function HomePage() {
  const { player, mode, recent } = useSession();
  const { users, transactionsFor } = useDemoData();
  const { selected, origin, dir, select, step } = useConsole();
  useArrowKeys(step);

  const txs = useMemo(() => (player ? transactionsFor(player.id) : []), [player, transactionsFor]);
  const board = useMemo(() => buildLeaderboard(users), [users]);
  const onStep = useCallback((d: 1 | -1) => step(d), [step]);

  if (!player) return null;

  const game = GAME_BY_ID[selected];
  const w = WORLD[selected];
  const myRank = board.find((b) => b.user.id === player.id)?.rank;
  const level = 1 + Math.floor(player.totalEarned / 5000);
  const resumeId = (recent[0] ?? "neon-overdrive") as GameId;
  const lastSession = recentGamesFor(txs, 30).find((s) => s.game === resumeId);
  const ready = MISSIONS.filter((m) => m.kind === "daily" && m.progress >= m.target).length;
  const hoursToReset = 24 - NOW.getUTCHours();

  const tiles: QuickTileData[] = [
    { href: "/games", label: "Browse games", stat: `${GAMES.length} worlds open`, icon: Compass, art: "neon-overdrive", accent: "#6ff2ff" },
    { href: "/missions", label: "Daily missions", stat: ready ? `${ready} ready to claim` : "In progress", icon: Target, art: "atlantis-cascade", accent: "#4fe3d4", hot: ready > 0 },
    { href: "/leaderboard", label: "Leaderboard", stat: myRank ? `You’re #${myRank}` : "See the season", icon: Trophy, art: "pharaohs-fortune", accent: "#f0b84a" },
    { href: "/rewards", label: "Rewards", stat: `Next daily in ${hoursToReset}h`, icon: Gift, art: "neon-overdrive", accent: "#ff7ae6" },
  ];

  return (
    <section data-parallax-root className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden">
      <WorldBackdrop gameId={selected} origin={origin} className="-z-30" />
      {/* readability: left for the story, bottom for the dock, top for the bar */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-r from-[#05050a]/90 via-[#05050a]/40 to-transparent lg:from-[#05050a]/85 lg:via-[#05050a]/30" aria-hidden />
      <div className="absolute inset-0 -z-20 bg-gradient-to-t from-[#05050a] via-[#05050a]/55 to-transparent to-60%" aria-hidden />
      <div className="absolute inset-x-0 top-0 -z-20 h-28 bg-gradient-to-b from-[#05050a]/80 to-transparent" aria-hidden />
      <div className="sv-vignette absolute inset-0 -z-20" aria-hidden />

      <div className={cn("relative z-10 mx-auto flex w-full max-w-[1480px] flex-1 flex-col px-4 pb-3 sm:px-8", mode === "guest" ? "pt-[92px] sm:pt-[96px]" : "pt-[60px] sm:pt-[68px]")}>
        <div className="flex items-center justify-between gap-3">
          <PlayerHud player={player} accent={w.primary} level={level} progress={player.totalEarned % 5000} streak={4} />
          <ResumePill gameId={resumeId} when={lastSession ? timeAgo(lastSession.timestamp) : undefined} />
        </div>

        <div className="flex flex-1 items-end pb-4 pt-8 lg:pt-6">
          <FeaturedPanel game={game} dir={dir} />
        </div>

        <div className="grid items-end gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10">
          <GameStrip games={GAMES} selected={selected} onSelect={select} onStep={onStep} />
          <nav aria-label="Shortcuts" className="grid grid-cols-2 gap-2 pb-4 sm:grid-cols-4 lg:w-[330px] lg:grid-cols-2">
            {tiles.map((t) => (
              <QuickTile key={t.href} {...t} />
            ))}
          </nav>
        </div>

        <p className="pb-1 text-center text-[10.5px] text-obsidian-300/80 lg:text-left">Entertainment only. Virtual points have no cash value and can’t be bought, withdrawn or exchanged. 18+.</p>
      </div>
    </section>
  );
}
