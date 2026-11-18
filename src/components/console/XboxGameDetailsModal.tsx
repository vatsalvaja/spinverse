"use client";

import { X, Play, Heart, Star, Sparkles, ShieldCheck } from "lucide-react";
import { XboxGameItem } from "./xboxGames";
import { playSelectSound, playBackSound } from "./xboxSound";
import { usePlay } from "@/components/site/PlayModal";
import { useSession } from "@/lib/session";
import { GAME_BY_ID } from "@/data/games";

interface XboxGameDetailsModalProps {
  game: XboxGameItem | null;
  onClose: () => void;
}

export function XboxGameDetailsModal({ game, onClose }: XboxGameDetailsModalProps) {
  const play = usePlay();
  const { favorites, toggleFavorite } = useSession();

  if (!game) return null;

  const spinverseGame = game.spinverseId ? GAME_BY_ID[game.spinverseId] : null;
  const isFav = game.spinverseId ? favorites.includes(game.spinverseId) : false;

  const handlePlay = () => {
    playSelectSound();
    onClose();
    if (game.spinverseId) {
      play(game.spinverseId);
    } else {
      // default playable world
      play("neon-overdrive");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${game.title} Game Details`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-[#0d1017]/95 shadow-2xl">
        {/* Banner key art */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={game.wallpaper} alt={game.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1017] via-[#0d1017]/40 to-transparent" />
          <button
            onClick={() => {
              playBackSound();
              onClose();
            }}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute left-6 bottom-4 flex items-center gap-2">
            <span className="rounded bg-black/75 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white ring-1 ring-white/20">
              XBOX SERIES X|S OPTIMIZED
            </span>
            <span className="rounded bg-[#52b043]/30 px-2.5 py-1 text-[11px] font-bold text-[#52b043] ring-1 ring-[#52b043]/50">
              GAME PASS
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-white">{game.title}</h2>
              <p className="mt-0.5 text-xs text-white/60">{game.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 rounded-xl bg-[#52b043] px-6 py-2.5 text-xs font-bold text-black shadow-lg shadow-[#52b043]/20 transition hover:bg-[#62cb52] hover:scale-105 active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                Play Game
              </button>
              {game.spinverseId && (
                <button
                  onClick={() => {
                    playSelectSound();
                    toggleFavorite(game.spinverseId!);
                  }}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border transition ${
                    isFav
                      ? "border-rose-500 bg-rose-500/20 text-rose-400"
                      : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                </button>
              )}
            </div>
          </div>

          {/* Stats & Metadata badges */}
          <div className="mt-5 grid grid-cols-3 gap-2 border-y border-white/10 py-3.5 text-center">
            <div>
              <p className="text-[11px] text-white/50">Genre</p>
              <p className="mt-0.5 text-xs font-bold text-white">{game.genre}</p>
            </div>
            <div>
              <p className="text-[11px] text-white/50">Rating</p>
              <p className="mt-0.5 flex items-center justify-center gap-1 text-xs font-bold text-[#f0b84a]">
                <Star className="h-3.5 w-3.5 fill-current" />
                {spinverseGame ? spinverseGame.rating : "4.9"}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/50">Audio & Visuals</p>
              <p className="mt-0.5 text-xs font-bold text-[#52b043]">4K Ultra HD · HDR</p>
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            <p className="text-xs leading-relaxed text-white/70">
              {spinverseGame
                ? spinverseGame.description
                : `Experience ${game.title} on the Xbox Console Dashboard. Fast loading with Quick Resume, rich HDR visuals, and seamless gameplay with Xbox wireless controllers.`}
            </p>
          </div>

          {/* Features pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-white/70 border border-white/10">
              <ShieldCheck className="h-3 w-3 text-[#52b043]" /> Cloud Saves
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-white/70 border border-white/10">
              <Sparkles className="h-3 w-3 text-[#f0b84a]" /> Spatial Audio
            </span>
            <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-[11px] text-white/70 border border-white/10">
              120 FPS Capable
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
