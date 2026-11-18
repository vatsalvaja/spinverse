"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Play, ArrowRight } from "lucide-react";
import { XBOX_GAMES, XboxGameItem } from "./xboxGames";
import { playNavSound, playSelectSound, playBackSound } from "./xboxSound";
import { usePlay } from "@/components/site/PlayModal";

interface XboxSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectGame: (game: XboxGameItem) => void;
}

export function XboxSearchModal({ open, onClose, onSelectGame }: XboxSearchModalProps) {
  const router = useRouter();
  const play = usePlay();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      playNavSound();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        playBackSound();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return XBOX_GAMES.slice(0, 8);
    return XBOX_GAMES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.subtitle.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q)
    );
  }, [query]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search games and apps"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-[#0d1017]/95 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <Search className="h-5 w-5 text-[#52b043]" />
            <span className="text-lg font-bold text-white tracking-wide">Search Xbox Console</span>
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

        {/* Input box */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search games, apps, creators, genres..."
            className="w-full rounded-xl border border-white/20 bg-black/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/40 focus:border-[#52b043] focus:outline-none focus:ring-1 focus:ring-[#52b043]"
          />
        </div>

        {/* Results grid */}
        <div className="mt-5 max-h-[50vh] overflow-y-auto space-y-2 pr-1 sv-scroll-x">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  playSelectSound();
                  onSelectGame(item);
                  if (item.spinverseId) {
                    play(item.spinverseId);
                  }
                  onClose();
                }}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition duration-150 hover:border-[#52b043] hover:bg-white/[0.1] hover:scale-[1.01]"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black/60">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.tileImg} alt={item.title} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-[#52b043] transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-white/60">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pr-2">
                  <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white/70">
                    {item.genre}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#52b043]/20 text-[#52b043] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-3.5 w-3.5 fill-current" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-sm text-white/50">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Quick Shortcuts Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-white/10 pt-4 text-xs text-white/50">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-white/70">Quick Jumps:</span>
            <button
              onClick={() => {
                onClose();
                router.push("/games");
              }}
              className="hover:text-white hover:underline flex items-center gap-1"
            >
              All Games <ArrowRight className="h-3 w-3" />
            </button>
            <button
              onClick={() => {
                onClose();
                router.push("/wallet");
              }}
              className="hover:text-white hover:underline flex items-center gap-1"
            >
              Points Vault <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
