import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import { GAME_BY_ID } from "@/data/games";
import type { GameId } from "@/data/types";

/** Immersive full-bleed frame shared by every authentication screen. Each screen lives in a different world. */
export function AuthFrame({ title, subtitle, children, footer, world = "pharaohs-fortune" }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode; world?: GameId }) {
  const w = WORLD[world];
  return (
    <div className="sv-stage relative isolate min-h-screen overflow-hidden" data-parallax-root>
      <div className="sv-grain" aria-hidden />
      <WorldArt gameId={world} className="-z-20" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#05050a]/80 via-[#05050a]/35 to-[#05050a]/90 lg:to-[#05050a]/75" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#05050a] via-transparent to-[#05050a]/50" />
      <div className="sv-vignette absolute inset-0 -z-10" />

      <div className="relative mx-auto flex min-h-screen max-w-[1320px] flex-col px-5 py-6 sm:px-8 lg:py-8">
        <header className="flex items-center justify-between">
          <Link href="/login" className="group inline-flex items-center gap-3" aria-label="SPINVERSE">
            <LogoMark className="h-10 w-10 transition-transform duration-700 group-hover:rotate-[28deg]" />
            <span className="sv-display text-sm font-semibold tracking-[0.4em] text-white">SPINVERSE</span>
          </Link>
          <p className="hidden text-xs text-obsidian-200 sm:block">Virtual points only · 18+</p>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.15fr_minmax(0,460px)] lg:gap-20">
          <div className="hidden lg:block">
            <p className="sv-serif text-3xl" style={{ color: w.primary }}>{w.kicker}</p>
            <p className="sv-serif mt-3 max-w-[11ch] text-[clamp(4rem,8vw,7.6rem)] leading-[0.92] text-white">
              Every spin tells a different story.
            </p>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-obsidian-200">
              Three handcrafted worlds, one lounge. Collect virtual points, climb the leaderboard and unlock rewards. No cash, no wagers.
            </p>
            <p className="mt-10 text-xs text-obsidian-200">Now showing: {GAME_BY_ID[world].name}</p>
          </div>

          <main className="sv-glass w-full rounded-[2rem] p-6 shadow-[0_40px_120px_-20px_rgba(0,0,0,.95)] sm:p-9">
            <h1 className="sv-display text-balance text-[1.9rem] font-bold leading-[1.05] text-white sm:text-[2.2rem]">{title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-obsidian-200">{subtitle}</p>
            <div className="mt-8">{children}</div>
            {footer && <div className="mt-8 text-center text-sm text-obsidian-200">{footer}</div>}
          </main>
        </div>
      </div>
    </div>
  );
}
