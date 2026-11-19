import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Play } from "lucide-react";
import { WORLD } from "@/components/art/worlds";
import type { GameId } from "@/data/types";
import { cn } from "@/lib/utils";

type Variant = "gold" | "ghost" | "outline" | "dark";

const base =
  "sv-shine relative inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[0.01em] transition duration-300 disabled:pointer-events-none disabled:opacity-50 active:scale-[.97]";
const variants: Record<Variant, string> = {
  gold: "bg-gradient-to-b from-[#f9e6a8] via-[#e3b951] to-[#b98524] text-[#2a1805] shadow-[0_0_0_1px_rgba(255,236,170,.5)_inset,0_10px_30px_-8px_rgba(226,185,80,.55)] hover:shadow-[0_0_0_1px_rgba(255,236,170,.7)_inset,0_14px_44px_-6px_rgba(226,185,80,.75)]",
  ghost: "text-obsidian-200 hover:bg-white/[0.07] hover:text-white",
  outline: "border border-gold-300/40 bg-white/[0.02] text-gold-100 backdrop-blur hover:border-gold-200/80 hover:bg-gold-300/10",
  dark: "border border-white/10 bg-white/[0.06] text-white backdrop-blur hover:bg-white/[0.12]",
};
const sizes = { sm: "h-9 px-4 text-[13px]", md: "h-11 px-6 text-sm", lg: "h-[52px] px-8 text-[15px]" };

interface Common {
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
}

export function Btn({ variant = "gold", size = "md", className, children, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
}

export function BtnLink({ href, variant = "gold", size = "md", className, children }: Common & { href: string }) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}

/** The signature call to action: a chamfered, world-tinted button. */
export function PlayButton({ gameId, children = "Play now", className, size = "lg", ...rest }: { gameId?: GameId; children?: ReactNode; className?: string; size?: "md" | "lg" } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const w = gameId ? WORLD[gameId] : null;
  return (
    <button
      {...rest}
      className={cn("group/play relative inline-flex items-center gap-3 font-display font-bold uppercase tracking-[0.12em] transition duration-300 active:scale-[.97]", size === "lg" ? "h-[58px] pl-3 pr-8 text-[13px]" : "h-11 pl-2.5 pr-6 text-xs", className)}
      style={{ filter: `drop-shadow(0 10px 28px ${w?.glow ?? "rgba(226,185,80,.5)"})` }}
    >
      <span
        className="sv-shine sv-chamfer absolute inset-0"
        style={{ background: w ? `linear-gradient(135deg, ${w.primary}, ${w.secondary})` : "linear-gradient(135deg,#f9e6a8,#e3b951 55%,#b98524)" }}
      />
      <span className={cn("relative flex items-center justify-center rounded-full bg-black/80 text-white transition group-hover/play:scale-110", size === "lg" ? "h-10 w-10" : "h-8 w-8")}>
        <Play className="h-4 w-4 translate-x-px fill-current" />
      </span>
      <span className="relative" style={{ color: w?.ctaText ?? "#2a1805" }}>{children}</span>
    </button>
  );
}

export function SectionHeader({ title, subtitle, action, className, kicker }: { title: string; subtitle?: string; action?: ReactNode; className?: string; kicker?: string }) {
  return (
    <div className={cn("mb-7 flex items-end justify-between gap-6", className)}>
      <div className="min-w-0">
        {kicker && <p className="sv-serif mb-1 text-xl text-gold-300">{kicker}</p>}
        <h2 className="sv-display text-balance text-[1.6rem] font-semibold leading-[1.05] text-white sm:text-[2.2rem]">{title}</h2>
        {subtitle && <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-obsidian-200">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Page header inside the launcher: a compact title row, no hero artwork. (`world` and `kicker` are accepted for older callers.) */
export function PageBanner({ title, subtitle, children, className }: { title: string; kicker?: string; subtitle?: string; world?: GameId; children?: ReactNode; className?: string }) {
  return (
    <header className={cn("lx-pagehead mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-5 pb-7 pt-5 sm:px-8 sm:pt-7 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="min-w-0">
        <h1 className="sv-display text-[clamp(1.4rem,2.6vw,1.9rem)] font-bold leading-tight text-white">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-obsidian-200">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function Wrap({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1320px] px-5 sm:px-8", className)}>{children}</div>;
}

export function PageTitle({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="sv-display sv-silver-text text-4xl font-bold leading-none sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-xl text-[15px] text-obsidian-200">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

export function Chip({ children, tone = "gold", className }: { children: ReactNode; tone?: "gold" | "neutral" | "teal" | "rose"; className?: string }) {
  const tones = {
    gold: "bg-gold-300/10 text-gold-100 ring-gold-300/30",
    neutral: "bg-white/[0.07] text-obsidian-100 ring-white/12",
    teal: "bg-lagoon/15 text-teal-100 ring-lagoon/35",
    rose: "bg-rose-500/15 text-rose-100 ring-rose-400/30",
  };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ring-1 backdrop-blur", tones[tone], className)}>{children}</span>;
}

/** Segmented, glowing progress meter. */
export function ProgressBar({ value, max, className, color }: { value: number; max: number; className?: string; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.09]", className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${pct}%`, background: color ? `linear-gradient(90deg, ${color}, #fff)` : "linear-gradient(90deg,#b98524,#f9e6a8)", boxShadow: `0 0 12px ${color ?? "rgba(240,200,100,.7)"}` }} />
    </div>
  );
}

export function PointsAmount({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("sv-num", className)}>
      {value.toLocaleString("en-US")} <span className="text-[0.7em] font-semibold uppercase tracking-wider opacity-60">pts</span>
    </span>
  );
}
