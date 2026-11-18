"use client";

import { useMemo } from "react";
import { GrowthChart, Legend, SERIES, SingleBars } from "@/components/admin/charts";
import { Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { gameStats, userGrowthSeries } from "@/data/derive";
import { GAMES } from "@/data/games";
import { useDemoData } from "@/data/provider";
import { TX_TYPE_LABEL, type TxType } from "@/data/types";
import { formatPoints } from "@/lib/utils";

export default function AnalyticsPage() {
  const { users, transactions } = useDemoData();

  const data = useMemo(() => {
    const stats = gameStats(transactions);
    const byType = (Object.keys(TX_TYPE_LABEL) as TxType[]).map((t) => ({
      label: TX_TYPE_LABEL[t].replace("Points ", "").replace("Admin ", ""),
      value: transactions.filter((x) => x.type === t && x.status === "completed").reduce((s, x) => s + x.credit + x.debit, 0),
    }));
    const countries = new Map<string, number>();
    users.forEach((u) => countries.set(u.country, (countries.get(u.country) ?? 0) + 1));
    return {
      sessions: GAMES.map((g) => ({ label: g.name.split(" ")[0], value: stats[g.id].sessions })),
      byType,
      growth: userGrowthSeries(users),
      countries: Array.from(countries.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6),
      tiers: ["Platinum", "Gold", "Silver", "Bronze", "Guest"].map((t) => ({ tier: t, count: users.filter((u) => u.membership === t).length })),
    };
  }, [users, transactions]);
  const maxC = Math.max(...data.countries.map((c) => c[1]));
  const maxT = Math.max(...data.tiers.map((c) => c.count));

  return (
    <div>
      <PageHeader title="Analytics" description="Engagement, points flow and audience mix, all computed from the same mock ledger." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Sessions by game" description="Completed play sessions, all time" />
          <div className="p-5 pt-4"><SingleBars data={data.sessions} label="Sessions" /></div>
        </Card>
        <Card>
          <CardHeader title="Points volume by transaction type" description="Total points moved (credits + debits)" />
          <div className="p-5 pt-4"><SingleBars data={data.byType} color={SERIES.b} label="Points moved" /></div>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title="Audience growth" description="Cumulative accounts by month" action={<Legend items={[{ label: "Registered", color: SERIES.a }, { label: "Guests", color: SERIES.b }]} />} />
          <div className="p-5 pt-4"><GrowthChart data={data.growth} /></div>
        </Card>
        <Card>
          <CardHeader title="Top countries" description="Accounts by country" />
          <ul className="space-y-3 p-5">
            {data.countries.map(([c, n]) => (
              <li key={c}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-700">{c}</span><span className="font-medium tabular-nums text-slate-900">{n}</span></div>
                <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(n / maxC) * 100}%`, background: SERIES.a }} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Membership tiers" description="Accounts by tier" />
          <ul className="space-y-3 p-5">
            {data.tiers.map((t) => (
              <li key={t.tier}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-700">{t.tier}</span><span className="font-medium tabular-nums text-slate-900">{formatPoints(t.count)}</span></div>
                <div className="h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${(t.count / maxT) * 100}%`, background: SERIES.a }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
