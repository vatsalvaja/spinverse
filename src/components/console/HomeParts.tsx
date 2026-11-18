"use client";

import Link from "next/link";
import { Compass, Flame, Gift, Play, Target, Trophy, type LucideIcon } from "lucide-react";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import { Avatar } from "@/components/ui/avatar";
import { MembershipBadge } from "@/components/site/MembershipBadge";
import { usePlay } from "@/components/site/PlayModal";
import { Ring } from "@/components/site/Ring";
import { GAME_BY_ID } from "@/data/games";
import type { GameId, UserRecord } from "@/data/types";
import { cn } from "@/lib/utils";

/** Compact player readout: avatar with level ring, name, tier and streak. No profile banner. */
export function PlayerHud({ player, accent, level, progress, streak }: { player: UserRecord; accent: string; level: number; progress: number; streak: number }) {
  return (
    <Link href="/profile" aria-label="Open your profile" className="group flex items-center gap-3 rounded-full border border-white/10 bg-black/40 py-1.5 pl-1.5 pr-4 backdrop-blur-md transition hover:border-white/30">
      <span className="relative">
        <Ring value={progress} max={5000} size={46} stroke={3} color={accent}>
          <Avatar name={player.name} size={32} />
        </Ring>
        <span className="sv-num absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-obsidian-950 px-1.5 text-[10px] font-bold leading-4 text-gold-100 ring-1 ring-gold-200/50">LV {level}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold leading-tight text-white">{player.name}</span>
        <span className="mt-1 flex items-center gap-2">
          <MembershipBadge tier={player.membership} size="sm" />
          <span className="hidden items-center gap-1 text-xs text-obsidian-100 sm:flex"><Flame className="h-3.5 w-3.5 text-ember" />{streak}-day streak</span>
        </span>
      </span>
    </Link>
  );
}

/** One-tap way back into the last world played. */
export function ResumePill({ gameId, when }: { gameId: GameId; when?: string }) {
  const play = usePlay();
  const w = WORLD[gameId];
  const g = GAME_BY_ID[gameId];
  return (
    <button onClick={() => play(gameId)} aria-label={`Continue ${g.name}`} className="group flex items-center gap-3 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-md transition hover:border-white/30 sm:pr-5">
      <span className="relative h-[40px] w-[40px] overflow-hidden rounded-full ring-2" style={{ ["--tw-ring-color" as string]: w.primary }}>
        <WorldArt gameId={gameId} lite thumb />
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition group-hover:opacity-100"><Play className="h-4 w-4 fill-white text-white" /></span>
      </span>
      <span className="hidden text-left sm:block">
        <span className="block text-[11px] text-obsidian-200">Continue{when ? ` · ${when}` : ""}</span>
        <span className="block text-[14px] font-semibold leading-tight text-white">{g.name}</span>
      </span>
    </button>
  );
}

export interface QuickTileData {
  href: string;
  label: string;
  stat: string;
  icon: LucideIcon;
  art: GameId;
  accent: string;
  hot?: boolean;
}

/** Console shortcut: world artwork, a bold icon and one live number. */
export function QuickTile({ href, label, stat, icon: Icon, art, accent, hot }: QuickTileData) {
  return (
    <Link href={href} className="group relative isolate flex h-[78px] flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-2.5 transition duration-300 hover:-translate-y-1 sm:h-[88px] sm:p-3" style={{ ["--ac" as string]: accent }}>
      <span className="absolute inset-0 -z-10 transition duration-700 group-hover:scale-110"><WorldArt gameId={art} lite thumb /></span>
      <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />
      <span className="absolute inset-0 -z-10 opacity-0 transition duration-300 group-hover:opacity-100" style={{ background: `linear-gradient(135deg, ${accent}40, transparent 60%)` }} />
      <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-inset transition duration-300 group-hover:opacity-100" style={{ ["--tw-ring-color" as string]: accent }} />
      <span className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/55 backdrop-blur" style={{ color: accent }}>
        <Icon className="h-4 w-4" />
        {hot && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-300 shadow-[0_0_8px_rgba(240,200,100,.9)]" />}
      </span>
      <span className="block text-[13px] font-semibold leading-tight text-white sm:text-sm">{label}</span>
      <span className={cn("block truncate text-[11px] sm:text-xs")} style={{ color: accent }}>{stat}</span>
    </Link>
  );
}

export const QUICK_ICONS = { browse: Compass, missions: Target, leaderboard: Trophy, rewards: Gift };
