"use client";

import Link from "next/link";
import { ArrowLeft, Music, Music2, Volume2, VolumeX } from "lucide-react";
import { AccountMenu } from "@/components/launcher/AccountMenu";

const money = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The SKYFALL mark: a swept wing over a falling arc inside a ring. Original artwork. */
export function SkyfallLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden focusable="false">
      <defs>
        <linearGradient id="sfl-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7cf0ff" />
          <stop offset="1" stopColor="#0e7fa0" />
        </linearGradient>
        <linearGradient id="sfl-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff0bd" />
          <stop offset="1" stopColor="#b8862a" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="#08142e" stroke="url(#sfl-ring)" strokeWidth="1.6" />
      <path d="M9 27 C 15 25, 22 18, 31 9" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity=".55" />
      <path d="M31 9 L 21 24 L 18 20 Z" fill="url(#sfl-gold)" />
      <path d="M31 9 L 14 15 L 18 20 Z" fill="#7cf0ff" />
      <circle cx="10" cy="29" r="1.6" fill="#22d3ee" />
    </svg>
  );
}

interface Props {
  balance: number;
  musicOn: boolean;
  soundOn: boolean;
  audioRunning: boolean;
  onMusic: () => void;
  onSound: () => void;
  onEnableAudio: () => void;
  onLogout: () => void;
  canReset: boolean;
  onReset: () => void;
}

export function Header({ balance, musicOn, soundOn, audioRunning, onMusic, onSound, onEnableAudio, onLogout, canReset, onReset }: Props) {
  const needsEnable = !audioRunning && (musicOn || soundOn);
  return (
    <header className="sf-head">
      <Link href="/dashboard" className="sf-back" aria-label="Back to lobby">
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back to Lobby</span>
      </Link>

      <div className="flex min-w-0 items-center gap-2.5">
        <SkyfallLogo className="h-8 w-8 shrink-0" />
        <span className="sf-display truncate text-[15px] font-bold tracking-[0.24em] text-white">SKYFALL</span>
        <span className="hidden rounded-full bg-[rgba(230,193,112,.12)] px-2.5 py-1 text-[11px] font-semibold text-[#e6c170] shadow-[inset_0_0_0_1px_rgba(230,193,112,.35)] md:inline">Demo</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {needsEnable && (
          <button type="button" className="sf-pill" onClick={onEnableAudio}>
            <Volume2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Enable sound</span>
            <span className="sm:hidden">Sound</span>
          </button>
        )}
        {canReset && (
          <button type="button" className="sf-back" onClick={onReset}>
            Reset credits
          </button>
        )}
        <div className="sf-bal" aria-label={`Demo credits ${money(balance)}`}>
          <span className="sf-coin" aria-hidden />
          <span className="sf-num text-[14px] font-bold tabular-nums text-[#f6e3ae]">{money(balance)}</span>
        </div>
        <button type="button" className="sf-icon" aria-pressed={musicOn} aria-label={musicOn ? "Turn music off" : "Turn music on"} title="Music" onClick={onMusic}>
          {musicOn ? <Music2 className="h-[17px] w-[17px]" /> : <Music className="h-[17px] w-[17px]" />}
        </button>
        <button type="button" className="sf-icon" aria-pressed={soundOn} aria-label={soundOn ? "Turn sound effects off" : "Turn sound effects on"} title="Sound effects" onClick={onSound}>
          {soundOn ? <Volume2 className="h-[17px] w-[17px]" /> : <VolumeX className="h-[17px] w-[17px]" />}
        </button>
        <AccountMenu onLogout={onLogout} />
      </div>
    </header>
  );
}
