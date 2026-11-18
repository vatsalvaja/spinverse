"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, Radio } from "lucide-react";
import { GameTitle } from "@/components/art/GameTitle";
import { ART } from "@/components/art/art";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import { FavoriteButton } from "@/components/site/GameCard";
import { usePlay } from "@/components/site/PlayModal";
import { PlayButton } from "@/components/site/ui";
import { GAMES, GAME_BY_ID } from "@/data/games";
import type { GameId } from "@/data/types";
import { cn, formatDate } from "@/lib/utils";
import { useConsole } from "./ConsoleContext";
import { FEATURES } from "./gameCopy";
import { WorldBackdrop } from "./WorldBackdrop";

const LAYERS: { key: "back" | "mid" | "front"; label: string }[] = [
  { key: "back", label: "Backdrop" },
  { key: "mid", label: "Midground" },
  { key: "front", label: "Foreground" },
];

/** Console-style game detail screen: the world fills the display, facts and features sit beneath. */
export function GameDetail({ id }: { id: GameId }) {
  const play = usePlay();
  const { select } = useConsole();
  const game = GAME_BY_ID[id];
  const w = WORLD[id];
  const art = ART[id];

  // opening a world's details also makes it the selected world on Home and Explore
  useEffect(() => select(id), [id, select]);

  const stats: [string, string][] = [
    ["Rating", String(game.rating)],
    ["Reels", game.grid],
    ["Volatility", game.volatility],
    ["Released", formatDate(game.releasedAt)],
  ];

  return (
    <div data-parallax-root className="relative isolate min-h-[100dvh]">
      <div className="fixed inset-0 -z-10" aria-hidden>
        <WorldBackdrop gameId={id} origin={{ x: 50, y: 50 }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#05050a]/90 via-[#05050a]/45 to-[#05050a]/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-[#05050a]/60 to-transparent to-70%" />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#05050a]/80 to-transparent" />
        <div className="sv-vignette absolute inset-0" />
      </div>

      <div className="mx-auto w-full max-w-[1480px] px-4 pt-[64px] sm:px-8 sm:pt-[72px]">
        <Link href="/games" className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 bg-black/40 pl-3 pr-4 text-[13px] font-medium text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10">
          <ArrowLeft className="h-4 w-4" /> Explore games
        </Link>

        <section className="sv-rise-in flex min-h-[calc(100dvh-250px)] flex-col justify-end pb-10 pt-10">
          <div className="max-w-[52rem]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{game.concept}</span>
              <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-obsidian-100 backdrop-blur">{game.theme}</span>
              {game.isNew && <span className="rounded-full bg-gradient-to-r from-[#f9e6a8] to-[#e3b951] px-3 py-1 text-xs font-bold text-[#2a1805]">New release</span>}
            </div>
            <p className="sv-serif mt-3 text-[1.5rem] sm:text-[1.9rem]" style={{ color: w.primary }}>{w.kicker}</p>
            <GameTitle gameId={id} as="h1" className="text-balance text-[clamp(2.6rem,min(7.6vw,11vh),7rem)]" />
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-obsidian-100 sm:text-base">{game.description}</p>

            <dl className="mt-6 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-5">
              {stats.map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-black/45 px-3.5 py-3 backdrop-blur">
                  <dd className="sv-num text-lg font-bold leading-none text-white">{v}</dd>
                  <dt className="mt-1.5 text-xs text-obsidian-200">{k}</dt>
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-black/45 px-3.5 py-3 backdrop-blur">
                <dd className="sv-num flex items-center gap-1.5 text-lg font-bold leading-none text-white"><Radio className="h-3.5 w-3.5 text-emerald-300" />{game.playersNow.toLocaleString("en-US")}</dd>
                <dt className="mt-1.5 text-xs text-obsidian-200">Playing now</dt>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-3 sm:gap-4">
              <PlayButton gameId={id} onClick={() => play(id)}>Play now</PlayButton>
              <FavoriteButton game={game} className="!h-[52px] !w-[52px]" />
            </div>
          </div>
        </section>

        <div className="grid gap-6 pb-10 lg:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="how-it-plays" className="sv-panel p-6 sm:p-7">
            <h2 id="how-it-plays" className="sv-display text-xl font-semibold text-white">How it plays</h2>
            <ul className="mt-5 space-y-4">
              {FEATURES[id].map((f) => (
                <li key={f.title} className="flex items-start gap-4">
                  <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/15" style={{ background: `linear-gradient(135deg, ${w.glow}, transparent)` }}>
                    <f.icon className="h-5 w-5" style={{ color: w.primary }} />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-white">{f.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-obsidian-200">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="theme" className="sv-panel p-6 sm:p-7">
            <h2 id="theme" className="sv-display text-xl font-semibold text-white">Theme preview</h2>
            <div className={cn("relative mt-5 aspect-[16/9] overflow-hidden bg-black ring-1 ring-white/10", w.shapeClass)}>
              <WorldArt gameId={id} lite />
            </div>
            <p className="mt-4 text-sm text-obsidian-100">{w.mood}.</p>
            <div className="mt-3 flex items-center gap-2" aria-label="World colours">
              {[w.primary, w.secondary, w.deep].map((c) => (
                <span key={c} className="h-7 w-7 rounded-full ring-1 ring-white/25" style={{ background: c }} title={c} />
              ))}
            </div>
            <ul className="mt-5 grid grid-cols-3 gap-2.5">
              {LAYERS.map((l) => (
                <li key={l.key}>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-[#0a0a10] ring-1 ring-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={art[l.key]} alt="" loading="lazy" decoding="async" draggable={false} className="h-full w-full object-cover" />
                  </div>
                  <p className="mt-1.5 text-center text-xs text-obsidian-200">{l.label}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <nav aria-label="Other worlds" className="pb-8">
          <p className="px-1 text-[15px] font-semibold text-white">Other worlds</p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {GAMES.filter((g) => g.id !== id).map((g) => (
              <li key={g.id}>
                <Link href={`/games/${g.id}`} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-black/45 p-2.5 pr-5 backdrop-blur transition hover:border-white/30">
                  <span className="relative h-[60px] w-[96px] shrink-0 overflow-hidden rounded-xl"><WorldArt gameId={g.id} lite thumb /></span>
                  <span className="min-w-0">
                    <span className={cn(WORLD[g.id].titleClass, "block truncate text-lg leading-tight")}>{g.name}</span>
                    <span className="block truncate text-xs text-obsidian-200">{g.concept}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
