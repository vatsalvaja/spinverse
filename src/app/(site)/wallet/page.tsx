"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Gamepad2, Gift, Info, RotateCw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { Reveal } from "@/components/art/Reveal";
import { WORLD } from "@/components/art/worlds";
import { CountUp } from "@/components/site/CountUp";
import { Btn, Chip, SectionHeader, Wrap } from "@/components/site/ui";
import { VaultDoor } from "@/components/site/VaultDoor";
import { useToast } from "@/components/ui/toast";
import { GAME_BY_ID } from "@/data/games";
import { useDemoData } from "@/data/provider";
import { TX_TYPE_LABEL, type Transaction, type TxType } from "@/data/types";
import { useSession } from "@/lib/session";
import { NOW, cn, formatPoints } from "@/lib/utils";

const FILTERS: { value: "all" | TxType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "earned", label: "Earned" },
  { value: "spent", label: "Spent" },
  { value: "reward", label: "Rewards" },
  { value: "bonus", label: "Bonuses" },
  { value: "adjustment", label: "Adjustments" },
];

const TYPE_STYLE: Record<TxType, { icon: typeof Gift; tone: string; ring: string }> = {
  earned: { icon: Sparkles, tone: "text-emerald-300", ring: "bg-emerald-400/12 ring-emerald-300/30" },
  spent: { icon: Gamepad2, tone: "text-gold-200", ring: "bg-gold-300/12 ring-gold-300/30" },
  reward: { icon: Gift, tone: "text-gold-100", ring: "bg-gold-300/12 ring-gold-200/30" },
  bonus: { icon: Zap, tone: "text-violet-200", ring: "bg-violet-400/12 ring-violet-300/30" },
  adjustment: { icon: ShieldCheck, tone: "text-sky-200", ring: "bg-sky-400/12 ring-sky-300/30" },
};

const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function dayLabel(iso: string) {
  const d = new Date(iso);
  const start = Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), NOW.getUTCDate());
  const t = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const diff = Math.round((start - t) / DAY);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
const timeLabel = (iso: string) => `${String(new Date(iso).getUTCHours()).padStart(2, "0")}:${String(new Date(iso).getUTCMinutes()).padStart(2, "0")}`;

