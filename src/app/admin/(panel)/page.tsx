"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Activity, Coins, Gamepad2, ReceiptText, UserCheck, UserPlus, Users, UserRound } from "lucide-react";
import { TxStatusBadge, TxTypeBadge } from "@/components/admin/badges";
import { GrowthChart, Legend, PointsChart, SERIES } from "@/components/admin/charts";
import { ALinkButton, Card, CardHeader, PageHeader, StatCard } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/avatar";
import { activityFeed, pointsActivitySeries, userGrowthSeries } from "@/data/derive";
import { useDemoData } from "@/data/provider";
import { NOW, formatCompact, formatDateTime, formatPoints, timeAgo } from "@/lib/utils";

export default function AdminOverview() {
  const { users, transactions } = useDemoData();

  const m = useMemo(() => {
    const registered = users.filter((u) => u.accountType === "Registered");
    const guests = users.filter((u) => u.accountType === "Guest");
    const thirtyDays = NOW.getTime() - 30 * 86_400_000;
    const sevenDays = NOW.getTime() - 7 * 86_400_000;
    return {
      registered: registered.length,
      guests: guests.length,
      active: users.filter((u) => u.status === "active" && new Date(u.lastActive).getTime() > sevenDays).length,
      circulation: users.reduce((s, u) => s + u.balance, 0),
      games: users.reduce((s, u) => s + u.gamesPlayed, 0),
      txCount: transactions.length,
      newRegs: users.filter((u) => new Date(u.registeredAt).getTime() > thirtyDays).length,
      growth: userGrowthSeries(users),
      points: pointsActivitySeries(transactions),
      feed: activityFeed(users, transactions, 8),
      recentTx: [...transactions].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 7),
      top: [...users].filter((u) => u.status !== "blocked").sort((a, b) => b.gamesPlayed - a.gamesPlayed).slice(0, 6),
    };
  }, [users, transactions]);

  return (
    <div>
      <PageHeader
        title="Overview"
        description="A live snapshot of players, engagement and virtual points across SPINVERSE."
        actions={<ALinkButton href="/admin/users" variant="primary"><Users className="h-4 w-4" /> Manage users</ALinkButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered users" value={formatPoints(m.registered)} icon={<UserCheck />} hint={`of ${users.length} accounts`} />
        <StatCard label="Active users (7 days)" value={formatPoints(m.active)} icon={<Activity />} hint={`${Math.round((m.active / users.length) * 100)}% of all accounts`} />
        <StatCard label="Guest users" value={formatPoints(m.guests)} icon={<UserRound />} hint="No account created" />
        <StatCard label="New registrations" value={formatPoints(m.newRegs)} icon={<UserPlus />} hint="last 30 days" />
        <StatCard label="Points in circulation" value={formatPoints(m.circulation)} icon={<Coins />} hint="sum of all balances" />
        <StatCard label="Total games played" value={formatPoints(m.games)} icon={<Gamepad2 />} hint="sessions across all games" />
        <StatCard label="Point transactions" value={formatPoints(m.txCount)} icon={<ReceiptText />} hint="all-time ledger entries" />
        <StatCard label="Blocked accounts" value={formatPoints(users.filter((u) => u.status === "blocked").length)} icon={<Users />} hint="need review" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="User growth" description="Cumulative accounts by month" action={<Legend items={[{ label: "Registered", color: SERIES.a }, { label: "Guests", color: SERIES.b }]} />} />
          <div className="p-5 pt-4"><GrowthChart data={m.growth} /></div>
        </Card>
        <Card>
          <CardHeader title="Virtual points activity" description="Weekly points credited vs debited, last 12 weeks" action={<Legend items={[{ label: "Credited", color: SERIES.a }, { label: "Debited", color: SERIES.b }]} />} />
          <div className="p-5 pt-4"><PointsChart data={m.points} /></div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader title="Recent transactions" action={<Link href="/admin/transactions" className="text-[13px] font-medium text-gold-700 hover:underline">View all</Link>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-slate-50/70 text-xs text-slate-500">
                <tr><th className="px-5 py-2.5 text-left font-medium">Transaction</th><th className="px-3 py-2.5 text-left font-medium">User</th><th className="px-3 py-2.5 text-left font-medium">Type</th><th className="px-3 py-2.5 text-right font-medium">Points</th><th className="px-5 py-2.5 text-left font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {m.recentTx.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3"><span className="ad-mono text-[13px] text-slate-900">{t.id}</span><p className="text-xs text-slate-400">{formatDateTime(t.timestamp)}</p></td>
                    <td className="px-3 py-3"><Link href={`/admin/users/${t.userId}`} className="font-medium text-slate-800 hover:text-gold-700">{t.userName}</Link></td>
                    <td className="px-3 py-3"><TxTypeBadge type={t.type} /></td>
                    <td className={`px-3 py-3 text-right font-medium tabular-nums ${t.credit ? "text-emerald-700" : "text-slate-700"}`}>{t.credit ? `+${formatPoints(t.credit)}` : `−${formatPoints(t.debit)}`}</td>
                    <td className="px-5 py-3"><TxStatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title="Top active users" description="By games played" />
          <ol className="divide-y divide-slate-100">
            {m.top.map((u, i) => (
              <li key={u.id}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/60">
                  <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                  <Avatar name={u.name} tone="light" size={32} />
                  <span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium text-slate-900">{u.name}</b><span className="text-xs text-slate-500">{u.accountType} · {formatCompact(u.balance)} pts</span></span>
                  <span className="text-sm font-semibold tabular-nums text-slate-800">{u.gamesPlayed}<span className="ml-1 text-xs font-normal text-slate-400">games</span></span>
                </Link>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent user activity" description="Latest actions across the platform" />
        <ul className="divide-y divide-slate-100">
          {m.feed.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <Avatar name={a.userName} tone="light" size={28} />
              <p className="min-w-0 flex-1 text-slate-600"><Link href={`/admin/users/${a.userId}`} className="font-medium text-slate-900 hover:text-gold-700">{a.userName}</Link> {a.text}</p>
              <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.timestamp)}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
