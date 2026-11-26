"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Coins, HandCoins, RotateCcw, UserCog, UsersRound, Wallet } from "lucide-react";
import { AButton, ALinkButton, Card, CardHeader, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { ConfirmModal } from "@/components/admin/UserDialogs";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { allClients, masterStats, masters } from "@/features/access/selectors";
import type { Account } from "@/features/access/types";
import { AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { CoinTxTable, StatusPill, coins } from "@/features/access/ui/shared";

export default function SuperAdminDashboard() {
  const { data, resetDemo } = useAccess();
  const toast = useToast();
  const [target, setTarget] = useState<Account | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const rows = useMemo(() => masters(data).map((m) => masterStats(data, m)), [data]);
  const clients = allClients(data);
  const issued = rows.reduce((s, r) => s + r.received, 0);
  const withMasters = rows.reduce((s, r) => s + r.available, 0);
  const heldByClients = rows.reduce((s, r) => s + r.heldByClients, 0);
  const recent = useMemo(() => [...data.txs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5), [data.txs]);
  const top = Math.max(1, ...rows.map((r) => r.received));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Issue coins to masters and follow them down to the clients who play. Coins are virtual and have no cash value."
        actions={<AButton onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" /> Reset demo data</AButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total masters" value={String(rows.length)} icon={<UserCog />} hint={`${rows.filter((r) => r.master.status === "active").length} active`} />
        <StatCard label="Total clients" value={String(clients.length)} icon={<UsersRound />} hint={`${clients.filter((c) => c.status === "active").length} active`} />
        <StatCard label="Coins issued" value={coins(issued)} icon={<Coins />} hint="allocated to masters" />
        <StatCard label="With masters" value={coins(withMasters)} icon={<Wallet />} hint="available to distribute" />
        <StatCard label="With clients" value={coins(heldByClients)} icon={<HandCoins />} hint="in player wallets" />
      </div>

      <Card className="mt-6">
        <CardHeader title="Coin distribution" description="Where the coins issued to each master are right now." action={<ALinkButton href="/super-admin/masters" size="sm">Manage masters</ALinkButton>} />
        <div className="space-y-5 p-5">
          {rows.length === 0 && <EmptyState title="No masters yet" body="Create a master to start allocating coins." />}
          {rows.map((r) => (
            <div key={r.master.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Link href={`/super-admin/masters/${r.master.id}`} className="text-sm font-semibold text-slate-900 hover:text-gold-700">{r.master.name}</Link>
                  <StatusPill status={r.master.status} />
                  <span className="text-xs text-slate-500">{r.clients} {r.clients === 1 ? "client" : "clients"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] text-slate-500">Issued <b className="font-semibold tabular-nums text-slate-900">{coins(r.received)}</b></span>
                  <AButton size="sm" variant="gold" onClick={() => setTarget(r.master)} disabled={r.master.status !== "active"}>Allocate coins</AButton>
                </div>
              </div>
              <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-slate-100" style={{ width: `${Math.max(8, (r.received / top) * 100)}%` }} role="img" aria-label={`${r.master.name}: ${coins(r.available)} available, ${coins(r.distributed)} distributed`}>
                <span className="h-full bg-amber-400" style={{ width: r.received ? `${(r.available / r.received) * 100}%` : 0 }} />
                <span className="h-full bg-sky-600" style={{ width: r.received ? `${(r.distributed / r.received) * 100}%` : 0 }} />
              </div>
              <p className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-amber-400" /> Available <b className="font-semibold tabular-nums text-slate-800">{coins(r.available)}</b></span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-sky-600" /> Distributed to clients <b className="font-semibold tabular-nums text-slate-800">{coins(r.distributed)}</b></span>
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mb-3 mt-8 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-slate-900">Recent coin activity</h2>
        <ALinkButton href="/super-admin/transactions" size="sm" variant="ghost">View all</ALinkButton>
      </div>
      {recent.length ? <CoinTxTable txs={recent} /> : <Card><EmptyState title="No coin activity yet" body="Allocate coins to a master and the movement shows up here." /></Card>}

      <AllocateCoinsModal target={target} onClose={() => setTarget(null)} />
      <ConfirmModal
        open={confirmReset}
        title="Reset demo data?"
        body="This restores the original demo accounts and clears every balance and coin transaction, including any masters or clients that were created."
        confirmLabel="Reset demo data"
        danger
        onConfirm={() => { resetDemo(); toast("Demo data was reset.", "info"); }}
        onClose={() => setConfirmReset(false)}
      />
    </div>
  );
}
