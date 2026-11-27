"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Download, ReceiptText, RotateCcw } from "lucide-react";
import { TxStatusBadge, TxTypeBadge } from "@/components/admin/badges";
import { AButton, AInput, ASelect, Card, EmptyState, PageHeader, Pagination, SearchInput, SortHeader, StatCard } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { useDemoData } from "@/data/provider";
import { TX_TYPE_LABEL, type Transaction } from "@/data/types";
import { formatDateTime, formatPoints } from "@/lib/utils";

type SortKey = "id" | "userName" | "type" | "amount" | "previousBalance" | "balanceAfter" | "timestamp" | "status";
const amountOf = (t: Transaction) => (t.credit ? t.credit : -t.debit);

export function AdminTransactionsView({ basePath = "/super-admin", embedded = false }: { basePath?: string; embedded?: boolean }) {
  const { transactions, users } = useDemoData();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [userId, setUserId] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "timestamp", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const fromMs = from ? new Date(`${from}T00:00:00Z`).getTime() : -Infinity;
    const toMs = to ? new Date(`${to}T23:59:59Z`).getTime() : Infinity;
    const list = transactions.filter((t) => {
      const ms = new Date(t.timestamp).getTime();
      return (
        (userId === "all" || t.userId === userId) &&
        (type === "all" || t.type === type) &&
        (status === "all" || t.status === status) &&
        ms >= fromMs && ms <= toMs &&
        (!s || [t.id, t.userName, t.userId, t.description].join(" ").toLowerCase().includes(s))
      );
    });
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      if (sort.key === "amount") return (amountOf(a) - amountOf(b)) * dir;
      const av = a[sort.key as keyof Transaction] as string | number;
      const bv = b[sort.key as keyof Transaction] as string | number;
      return (typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv))) * dir;
    });
  }, [transactions, q, userId, type, status, from, to, sort]);

  const completed = rows.filter((t) => t.status === "completed");
  const credited = completed.reduce((s, t) => s + t.credit, 0);
  const debited = completed.reduce((s, t) => s + t.debit, 0);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);
  const filtersOn = q || userId !== "all" || type !== "all" || status !== "all" || from || to;
  const reset = () => { setQ(""); setUserId("all"); setType("all"); setStatus("all"); setFrom(""); setTo(""); setPage(1); };
  const reflow = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1); };

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  const head = (key: SortKey, label: string, align: "left" | "right" = "left") => <SortHeader label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggle(key)} align={align} />;

  return (
    <div>
      {!embedded && (
        <PageHeader
          title="Transactions"
          description="Every virtual points movement across all accounts. Points have no cash value."
          actions={<AButton onClick={() => toast("Exported transactions.csv (demo: no file is created).", "info")}><Download className="h-4 w-4" /> Export CSV</AButton>}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total points credited" value={formatPoints(credited)} icon={<ArrowDownLeft />} hint={filtersOn ? "matching filters" : "all time, completed"} />
        <StatCard label="Total points debited" value={formatPoints(debited)} icon={<ArrowUpRight />} hint={filtersOn ? "matching filters" : "all time, completed"} />
        <StatCard label="Total transactions" value={formatPoints(rows.length)} icon={<ReceiptText />} hint={filtersOn ? `of ${formatPoints(transactions.length)} total` : "ledger entries"} />
      </div>

      <Card className="mt-6">
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="flex flex-col gap-1 text-xs font-medium text-slate-500 sm:col-span-2 lg:col-span-2">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => reflow(setQ)(e.target.value)} placeholder="Transaction ID, user or description" aria-label="Search transactions" />
          </div>
          <ASelect label="User" value={userId} onChange={(e) => reflow(setUserId)(e.target.value)}>
            <option value="all">All users</option>
            {[...users].sort((a, b) => a.name.localeCompare(b.name)).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </ASelect>
          <ASelect label="Type" value={type} onChange={(e) => reflow(setType)(e.target.value)}>
            <option value="all">All types</option>
            {Object.entries(TX_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </ASelect>
          <ASelect label="Status" value={status} onChange={(e) => reflow(setStatus)(e.target.value)}>
            <option value="all">All statuses</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option>
          </ASelect>
          <div className="grid grid-cols-2 gap-2">
            <AInput label="From" type="date" value={from} max={to || undefined} onChange={(e) => reflow(setFrom)(e.target.value)} />
            <AInput label="To" type="date" value={to} min={from || undefined} onChange={(e) => reflow(setTo)(e.target.value)} />
          </div>
        </div>
        {filtersOn && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[13px] text-slate-600">
            <span>{rows.length} matching {rows.length === 1 ? "transaction" : "transactions"}</span>
            <AButton variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset filters</AButton>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                {head("id", "Transaction ID")}
                {head("userName", "User")}
                {head("type", "Type")}
                {head("amount", "Points amount", "right")}
                {head("previousBalance", "Previous balance", "right")}
                {head("balanceAfter", "New balance", "right")}
                {head("timestamp", "Date and time")}
                {head("status", "Status")}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 ad-mono text-[13px] text-slate-800">{t.id}</td>
                  <td className="px-4 py-3"><Link href={`${basePath}/users/${t.userId}`} className="font-medium text-slate-900 hover:text-gold-700">{t.userName}</Link><p className="ad-mono text-[11px] text-slate-400">{t.userId}</p></td>
                  <td className="px-4 py-3"><TxTypeBadge type={t.type} /></td>
                  <td className={`px-4 py-3 text-right font-semibold tabular-nums ${t.credit ? "text-emerald-700" : "text-slate-700"}`}>{t.credit ? `+${formatPoints(t.credit)}` : `−${formatPoints(t.debit)}`}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-500">{formatPoints(t.previousBalance)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">{formatPoints(t.balanceAfter)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(t.timestamp)}</td>
                  <td className="px-4 py-3"><TxStatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && <EmptyState title="No transactions found" body="Adjust the search, date range or filters to widen the results." action={<AButton onClick={reset}>Reset filters</AButton>} />}
        </div>
        <Pagination page={current} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </Card>
    </div>
  );
}
