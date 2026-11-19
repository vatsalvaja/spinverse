"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Gauge, Heart, Info, Minus, Music, Plus, RotateCw, Repeat, Volume2, VolumeX, X } from "lucide-react";
import { cn, formatPoints } from "@/lib/utils";
import { PAY, PAYING, SIZE_BUCKETS } from "./engine";
import { SymbolArt, SYMBOL_NAME } from "./SymbolArt";

/* ------------------------------------------------------------------ top bar */
function RoundBtn({ label, onClick, pressed, off, children }: { label: string; onClick: () => void; pressed?: boolean; off?: boolean; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={pressed} title={label} className="ac-rbtn" data-on="false">
      <span className={cn("transition-opacity", off && "opacity-40")}>{children}</span>
      {off && <span className="pointer-events-none absolute h-[2px] w-[58%] rotate-[-45deg] rounded bg-[#bffcff]" aria-hidden />}
    </button>
  );
}

export function TopBar(p: { favorite: boolean; onFavorite: () => void; onInfo: () => void; musicOn: boolean; onMusic: () => void; soundOn: boolean; onSound: () => void }) {
  return (
    <div className="ac-top">
      <div>
        <Link href="/dashboard" aria-label="Back to lobby" className="ac-pill">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden min-[420px]:inline">Back to Lobby</span>
        </Link>
      </div>
      <h1 className="ac-title">Atlantis Cascade</h1>
      <div className="flex items-center justify-end gap-[clamp(4px,.7vw,10px)]">
        <RoundBtn label={p.favorite ? "Remove from favorites" : "Add to favorites"} pressed={p.favorite} onClick={p.onFavorite}>
          <Heart className={cn("h-[18px] w-[18px]", p.favorite && "fill-rose-400 text-rose-400")} />
        </RoundBtn>
        <RoundBtn label="Game info and paytable" onClick={p.onInfo}>
          <Info className="h-[18px] w-[18px]" />
        </RoundBtn>
        <RoundBtn label={p.musicOn ? "Turn music off" : "Turn music on"} pressed={p.musicOn} off={!p.musicOn} onClick={p.onMusic}>
          <Music className="h-[18px] w-[18px]" />
        </RoundBtn>
        <RoundBtn label={p.soundOn ? "Turn sound effects and voice off" : "Turn sound effects and voice on"} pressed={p.soundOn} onClick={p.onSound}>
          {p.soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
        </RoundBtn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ hud */
export interface FreeState {
  left: number;
  mult: number;
  total: number;
}

function HeartPip({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="ac-pip" data-on={on ? "1" : "0"} aria-hidden>
      <path d="M50 90 C18 66 8 46 12 32 C16 16 38 12 50 30 C62 12 84 16 88 32 C92 46 82 66 50 90Z" fill="url(#acg-heart)" stroke="#fff" strokeOpacity=".6" strokeWidth="3" />
    </svg>
  );
}

const RUNGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** The cascade multiplier and the scatter gate, as side panels on wide screens and a slim row on tall ones. */
export function Hud({ mult, scatters, free }: { mult: number; scatters: number; free: FreeState | null }) {
  const shownMult = free ? free.mult : mult;
  const label = free ? "FREE SPINS MULTIPLIER" : "TIDE MULTIPLIER";
  return (
    <>
      <aside className="ac-hud-side" aria-label="Cascade multiplier">
        <div className="ac-panel flex min-h-0 w-full flex-1 flex-col items-center p-2">
          <p className="ac-lbl text-center">{label}</p>
          <p key={shownMult} className={cn("ac-num ac-mult-pop font-extrabold leading-none text-[#ffe07a] [text-shadow:0_0_14px_rgba(255,200,70,.8)]", "text-[clamp(1.4rem,3.6cqh,2.4rem)]")}>
            x{Math.max(1, shownMult)}
          </p>
          <div className="ac-ladder w-full flex-1">
            {RUNGS.map((n) => (
              <div key={n} className="ac-rung ac-num" data-on={shownMult >= n ? (shownMult === n || (shownMult > 10 && n === 10) ? "2" : "1") : "0"}>
                x{n}
              </div>
            ))}
          </div>
        </div>
      </aside>
      <aside className="ac-hud-side" aria-label="Atlantis gate" style={{ order: 3 }}>
        <div className="ac-panel flex w-full flex-col items-center gap-2 p-3 text-center">
          <p className="ac-lbl">ATLANTIS GATE</p>
          <div className="ac-pips">
            {[0, 1, 2, 3].map((i) => (
              <HeartPip key={i} on={i < scatters} />
            ))}
          </div>
          <p className="text-[clamp(10px,1.7cqh,13px)] leading-snug text-[#9fe0e8]">{free ? `${free.left} free ${free.left === 1 ? "spin" : "spins"} left` : "4 hearts open the gate to free spins"}</p>
          {free && <p className="ac-num text-[clamp(12px,2cqh,16px)] font-bold text-[#ffe07a]">+{formatPoints(free.total)}</p>}
        </div>
      </aside>
      <div className="ac-hud-row" aria-label="Cascade multiplier and Atlantis gate">
        <div className="ac-panel flex flex-1 items-center gap-3 px-3 py-1.5">
          <div className="min-w-0">
            <p className="ac-lbl truncate">{free ? "FREE MULTIPLIER" : "TIDE MULTIPLIER"}</p>
            <p key={shownMult} className="ac-num ac-mult-pop text-[clamp(1.2rem,3.4dvh,1.8rem)] font-extrabold leading-none text-[#ffe07a] [text-shadow:0_0_12px_rgba(255,200,70,.8)]">
              x{Math.max(1, shownMult)}
            </p>
          </div>
          <div className="flex flex-1 items-end gap-[3px]" aria-hidden>
            {RUNGS.map((n) => (
              <span key={n} className="flex-1 rounded-sm transition-all duration-300" style={{ height: 6 + n * 1.6, background: shownMult >= n ? "linear-gradient(180deg,#fff6c2,#f3cf6a)" : "rgba(95,247,239,.16)", boxShadow: shownMult >= n ? "0 0 8px rgba(255,214,110,.8)" : "none" }} />
            ))}
          </div>
        </div>
        <div className="ac-panel flex items-center gap-2 px-3 py-1.5">
          <div>
            <p className="ac-lbl">{free ? `${free.left} LEFT` : "GATE"}</p>
            <div className="ac-pips mt-0.5">
              {[0, 1, 2, 3].map((i) => (
                <HeartPip key={i} on={i < scatters} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ deck */
function Led({ label, value, gold, className }: { label: string; value: ReactNode; gold?: boolean; className?: string }) {
  return (
    <div className={cn("ac-led", gold && "gold", className)}>
      <span className="l">{label}</span>
      <span className="v ac-num">{value}</span>
    </div>
  );
}

export interface DeckProps {
  lamp: ReactNode;
  balance: number;
  bet: number;
  canLower: boolean;
  canRaise: boolean;
  betLocked: boolean;
  onBet: (d: 1 | -1) => void;
  win: number;
  winLabel: string;
  freeLeft: number | null;
  spinning: boolean;
  spinDisabled: boolean;
  onSpin: () => void;
  broke: boolean;
  onReset: () => void;
  turbo: boolean;
  onTurbo: () => void;
  auto: boolean;
  onAuto: () => void;
}

export function Deck(p: DeckProps) {
  const [ripple, setRipple] = useState(0);
  return (
    <div className="ac-deck">
      {p.lamp}
      <div className="ac-deck-in">
        <div className="d-l">
          <Led className="d-bal" label="DEMO POINTS" value={formatPoints(p.balance)} />
          <Led className="d-bet" label="BET" value={formatPoints(p.bet)} gold />
          <div className="d-btns">
            <button className="ac-rbtn" onClick={() => p.onBet(-1)} disabled={p.betLocked || !p.canLower} aria-label="Lower bet">
              <Minus className="h-5 w-5" />
            </button>
            <button className="ac-rbtn" onClick={() => p.onBet(1)} disabled={p.betLocked || !p.canRaise} aria-label="Raise bet">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="d-c d-spin">
          <div className="relative">
            {ripple > 0 && <span key={ripple} className="ac-ripple" aria-hidden />}
            {p.broke ? (
              <button onClick={p.onReset} className="ac-spin" aria-label="Reset demo points">
                <span className="ring" />
                <span className="bezel" />
                <span className="well" />
                <span className="dome" />
                <span className="lab text-center text-[clamp(10px,1.9dvh,14px)] leading-tight">
                  RESET
                  <br />
                  POINTS
                </span>
              </button>
            ) : (
              <button
                onClick={p.onSpin}
                onPointerDown={() => !p.spinDisabled && setRipple((r) => r + 1)}
                disabled={p.spinDisabled}
                data-busy={p.spinning ? "1" : "0"}
                className="ac-spin"
                aria-label={p.spinning ? "Cascade in progress" : p.freeLeft !== null ? "Free spin" : "Spin"}
                aria-busy={p.spinning}
              >
                <span className="ring" />
                <span className="bezel" />
                <span className="well" />
                <span className="dome" />
                <span className="spec" />
                <span className="lab">
                  {p.spinning ? (
                    <RotateCw className="animate-spin" style={{ width: "34%", height: "34%" }} />
                  ) : p.freeLeft !== null ? (
                    <>
                      <span className="ac-num text-[clamp(1.4rem,4.6dvh,2.6rem)] leading-none">{p.freeLeft}</span>
                      <span className="text-[clamp(8px,1.5dvh,11px)]">FREE</span>
                    </>
                  ) : (
                    <>
                      <RotateCw style={{ width: "30%", height: "30%" }} />
                      <span className="text-[clamp(11px,2.2dvh,17px)]">SPIN</span>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        <div className="d-r">
          <Led className="d-win" label={p.winLabel} value={formatPoints(p.win)} gold />
          <div className="d-tools">
            <button className="ac-rbtn" data-on={p.turbo} aria-pressed={p.turbo} onClick={p.onTurbo} aria-label="Turbo spins" title="Turbo">
              <Gauge className="h-5 w-5" />
            </button>
            <button className="ac-rbtn" data-on={p.auto} aria-pressed={p.auto} onClick={p.onAuto} aria-label={p.auto ? "Stop autoplay" : "Autoplay"} title="Autoplay">
              <Repeat className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ entrance */
export function Intro({ out, onEnter }: { out: boolean; onEnter: () => void }) {
  const bubbles = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ l: (i * 47) % 100, s: 6 + ((i * 13) % 22), d: 5 + ((i * 7) % 9), dl: -((i * 3) % 9) })), []);
  const rays = [8, 24, 42, 60, 78];
  return (
    <div className="ac-intro" data-out={out ? "1" : "0"} role="dialog" aria-label="Atlantis Cascade">
      {rays.map((l, i) => (
        <span key={i} className="ray" style={{ left: `${l}%`, animationDelay: `${-i * 1.3}s`, transform: `rotate(${(i - 2) * 6}deg)` }} />
      ))}
      {bubbles.map((b, i) => (
        <span key={i} className="absolute rounded-full border border-white/50 bg-white/10" style={{ left: `${b.l}%`, bottom: "-8%", width: b.s, height: b.s, animation: `ac-ibub ${b.d}s linear ${b.dl}s infinite` }} />
      ))}
      <div className="depth" />
      <h1 className="relative px-4">Atlantis Cascade</h1>
      <p className="sub relative">EVERY WIN SENDS THE TIDE HIGHER</p>
      <div className="dive relative">
        <button className="ac-cta" onClick={onEnter} autoFocus>
          Dive in
        </button>
      </div>
      <p className="relative mt-5 text-xs text-[#6fb7c4]">Demo points only. No cash value.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ bonus + info */
export function BonusIn({ spins, onGo }: { spins: number; onGo: () => void }) {
  useEffect(() => {
    const t = setTimeout(onGo, 7500);
    return () => clearTimeout(t);
  }, [onGo]);
  return (
    <div className="ac-ovl" role="dialog" aria-label="Free spins unlocked">
      <div className="ac-wipe" />
      <div className="ac-card ac-pop-in">
        <h2>Atlantis awakens</h2>
        <p className="mt-2">The gate has opened.</p>
        <p className="big ac-num my-2">{spins} Free Spins</p>
        <p>Every cascade raises your multiplier by one. It carries from spin to spin until the last one.</p>
        <button className="ac-cta" onClick={onGo} autoFocus>
          Enter the deep
        </button>
      </div>
    </div>
  );
}

export function BonusOut({ total, spins, onGo }: { total: number; spins: number; onGo: () => void }) {
  return (
    <div className="ac-ovl" role="dialog" aria-label="Free spins complete" style={{ background: "radial-gradient(60% 50% at 50% 50%,rgba(120,40,200,.35),rgba(1,8,16,.85))" }}>
      <div className="ac-card ac-pop-in">
        <h2>Free spins complete</h2>
        <p className="big ac-num my-2">{formatPoints(total)}</p>
        <p>demo points won across {spins} free spins</p>
        <button className="ac-cta" onClick={onGo} autoFocus>
          Back to the surface
        </button>
      </div>
    </div>
  );
}

const fmtX = (n: number) => (n % 1 ? n.toFixed(1) : String(n));

export function InfoPanel({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="ac-info" role="dialog" aria-modal="true" aria-label="Atlantis Cascade paytable and rules" onClick={onClose}>
      <div className="ac-info-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="ac-title !text-[clamp(1.2rem,3.4vw,2rem)]">How Atlantis Cascade plays</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#bfeff5]">
              Land groups of <b>5 or more</b> matching symbols that touch side to side. The group is paid and vanishes, and new symbols tumble in from above. Keep winning and the cascade keeps going. Each cascade in a spin raises the multiplier: x1, x2, x3 and up to x10.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="ac-rbtn shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        <h3 className="mb-2 mt-5 text-sm tracking-[0.14em] text-[#7fc3cf]">PAYTABLE · MULTIPLES OF YOUR BET BY GROUP SIZE</h3>
        <div className="mb-2 hidden grid-cols-[1fr_repeat(5,64px)] gap-2 px-2 text-center text-xs text-[#7fc3cf] sm:grid">
          <span className="text-left">Symbol</span>
          {SIZE_BUCKETS.map((b) => (
            <span key={b}>{b}</span>
          ))}
        </div>
        <div className="grid gap-2">
          {PAYING.map((s) => (
            <div key={s} className="grid grid-cols-[52px_1fr] items-center gap-3 rounded-xl border border-[#5ff7ef]/15 bg-[#031c2c]/80 px-2 py-1.5 sm:grid-cols-[52px_1fr_repeat(5,64px)]">
              <SymbolArt id={s} className="h-[52px] w-[52px] overflow-visible" />
              <span className="text-sm text-[#d8fbff]">{SYMBOL_NAME[s]}</span>
              <span className="col-span-2 ac-num flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#ffe07a] sm:hidden">
                {PAY[s].map((v, i) => (
                  <span key={i}>
                    {SIZE_BUCKETS[i]}: x{fmtX(v)}
                  </span>
                ))}
              </span>
              {PAY[s].map((v, i) => (
                <span key={i} className="ac-num hidden text-center text-sm font-semibold text-[#ffe07a] sm:block">
                  x{fmtX(v)}
                </span>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-[#5ff7ef]/25 bg-[#031c2c]/80 p-3">
            <SymbolArt id="wild" className="h-16 w-16 shrink-0 overflow-visible" />
            <p className="text-sm leading-snug text-[#bfeff5]">
              <b className="text-[#7ffcf3]">Poseidon&rsquo;s Sigil (Wild)</b> substitutes for every paying symbol and joins any group it touches.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-[#ff5fe0]/30 bg-[#031c2c]/80 p-3">
            <SymbolArt id="scatter" className="h-16 w-16 shrink-0 overflow-visible" />
            <p className="text-sm leading-snug text-[#bfeff5]">
              <b className="text-[#ff9cf0]">Atlantis Heart (Scatter)</b> pays anywhere. Land 4 to open the gate to 8 free spins, where the multiplier carries over and keeps growing.
            </p>
          </div>
        </div>

        <h3 className="mb-2 mt-5 text-sm tracking-[0.14em] text-[#7fc3cf]">WIN LEVELS (TOTAL SPIN WIN)</h3>
        <p className="ac-num text-sm text-[#d8fbff]">Big 10x · Super 25x · Mega 50x · Jackpot 100x your bet</p>

        <p className="mt-5 rounded-xl border border-[#f3cf6a]/35 bg-[#031c2c]/80 p-3 text-xs leading-relaxed text-[#bfeff5]">
          Spinverse uses virtual demo points. They are free, cannot be bought, sold, transferred or redeemed for anything, and have no cash value. Outcomes in this demo follow a fixed script and nothing is saved to your account.
        </p>
      </div>
    </div>
  );
}
