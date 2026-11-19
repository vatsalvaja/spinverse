"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowLeft, Play, Radio } from "lucide-react";
import { ART } from "@/components/art/art";
import { WORLD } from "@/components/art/worlds";
import { coverFor } from "@/components/launcher/GameTile";
import { FavoriteButton } from "@/components/site/GameCard";
import { usePlay } from "@/components/site/PlayModal";
import { Wrap } from "@/components/site/ui";
import { GAMES, GAME_BY_ID } from "@/data/games";
import type { GameId } from "@/data/types";
import { formatDate } from "@/lib/utils";
import { FEATURES } from "./gameCopy";

const LAYERS: { key: "back" | "mid" | "front"; label: string }[] = [
  { key: "back", label: "Backdrop" },
  { key: "mid", label: "Midground" },
  { key: "front", label: "Foreground" },
];

/** A single game's page, inside the launcher: poster, facts, how it plays. */
export function GameDetail({ id }: { id: GameId }) {
  const play = usePlay();
  const game = GAME_BY_ID[id];
  const w = WORLD[id];
  const art = ART[id];

  const stats: [string, string][] = [
    ["Rating", String(game.rating)],
    ["Reels", game.grid],
    ["Volatility", game.volatility],
    ["Released", formatDate(game.releasedAt)],
  ];

  return (
    <div className="pb-6">
      <Wrap className="pt-4 sm:pt-6">
        <Link href="/games" className="lx-chip h-9 gap-2 !rounded-full pl-3 pr-4 text-[13px] font-medium">
          <ArrowLeft className="h-4 w-4" /> Explore games
        </Link>

        <section
          className="mt-4 grid gap-6 overflow-hidden rounded-3xl p-4 sm:p-6 md:grid-cols-[260px_1fr] md:gap-8"
          style={{ background: `radial-gradient(70% 90% at 0% 100%, ${game.accentSoft}, transparent 70%), linear-gradient(180deg, rgba(20,22,38,.9), rgba(8,9,18,.92))`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.08), 0 30px 70px -40px rgba(0,0,0,.9)" }}
        >
          <div className="mx-auto w-full max-w-[260px] md:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl ring-1 ring-white/15" style={{ boxShadow: `0 24px 50px -22px ${game.accent}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverFor(game)} alt={`${game.name} poster`} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "50% 45%" }} />
            </div>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs font-semibold text-white">{game.concept}</span>
              <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1 text-xs text-obsidian-100">{game.theme}</span>
              {game.isNew && <span className="rounded-full bg-gradient-to-r from-[#f9e6a8] to-[#e3b951] px-3 py-1 text-xs font-bold text-[#2a1805]">New release</span>}
            </div>
            <h1 className="sv-display mt-3 text-balance text-[clamp(1.6rem,3.4vw,2.4rem)] font-bold leading-tight text-white">{game.name}</h1>
            <p className="mt-1 text-sm font-medium" style={{ color: game.accent }}>{game.tagline}</p>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-obsidian-100">{game.description}</p>

            <dl className="mt-5 grid max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-5">
              {stats.map(([k, v]) => (
                <div key={k} className="rounded-2xl border border-white/10 bg-black/35 px-3.5 py-3">
                  <dd className="sv-num text-base font-bold leading-none text-white">{v}</dd>
                  <dt className="mt-1.5 text-xs text-obsidian-200">{k}</dt>
                </div>
              ))}
              <div className="rounded-2xl border border-white/10 bg-black/35 px-3.5 py-3">
                <dd className="sv-num flex items-center gap-1.5 text-base font-bold leading-none text-white"><Radio className="h-3.5 w-3.5 text-emerald-300" />{game.playersNow.toLocaleString("en-US")}</dd>
                <dt className="mt-1.5 text-xs text-obsidian-200">Playing now</dt>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => play(id)} className="lx-play !h-12 !w-auto px-8 text-[15px]" style={{ "--ac": game.accent } as CSSProperties}>
                <Play className="h-4 w-4 fill-current" /> Play now
              </button>
              <FavoriteButton game={game} className="!h-12 !w-12" />
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="how-it-plays" className="sv-panel p-6 sm:p-7">
            <h2 id="how-it-plays" className="sv-display text-lg font-semibold text-white">How it plays</h2>
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
            <h2 id="theme" className="sv-display text-lg font-semibold text-white">Theme preview</h2>
            <p className="mt-3 text-sm text-obsidian-100">{w.mood}.</p>
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

        <nav aria-label="Other games" className="mt-6">
          <p className="text-[15px] font-semibold text-white">Other games</p>
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {GAMES.filter((g) => g.id !== id).map((g) => (
              <li key={g.id}>
                <Link href={`/games/${g.id}`} className="lx-drawer-link !p-2.5 [box-shadow:inset_0_0_0_1px_rgba(255,255,255,.08)]">
                  <span className="relative h-[56px] w-[44px] shrink-0 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverFor(g)} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[14.5px] font-semibold leading-tight text-white">{g.name}</span>
                    <span className="block truncate text-xs text-white/50">{g.concept}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Wrap>
    </div>
  );
}
