"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Coins, Gamepad2, Pencil, Power, Wallet } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, Badge, Card, CardHeader, EmptyState, PageHeader, StatCard, Th } from "@/components/admin/ui";
import { ConfirmModal } from "@/components/admin/UserDialogs";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { byId, txsOfAccount } from "@/features/access/selectors";
import { AccountFormModal, AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { CoinTxTable, StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate, formatDateTime, formatPoints } from "@/lib/utils";
import { buildSampleClientGameActivity } from "../../_lib/masterData";

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data, current, setClientStatus } = useAccess();
  const toast = useToast();
  const [allocate, setAllocate] = useState(false);
  const [edit, setEdit] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState(false);

  const client = byId(data, params.id);
  const me = current?.role === "master" ? current : null;

  const gameSessions = useMemo(
    () => (client ? buildSampleClientGameActivity([client]) : []),
    [client],
  );

  if (!me) return null;
  if (!client || client.role !== "client" || client.parentId !== me.id) {
    return (
      <Card>
        <EmptyState title="Client not found" body="This client doesn't exist in your account." action={<Link href="/master/clients" className="text-sm font-medium text-slate-700 underline">Back to clients</Link>} />
      </Card>
    );
  }

  const received = data.txs.filter((t) => t.kind === "client_allocation" && t.toId === client.id).reduce((s, t) => s + t.amount, 0);
  const totalSpins = gameSessions.reduce((s, g) => s + g.spins, 0);
  const totalWagered = gameSessions.reduce((s, g) => s + g.wagered, 0);
  const totalWon = gameSessions.reduce((s, g) => s + g.won, 0);

  const toggleStatus = () => {
    const next = client.status === "active" ? "inactive" : "active";
    const res = setClientStatus(client.id, next);
    toast(res.ok ? `${client.name} is now ${next}.` : res.error, res.ok ? "success" : "error");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/master/clients" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-3.5 w-3.5" /> All clients
        </Link>

        <Card className="mb-6 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={client.name} tone="light" size={56} />
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl font-semibold tracking-tight text-slate-900">{client.name}</h1>
                  <StatusPill status={client.status} />
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  <span className="ad-mono">@{client.username}</span> · <span className="ad-mono">{client.id}</span> · created {formatDate(client.createdAt)}
                  {client.email ? ` · ${client.email}` : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <AButton onClick={() => setEdit(true)}><Pencil className="h-4 w-4" /> Edit</AButton>
              <AButton onClick={() => setConfirmStatus(true)}>
                <Power className="h-4 w-4" /> {client.status === "active" ? "Deactivate" : "Activate"}
              </AButton>
              <AButton variant="gold" onClick={() => setAllocate(true)} disabled={client.status !== "active" || me.balance <= 0}>
                <Coins className="h-4 w-4" /> Allocate coins
              </AButton>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Coin balance" value={coins(client.balance)} icon={<Wallet />} hint="in their game dashboard" />
          <StatCard label="Received from you" value={coins(received)} icon={<Coins />} hint="all allocations" />
          <StatCard label="Your available coins" value={coins(me.balance)} icon={<Wallet />} hint="left to distribute" />
          <StatCard label="Sample game sessions" value={String(gameSessions.length)} icon={<Gamepad2 />} hint={`${formatPoints(totalSpins)} total spins`} />
        </div>
      </div>

      <Card>
        <CardHeader
          title="Client game activity (sample data)"
          description={`Sample gameplay sessions for ${client.name} · ${formatPoints(totalWagered)} wagered · ${formatPoints(totalWon)} won`}
          action={<Badge tone="slate">Demo sample</Badge>}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                <Th>Session</Th><Th>Game</Th><Th>Category</Th><Th align="right">Spins</Th><Th align="right">Wagered</Th><Th align="right">Won</Th><Th align="right">Net</Th><Th>Played at</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gameSessions.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/60">
                  <td className="ad-mono px-4 py-3 text-xs text-slate-600">{g.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{g.gameName}</td>
                  <td className="px-4 py-3 text-slate-600">{g.category}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{g.spins}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(g.wagered)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{formatPoints(g.won)}</td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${g.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {g.net >= 0 ? `+${formatPoints(g.net)}` : `−${formatPoints(Math.abs(g.net))}`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(g.playedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Client transaction history</h2>
        <CoinTxTable txs={txsOfAccount(data, client.id)} perspective={client.id} emptyBody="No coins have been allocated to this client yet." />
      </div>

      <AllocateCoinsModal target={allocate ? client : null} onClose={() => setAllocate(false)} />
      <AccountFormModal open={edit} role="client" account={client} onClose={() => setEdit(false)} />
      <ConfirmModal
        open={confirmStatus}
        title={client.status === "active" ? "Deactivate client?" : "Activate client?"}
        body={client.status === "active" ? `${client.name} will no longer be able to sign in or receive coins. Their balance is kept.` : `${client.name} will be able to sign in and receive coins again.`}
        confirmLabel={client.status === "active" ? "Deactivate" : "Activate"}
        danger={client.status === "active"}
        onConfirm={toggleStatus}
        onClose={() => setConfirmStatus(false)}
      />
    </div>
  );
}