function Spark({ values, color }: { values: number[]; color: string }) {
  const u = "sp" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => [(i / Math.max(1, values.length - 1)) * 100, 28 - (v / max) * 24]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-10 w-full" aria-hidden>
      <defs>
        <linearGradient id={u} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".4" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient>
      </defs>
      <path d={`${line} L100,32 L0,32Z`} fill={`url(#${u})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

export default function WalletPage() {
  const { player } = useSession();
  const { transactionsFor } = useDemoData();
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const [visible, setVisible] = useState(12);

  const all = useMemo(() => (player ? transactionsFor(player.id) : []), [player, transactionsFor]);
  const stats = useMemo(() => {
    const done = all.filter((t) => t.status === "completed");
    const week = done.filter((t) => NOW.getTime() - new Date(t.timestamp).getTime() < 7 * DAY);
    const recent = [...done].reverse();
    const last = (pick: (t: Transaction) => number) => recent.slice(-16).map(pick);
    return {
      weekIn: week.reduce((s, t) => s + t.credit, 0),
      weekOut: week.reduce((s, t) => s + t.debit, 0),
      weekGames: week.filter((t) => t.type === "spent").length,
      inSpark: last((t) => t.credit),
      outSpark: last((t) => t.debit),
      gameSpark: last((t) => (t.type === "spent" ? t.spins ?? 0 : 0)),
    };
  }, [all]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    all.forEach((t) => (c[t.type] = (c[t.type] ?? 0) + 1));
    return c;
  }, [all]);

  if (!player) return null;
  const txs = all.filter((t) => filter === "all" || t.type === filter);
  const shown = txs.slice(0, visible);
  const groups: { label: string; items: Transaction[] }[] = [];
  shown.forEach((t) => {
    const label = dayLabel(t.timestamp);
    const g = groups[groups.length - 1];
    if (g && g.label === label) g.items.push(t);
    else groups.push({ label, items: [t] });
  });

  return (
    <div className="pb-10">
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(900px_520px_at_72%_40%,rgba(240,200,100,.12),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-[#06060b] to-transparent" />
        <Wrap className="grid items-center gap-10 pb-14 pt-24 lg:grid-cols-[1fr_1.05fr] lg:pt-28">
          <div className="sv-rise-in">
            <p className="sv-serif text-2xl text-gold-300">Your virtual points</p>
            <h1 className="sv-display sv-silver-text mt-2 text-[clamp(2.8rem,7vw,5.8rem)] font-bold leading-[0.95]">The Vault</h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-obsidian-100">Every point you earn is sealed here. Open the ledger to see where each one came from and where it went.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Btn size="lg" onClick={() => toast("Daily reward already claimed today. Come back tomorrow at 00:00 UTC.", "info")}>Claim daily reward</Btn>
              <Btn size="lg" variant="outline" onClick={() => toast("Statement exports arrive in the next release.", "info")}>Download statement</Btn>
            </div>
            <p className="mt-8 flex max-w-md items-start gap-2.5 text-sm leading-relaxed text-obsidian-300">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-300" /> Points are for entertainment only. They can’t be bought, withdrawn or exchanged for money or prizes.
            </p>
          </div>
          <div className="relative">
            <VaultDoor>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-gold-300">BALANCE</p>
              <p className="sv-num sv-gold-text my-1 text-[clamp(1.7rem,5.6vw,3.4rem)] font-extrabold leading-none"><CountUp value={player.balance} /></p>
              <p className="text-xs text-obsidian-200">virtual points</p>
            </VaultDoor>
          </div>
        </Wrap>
      </section>

      <Wrap>
        <Reveal>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Credits", sub: "earned, rewards, bonuses", value: player.totalEarned, week: `+${formatPoints(stats.weekIn)} this week`, icon: ArrowDownLeft, color: "#6ee7b7", spark: stats.inSpark, tone: "text-emerald-300" },
              { label: "Debits", sub: "points played in games", value: player.totalSpent, week: `−${formatPoints(stats.weekOut)} this week`, icon: ArrowUpRight, color: "#f0cf80", spark: stats.outSpark, tone: "text-gold-200" },
              { label: "Activity", sub: "spins across all worlds", value: player.totalSpins, week: `${stats.weekGames} sessions this week`, icon: RotateCw, color: "#6ff2ff", spark: stats.gameSpark, tone: "text-neon-cyan" },
            ].map(({ label, sub, value, week, icon: Icon, color, spark, tone }) => (
              <div key={label} className="sv-glass relative overflow-hidden rounded-3xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-obsidian-200">{label}</p>
                    <p className="text-xs text-obsidian-300">{sub}</p>
                  </div>
                  <span className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/10", tone)}><Icon className="h-[18px] w-[18px]" /></span>
                </div>
                <p className="sv-num mt-4 text-[2.6rem] font-extrabold leading-none text-white">{formatPoints(value)}</p>
                <p className={cn("mt-2 text-sm font-medium", tone)}>{week}</p>
                <div className="-mx-1 mt-3"><Spark values={spark} color={color} /></div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-24">
          <SectionHeader kicker="Every point, accounted for" title="The ledger" subtitle={`${all.length} entries, newest first.`} />
          <div className="sv-scroll-x mb-8 flex gap-2 overflow-x-auto" role="tablist" aria-label="Filter transactions">
            {FILTERS.map((f) => (
              <button key={f.value} role="tab" aria-selected={filter === f.value} onClick={() => { setFilter(f.value); setVisible(12); }} className={cn("flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition", filter === f.value ? "border-gold-200/70 bg-gold-300/15 text-gold-50" : "border-white/10 text-obsidian-200 hover:border-white/25 hover:text-white")}>
                {f.label}
                <span className={cn("sv-num rounded-full px-1.5 text-xs", filter === f.value ? "bg-gold-300/25" : "bg-white/[0.08] text-obsidian-300")}>{counts[f.value] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {groups.map((g) => (
              <div key={g.label}>
                <p className="sv-serif mb-3 text-2xl text-gold-300">{g.label}</p>
                <ul className="sv-glass divide-y divide-white/[0.07] overflow-hidden rounded-3xl">
                  {g.items.map((t) => {
                    const st = TYPE_STYLE[t.type];
                    const Icon = st.icon;
                    return (
                      <li key={t.id} className="flex items-center gap-4 px-4 py-4 sm:px-6">
                        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1", st.ring, st.tone)}><Icon className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-semibold text-white">{t.description}</p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-obsidian-300">
                            <span className={st.tone}>{TX_TYPE_LABEL[t.type]}</span>
                            <span aria-hidden>·</span>
                            <span>{timeLabel(t.timestamp)} UTC</span>
                            {t.game && <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: WORLD[t.game].primary }} />{GAME_BY_ID[t.game].name}</span>}
                            {t.status !== "completed" && <Chip tone={t.status === "failed" ? "rose" : "gold"}>{t.status}</Chip>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn("sv-num text-xl font-bold leading-none sm:text-2xl", t.credit ? "text-emerald-300" : "text-white")}>{t.credit ? `+${formatPoints(t.credit)}` : `−${formatPoints(t.debit)}`}</p>
                          <p className="sv-num mt-1.5 text-[13px] text-obsidian-300">balance {formatPoints(t.balanceAfter)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            {!txs.length && (
              <p className="sv-panel px-5 py-12 text-center text-sm text-obsidian-300"><Info className="mx-auto mb-2 h-5 w-5" />No transactions in this category yet.</p>
            )}
          </div>
          {visible < txs.length && (
            <div className="mt-8 flex flex-col items-center gap-2">
              <Btn variant="outline" onClick={() => setVisible((v) => v + 12)}>Show 12 more</Btn>
              <p className="text-xs text-obsidian-300">Showing {shown.length} of {txs.length}</p>
            </div>
          )}
        </Reveal>
      </Wrap>
    </div>
  );
}
