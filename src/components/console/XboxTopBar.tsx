"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Library,
  LayoutGrid,
  Search,
  Settings,
  Mic,
  MicOff,
  Gamepad2,
  BatteryMedium,
  LogOut,
  User,
  Wallet,
  Sparkles,
} from "lucide-react";
import { useSession } from "@/lib/session";
import { formatPoints } from "@/lib/utils";
import { isAudioMuted, setAudioMuted, playNavSound, playSelectSound } from "./xboxSound";

interface XboxTopBarProps {
  onOpenSearch: () => void;
  onOpenApps: () => void;
  onOpenCustomizer: () => void;
}

export function XboxTopBar({ onOpenSearch, onOpenApps, onOpenCustomizer }: XboxTopBarProps) {
  const router = useRouter();
  const { player, signOut } = useSession();
  const [timeStr, setTimeStr] = useState<string>("04:55 pm");
  const [muted, setMuted] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMuted(isAudioMuted());
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const str = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
      setTimeStr(str);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) playSelectSound();
  };

  const gamertag = player?.username || player?.name || "NewSasquatch";
  const gamerscore = player?.balance ? formatPoints(player.balance) : "21,337";

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-14 select-none items-center justify-between px-4 sm:px-8 text-white transition-opacity duration-300">
      {/* Left: Player Profile Badge */}
      <div className="relative flex items-center gap-3">
        <button
          onClick={() => {
            playNavSound();
            setProfileOpen((p) => !p);
          }}
          className="group flex items-center gap-3 rounded-full py-1 pr-3 transition duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b043]"
          aria-label="Player profile and quick menu"
        >
          {/* Gamerpic circular avatar */}
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20 transition-transform duration-200 group-hover:scale-105 group-hover:ring-[#52b043]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/art/xbox/avatar-sasquatch.webp"
              alt={gamertag}
              className="h-full w-full object-cover"
              onError={(e) => {
                // fallback to player avatar styling
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>

          {/* Gamertag & Gamerscore */}
          <div className="text-left leading-none">
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold tracking-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                {gamertag}
              </span>
              <span className="rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white ring-1 ring-white/30">
                ULTIMATE
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              {/* Xbox Gamerscore G symbol */}
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white/25 text-[8.5px] font-black text-white">
                G
              </span>
              <span className="text-[12px] font-semibold text-white/90 drop-shadow">
                {gamerscore}
              </span>
            </div>
          </div>
        </button>

        {/* Quick Profile Popover */}
        {profileOpen && (
          <div className="absolute left-0 top-14 z-[60] w-60 rounded-xl border border-white/15 bg-[#0e1015]/95 p-2 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-white/10 px-3 py-2">
              <p className="text-xs font-semibold text-white/60">Signed in as</p>
              <p className="text-sm font-bold text-white">{gamertag}</p>
              <p className="mt-0.5 text-xs text-[#52b043]">Xbox Live Connected</p>
            </div>
            <div className="mt-1 space-y-0.5">
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                <User className="h-4 w-4 text-white/70" />
                Player Profile
              </Link>
              <Link
                href="/wallet"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
              >
                <Wallet className="h-4 w-4 text-[#f0b84a]" />
                Points Vault ({gamerscore} G)
              </Link>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  onOpenCustomizer();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-white transition hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-[#52b043]" />
                Customize Home
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  signOut();
                  router.push("/login");
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center: Console Navigation / Utility Icons */}
      <nav aria-label="Xbox Console Navigation" className="flex items-center gap-3 sm:gap-5">
        {/* 1. My Games & Apps (Library icon) */}
        <Link
          href="/games"
          onClick={() => playNavSound()}
          title="My games & apps"
          aria-label="My games & apps"
          className="group relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b043]"
        >
          {/* Stylized library spines icon */}
          <div className="flex items-center gap-0.5">
            <span className="h-4 w-[2.5px] rounded-full bg-current transition-transform group-hover:-translate-y-0.5" />
            <span className="h-4 w-[2.5px] rounded-full bg-current" />
            <span className="h-4 w-[2.5px] rounded-full bg-current transition-transform group-hover:translate-y-0.5" />
          </div>
        </Link>

        {/* 2. Store / Apps Grid icon */}
        <button
          onClick={() => {
            playNavSound();
            onOpenApps();
          }}
          title="Store & All Apps"
          aria-label="Store & All Apps"
          className="group flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b043]"
        >
          <div className="flex h-4 w-4 items-center justify-center rounded-[3px] border border-current p-0.5">
            <LayoutGrid className="h-3 w-3" />
          </div>
        </button>

        {/* 3. Game Pass Badge */}
        <Link
          href="/missions"
          onClick={() => playNavSound()}
          title="Xbox Game Pass"
          aria-label="Xbox Game Pass"
          className="group flex h-7 items-center justify-center rounded border border-white/30 bg-black/30 px-2 text-[10px] font-black uppercase tracking-wider text-white transition duration-150 hover:border-[#52b043] hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b043]"
        >
          <span className="leading-none text-white/90 group-hover:text-[#52b043]">GAME PASS</span>
        </Link>

        {/* 4. Search icon */}
        <button
          onClick={() => {
            playNavSound();
            onOpenSearch();
          }}
          title="Search"
          aria-label="Search games and apps"
          className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b043]"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* 5. Settings icon (with green notification dot) */}
        <Link
          href="/settings"
          onClick={() => playNavSound()}
          title="Settings"
          aria-label="Settings"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition duration-150 hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#52b043]"
        >
          <Settings className="h-[18px] w-[18px]" />
          {/* Signature green notification pip */}
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#52b043] shadow-[0_0_6px_#52b043]" />
        </Link>
      </nav>

      {/* Right: System Status & Real-time Clock */}
      <div className="flex items-center gap-3 sm:gap-4 text-white/90">
        {/* Audio Mute toggle */}
        <button
          onClick={toggleMute}
          title={muted ? "Unmute Console Audio" : "Mute Console Audio"}
          aria-label={muted ? "Unmute Console Audio" : "Mute Console Audio"}
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white"
        >
          {muted ? <MicOff className="h-4 w-4 text-rose-400" /> : <Mic className="h-4 w-4" />}
        </button>

        {/* Battery / Controller indicator */}
        <div className="flex items-center gap-1.5 text-white/75" title="Controller Connected: Battery Good">
          <Gamepad2 className="hidden h-4 w-4 sm:block" />
          <BatteryMedium className="h-4 w-4" />
        </div>

        {/* Live Xbox Digital Clock */}
        <time className="sv-num text-[13px] font-semibold tracking-tight text-white/90 drop-shadow">
          {timeStr}
        </time>
      </div>
    </header>
  );
}
