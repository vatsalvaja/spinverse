"use client";

import { useMemo, useState } from "react";
import { ChevronsUp, Crown } from "lucide-react";
import { Reveal } from "@/components/art/Reveal";
import { WORLD } from "@/components/art/worlds";
import { PageBanner, Wrap } from "@/components/site/ui";
import { Avatar } from "@/components/ui/avatar";
import { buildLeaderboard } from "@/data/engagement";
import { GAME_BY_ID } from "@/data/games";
import { useDemoData } from "@/data/provider";
import { useSession } from "@/lib/session";
import { cn, formatPoints } from "@/lib/utils";

const METRICS = [
  { value: "totalEarned", label: "Points earned" },
  { value: "gamesPlayed", label: "Games played" },
  { value: "totalSpins", label: "Spins" },
] as const;

const PLATE = {
  1: { grad: "from-[#fff3c4] via-[#e3b951] to-[#8a5f14]", text: "text-[#3a2407]", h: "h-60 sm:h-72", ring: "ring-gold-200" },
  2: { grad: "from-[#f2f4fa] via-[#a8aec2] to-[#555a6b]", text: "text-[#20222c]", h: "h-44 sm:h-52", ring: "ring-[#c9ccd8]" },
  3: { grad: "from-[#ffd9b0] via-[#c9803f] to-[#6b3a14]", text: "text-[#2e1807]", h: "h-36 sm:h-44", ring: "ring-[#d08c4f]" },
} as const;

export default function LeaderboardPage() {
  const { users } = useDemoData();
  const { player } = useSession();
  const [metric, setMetric] = useState<(typeof METRICS)[number]["value"]>("totalEarned");

  const rows = useMemo(() => {
    const base = buildLeaderboard(users).map((r) => r.user);
    return base.sort((a, b) => b[metric] - a[metric]).map((user, i) => ({ rank: i + 1, user }));
  }, [users, metric]);
  const podium = [rows[1], rows[0], rows[2]].filter(Boolean);
  const top = rows[0]?.user[metric] ?? 1;
  const meIdx = rows.findIndex((r) => r.user.id === player?.id);
  const me = meIdx >= 0 ? rows[meIdx] : undefined;
  const ahead = meIdx > 0 ? rows[meIdx - 1] : undefined;
  const metricLabel = METRICS.find((m) => m.value === metric)!.label;

  return (
    <div className="pb-10">
      <PageBanner
        world="neon-overdrive"
        kicker="Season standings"
        title="Leaderboard"
        subtitle="Registered players ranked by what they’ve done this season. Guests and blocked accounts aren’t ranked."
      >
        <div className="sv-scroll-x flex gap-2 overflow-x-auto" role="tablist" aria-label="Ranking metric">
          {METRICS.map((m) => (
            <button key={m.value} role="tab" aria-selected={metric === m.value} onClick={() => setMetric(m.value)} className={cn("shrink-0 rounded-full border px-5 py-2.5 text-[13px] font-medium transition", metric === m.value ? "border-neon-cyan/70 bg-neon-cyan/10 text-white shadow-[0_0_26px_-6px_#6ff2ff]" : "border-white/10 text-obsidian-200 hover:border-white/25 hover:text-white")}>{m.label}</button>
          ))}
        </div>
      </PageBanner>

      <Wrap>
        {/* podium */}
        <Reveal>
          <div className="mx-auto grid max-w-4xl grid-cols-3 items-end gap-2 sm:gap-5">
            {podium.map(({ rank, user }) => {
              const p = PLATE[rank as 1 | 2 | 3];
              return (
                <div key={user.id} className="flex flex-col items-center">
                  {rank === 1 && <Crown className="mb-2 h-7 w-7 text-gold-200 drop-shadow-[0_0_14px_rgba(240,200,100,.9)]" />}
                  <Avatar name={user.name} size={rank === 1 ? 92 : 72} className={cn("ring-4", p.ring)} />
                  <p className="mt-3 max-w-full truncate px-1 text-center text-sm font-semibold text-white sm:text-base">{user.name}</p>
                  <p className="sv-num mb-3 text-lg font-bold text-gold-100 sm:text-2xl">{formatPoints(user[metric])}</p>
                  <div className={cn("sv-chamfer relative flex w-full items-start justify-center bg-gradient-to-b pt-3", p.grad, p.h)}>
                    <span className={cn("sv-num text-6xl font-extrabold leading-none sm:text-8xl", p.text)}>{rank}</span>
                    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/35 to-transparent" />
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* standing */}
        {me && (
          <Reveal className="mx-auto mt-14 max-w-4xl">
            <div className="sv-glass flex flex-wrap items-center gap-x-8 gap-y-4 rounded-[2rem] border-gold-300/30 p-6">
              <div>
                <p className="text-xs text-obsidian-200">Your standing</p>
                <p className="sv-num sv-gold-text text-5xl font-extrabold leading-none">#{me.rank}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-white">{formatPoints(me.user[metric])} <span className="text-obsidian-200">{metricLabel.toLowerCase()}</span></p>
                <p className="mt-1 flex items-center gap-2 text-sm text-obsidian-200">
                  <ChevronsUp className="h-4 w-4 text-neon-cyan" />
                  {ahead ? `${formatPoints(ahead.user[metric] - me.user[metric])} more to pass ${ahead.user.name}` : "You’re leading the season."}
                </p>
              </div>
            </div>
          </Reveal>
        )}

        {/* ranking */}
        <Reveal className="mx-auto mt-12 max-w-4xl">
          <ol className="space-y-2.5">
            {rows.map(({ rank, user }) => {
              const mine = user.id === player?.id;
              const fav = WORLD[user.favoriteGame];
              return (
                <li key={user.id} className="-skew-x-6">
                  <div className={cn("relative flex skew-x-6 items-center gap-3 overflow-hidden rounded-xl border py-3 pl-4 pr-5 sm:gap-5 sm:pl-6", mine ? "border-gold-200/60 bg-gold-300/[0.12]" : "border-white/[0.07] bg-white/[0.035]")}>
                    <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: rank <= 3 ? "linear-gradient(#fff3c4,#b98524)" : fav.primary, opacity: rank <= 3 ? 1 : 0.7 }} />
                    <span className={cn("sv-num w-9 text-2xl font-extrabold sm:w-12 sm:text-3xl", rank <= 3 ? "text-gold-200" : "text-obsidian-300")}>{rank}</span>
                    <Avatar name={user.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white sm:text-base">{user.name}{mine && <span className="ml-2 text-xs font-medium text-gold-300">You</span>}</p>
                      <p className="truncate text-xs text-obsidian-300">{user.membership} · plays {GAME_BY_ID[user.favoriteGame].name}</p>
                      <div className="mt-2 hidden h-1 overflow-hidden rounded-full bg-white/10 sm:block">
                        <div className="h-full rounded-full" style={{ width: `${(user[metric] / top) * 100}%`, background: `linear-gradient(90deg, ${fav.secondary}, ${fav.primary})` }} />
                      </div>
                    </div>
                    <span className="sv-num text-lg font-bold text-white sm:text-xl">{formatPoints(user[metric])}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </Reveal>
      </Wrap>
    </div>
  );
}
