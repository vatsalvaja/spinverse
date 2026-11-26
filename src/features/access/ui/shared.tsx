"use client";

import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { AButton, ASelect, Badge, Card, EmptyState, Pagination, SearchInput, Th, type Tone } from "@/components/admin/ui";
import { formatDateTime, formatPoints } from "@/lib/utils";
import { TX_KIND_LABEL, type AccessStatus, type CoinTx, type CoinTxKind } from "../types";

export function StatusPill({ status }: { status: AccessStatus }) {
  return <Badge tone={status === "active" ? "green" : "slate"} dot>{status === "active" ? "Active" : "Inactive"}</Badge>;
}

const KIND_TONE: Record<CoinTxKind, Tone> = { master_allocation: "gold", client_allocation: "blue", client_reclaim: "amber" };
export function KindBadge({ kind }: { kind: CoinTxKind }) {
  return <Badge tone={KIND_TONE[kind]}>{TX_KIND_LABEL[kind]}</Badge>;
}

export const coins = (n: number) => formatPoints(n);

/**
 * Searchable, paginated coin history. Pass `perspective` (an account id) to show amounts as in/out for that
 * account; without it the amount is shown plainly, as in the Super Admin's system-wide view.
 */
export function CoinTxTable({ txs, perspective, emptyBody = "Coin movements appear here as soon as coins are allocated." }: { txs: CoinTx[]; perspective?: string; emptyBody?: string }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return txs.filter((t) => (kind === "all" || t.kind === kind) && (!s || [t.id, t.fromName, t.toName, t.note].join(" ").toLowerCase().includes(s)));
  }, [txs, q, kind]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const visible = rows.slice((cur - 1) * pageSize, cur * pageSize);
  const filtersOn = !!q || kind !== "all";
  const reset = () => { setQ(""); setKind("all"); setPage(1); };

  return (
    <Card>
      <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
          <span>Search</span>
          <SearchInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Transaction ID, name or note" aria-label="Search coin transactions" />
        </div>
        <ASelect label="Type" value={kind} onChange={(e) => { setKind(e.target.value); setPage(1); }}>
          <option value="all">All types</option>
          {Object.entries(TX_KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </ASelect>
      </div>
      {filtersOn && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[13px] text-slate-600">
          <span>{rows.length} matching {rows.length === 1 ? "transaction" : "transactions"}</span>
          <AButton variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset filters</AButton>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/70">
            <tr>
              <Th>Transaction ID</Th><Th>Type</Th><Th>From → To</Th><Th align="right">Coins</Th><Th align="right">Sender after</Th><Th align="right">Receiver after</Th><Th>Date and time</Th><Th>Note</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.map((t) => {
              const sign = perspective ? (t.toId === perspective ? "+" : t.fromId === perspective ? "−" : "") : "";
              return (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="ad-mono px-4 py-3 text-[13px] text-slate-800">{t.id}</td>
                  <td className="px-4 py-3"><KindBadge kind={t.kind} /></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1.5 text-slate-800"><span className="font-medium">{t.fromName}</span><ArrowRight className="h-3.5 w-3.5 text-slate-400" /><span className="font-medium">{t.toName}</span></span></td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${sign === "+" ? "text-emerald-700" : sign === "−" ? "text-rose-700" : "text-slate-900"}`}>{sign}{coins(t.amount)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{t.fromBalanceAfter === null ? "Unlimited" : coins(t.fromBalanceAfter)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">{coins(t.toBalanceAfter)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(t.timestamp)}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-slate-500" title={t.note}>{t.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length && <EmptyState title={filtersOn ? "No transactions found" : "No transactions yet"} body={filtersOn ? "Adjust the search or type filter to widen the results." : emptyBody} action={filtersOn ? <AButton onClick={reset}>Reset filters</AButton> : undefined} />}
      </div>
      <Pagination page={cur} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
    </Card>
  );
}
