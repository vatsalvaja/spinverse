import { useState, type ReactNode } from "react";
import { Minus, Plus, RotateCw } from "lucide-react";
import { cn, formatPoints } from "@spinverse/game-sdk";
import { SymbolArt } from "./SymbolArt";

/** A lit readout in a recessed window, like the amber displays on a real cabinet. */
function Led({ label, value, tone = "amber", big = false }: { label: string; value: ReactNode; tone?: "amber" | "teal"; big?: boolean }) {
  return (
    <div className="min-w-0 flex-1 rounded-[clamp(8px,1.4dvh,14px)] bg-[#0b0603] px-[clamp(8px,1.2vw,18px)] py-[clamp(3px,.8dvh,10px)] shadow-[inset_0_3px_8px_rgba(0,0,0,.95),0_1px_0_rgba(255,214,110,.35)] ring-1 ring-[#3a2406]">
      <p className="truncate text-[clamp(9px,1.35dvh,12px)] font-semibold tracking-[0.12em] text-[#b89a5a]">{label}</p>
      <p className={cn("sv-num truncate font-bold leading-none", tone === "amber" ? "text-[#ffd46a] [text-shadow:0_0_12px_rgba(255,190,60,.75)]" : "text-[#8ff7ea] [text-shadow:0_0_12px_rgba(60,230,210,.75)]", big ? "text-[clamp(1.3rem,4.2dvh,2.6rem)]" : "text-[clamp(1.05rem,3.2dvh,2rem)]")}>{value}</p>
    </div>
  );
}

function StepButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group relative flex h-[clamp(34px,6dvh,52px)] w-[clamp(34px,6dvh,52px)] items-center justify-center rounded-full bg-[conic-gradient(from_200deg,#fff1b8,#8a5a12,#e8bf55,#6b4310,#fff1b8)] shadow-[0_4px_10px_rgba(0,0,0,.7)] transition active:translate-y-[2px] active:shadow-[0_1px_3px_rgba(0,0,0,.7)] disabled:opacity-35"
    >
      <span className="absolute inset-[3px] rounded-full bg-gradient-to-b from-[#3a2810] to-[#120a04] shadow-[inset_0_1px_1px_rgba(255,236,170,.5)] transition group-hover:from-[#4d3514] group-enabled:group-active:from-[#120a04]" />
      <span className="relative text-[#ffd46a] [filter:drop-shadow(0_0_4px_rgba(255,190,60,.8))]">{children}</span>
    </button>
  );
}

function SpinButton({ onClick, disabled, spinning, free }: { onClick: () => void; disabled: boolean; spinning: boolean; free: boolean }) {
  const [ripple, setRipple] = useState(0);
  return (
    <div className="relative shrink-0" style={{ width: "var(--spin)", height: "var(--spin)" }}>
      {ripple > 0 && <span key={ripple} className="pf-ripple pointer-events-none absolute inset-0 rounded-full border-2 border-[#ffe9a0]" aria-hidden />}
      <button
        onClick={onClick}
        onPointerDown={() => !disabled && setRipple((r) => r + 1)}
        disabled={disabled}
        aria-label={spinning ? "Reels spinning" : free ? "Free spin" : "Spin"}
        aria-busy={spinning}
        className="group relative block h-full w-full rounded-full outline-offset-[6px] transition duration-150 enabled:hover:scale-[1.04] enabled:active:translate-y-[3px] enabled:active:scale-[.96] disabled:cursor-not-allowed"
      >
        {/* light ring */}
        <span className={cn("absolute inset-[-7%] rounded-full opacity-90 [background:conic-gradient(from_0deg,transparent,rgba(255,226,140,.9),transparent_30%,transparent_55%,rgba(255,226,140,.6),transparent_80%)] [mask-image:radial-gradient(circle,transparent_62%,black_64%,black_70%,transparent_72%)]", spinning ? "animate-[spin_.9s_linear_infinite]" : disabled ? "opacity-0" : "animate-[spin_7s_linear_infinite]")} aria-hidden />
        {/* metal bezel */}
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_20deg,#fff6d2,#b57b1d,#fff1b8,#6b4310,#e8bf55,#8a5a12,#fff6d2)] shadow-[0_14px_30px_-4px_rgba(0,0,0,.85),0_0_0_2px_rgba(60,35,8,.9)]" aria-hidden />
        <span className="absolute inset-[7%] rounded-full bg-[#120a04] shadow-[inset_0_4px_10px_rgba(0,0,0,.95)]" aria-hidden />
        {/* dome */}
        <span
          className={cn("absolute inset-[12%] rounded-full transition-all duration-300", disabled ? "bg-[radial-gradient(circle_at_35%_28%,#8a7440,#4a3a18_60%,#241a08)]" : "pf-spin-ready bg-[radial-gradient(circle_at_35%_28%,#fffbe0,#f6cf62_32%,#c0892a_66%,#7a4d10)] group-hover:brightness-110")}
          aria-hidden
        />
        <span className="pointer-events-none absolute left-[24%] top-[17%] h-[22%] w-[34%] rotate-[-24deg] rounded-full bg-white/50 blur-[3px]" aria-hidden />
        <span className="relative flex h-full w-full flex-col items-center justify-center text-[#2a1805]">
          {spinning ? (
            <RotateCw className="animate-spin" style={{ width: "34%", height: "34%" }} />
          ) : (
            <>
              <span className="sv-display font-bold tracking-[0.14em] [text-shadow:0_1px_0_rgba(255,246,210,.7)]" style={{ fontSize: "calc(var(--spin) * 0.2)" }}>{free ? "FREE" : "SPIN"}</span>
              {free && <span className="font-semibold" style={{ fontSize: "calc(var(--spin) * 0.11)" }}>spin</span>}
            </>
          )}
        </span>
      </button>
    </div>
  );
}

