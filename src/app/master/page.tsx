"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { svDiag } from "@/lib/diag"; // [sv-diag]
import { Activity, Coins, Gamepad2, HandCoins, Plus, UserCheck, UsersRound, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, ALinkButton, Badge, Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf, masterStats, txsOfMaster } from "@/features/access/selectors";
import type { Account } from "@/features/access/types";
import { AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { CoinTxTable, StatusPill, coins } from "@/features/access/ui/shared";
import { formatDateTime, formatPoints } from "@/lib/utils";
import { buildClientActivityFeed, buildSampleClientGameActivity, useMasterProfile } from "./_lib/masterData";

export default function MasterDashboard() {
  const { data, current } = useAccess();
  const [target, setTarget] = useState<Account | null>(null);

  const me = current?.role === "master" ? current : null;
  const profile = useMasterProfile(me);
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);
  const clients = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const allMasterTxs = useMemo(() => (me ? txsOfMaster(data, me.id) : []), [data, me]);
  const recent = useMemo(() => allMasterTxs.slice(0, 5), [allMasterTxs]);
  const sampleGames = useMemo(() => buildSampleClientGameActivity(clients), [clients]);
  const activityFeed = useMemo(
    () => buildClientActivityFeed(clients, allMasterTxs, sampleGames).slice(0, 7),
    [clients, allMasterTxs, sampleGames],
  );

  useEffect(() => svDiag(me && stats ? "page:master:mounted" : "page:master:returned-null", { hasMaster: !!me, clients: clients.length }), [me, stats]); // eslint-disable-line react-hooks/exhaustive-deps -- [sv-diag]
  if (!me || !stats) return null;

  const inactiveClients = stats.clients - stats.activeClients;
  const max = Math.max(1, ...clients.map((c) => c.balance));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${profile.displayName}`}
        description="Your clients, coin balances, recent allocations and client activity at a glance."
        actions={
          <>
            <ALinkButton href="/master/coins" variant="gold"><Coins className="h-4 w-4" /> Allocate coins</ALinkButton>
            <ALinkButton href="/master/clients" variant="primary"><Plus className="h-4 w-4" /> Manage clients</ALinkButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total clients" value={String(stats.clients)} icon={<UsersRound />} hint="accounts under you" />
        <StatCard label="Active / Inactive" value={`${stats.activeClients} / ${inactiveClients}`} icon={<UserCheck />} hint={`${stats.activeClients} active · ${inactiveClients} inactive`} />
        <StatCard label="Available coins" value={coins(stats.available)} icon={<Wallet />} hint="ready to allocate" />
        <StatCard label="Total received" value={coins(stats.received)} icon={<Coins />} hint="from Super Admin" />
        <StatCard label="Total distributed" value={coins(stats.distributed)} icon={<HandCoins />} hint="net allocated to clients" />
        <StatCard label="Held by clients" value={coins(stats.heldByClients)} icon={<Coins />} hint="in client wallets" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader
            title="Client-wise coin balance overview"
            description="What each of your clients holds right now."
            action={<ALinkButton href="/master/clients" size="sm">All clients</ALinkButton>}
          />
          {clients.length === 0 ? (
            <EmptyState title="No clients yet" body="Create your first client, then allocate coins to them." action={<ALinkButton href="/master/clients" variant="primary">Create a client</ALinkButton>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {clients.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                  <Avatar name={c.name} tone="light" size={34} />
                  <div className="min-w-[140px] flex-1">
                    <Link href={`/master/clients/${c.id}`} className="text-sm font-medium text-slate-900 hover:text-gold-700">{c.name}</Link>
                    <p className="ad-mono text-[11px] text-slate-400">@{c.username} · {c.id}</p>
                  </div>
                  <StatusPill status={c.status} />
                  <div className="hidden w-36 sm:block">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-sky-600" style={{ width: `${(c.balance / max) * 100}%` }} />
                    </div>
                  </div>
                  <span className="w-24 text-right text-sm font-semibold tabular-nums text-slate-900">{coins(c.balance)}</span>
                  <AButton size="sm" variant="gold" onClick={() => setTarget(c)} disabled={c.status !== "active" || me.balance <= 0}>Allocate</AButton>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Recent client activity"
            description="Latest coin movements and sample gameplay"
            action={<ALinkButton href="/master/reports" size="sm" variant="ghost">Reports</ALinkButton>}
          />
          {activityFeed.length === 0 ? (
            <EmptyState title="No client activity yet" body="Create a client or allocate coins to see activity here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {activityFeed.map((a) => (
                <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    {a.kind === "game_play" ? <Gamepad2 className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      <Link href={`/master/clients/${a.clientId}`} className="font-semibold text-slate-900 hover:text-gold-700">{a.clientName}</Link>
                      {" · "}
                      {a.summary}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">{a.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge tone={a.kind === "coin_in" ? "blue" : a.kind === "coin_reclaim" ? "amber" : "slate"}>
                      {a.kind === "game_play" ? "Game (sample)" : a.kind === "coin_in" ? "Coins" : "Reclaim"}
                    </Badge>
                    <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(a.timestamp)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-slate-900">Recent transactions</h2>
          <ALinkButton href="/master/transactions" size="sm" variant="ghost">View all ({formatPoints(allMasterTxs.length)})</ALinkButton>
        </div>
        {recent.length ? <CoinTxTable txs={recent} perspective={me.id} /> : <Card><EmptyState title="No transactions yet" body="Coins received from Super Admin and allocated to clients will appear here." /></Card>}
      </div>

      <AllocateCoinsModal target={target} onClose={() => setTarget(null)} />
    </div>
  );
}
