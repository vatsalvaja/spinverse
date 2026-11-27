"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ReceiptText, RotateCcw } from "lucide-react";
import { AButton, AInput, ASelect, Badge, Card, EmptyState, PageHeader, Pagination, SearchInput, StatCard, Th } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf, masterStats, txsOfMaster } from "@/features/access/selectors";
import { TX_KIND_LABEL, type CoinTxKind } from "@/features/access/types";
import { KindBadge, coins } from "@/features/access/ui/shared";
import { formatDateTime } from "@/lib/utils";

export default function MasterTransactions() {
  const { data, current } = useAccess();
  const me = current?.role === "master" ? current : null;

  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | CoinTxKind>("all");
  const [clientId, setClientId] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const clients = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const allTxs = useMemo(() => (me ? txsOfMaster(data, me.id) : []), [data, me]);
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fromMs = from ? new Date(`${from}T00:00:00Z`).getTime() : -Infinity;
    const toMs = to ? new Date(`${to}T23:59:59Z`).getTime() : Infinity;
    return allTxs.filter((t) => {
      const ms = new Date(t.timestamp).getTime();
      const matchesClient = clientId === "all" || t.toId === clientId || t.fromId === clientId;
      const matchesStatus = statusFilter === "all" || statusFilter === "completed";
      return (
        (kind === "all" || t.kind === kind) &&
        matchesClient &&
        matchesStatus &&
        ms >= fromMs &&
        ms <= toMs &&
        (!s || [t.id, t.fromName, t.toName, t.note].join(" ").toLowerCase().includes(s))
      );
    });
  }, [allTxs, q, kind, clientId, statusFilter, from, to]);

  if (!me || !stats) return null;

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const visible = rows.slice((cur - 1) * pageSize, cur * pageSize);
  const filtersOn = !!q || kind !== "all" || clientId !== "all" || statusFilter !== "all" || !!from || !!to;
  const reset = () => { setQ(""); setKind("all"); setClientId("all"); setStatusFilter("all"); setFrom(""); setTo(""); setPage(1); };

  const incomingCount = allTxs.filter((t) => t.kind === "master_allocation").length;
  const outgoingCount = allTxs.filter((t) => t.kind === "client_allocation").length;

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Incoming coins from Super Admin and outgoing allocations to your clients."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Incoming from Super Admin" value={coins(stats.received)} icon={<ArrowDownLeft />} hint={`${incomingCount} transfer(s)`} />
        <StatCard label="Outgoing to clients" value={coins(stats.distributed)} icon={<ArrowUpRight />} hint={`${outgoingCount} allocation(s)`} />
        <StatCard label="Transactions" value={String(rows.length)} icon={<ReceiptText />} hint={filtersOn ? `of ${allTxs.length} total` : "all ledger entries"} />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:col-span-2 lg:col-span-2">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Transaction ID, client name or note" aria-label="Search transactions" />
          </div>
          <ASelect label="Type" value={kind} onChange={(e) => { setKind(e.target.value as "all" | CoinTxKind); setPage(1); }}>
            <option value="all">All types</option>
            <option value="master_allocation">Incoming from Super Admin</option>
            <option value="client_allocation">Outgoing client allocation</option>
            <option value="client_reclaim">{TX_KIND_LABEL.client_reclaim}</option>
          </ASelect>
          <ASelect label="Client" value={clientId} onChange={(e) => { setClientId(e.target.value); setPage(1); }}>
            <option value="all">All clients</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </ASelect>
          <ASelect label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as "all" | "completed"); setPage(1); }}>
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
          </ASelect>
          <div className="grid grid-cols-2 gap-2">
            <AInput label="From" type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            <AInput label="To" type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
        </div>

        {filtersOn && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[13px] text-slate-600">
            <span>{rows.length} matching {rows.length === 1 ? "transaction" : "transactions"}</span>
            <AButton variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset filters</AButton>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                <Th>Transaction ID</Th>
                <Th>Type</Th>
                <Th>Client / Counterparty</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Your balance after</Th>
                <Th>Date and time</Th>
                <Th>Status</Th>
                <Th>Note</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((t) => {
                const incoming = t.toId === me.id;
                const counterpartyName = incoming ? t.fromName : t.toName;
                const counterpartyId = incoming ? t.fromId : t.toId;
                const isClient = clients.some((c) => c.id === counterpartyId);
                const myBalanceAfter = incoming ? t.toBalanceAfter : t.fromBalanceAfter;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="ad-mono px-4 py-3 text-[13px] text-slate-800">{t.id}</td>
                    <td className="px-4 py-3"><KindBadge kind={t.kind} /></td>
                    <td className="px-4 py-3">
                      {isClient ? (
                        <Link href={`/master/clients/${counterpartyId}`} className="font-medium text-slate-900 hover:text-gold-700">
                          {counterpartyName}
                        </Link>
                      ) : (
                        <span className="font-medium text-slate-800">{counterpartyName}</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${incoming ? "text-emerald-700" : "text-rose-700"}`}>
                      {incoming ? "+" : "−"}{coins(t.amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                      {myBalanceAfter === null ? "—" : coins(myBalanceAfter)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(t.timestamp)}</td>
                    <td className="px-4 py-3"><Badge tone="green" dot>Completed</Badge></td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-500" title={t.note}>{t.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState
              title={filtersOn ? "No transactions found" : "No transactions yet"}
              body={filtersOn ? "Adjust the search, date range or filters to widen the results." : "Coins you receive from Super Admin and allocate to clients will appear here."}
              action={filtersOn ? <AButton onClick={reset}>Reset filters</AButton> : undefined}
            />
          )}
        </div>
        <Pagination page={cur} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </Card>
    </div>
  );
}
