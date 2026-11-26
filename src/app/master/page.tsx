"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Coins, HandCoins, Plus, UsersRound, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, ALinkButton, Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf, masterStats, txsOfMaster } from "@/features/access/selectors";
import type { Account } from "@/features/access/types";
import { AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { CoinTxTable, StatusPill, coins } from "@/features/access/ui/shared";

export default function MasterDashboard() {
  const { data, current } = useAccess();
  const [target, setTarget] = useState<Account | null>(null);

  // everything on this page is scoped to the signed-in master
  const me = current?.role === "master" ? current : null;
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);
  const clients = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const recent = useMemo(() => (me ? txsOfMaster(data, me.id).slice(0, 5) : []), [data, me]);
  if (!me || !stats) return null;

  const max = Math.max(1, ...clients.map((c) => c.balance));

  return (
    <div>
      <PageHeader
        title={`Welcome, ${me.name}`}
        description="Your coins, your clients. Coins you allocate show up in the client's game dashboard straight away."
        actions={<ALinkButton href="/master/clients" variant="primary"><Plus className="h-4 w-4" /> Manage clients</ALinkButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total clients" value={String(stats.clients)} icon={<UsersRound />} hint={`${stats.activeClients} active`} />
        <StatCard label="Available coins" value={coins(stats.available)} icon={<Wallet />} hint="ready to distribute" />
        <StatCard label="Distributed coins" value={coins(stats.distributed)} icon={<HandCoins />} hint="given to clients" />
        <StatCard label="Total received" value={coins(stats.received)} icon={<Coins />} hint="from Super Admin" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Client coin balances" description="What each of your clients holds right now." action={<ALinkButton href="/master/clients" size="sm">All clients</ALinkButton>} />
        {clients.length === 0 ? (
          <EmptyState title="No clients yet" body="Create your first client, then allocate coins to them." action={<ALinkButton href="/master/clients" variant="primary">Create a client</ALinkButton>} />
        ) : (
          <ul className="divide-y divide-slate-100">
            {clients.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                <Avatar name={c.name} tone="light" size={34} />
                <div className="min-w-[140px] flex-1">
                  <Link href={`/master/clients/${c.id}`} className="text-sm font-medium text-slate-900 hover:text-gold-700">{c.name}</Link>
                  <p className="ad-mono text-[11px] text-slate-400">@{c.username}</p>
                </div>
                <StatusPill status={c.status} />
                <div className="hidden w-40 sm:block"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-sky-600" style={{ width: `${(c.balance / max) * 100}%` }} /></div></div>
                <span className="w-24 text-right text-sm font-semibold tabular-nums text-slate-900">{coins(c.balance)}</span>
                <AButton size="sm" variant="gold" onClick={() => setTarget(c)} disabled={c.status !== "active" || me.balance <= 0}>Allocate</AButton>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">Recent coin activity</h2>
        <ALinkButton href="/master/transactions" size="sm" variant="ghost">View all</ALinkButton>
      </div>
      {recent.length ? <CoinTxTable txs={recent} perspective={me.id} /> : <Card><EmptyState title="No coin activity yet" body="Coins you receive and allocate will be listed here." /></Card>}

      <AllocateCoinsModal target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
