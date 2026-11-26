"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Coins, HandCoins, Pencil, UsersRound, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, Card, CardHeader, EmptyState, PageHeader, StatCard, Th } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { byId, clientsOf, masterStats, txsOfMaster } from "@/features/access/selectors";
import { AccountFormModal, AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { CoinTxTable, StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate } from "@/lib/utils";

export default function MasterDetailPage({ params }: { params: { id: string } }) {
  const { data } = useAccess();
  const [allocate, setAllocate] = useState(false);
  const [edit, setEdit] = useState(false);
  const master = byId(data, params.id);
  const stats = useMemo(() => (master?.role === "master" ? masterStats(data, master) : null), [data, master]);

  if (!master || master.role !== "master" || !stats) {
    return (
      <Card>
        <EmptyState title="Master not found" body="This master doesn't exist." action={<Link href="/super-admin/masters" className="text-sm font-medium text-slate-700 underline">Back to masters</Link>} />
      </Card>
    );
  }
  const clients = clientsOf(data, master.id);

  return (
    <div>
      <Link href="/super-admin/masters" className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5" /> All masters</Link>
      <PageHeader
        title={master.name}
        description={`@${master.username} · ${master.id} · created ${formatDate(master.createdAt)}${master.email ? ` · ${master.email}` : ""}`}
        actions={
          <>
            <StatusPill status={master.status} />
            <AButton onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</AButton>
            <AButton variant="gold" onClick={() => setAllocate(true)} disabled={master.status !== "active"}><Coins className="h-4 w-4" /> Allocate coins</AButton>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available coins" value={coins(stats.available)} icon={<Wallet />} hint="ready to distribute" />
        <StatCard label="Distributed to clients" value={coins(stats.distributed)} icon={<HandCoins />} hint="net of returns" />
        <StatCard label="Total issued" value={coins(stats.received)} icon={<Coins />} hint="from Super Admin" />
        <StatCard label="Clients" value={String(stats.clients)} icon={<UsersRound />} hint={`${stats.activeClients} active`} />
      </div>

      <Card className="mt-6">
        <CardHeader title="Clients" description="Read-only view of this master's clients and their coin balances." />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70"><tr><Th>Client</Th><Th>Status</Th><Th align="right">Coin balance</Th><Th>Created</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3"><span className="flex items-center gap-3"><Avatar name={c.name} tone="light" size={30} /><span><b className="block font-medium text-slate-900">{c.name}</b><span className="ad-mono text-[11px] text-slate-400">@{c.username} · {c.id}</span></span></span></td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{coins(c.balance)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!clients.length && <EmptyState title="No clients yet" body="This master hasn't created any clients." />}
        </div>
      </Card>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-slate-900">Coin history</h2>
      <CoinTxTable txs={txsOfMaster(data, master.id)} perspective={master.id} />

      <AllocateCoinsModal target={allocate ? master : null} onClose={() => setAllocate(false)} />
      <AccountFormModal open={edit} role="master" account={master} onClose={() => setEdit(false)} />
    </div>
  );
}
