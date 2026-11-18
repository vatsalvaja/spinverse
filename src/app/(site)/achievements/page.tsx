"use client";

import { useState } from "react";
import { Reveal } from "@/components/art/Reveal";
import { PageBanner, Wrap } from "@/components/site/ui";
import { Medal, MEDAL_ICON, TIER } from "@/components/site/Medal";
import { Ring } from "@/components/site/Ring";
import { ACHIEVEMENTS } from "@/data/engagement";
import { cn, formatPoints } from "@/lib/utils";

export default function AchievementsPage() {
  const [filter, setFilter] = useState<"all" | "unlocked" | "progress">("all");
  const done = ACHIEVEMENTS.filter((a) => a.progress >= a.target);
  const list = ACHIEVEMENTS.filter((a) => (filter === "all" ? true : filter === "unlocked" ? a.progress >= a.target : a.progress < a.target));
  const bonus = done.reduce((s, a) => s + a.reward, 0);

  return (
    <div className="pb-10">
      <PageBanner world="atlantis-cascade" kicker="Your collection" title="Achievements" subtitle="Every milestone is struck as a medal and pays out bonus points. Rarer medals take longer to earn.">
        <div className="flex items-center gap-6">
          <Ring value={done.length} max={ACHIEVEMENTS.length} size={116} stroke={6}>
            <span className="sv-num text-3xl font-extrabold text-white">{done.length}<span className="text-base text-obsidian-300">/{ACHIEVEMENTS.length}</span></span>
          </Ring>
          <div>
            <p className="sv-serif text-2xl text-obsidian-100">medals unlocked</p>
            <p className="mt-1 text-sm text-obsidian-300"><b className="sv-num text-gold-200">{formatPoints(bonus)}</b> bonus points earned</p>
          </div>
        </div>
      </PageBanner>

      <Wrap>
        <div className="mb-12 flex flex-wrap gap-2" role="tablist" aria-label="Filter medals">
          {([["all", "All medals"], ["unlocked", "Unlocked"], ["progress", "In progress"]] as const).map(([v, l]) => (
            <button key={v} role="tab" aria-selected={filter === v} onClick={() => setFilter(v)} className={cn("rounded-full border px-5 py-2.5 text-sm font-medium transition", filter === v ? "border-gold-200/70 bg-gold-300/15 text-gold-50" : "border-white/10 text-obsidian-200 hover:border-white/25 hover:text-white")}>{l}</button>
          ))}
        </div>

        <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {list.map((a, i) => {
            const got = a.progress >= a.target;
            const t = TIER[a.tier];
            return (
              <Reveal key={a.id} delay={(i % 4) * 0.06}>
                <article className="sv-foil sv-chamfer group relative flex h-full flex-col overflow-hidden border border-white/12 bg-gradient-to-b from-white/[0.08] to-white/[0.015] px-6 pb-6 pt-7 transition duration-500 hover:-translate-y-1.5">
                  <span className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold tracking-wide" style={{ color: t.a, border: `1px solid ${t.b}77`, background: `${t.c}66` }}>{t.name}</span>
                  <Medal tier={a.tier} unlocked={got} icon={MEDAL_ICON[a.id]} delay={(i % 4) * 0.08} />
                  <h3 className="sv-display mt-3 text-center text-lg font-semibold leading-tight text-white">{a.title}</h3>
                  <p className="mt-2 text-center text-[15px] leading-snug text-obsidian-200">{a.detail}</p>
                  <div className="mt-auto pt-6">
                    <div className="mb-2.5 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-[width] duration-1000" style={{ width: `${Math.min(100, (a.progress / a.target) * 100)}%`, background: `linear-gradient(90deg, ${t.c}, ${t.a})`, boxShadow: got ? `0 0 12px ${t.b}` : undefined }} />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="sv-num text-obsidian-200">{formatPoints(Math.min(a.progress, a.target))} / {formatPoints(a.target)}</span>
                      <span className="sv-num font-bold text-gold-200">+{formatPoints(a.reward)}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
        {!list.length && <p className="sv-panel px-6 py-14 text-center text-base text-obsidian-200">Nothing here yet. Keep playing to fill this shelf.</p>}
      </Wrap>
    </div>
  );
}
