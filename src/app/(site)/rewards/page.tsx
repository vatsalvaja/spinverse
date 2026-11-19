"use client";

import { useId, useState } from "react";
import { Gift, Lock } from "lucide-react";
import { Reveal } from "@/components/art/Reveal";
import { Btn, Chip, PageBanner, SectionHeader, Wrap } from "@/components/site/ui";
import { useToast } from "@/components/ui/toast";
import { RECENT_REWARDS, REWARD_CATALOG } from "@/data/engagement";
import { useSession } from "@/lib/session";
import { cn, formatDateTime, formatPoints } from "@/lib/utils";

const GEMS = [
  { a: "#fff3c4", b: "#e3b951", c: "#7a5110", glow: "rgba(240,200,100,.55)" },
  { a: "#d9fffa", b: "#2fb8b0", c: "#07485a", glow: "rgba(79,227,212,.5)" },
  { a: "#ffd1f4", b: "#ff4fd8", c: "#5a0f5a", glow: "rgba(255,79,216,.5)" },
];

function Relic({ i, owned }: { i: number; owned: boolean }) {
  const u = "rl" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const g = GEMS[i % GEMS.length];
  return (
    <div className="relative mx-auto h-40 w-40">
      <div className="absolute inset-2 rounded-full blur-2xl" style={{ background: g.glow, opacity: owned ? 1 : 0.55 }} aria-hidden />
      <svg viewBox="0 0 160 160" className="sv-float relative h-full w-full" style={{ animationDelay: `${i * 0.9}s` }} aria-hidden>
        <defs>
          <linearGradient id={`${u}a`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={g.a} /><stop offset="1" stopColor={g.b} /></linearGradient>
          <linearGradient id={`${u}b`} x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor={g.b} /><stop offset="1" stopColor={g.c} /></linearGradient>
        </defs>
        <polygon points="80,10 128,52 80,150 32,52" fill={`url(#${u}b)`} />
        <polygon points="80,10 128,52 80,64" fill={`url(#${u}a)`} />
        <polygon points="80,10 32,52 80,64" fill={g.a} opacity=".85" />
        <polygon points="32,52 80,64 80,150" fill={g.c} opacity=".5" />
        <polygon points="128,52 80,64 80,150" fill={g.b} opacity=".6" />
        <polygon points="80,10 128,52 32,52" fill="none" stroke="#fff" strokeOpacity=".45" />
        <circle cx="62" cy="38" r="5" fill="#fff" opacity=".9" />
        <path d="M80,10 L80,150" stroke="#fff" strokeOpacity=".15" />
      </svg>
      {!owned && <Lock className="absolute bottom-2 right-3 h-5 w-5 text-obsidian-200" />}
    </div>
  );
}

export default function RewardsPage() {
  const toast = useToast();
  const { player } = useSession();
  const [owned, setOwned] = useState<string[]>([]);
  const [spent, setSpent] = useState(0);
  if (!player) return null;
  const balance = player.balance - spent;
  const catalog = REWARD_CATALOG.filter((r) => r.cost);

  return (
    <div className="pb-10">
      <PageBanner world="pharaohs-fortune" kicker="The treasury" title="Rewards" subtitle="Claim what you’ve earned and unlock cosmetic relics with your points. They never change how a game plays.">
        <div className="sv-glass rounded-3xl px-6 py-4">
          <p className="text-xs text-gold-300">Spendable points</p>
          <p className="sv-num sv-gold-text text-4xl font-extrabold leading-none">{formatPoints(balance)}</p>
        </div>
      </PageBanner>

      <Wrap>
        <SectionHeader kicker="Cosmetics only" title="Unlock a relic" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map((r, i) => {
            const has = owned.includes(r.id);
            const afford = balance >= (r.cost ?? 0);
            return (
              <Reveal key={r.id} delay={i * 0.08}>
                <article className="sv-chamfer group relative flex h-full flex-col border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.015] p-6 pt-8 transition duration-500 hover:-translate-y-1.5">
                  <Relic i={i} owned={has} />
                  <h3 className="sv-display mt-4 text-center text-lg font-semibold text-white">{r.title}</h3>
                  <p className="mt-1 text-center text-sm text-obsidian-200">{r.detail}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                    <span className="sv-num text-lg font-bold text-gold-200">{formatPoints(r.cost!)} <span className="text-xs font-medium text-obsidian-300">pts</span></span>
                    {has ? (
                      <Chip tone="teal">Unlocked</Chip>
                    ) : (
                      <Btn
                        size="sm"
                        variant={afford ? "gold" : "dark"}
                        onClick={() => {
                          if (!afford) return toast("Not enough points yet. Missions are a quick way to top up.", "info");
                          setOwned((o) => [...o, r.id]);
                          setSpent((s) => s + r.cost!);
                          toast(`${r.title} unlocked.`);
                        }}
                      >
                        {!afford && <Lock className="h-3.5 w-3.5" />} Unlock
                      </Btn>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-8">
          <SectionHeader kicker="Your history" title="Recently claimed" />
          <ol className="relative space-y-4 before:absolute before:bottom-3 before:left-[23px] before:top-3 before:w-px before:bg-gradient-to-b before:from-gold-300/60 before:to-transparent">
            {RECENT_REWARDS.map((r) => (
              <li key={r.id} className="relative flex items-center gap-4">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-300/40 bg-obsidian-900 shadow-[0_0_20px_-4px_rgba(240,200,100,.6)]"><Gift className="h-5 w-5 text-gold-200" /></span>
                <div className="sv-glass flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{r.title}</p>
                    <p className="text-xs text-obsidian-300">{r.detail} · {formatDateTime(r.claimedAt!)}</p>
                  </div>
                  <Chip>{r.tier}</Chip>
                  <span className="sv-num w-20 text-right text-lg font-bold text-gold-200">+{formatPoints(r.points)}</span>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
      </Wrap>
    </div>
  );
}
