"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Coins, Pencil, Wallet } from "lucide-react";
import { AButton, Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { byId, txsOfAccount } from "@/features/access/selectors";
import { AccountFormModal, AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { CoinTxTable, StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate } from "@/lib/utils";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data, current } = useAccess();
  const [allocate, setAllocate] = useState(false);
  const [edit, setEdit] = useState(false);

  // a master can only open their own clients; anything else looks exactly like a missing client
  const client = byId(data, params.id);
  const me = current?.role === "master" ? current : null;
  if (!me) return null;
  if (!client || client.role !== "client" || client.parentId !== me.id) {
    return (
      <Card>
        <EmptyState title="Client not found" body="This client doesn't exist in your account." action={<Link href="/master/clients" className="text-sm font-medium text-slate-700 underline">Back to clients</Link>} />
      </Card>
    );
  }
  const received = data.txs.filter((t) => t.kind === "client_allocation" && t.toId === client.id).reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <Link href="/master/clients" className="mb-4 inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 hover:text-slate-900"><ArrowLeft className="h-3.5 w-3.5" /> All clients</Link>
      <PageHeader
        title={client.name}
        description={`@${client.username} · ${client.id} · created ${formatDate(client.createdAt)}${client.email ? ` · ${client.email}` : ""}`}
        actions={
          <>
            <StatusPill status={client.status} />
            <AButton onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</AButton>
            <AButton variant="gold" onClick={() => setAllocate(true)} disabled={client.status !== "active" || me.balance <= 0}><Coins className="h-4 w-4" /> Allocate coins</AButton>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Coin balance" value={coins(client.balance)} icon={<Wallet />} hint="in their game dashboard" />
        <StatCard label="Received from you" value={coins(received)} icon={<Coins />} hint="all allocations" />
        <StatCard label="Your available coins" value={coins(me.balance)} icon={<Wallet />} hint="left to distribute" />
      </div>

      <h2 className="mb-3 mt-8 text-[15px] font-semibold text-slate-900">Coin history</h2>
      <CoinTxTable txs={txsOfAccount(data, client.id)} perspective={client.id} emptyBody="No coins have been allocated to this client yet." />

      <AllocateCoinsModal target={allocate ? client : null} onClose={() => setAllocate(false)} />
      <AccountFormModal open={edit} role="client" account={client} onClose={() => setEdit(false)} />
    </div>
  );
}
