"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Play, Sparkles } from "lucide-react";
import { XboxTopBar } from "./XboxTopBar";
import { XBOX_GAMES, XboxGameItem } from "./xboxGames";
import { XboxSearchModal } from "./XboxSearchModal";
import { XboxCustomizeModal } from "./XboxCustomizeModal";
import { XboxGameDetailsModal } from "./XboxGameDetailsModal";
import { playNavSound, playSelectSound } from "./xboxSound";
import { usePlay } from "@/components/site/PlayModal";

interface XboxDashboardProps {
  onOpenUniverseMenu?: () => void;
}

export function XboxDashboard({ onOpenUniverseMenu }: XboxDashboardProps) {
  const router = useRouter();
  const play = usePlay();

  // Active game index among our exactly 3 finalized launch games:
  // 0: Pharaoh's Fortune, 1: Atlantis Cascade, 2: Neon Overdrive
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [currentWallpaper, setCurrentWallpaper] = useState<string>(XBOX_GAMES[0].wallpaper);
  const [accentColor, setAccentColor] = useState<string>("#52b043");

  // Modals state
  const [searchOpen, setSearchOpen] = useState(false);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [detailsGame, setDetailsGame] = useState<XboxGameItem | null>(null);

  // Focus zone: "games" (the 3 hero cards) | "cards" (bottom 4 utility banners)
  const [focusZone, setFocusZone] = useState<"games" | "cards">("games");
  const [cardIndex, setCardIndex] = useState<number>(0);

  const shelfContainerRef = useRef<HTMLDivElement>(null);

  const activeGame = XBOX_GAMES[selectedIndex] || XBOX_GAMES[0];

  // Switch selected game and update full-bleed wallpaper
  const selectGameIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= XBOX_GAMES.length) return;
    setSelectedIndex(idx);
    setCurrentWallpaper(XBOX_GAMES[idx].wallpaper);
    playNavSound();

    if (shelfContainerRef.current) {
      const tileEl = shelfContainerRef.current.children[idx] as HTMLElement | undefined;
      tileEl?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, []);

  // Keyboard and gamepad navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        searchOpen ||
        customizerOpen ||
        detailsGame
      ) {
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (focusZone === "games") {
          selectGameIndex((selectedIndex + 1) % XBOX_GAMES.length);
        } else {
          setCardIndex((c) => Math.min(3, c + 1));
          playNavSound();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (focusZone === "games") {
          selectGameIndex((selectedIndex - 1 + XBOX_GAMES.length) % XBOX_GAMES.length);
        } else {
          setCardIndex((c) => Math.max(0, c - 1));
          playNavSound();
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (focusZone === "games") {
          setFocusZone("cards");
          playNavSound();
        }
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (focusZone === "cards") {
          setFocusZone("games");
          playNavSound();
        }
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (focusZone === "games") {
          handleLaunchGame(activeGame);
        } else {
          handleBottomCardAction(cardIndex);
        }
      } else if (e.key.toLowerCase() === "x") {
        e.preventDefault();
        playSelectSound();
        setDetailsGame(activeGame);
      } else if (e.key.toLowerCase() === "y") {
        e.preventDefault();
        playSelectSound();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, focusZone, cardIndex, activeGame, searchOpen, customizerOpen, detailsGame, selectGameIndex]);

  const handleLaunchGame = (game: XboxGameItem) => {
    playSelectSound();
    play(game.spinverseId);
  };

  const handleBottomCardAction = (idx: number) => {
    playSelectSound();
    switch (idx) {
      case 0: // Explore All 3 Worlds
        router.push("/games");
        break;
      case 1: // Customize Console
        setCustomizerOpen(true);
        break;
      case 2: // Featured Game (Neon Overdrive)
        const neon = XBOX_GAMES.find((g) => g.id === "neon-overdrive") || activeGame;
        setDetailsGame(neon);
        break;
      case 3: // Points Vault
        router.push("/wallet");
        break;
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#050608] font-sans select-none">
      {/* 1. Full-Bleed Dynamic Cinematic Wallpaper */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentWallpaper}
          src={currentWallpaper}
          alt=""
          className="h-full w-full object-cover transition-all duration-700 ease-out scale-100 animate-in fade-in zoom-in-95"
        />

        {/* Ambient atmospheric glow keyed to the active game's accent color */}
        <div
          className="absolute inset-0 transition-opacity duration-1000 opacity-40 mix-blend-screen"
          style={{
            background: `radial-gradient(circle at 50% 35%, ${activeGame.accent}45 0%, transparent 68%)`,
          }}
        />

        {/* Console gradients for contrast */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#050608]/55 to-transparent to-75%" />
        <div className="sv-vignette absolute inset-0 opacity-70" />
      </div>

      {/* 2. Xbox Top Bar */}
      <XboxTopBar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenApps={() => {
          if (onOpenUniverseMenu) onOpenUniverseMenu();
          else router.push("/games");
        }}
        onOpenCustomizer={() => setCustomizerOpen(true)}
      />

      {/* 3. Main Console Stage */}
      <main className="relative z-10 flex min-h-screen flex-col justify-end px-4 pb-8 sm:px-8 lg:px-12 pt-20">
        {/* Open hero space - background wallpaper stays simple, clean & unobstructed */}
        <div className="flex-1 min-h-[140px] sm:min-h-[220px]" />

        {/* MIDDLE SHELF: Dynamic Horizontal Game Selection */}
        <section aria-label="Game selection" className="w-full max-w-[1280px] mx-auto">
              <div
                tabIndex={0}
                role="region"
                aria-label="Recent games carousel"
                className="w-full overflow-x-auto pb-3 pt-1 sv-scroll-x scroll-smooth focus:outline-none"
              >
                <div
                  ref={shelfContainerRef}
                  className="flex items-center gap-3 sm:gap-4 w-max mx-auto px-4"
                >
                  {XBOX_GAMES.map((game, i) => {
                    const isSelected = selectedIndex === i;

                    return (
                      <div
                        key={game.id}
                        onClick={() => {
                          setFocusZone("games");
                          if (selectedIndex === i) {
                            handleLaunchGame(game);
                          } else {
                            selectGameIndex(i);
                          }
                        }}
                        onMouseEnter={() => {
                          if (selectedIndex !== i) {
                            selectGameIndex(i);
                          }
                        }}
                        className={`group relative shrink-0 cursor-pointer transition-all duration-300 ease-out ${isSelected
                            ? "scale-[1.04] sm:scale-[1.06] -translate-y-1 z-20"
                            : "scale-100 hover:scale-[1.02] opacity-80 hover:opacity-100 z-10"
                          }`}
                        style={{
                          width: isSelected ? "clamp(102px, 11vw, 128px)" : "clamp(82px, 8.8vw, 102px)",
                        }}
                      >
                        {/* Tile Card Frame */}
                        <div
                          className={`relative aspect-square w-full overflow-hidden rounded-lg sm:rounded-xl bg-black/80 transition-all duration-300 ${isSelected
                              ? "ring-[3px] ring-[#52b043] shadow-[0_0_24px_rgba(82,176,67,0.7)]"
                              : "ring-1 ring-white/15 hover:ring-white/40"
                            }`}
                          style={
                            isSelected && accentColor !== "#52b043"
                              ? {
                                boxShadow: `0 0 24px ${accentColor}90`,
                                borderColor: accentColor,
                              }
                              : undefined
                          }
                        >
                          {/* Game cover artwork */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={game.tileImg}
                            alt={game.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Quick play overlay on hover if active */}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur text-white shadow-lg">
                                <Play className="h-5 w-5 fill-current ml-0.5" />
                              </div>
                            </div>
                          )}

                          {/* Game title: inside game box with low opacity and light color, shown only on hover */}
                          <div className="pointer-events-none absolute inset-x-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="rounded-md bg-black/45 backdrop-blur-md px-2 py-1 text-center border border-white/10 shadow-sm">
                              <p className="truncate text-[10.5px] sm:text-[11.5px] font-medium text-white/85">
                                {game.title}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
        </section>

        {/* BOTTOM SHELF: 4 Featured Cards (Small-Medium Proportions) */}
        <section aria-label="Console shortcuts" className="mt-4 sm:mt-5 w-full max-w-[820px] mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
            {/* Card 1: Explore Games (Browse our 3 worlds) */}
            <div
              onClick={() => handleBottomCardAction(0)}
              onMouseEnter={() => {
                setFocusZone("cards");
                setCardIndex(0);
                playNavSound();
              }}
              className={`group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl border bg-black/60 transition-all duration-300 ${focusZone === "cards" && cardIndex === 0
                  ? "ring-2 ring-[#52b043] border-[#52b043] shadow-[0_0_16px_rgba(82,176,67,0.5)] scale-[1.02]"
                  : "border-white/15 hover:border-white/40 hover:scale-[1.01]"
                }`}
            >
              <div className="relative aspect-[16/8.5] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/art/xbox/card-browse.webp"
                  alt="Browse all 3 worlds"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-2.5 bottom-2">
                  <p className="text-[11px] sm:text-xs font-bold text-white drop-shadow truncate">Explore 3 Worlds</p>
                </div>
              </div>
            </div>

            {/* Card 2: Customize your Home */}
            <div
              onClick={() => handleBottomCardAction(1)}
              onMouseEnter={() => {
                setFocusZone("cards");
                setCardIndex(1);
                playNavSound();
              }}
              className={`group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl border bg-black/60 transition-all duration-300 ${focusZone === "cards" && cardIndex === 1
                  ? "ring-2 ring-[#52b043] border-[#52b043] shadow-[0_0_16px_rgba(82,176,67,0.5)] scale-[1.02]"
                  : "border-white/15 hover:border-white/40 hover:scale-[1.01]"
                }`}
            >
              <div className="relative aspect-[16/8.5] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/art/xbox/card-customize.webp"
                  alt="Customize your Home"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-2.5 bottom-2">
                  <p className="text-[11px] sm:text-xs font-bold text-white drop-shadow truncate">Customize Home</p>
                </div>
              </div>
            </div>

            {/* Card 3: Featured Game Spotlight (Neon Overdrive) */}
            <div
              onClick={() => handleBottomCardAction(2)}
              onMouseEnter={() => {
                setFocusZone("cards");
                setCardIndex(2);
                playNavSound();
              }}
              className={`group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl border bg-black/60 transition-all duration-300 ${focusZone === "cards" && cardIndex === 2
                  ? "ring-2 ring-[#52b043] border-[#52b043] shadow-[0_0_16px_rgba(82,176,67,0.5)] scale-[1.02]"
                  : "border-white/15 hover:border-white/40 hover:scale-[1.01]"
                }`}
            >
              <div className="relative aspect-[16/8.5] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/art/xbox/card-forza.webp"
                  alt="Featured: Neon Overdrive"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute left-2 top-2">
                  <span className="rounded bg-black/80 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white ring-1 ring-white/20">
                    GAME PASS
                  </span>
                </div>
                <div className="absolute inset-x-2.5 bottom-2">
                  <p className="text-[11px] sm:text-xs font-bold text-white drop-shadow truncate">Neon Overdrive</p>
                </div>
              </div>
            </div>

            {/* Card 4: Play like a Pro (The Points Vault) */}
            <div
              onClick={() => handleBottomCardAction(3)}
              onMouseEnter={() => {
                setFocusZone("cards");
                setCardIndex(3);
                playNavSound();
              }}
              className={`group relative cursor-pointer overflow-hidden rounded-lg sm:rounded-xl border bg-black/60 transition-all duration-300 ${focusZone === "cards" && cardIndex === 3
                  ? "ring-2 ring-[#52b043] border-[#52b043] shadow-[0_0_16px_rgba(82,176,67,0.5)] scale-[1.02]"
                  : "border-white/15 hover:border-white/40 hover:scale-[1.01]"
                }`}
            >
              <div className="relative aspect-[16/8.5] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/art/xbox/card-pro.webp"
                  alt="Play like a Pro · Vault"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-x-2.5 bottom-2">
                  <p className="text-[11px] sm:text-xs font-bold text-white drop-shadow truncate">Vault Perks</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <XboxSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectGame={(game) => {
          const idx = XBOX_GAMES.findIndex((g) => g.id === game.id);
          if (idx >= 0) selectGameIndex(idx);
        }}
      />

      <XboxCustomizeModal
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        selectedWallpaper={currentWallpaper}
        onSelectWallpaper={(wp) => setCurrentWallpaper(wp)}
        accentColor={accentColor}
        onSelectAccent={(color) => setAccentColor(color)}
      />

      <XboxGameDetailsModal
        game={detailsGame}
        onClose={() => setDetailsGame(null)}
      />
    </div>
  );
}
