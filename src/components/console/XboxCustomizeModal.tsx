"use client";

import { useState, useEffect } from "react";
import { X, Check, Volume2, VolumeX, Palette, Sparkles, Monitor } from "lucide-react";
import { XBOX_GAMES, XboxGameItem } from "./xboxGames";
import { isAudioMuted, setAudioMuted, playNavSound, playSelectSound, playBackSound } from "./xboxSound";
import { useSession } from "@/lib/session";

interface XboxCustomizeModalProps {
  open: boolean;
  onClose: () => void;
  selectedWallpaper: string;
  onSelectWallpaper: (wp: string) => void;
  accentColor: string;
  onSelectAccent: (accent: string) => void;
}

const ACCENT_COLORS = [
  { name: "Xbox Green", color: "#52b043" },
  { name: "Pharaoh Gold", color: "#f0b84a" },
  { name: "Atlantis Cyan", color: "#4fe3d4" },
  { name: "Cyberpunk Pink", color: "#ff4fd8" },
  { name: "Hellfire Red", color: "#ef4444" },
  { name: "Electric Blue", color: "#3b82f6" },
];

export function XboxCustomizeModal({
  open,
  onClose,
  selectedWallpaper,
  onSelectWallpaper,
  accentColor,
  onSelectAccent,
}: XboxCustomizeModalProps) {
  const { player, signIn } = useSession();
  const [muted, setMuted] = useState(false);
  const [tag, setTag] = useState(player?.username || player?.name || "NewSasquatch");
  const [tab, setTab] = useState<"wallpaper" | "theme" | "profile">("wallpaper");

  useEffect(() => {
    if (open) {
      setMuted(isAudioMuted());
      setTag(player?.username || player?.name || "NewSasquatch");
      playNavSound();
    }
  }, [open, player]);

  const toggleSound = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
    if (!next) playSelectSound();
  };

  const handleSaveGamertag = () => {
    if (tag.trim()) {
      signIn({ username: tag.trim(), name: tag.trim() });
      playSelectSound();
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize your Home"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-white/20 bg-[#0d1017]/95 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
            >
              <Monitor className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">Customize your Home</h2>
              <p className="text-xs text-white/60">Personalize your Xbox Console dashboard theme and artwork</p>
            </div>
          </div>
          <button
            onClick={() => {
              playBackSound();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-5 flex gap-2 border-b border-white/10 pb-2">
          <button
            onClick={() => {
              playNavSound();
              setTab("wallpaper");
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === "wallpaper" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Background Art
          </button>
          <button
            onClick={() => {
              playNavSound();
              setTab("theme");
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === "theme" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            Accent Colors & Sound
          </button>
          <button
            onClick={() => {
              playNavSound();
              setTab("profile");
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              tab === "profile" ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
            }`}
          >
            Gamertag
          </button>
        </div>

        {/* Content Tab 1: Wallpapers */}
        {tab === "wallpaper" && (
          <div className="mt-4">
            <p className="text-xs text-white/60 mb-3">
              Choose your primary dashboard backdrop. Focused games will preview their own art dynamically:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[46vh] overflow-y-auto pr-1 sv-scroll-x">
              {XBOX_GAMES.map((game) => {
                const isSelected = selectedWallpaper === game.wallpaper;
                return (
                  <button
                    key={game.id}
                    onClick={() => {
                      playSelectSound();
                      onSelectWallpaper(game.wallpaper);
                    }}
                    className={`group relative overflow-hidden rounded-xl border text-left transition duration-200 ${
                      isSelected
                        ? "border-[#52b043] ring-2 ring-[#52b043] scale-[1.02]"
                        : "border-white/15 hover:border-white/40 hover:scale-[1.01]"
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-black/60 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={game.wallpaper}
                        alt={game.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#52b043] text-black">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div className="bg-[#12151c] p-2">
                      <p className="text-xs font-bold text-white truncate">{game.title}</p>
                      <p className="text-[10px] text-white/50 truncate">{game.genre}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Tab 2: Theme & Audio */}
        {tab === "theme" && (
          <div className="mt-4 space-y-6">
            <div>
              <p className="text-xs font-bold text-white mb-2">Xbox Accent Glow Color</p>
              <div className="flex flex-wrap gap-3">
                {ACCENT_COLORS.map((item) => (
                  <button
                    key={item.color}
                    onClick={() => {
                      playSelectSound();
                      onSelectAccent(item.color);
                    }}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                      accentColor === item.color
                        ? "border-white bg-white/20 text-white"
                        : "border-white/10 bg-white/[0.04] text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/40"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs font-bold text-white mb-2">Console Audio Effects</p>
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                    {muted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-[#52b043]" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Dashboard Navigation Chimes</p>
                    <p className="text-[11px] text-white/60">Tactile audio feedback on tile hover and game selection</p>
                  </div>
                </div>
                <button
                  onClick={toggleSound}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    !muted ? "bg-[#52b043] text-black" : "bg-white/10 text-white"
                  }`}
                >
                  {!muted ? "Enabled" : "Muted"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Tab 3: Gamertag */}
        {tab === "profile" && (
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="gamertag-input" className="block text-xs font-bold text-white mb-1">
                Gamertag
              </label>
              <div className="flex gap-2">
                <input
                  id="gamertag-input"
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Enter custom Gamertag"
                  className="w-full rounded-xl border border-white/20 bg-black/50 px-4 py-2.5 text-sm text-white focus:border-[#52b043] focus:outline-none focus:ring-1 focus:ring-[#52b043]"
                />
                <button
                  onClick={handleSaveGamertag}
                  className="shrink-0 rounded-xl bg-[#52b043] px-4 py-2.5 text-xs font-bold text-black transition hover:bg-[#62cb52]"
                >
                  Save
                </button>
              </div>
              <p className="mt-1 text-[11px] text-white/50">
                This updates your gamertag shown on the top-left badge and in player leaderboards.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
          <button
            onClick={() => {
              playSelectSound();
              onClose();
            }}
            className="rounded-xl bg-[#52b043] px-6 py-2 text-xs font-bold text-black transition hover:bg-[#62cb52]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
