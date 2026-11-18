"use client";

import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import { useReduceMotion } from "@/lib/useReduceMotion";
import { Radio, Star } from "lucide-react";
import { GameTitle } from "@/components/art/GameTitle";
import { WORLD } from "@/components/art/worlds";
import { FavoriteButton } from "@/components/site/GameCard";
import { usePlay } from "@/components/site/PlayModal";
import { PlayButton } from "@/components/site/ui";
import type { Game } from "@/data/games";
import { cn } from "@/lib/utils";
import { FEATURES } from "./gameCopy";

const EASE = [0.2, 0.7, 0.2, 1] as const;

function makeVariants(reduce: boolean): { box: Variants; item: Variants } {
  return {
    box: {
      hidden: {},
      show: { transition: { staggerChildren: 0.065, delayChildren: reduce ? 0 : 0.28 } },
      exit: {},
    },
    item: {
      hidden: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, y: d * 34, filter: "blur(9px)" }),
      show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: reduce ? 0.2 : 0.7, ease: EASE } },
      exit: (d: number) => (reduce ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, y: d * -22, filter: "blur(7px)", transition: { duration: 0.24, ease: "easeIn" } }),
    },
  };
}

function Row({ v, dir, className, children }: { v: { item: Variants }; dir: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div variants={v.item} custom={dir} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * The featured world: title, story, features and actions.
 * When the world changes the copy rolls like a reel stopping: forward rolls up, back rolls down.
 */
export function FeaturedPanel({ game, dir, rich = false, className }: { game: Game; dir: 1 | -1; rich?: boolean; className?: string }) {
  const play = usePlay();
  const reduce = useReduceMotion();
  const v = makeVariants(reduce);
  const w = WORLD[game.id];
  return (
    <div className={cn("relative", className)}>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div key={game.id} variants={v.box} initial="hidden" animate="show" exit="exit" className="max-w-[52rem]">
          <Row v={v} dir={dir} className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{game.category}</span>
            {game.isNew && <span className="rounded-full bg-gradient-to-r from-[#f9e6a8] to-[#e3b951] px-3 py-1 text-xs font-bold text-[#2a1805]">New release</span>}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs text-obsidian-100 backdrop-blur">
              <Radio className="h-3 w-3 text-emerald-300" />
              <b className="sv-num font-bold text-white">{game.playersNow.toLocaleString("en-US")}</b> playing
            </span>
          </Row>

          <Row v={v} dir={dir}>
            <p className="sv-serif mt-3 text-[1.5rem] sm:text-[1.9rem]" style={{ color: w.primary }}>{w.kicker}</p>
            <GameTitle gameId={game.id} as="h1" className="text-balance text-[clamp(2.5rem,min(7.2vw,10.5vh),6.6rem)]" />
          </Row>

          <Row v={v} dir={dir}>
            <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-obsidian-100 sm:line-clamp-none sm:text-base">{game.description}</p>
          </Row>

          <Row v={v} dir={dir}>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-obsidian-100">
              <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 fill-gold-300 text-gold-300" /><b className="sv-num text-white">{game.rating}</b> rating</span>
              <span><b className="sv-num text-white">{game.grid}</b> reels</span>
              <span><b className="text-white">{game.volatility}</b> volatility</span>
              <span className="text-obsidian-200">{game.tags.join(" · ")}</span>
            </div>
          </Row>

          <Row v={v} dir={dir}>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4">
              <PlayButton gameId={game.id} onClick={() => play(game.id)}>Play now</PlayButton>
              <Link
                href={`/games/${game.id}`}
                className="inline-flex h-[52px] items-center rounded-full border border-white/20 bg-black/40 px-6 text-sm font-semibold text-white backdrop-blur transition hover:border-white/50 hover:bg-white/[0.12] active:scale-[.97]"
              >
                Game details
              </Link>
              <FavoriteButton game={game} className="!h-[52px] !w-[52px]" />
            </div>
          </Row>

          {rich && (
            <Row v={v} dir={dir}>
              <ul className="mt-7 grid max-w-3xl gap-2.5 sm:grid-cols-3">
                {FEATURES[game.id].map((f) => (
                  <li key={f.title} className="rounded-2xl border border-white/10 bg-black/45 p-3.5 backdrop-blur">
                    <f.icon className="h-[18px] w-[18px]" style={{ color: w.primary }} />
                    <p className="mt-2 text-[14px] font-semibold text-white">{f.title}</p>
                    <p className="mt-1 text-[12.5px] leading-snug text-obsidian-200">{f.text}</p>
                  </li>
                ))}
              </ul>
            </Row>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