export interface ControlDeckProps {
  balance: number;
  bet: number;
  betLocked: boolean;
  canLower: boolean;
  canRaise: boolean;
  onBet: (delta: 1 | -1) => void;
  win: number;
  winLabel: string;
  freeSpins: number;
  spinning: boolean;
  spinDisabled: boolean;
  onSpin: () => void;
  broke: boolean;
  onReset: () => void;
  lamp: ReactNode;
}

/**
 * The control deck: a bronze base that runs along the bottom of the screen and is part of the machine.
 * SPIN sits bottom-left with the bet controls beside it; readouts and rules sit to the right.
 */
export function ControlDeck(p: ControlDeckProps) {
  const free = p.freeSpins > 0;
  return (
    <div className="relative z-20 shrink-0" style={{ height: "var(--deck)" }}>
      <div className="absolute inset-0 border-t-[3px] border-[#e8bf55] bg-[linear-gradient(180deg,#3a2810_0%,#1d1308_28%,#0d0804_100%)] shadow-[0_-24px_50px_rgba(0,0,0,.75),inset_0_2px_0_rgba(255,236,170,.5)]">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background:repeating-linear-gradient(135deg,transparent_0_9px,rgba(0,0,0,.45)_9px_10px)]" aria-hidden />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/[0.07] to-transparent" aria-hidden />
      </div>

      <div className="relative mx-auto flex h-full max-w-[2200px] items-center gap-[clamp(10px,2vw,36px)] px-[clamp(10px,2.4vw,48px)] portrait:grid portrait:grid-cols-[auto_1fr] portrait:grid-rows-[auto_1fr] portrait:gap-x-3 portrait:gap-y-2 portrait:px-3 portrait:py-2">
        <div className="portrait:row-span-2">
          <SpinButton onClick={p.onSpin} disabled={p.spinDisabled} spinning={p.spinning} free={free} />
        </div>

        <div className="flex items-center gap-[clamp(8px,1vw,18px)] rounded-[clamp(12px,2dvh,22px)] bg-black/35 p-[clamp(6px,1dvh,12px)] ring-1 ring-[#6b4310]/60">
          <StepButton label="Lower bet" onClick={() => p.onBet(-1)} disabled={p.betLocked || !p.canLower}><Minus className="h-[55%] w-[55%]" strokeWidth={3} /></StepButton>
          <div className="w-[clamp(84px,11vw,190px)]">
            <Led label={p.betLocked && free ? "BET (LOCKED)" : "BET PER SPIN"} value={formatPoints(p.bet)} big />
          </div>
          <StepButton label="Raise bet" onClick={() => p.onBet(1)} disabled={p.betLocked || !p.canRaise}><Plus className="h-[55%] w-[55%]" strokeWidth={3} /></StepButton>
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[clamp(4px,.9dvh,10px)] portrait:col-start-2">
          <div className="flex min-h-[clamp(18px,3.2dvh,30px)] items-center justify-center rounded-full bg-[#0a0604]/90 px-4 text-center shadow-[inset_0_1px_6px_rgba(0,0,0,.9),0_0_0_1px_rgba(255,214,110,.3)]" role="status" aria-live="polite">
            {p.lamp}
          </div>
          <div className="flex gap-[clamp(6px,1vw,16px)]">
            <Led label="DEMO POINTS" value={formatPoints(p.balance)} />
            {free ? <Led label="FREE SPINS LEFT" value={p.freeSpins} tone="teal" /> : <Led label={p.winLabel} value={p.win > 0 ? `+${formatPoints(p.win)}` : "0"} />}
            {p.broke && (
              <button onClick={p.onReset} className="shrink-0 self-stretch rounded-[clamp(8px,1.4dvh,14px)] border border-[#e8bf55]/60 bg-[#e8bf55]/10 px-3 text-[11px] font-semibold text-[#ffe08a] transition hover:bg-[#e8bf55]/25">Reset demo points</button>
            )}
          </div>
        </div>

        <ul className="hidden w-[clamp(190px,20vw,330px)] shrink-0 flex-col gap-[clamp(4px,.8dvh,8px)] text-[clamp(10px,1.45dvh,13px)] text-obsidian-100 min-[900px]:flex portrait:hidden">
          <li className="flex items-center gap-2 rounded-full border border-[#7ff5e6]/35 bg-black/50 py-[3px] pl-1.5 pr-3">
            <SymbolArt id="scarab" className="h-[clamp(20px,3.6dvh,34px)] w-[clamp(20px,3.6dvh,34px)] shrink-0" />
            <span className="leading-tight"><b className="text-white">Scatter</b> · 3+ Scarabs open free spins</span>
          </li>
          <li className="flex items-center gap-2 rounded-full border border-[#f3cb62]/35 bg-black/50 py-[3px] pl-1.5 pr-3">
            <SymbolArt id="pharaoh" className="h-[clamp(20px,3.6dvh,34px)] w-[clamp(20px,3.6dvh,34px)] shrink-0" />
            <span className="leading-tight"><b className="text-white">Wild</b> · Pharaoh substitutes</span>
          </li>
          <li className="px-2 text-[clamp(9px,1.25dvh,11px)] text-[#9a8458]">Demo points only. No cash value. Space to spin.</li>
        </ul>
      </div>
    </div>
  );
}
