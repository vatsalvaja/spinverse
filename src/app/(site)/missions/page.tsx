"use client";

import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { Reveal } from "@/components/art/Reveal";
import { WORLD } from "@/components/art/worlds";
import { Btn, Chip, PageBanner, SectionHeader, Wrap } from "@/components/site/ui";
import { useToast } from "@/components/ui/toast";
import { MISSIONS, type Mission } from "@/data/engagement";
import { GAME_BY_ID } from "@/data/games";
import { cn } from "@/lib/utils";

function Pips({ value, max, color }: { value: number; max: number; color: string }) {
  if (max > 12) {
    return (
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
    );
  }
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className="h-2 flex-1 rounded-sm" style={{ background: i < value ? color : "rgba(255,255,255,.1)", boxShadow: i < value ? `0 0 10px ${color}` : undefined }} />
      ))}
    </div>
  );
}

function Ticket({ m, claimed, onClaim }: { m: Mission; claimed: boolean; onClaim: () => void }) {
  const done = m.progress >= m.target;
  const w = m.game ? WORLD[m.game] : null;
  const c = w?.primary ?? "#f0cf80";
  return (
    <article className={cn("sv-ticket relative grid grid-cols-[104px_1fr] border bg-gradient-to-br from-white/[0.07] to-white/[0.015] sm:grid-cols-[132px_1fr]", done && !claimed ? "border-gold-200/50" : "border-white/10")} style={{ borderRadius: 18 }}>
      <div className="relative flex flex-col items-center justify-center border-r-2 border-dashed border-white/15 px-3 py-6 text-center" style={{ background: `linear-gradient(160deg, ${c}33, transparent 70%)` }}>
        <p className="sv-num text-2xl font-extrabold leading-none text-white sm:text-3xl">{m.reward}</p>
        <p className="mt-1 text-xs font-semibold tracking-wider" style={{ color: c }}>POINTS</p>
      </div>
      <div className="flex flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="sv-display text-base font-semibold leading-tight text-white sm:text-lg">{m.title}</h3>
          {m.game && <Chip tone="neutral" className="hidden shrink-0 sm:inline-flex">{GAME_BY_ID[m.game].name}</Chip>}
        </div>
        <p className="mt-1 text-sm text-obsidian-200">{m.detail}</p>
        <div className="mt-4"><Pips value={Math.min(m.progress, m.target)} max={m.target} color={c} /></div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="sv-num text-xs text-obsidian-200">{m.progress}/{m.target}</span>
          {claimed ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><Check className="h-4 w-4" /> Claimed</span>
          ) : done ? (
            <Btn size="sm" onClick={onClaim}>Claim reward</Btn>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-obsidian-300"><Clock className="h-3.5 w-3.5" /> {m.target - m.progress} to go</span>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MissionsPage() {
  const toast = useToast();
  const [claimed, setClaimed] = useState<string[]>([]);

  const group = (kind: "daily" | "weekly", title: string, kicker: string) => (
    <section className="mt-16 first:mt-0">
      <Reveal>
        <SectionHeader kicker={kicker} title={title} />
        <div className="grid gap-5 lg:grid-cols-2">
          {MISSIONS.filter((m) => m.kind === kind).map((m) => (
            <Ticket key={m.id} m={m} claimed={claimed.includes(m.id)} onClaim={() => { setClaimed((c) => [...c, m.id]); toast(`Claimed ${m.reward} points for “${m.title}”.`); }} />
          ))}
        </div>
      </Reveal>
    </section>
  );

  return (
    <div className="pb-10">
      <PageBanner world="pharaohs-fortune" kicker="The quest board" title="Missions" subtitle="Small goals, steady rewards. Daily missions reset at 00:00 UTC.">
        <Chip><Clock className="h-3 w-3" /> Daily reset at 00:00 UTC</Chip>
      </PageBanner>
      <Wrap>
        {group("daily", "Daily missions", "Fresh every morning")}
        {group("weekly", "Weekly missions", "Bigger goals, bigger rewards")}
      </Wrap>
    </div>
  );
}
