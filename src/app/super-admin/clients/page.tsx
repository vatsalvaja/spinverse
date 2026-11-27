"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, UsersRound } from "lucide-react";
import { AButton, ASelect, Card, EmptyState, PageHeader, SearchInput, StatCard, Th } from "@/components/admin/ui";
import { Avatar } from "@/components/ui/avatar";
import { useAccess } from "@/features/access/AccessProvider";
import { allClients, masters } from "@/features/access/selectors";
import { StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate } from "@/lib/utils";

export default function SuperAdminClientsPage() {
  const { data } = useAccess();
  const [q, setQ] = useState("");
  const [masterId, setMasterId] = useState("all");
  const [status, setStatus] = useState("all");

  const masterList = useMemo(() => masters(data), [data]);
  const masterMap = useMemo(() => new Map(masterList.map((m) => [m.id, m])), [masterList]);
  const clients = useMemo(() => allClients(data), [data]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return clients.filter((c) => {
      const m = c.parentId ? masterMap.get(c.parentId) : undefined;
      return (
        (masterId === "all" || c.parentId === masterId) &&
        (status === "all" || c.status === status) &&
        (!s || [c.name, c.username, c.email, c.id, m?.name ?? ""].join(" ").toLowerCase().includes(s))
      );
    });
  }, [clients, masterMap, q, masterId, status]);

  const totalBalance = rows.reduce((s, c) => s + c.balance, 0);
  const filtersOn = !!q || masterId !== "all" || status !== "all";
  const reset = () => { setQ(""); setMasterId("all"); setStatus("all"); };

  return (
    <div>
      <PageHeader
        title="Client Management"
        description="System-wide directory of all client accounts across all masters (Super Admin visibility)."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total clients" value={String(clients.length)} icon={<UsersRound />} hint="across all masters" />
        <StatCard label="Active clients" value={String(clients.filter((c) => c.status === "active").length)} icon={<UsersRound />} hint="allowed to sign in" />
        <StatCard label="Total client coins" value={coins(totalBalance)} icon={<UsersRound />} hint={filtersOn ? "matching filters" : "in client wallets"} />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Client name, @username, ID or master" aria-label="Search clients" />
          </div>
          <ASelect label="Owning Master" value={masterId} onChange={(e) => setMasterId(e.target.value)}>
            <option value="all">All masters</option>
            {masterList.map((m) => <option key={m.id} value={m.id}>{m.name} (@{m.username})</option>)}
          </ASelect>
          <ASelect label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </ASelect>
        </div>

        {filtersOn && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[13px] text-slate-600">
            <span>{rows.length} matching {rows.length === 1 ? "client" : "clients"}</span>
            <AButton variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-3.5 w-3.5" /> Reset filters</AButton>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr><Th>Client</Th><Th>Owning Master</Th><Th>Status</Th><Th align="right">Coin balance</Th><Th>Created</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => {
                const owner = c.parentId ? masterMap.get(c.parentId) : undefined;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} tone="light" size={34} />
                        <div>
                          <p className="font-medium text-slate-900">{c.name}</p>
                          <p className="ad-mono text-[11px] text-slate-400">@{c.username} · {c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {owner ? (
                        <Link href={`/super-admin/masters/${owner.id}`} className="font-medium text-gold-700 hover:underline">
                          {owner.name} <span className="ad-mono text-xs text-slate-400">({owner.id})</span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{coins(c.balance)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <EmptyState
              title="No clients found"
              body={filtersOn ? "Try adjusting your search or filters." : "Clients created by masters will appear here."}
              action={filtersOn ? <AButton onClick={reset}>Reset filters</AButton> : undefined}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
