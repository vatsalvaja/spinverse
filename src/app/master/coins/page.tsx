"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertCircle, ArrowRight, Coins, HandCoins, Send, Wallet } from "lucide-react";
import { AButton, AInput, ASelect, Card, CardHeader, EmptyState, PageHeader, StatCard, Th } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf, masterStats, txsOfMaster } from "@/features/access/selectors";
import { MAX_ALLOCATION } from "@/features/access/types";
import { KindBadge, coins } from "@/features/access/ui/shared";
import { formatDateTime, formatPoints } from "@/lib/utils";

const QUICK = [500, 1000, 5000, 10000, 25000];

export default function MasterCoinManagementPage() {
  const { data, current, allocateToClient } = useAccess();
  const toast = useToast();

  const me = current?.role === "master" ? current : null;
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);
  const clients = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const history = useMemo(
    () => (me ? txsOfMaster(data, me.id).filter((t) => t.kind === "client_allocation" || t.kind === "client_reclaim") : []),
    [data, me],
  );

  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [filterClientId, setFilterClientId] = useState("all");

  if (!me || !stats) return null;

  const chosenId = selectedClientId && activeClients.some((c) => c.id === selectedClientId) ? selectedClientId : activeClients[0]?.id ?? "";
  const chosenClient = activeClients.find((c) => c.id === chosenId) ?? null;

  const n = amount.trim() === "" ? NaN : Number(amount);
  const validInt = Number.isInteger(n) && n > 0 && n <= MAX_ALLOCATION;
  const exceedsBalance = validInt && n > me.balance;

  const filteredHistory = filterClientId === "all"
    ? history
    : history.filter((t) => t.toId === filterClientId || t.fromId === filterClientId);

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenClient) {
      const msg = "Select an active client to allocate coins.";
      setError(msg);
      toast(msg, "error");
      return;
    }
    if (!validInt) {
      const msg = "Enter a valid whole number of coins greater than zero.";
      setError(msg);
      toast(msg, "error");
      return;
    }
    if (exceedsBalance) {
      const msg = `Cannot allocate ${formatPoints(n)} coins: only ${formatPoints(me.balance)} available.`;
      setError(msg);
      toast(msg, "error");
      return;
    }

    const res = allocateToClient(chosenClient.id, n, note);
    if (!res.ok) {
      setError(res.error);
      toast(res.error, "error");
      return;
    }

    toast(`Allocated ${formatPoints(n)} coins to ${chosenClient.name}.`, "success");
    setAmount("");
    setNote("");
    setError("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coin Management"
        description="Track your coin pool, allocate coins to active clients, and review client allocation history."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Available coin balance" value={coins(stats.available)} icon={<Wallet />} hint="ready to distribute" />
        <StatCard label="Total coins received" value={coins(stats.received)} icon={<Coins />} hint="issued by Super Admin" />
        <StatCard label="Total coins distributed" value={coins(stats.distributed)} icon={<HandCoins />} hint="net given to clients" />
        <StatCard label="Coins held by clients" value={coins(stats.heldByClients)} icon={<Coins />} hint={`${clients.length} total clients`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card>
          <CardHeader title="Allocate coins to client" description="Transfers move instantly from your available balance to the selected client." />
          <form onSubmit={handleAllocate} className="space-y-4 p-5" noValidate>
            {me.balance <= 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <span>Your available coin balance is 0. Ask Super Admin to allocate coins to your account before distributing to clients.</span>
              </div>
            )}

            <ASelect
              label="Select active client"
              value={chosenId}
              onChange={(e) => { setSelectedClientId(e.target.value); setError(""); }}
              disabled={activeClients.length === 0}
            >
              {activeClients.length === 0 ? (
                <option value="">No active clients available</option>
              ) : (
                activeClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (@{c.username}) · {coins(c.balance)} coins
                  </option>
                ))
              )}
            </ASelect>

            <div>
              <AInput
                label="Allocation amount"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(""); }}
                placeholder="e.g. 5000"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => { setAmount(String(q)); setError(""); }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    +{formatPoints(q)}
                  </button>
                ))}
                {me.balance > 0 && (
                  <button
                    type="button"
                    onClick={() => { setAmount(String(me.balance)); setError(""); }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-gold-700 ring-1 ring-gold-500/40 hover:bg-gold-50"
                  >
                    Max ({formatPoints(me.balance)})
                  </button>
                )}
              </div>
            </div>

            <AInput
              label="Note (optional)"
              value={note}
              maxLength={80}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly player top-up"
            />

            {chosenClient && validInt && !exceedsBalance && (
              <div className="rounded-lg bg-emerald-50 px-3 py-2.5 text-xs text-emerald-900 ring-1 ring-emerald-600/15">
                <p><b>{chosenClient.name}</b> new balance: <b className="tabular-nums">{coins(chosenClient.balance + n)}</b></p>
                <p className="mt-0.5">Your remaining balance: <b className="tabular-nums">{coins(me.balance - n)}</b></p>
              </div>
            )}

            {(error || (amount.trim() && (!validInt || exceedsBalance))) && (
              <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-rose-600/20">
                {error || (!validInt ? "Enter a whole number greater than zero." : `Insufficient balance: you only have ${coins(me.balance)} coins available.`)}
              </p>
            )}

            <AButton type="submit" variant="gold" className="w-full" disabled={activeClients.length === 0}>
              <Send className="h-4 w-4" /> Allocate coins
            </AButton>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Allocation history"
            description="Every client allocation and coin return under your Master account."
            action={
              <ASelect label="" aria-label="Filter by client" value={filterClientId} onChange={(e) => setFilterClientId(e.target.value)} className="w-48">
                <option value="all">All clients</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </ASelect>
            }
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[740px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr>
                  <Th>Transaction ID</Th>
                  <Th>Type</Th>
                  <Th>Client</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Your balance after</Th>
                  <Th>Allocation date</Th>
                  <Th>Note</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map((t) => {
                  const isOut = t.kind === "client_allocation";
                  const clientName = isOut ? t.toName : t.fromName;
                  const clientId = isOut ? t.toId : t.fromId;
                  const masterAfter = isOut ? t.fromBalanceAfter : t.toBalanceAfter;
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="ad-mono px-4 py-3 text-[13px] text-slate-800">{t.id}</td>
                      <td className="px-4 py-3"><KindBadge kind={t.kind} /></td>
                      <td className="px-4 py-3">
                        <Link href={`/master/clients/${clientId}`} className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-gold-700">
                          {clientName} <ArrowRight className="h-3 w-3 text-slate-400" />
                        </Link>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${isOut ? "text-rose-700" : "text-emerald-700"}`}>
                        {isOut ? "−" : "+"}{coins(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-600">{masterAfter === null ? "—" : coins(masterAfter)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(t.timestamp)}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-slate-500" title={t.note}>{t.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredHistory.length && (
              <EmptyState title="No allocation history yet" body="Allocations you make to clients will appear here with date, amount and updated balances." />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
