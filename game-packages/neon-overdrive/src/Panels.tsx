"use client";

import { LobbyLink, cn, formatPoints } from "@spinverse/game-sdk";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Info, Minus, Music, Plus, RotateCw, Volume2, VolumeX, X } from "lucide-react";
import { GRAND_BONUS, HOLD_TRIGGER, OVERDRIVE_AT, PAYLINES, PAYS, PAY_ORDER, SYMBOL_META, TIERS, type Tier } from "./engine";
import { SymbolArt } from "./symbols";

function RoundBtn({ label, onClick, pressed, off, children }: { label: string; onClick: () => void; pressed?: boolean; off?: boolean; children: ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} aria-pressed={pressed} title={label} className="no-btn h-[clamp(34px,5.6dvh,46px)] w-[clamp(34px,5.6dvh,46px)]">
      <span className={cn("transition-opacity", off && "opacity-40")}>{children}</span>
      {off && <span className="pointer-events-none absolute h-[2px] w-[58%] rotate-[-45deg] rounded bg-[#cfeaff]" aria-hidden />}
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

export function TopBar(p: TopBarProps) {
  return (
    <div className="relative z-30 grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 px-[clamp(8px,2vw,40px)]" style={{ height: "var(--top)" }}>
      <div>
        <LobbyLink aria-label="Back to lobby" className="no-btn h-[clamp(34px,5.6dvh,46px)] gap-2 pl-3 pr-4 text-[clamp(12px,1.9dvh,15px)] font-semibold">
          <ArrowLeft className="h-4 w-4" /> <span className="hidden min-[420px]:inline">Back to Lobby</span>
        </LobbyLink>
      </div>
      <h1 className="no-disp no-flicker whitespace-nowrap text-[clamp(1.05rem,4.4dvh,2.7rem)] leading-none" style={{ backgroundImage: "linear-gradient(180deg,#fff 20%,var(--c1) 60%,var(--c3))", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 10px var(--c1)) drop-shadow(0 0 26px var(--c3))", fontStyle: "italic" }}>
        NEON OVERDRIVE
      </h1>
      <div className="flex items-center justify-end gap-[clamp(4px,.7vw,10px)]">
        <RoundBtn label={p.favorite ? "Remove from favorites" : "Add to favorites"} pressed={p.favorite} onClick={p.onFavorite}>
          <Heart className={cn("h-[18px] w-[18px]", p.favorite && "fill-rose-400 text-rose-400")} />
        </RoundBtn>
        <RoundBtn label="Paytable and rules" onClick={p.onInfo}><Info className="h-[18px] w-[18px]" /></RoundBtn>
        <RoundBtn label={p.musicOn ? "Turn music off" : "Turn music on"} pressed={p.musicOn} off={!p.musicOn} onClick={p.onMusic}><Music className="h-[18px] w-[18px]" /></RoundBtn>
        <RoundBtn label={p.soundOn ? "Turn sound effects and voice off" : "Turn sound effects and voice on"} pressed={p.soundOn} onClick={p.onSound}>
          {p.soundOn ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" />}
        </RoundBtn>
      </div>
    </div>
  );
}

export interface DeckProps {
  balance: number;
  bet: number;
  betLocked: boolean;
  canLower: boolean;
  canRaise: boolean;
  onBet: (d: 1 | -1) => void;
  win: number;
  winLabel: string;
  spinning: boolean;
  spinDisabled: boolean;
  spinLabel: string;
  onSpin: () => void;
  broke: boolean;
  onReset: () => void;
  lamp: ReactNode;
}

export function ControlDeck(p: DeckProps) {
  return (
    <div className="relative z-20 shrink-0 px-[clamp(8px,2vw,40px)] pb-[max(8px,env(safe-area-inset-bottom))]" style={{ height: "var(--deck)" }}>
      <div className="mx-auto flex h-full max-w-[1100px] flex-col justify-end gap-[clamp(4px,1dvh,10px)]">
        <div className="min-h-[1.2em] truncate text-center" aria-live="polite">{p.lamp}</div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-[clamp(8px,2.2vw,28px)]">
          <div className="flex flex-col gap-[clamp(3px,.6dvh,6px)]">
            <div className="no-lcd flex items-baseline justify-between gap-2 px-3 py-[clamp(2px,.6dvh,6px)]">
              <span className="text-[clamp(8px,1.3dvh,11px)] tracking-widest text-[#8fa2ff]">POINTS</span>
              <span className="no-num text-[clamp(13px,2.5dvh,22px)] font-bold text-white">{formatPoints(p.balance)}</span>
            </div>
            <div className="no-lcd flex items-center justify-between gap-1 px-1.5 py-[clamp(1px,.4dvh,4px)]">
              <button className="no-btn h-[clamp(24px,4dvh,34px)] w-[clamp(24px,4dvh,34px)]" onClick={() => p.onBet(-1)} disabled={p.betLocked || !p.canLower} aria-label="Lower bet"><Minus className="h-4 w-4" /></button>
              <div className="text-center leading-none">
                <div className="text-[clamp(8px,1.3dvh,11px)] tracking-widest text-[#8fa2ff]">BET</div>
                <div className="no-num text-[clamp(13px,2.5dvh,22px)] font-bold text-[#7ff3ff]">{formatPoints(p.bet)}</div>
              </div>
              <button className="no-btn h-[clamp(24px,4dvh,34px)] w-[clamp(24px,4dvh,34px)]" onClick={() => p.onBet(1)} disabled={p.betLocked || !p.canRaise} aria-label="Raise bet"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          <button onClick={p.onSpin} disabled={p.spinDisabled} aria-label={p.spinLabel === "SPIN" ? "Spin the reels" : p.spinLabel} className={cn("no-spinbtn", p.spinning && "busy", !p.spinDisabled && "ready")}>
            <span className="ring"><i /></span>
            <span className="face">
              <RotateCw className={cn("h-[28%] w-[28%]", p.spinning && "animate-spin")} />
              <span className="no-disp text-[clamp(11px,2.3dvh,19px)] leading-none">{p.spinLabel}</span>
            </span>
          </button>

          <div className="flex flex-col gap-[clamp(3px,.6dvh,6px)]">
            <div className="no-lcd px-3 py-[clamp(3px,.9dvh,8px)] text-right">
              <div className="text-[clamp(8px,1.3dvh,11px)] tracking-widest text-[#8fa2ff]">{p.winLabel}</div>
              <div className={cn("no-num text-[clamp(15px,3.2dvh,28px)] font-black leading-none", p.win > 0 ? "text-[#ffe08a]" : "text-white/55")} style={p.win > 0 ? { textShadow: "0 0 14px rgba(255,200,80,.6)" } : undefined}>{formatPoints(p.win)}</div>
            </div>
            {p.broke ? (
              <button className="no-btn h-[clamp(24px,4dvh,34px)] text-[clamp(10px,1.6dvh,13px)] font-semibold" onClick={p.onReset}>Reset demo points</button>
            ) : (
              <p className="px-1 text-right text-[clamp(8px,1.3dvh,11px)] leading-tight text-[#7f8fd0]">Free demo points. No cash value.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- info panel --------------------------------- */
function PaylineDiagram({ line }: { line: number }) {
  const rows = PAYLINES[line];
  return (
    <svg viewBox="0 0 50 40" className="h-9 w-11 rounded border border-white/15 bg-black/40" aria-label={`Payline ${line + 1}`}>
      {Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, (_, c) => <rect key={`${r}${c}`} x={r * 10 + 1} y={c * 10 + 1} width="8" height="8" rx="1.5" fill="rgba(140,160,255,.16)" />))}
      <polyline points={rows.map((r, i) => `${i * 10 + 5},${r * 10 + 5}`).join(" ")} fill="none" stroke="#35e8ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function InfoPanel({ onClose }: { onClose: () => void }) {
  const tiers: [Tier, number][] = [["mini", 2], ["minor", 5], ["major", 12], ["grand", 40]];
  return (
    <motion.div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label="Neon Overdrive paytable and rules" className="relative flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#35e8ff]/40 bg-[#07051c]/95 shadow-[0_0_60px_rgba(53,232,255,.25)]" initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <h2 className="no-disp text-xl text-[#7ff3ff]">Paytable and rules</h2>
          <button className="no-btn h-9 w-9" onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-6 overflow-y-auto px-5 py-4 text-sm leading-relaxed text-[#c9d4ff]">
          <section>
            <h3 className="mb-2 font-semibold text-white">Symbols (pays × total bet, left to right on a payline)</h3>
            <div className="grid grid-cols-1 gap-2 min-[560px]:grid-cols-2">
              {PAY_ORDER.map((id) => (
                <div key={id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[.03] p-2">
                  <SymbolArt id={id} className="h-14 w-14 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{SYMBOL_META[id].name}{id === "reactor" && <span className="ml-2 text-xs text-[#7ff3ff]">WILD</span>}</p>
                    <p className="no-num text-xs text-[#9fb0ff]">5 × {PAYS[id][2]}  ·  4 × {PAYS[id][1]}  ·  3 × {PAYS[id][0]}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#9fb0ff]">The Arc Reactor is wild and substitutes for every pay symbol. Overdrive Cores never join a payline.</p>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">Hold &amp; Respin</h3>
            <ul className="list-disc space-y-1 pl-5">
              <li>{HOLD_TRIGGER} or more Overdrive Cores anywhere start the feature. Each core carries a demo-point value shown on its plate.</li>
              <li>Cores lock in place. Only empty slots respin. You get 3 respins, and every new core resets them to 3.</li>
              <li>Lock {OVERDRIVE_AT} cores to engage <span className="text-[#ff7de6]">OVERDRIVE</span>: the machine shifts gear and every core value doubles.</li>
              <li>Fill all 20 slots for the Grand: +{GRAND_BONUS}× your bet. When the respins end, every core discharges and the total is paid.</li>
            </ul>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              {tiers.map(([t, v]) => (
                <div key={t} className="text-center">
                  <SymbolArt id="orb" value={v} className="h-16 w-16" />
                  <p className="text-xs font-semibold" style={{ color: TIERS[t].main }}>{TIERS[t].label}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold text-white">12 paylines</h3>
            <div className="flex flex-wrap gap-2">{PAYLINES.map((_, i) => <PaylineDiagram key={i} line={i} />)}</div>
          </section>

          <section className="rounded-lg border border-[#35e8ff]/25 bg-[#35e8ff]/[.06] p-3 text-xs text-[#aebcff]">
            Neon Overdrive uses free demo points only. Points have no cash value, cannot be bought, transferred or redeemed, and outcomes in this preview are scripted for demonstration.
          </section>
        </div>
      </motion.div>
    </motion.div>
  );
}
