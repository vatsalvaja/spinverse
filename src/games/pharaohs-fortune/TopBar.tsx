"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Info, Music, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { WingedSun } from "./Decor";

function RoundBtn({ label, onClick, pressed, off, children }: { label: string; onClick: () => void; pressed?: boolean; off?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="relative flex h-[clamp(34px,5.4dvh,48px)] w-[clamp(34px,5.4dvh,48px)] items-center justify-center rounded-full border border-[#d4af4f]/45 bg-gradient-to-b from-[#2a1c0a]/90 to-[#0d0804]/90 text-[#f6dc8e] shadow-[0_4px_12px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,236,170,.3)] backdrop-blur transition hover:border-[#f3cb62] hover:text-white active:translate-y-px active:scale-95"
    >
      <span className={cn("transition-opacity", off && "opacity-40")}>{children}</span>
      {off && <span className="pointer-events-none absolute h-[2px] w-[58%] rotate-[-45deg] rounded bg-[#f6dc8e]" aria-hidden />}
    </button>
  );
}

export interface TopBarProps {
  favorite: boolean;
  onFavorite: () => void;
  onInfo: () => void;
  musicOn: boolean;
  onMusic: () => void;
  soundOn: boolean;
  onSound: () => void;
}

/** Slim top rail: lobby on the left, the title in the middle, game switches on the right. */
export function TopBar(p: TopBarProps) {
  return (
    <div className="relative z-30 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-[clamp(8px,2vw,40px)]" style={{ height: "var(--top)" }}>
      <div>
        <Link href="/dashboard" aria-label="Back to lobby" className="inline-flex h-[clamp(34px,5.4dvh,48px)] items-center gap-2 rounded-full border border-[#d4af4f]/45 bg-gradient-to-b from-[#2a1c0a]/90 to-[#0d0804]/90 pl-3 pr-4 text-[clamp(12px,1.9dvh,15px)] font-semibold text-[#f6dc8e] shadow-[0_4px_12px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,236,170,.3)] backdrop-blur transition hover:border-[#f3cb62] hover:text-white active:scale-95">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden min-[420px]:inline">Back to Lobby</span>
        </Link>
      </div>

      <div className="flex items-center gap-[clamp(6px,1.4vw,22px)]">
        <WingedSun className="hidden h-[clamp(20px,4.2dvh,40px)] min-[560px]:block" />
        <h1 className="title-pharaoh whitespace-nowrap text-[clamp(1.05rem,4.6dvh,2.8rem)] leading-none">Pharaoh’s Fortune</h1>
        <WingedSun flip className="hidden h-[clamp(20px,4.2dvh,40px)] min-[560px]:block" />
      </div>

      <div className="flex items-center justify-end gap-[clamp(4px,.7vw,10px)]">
        <RoundBtn label={p.favorite ? "Remove from favorites" : "Add to favorites"} pressed={p.favorite} onClick={p.onFavorite}>
          <Heart className={cn("h-[18px] w-[18px]", p.favorite && "fill-rose-400 text-rose-400")} />
        </RoundBtn>
        <RoundBtn label="Game info" onClick={p.onInfo}><Info className="h-[18px] w-[18px]" /></RoundBtn>
        <RoundBtn label={p.musicOn ? "Turn music off" : "Turn music on"} pressed={p.musicOn} off={!p.musicOn} onClick={p.onMusic}><Music className="h-[18px] w-[18px]" /></RoundBtn>
        <RoundBtn label={p.soundOn ? "Turn sound effects and voice off" : "Turn sound effects and voice on"} pressed={p.soundOn} onClick={p.onSound}>
          {p.soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
        </RoundBtn>
      </div>
    </div>
  );
}
