"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Power, RotateCcw, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, ALinkButton, ASelect, Card, EmptyState, PageHeader, SearchInput, StatCard, Th } from "@/components/admin/ui";
import { ConfirmModal } from "@/components/admin/UserDialogs";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf } from "@/features/access/selectors";
import type { Account } from "@/features/access/types";
import { AccountFormModal, AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate, formatPoints } from "@/lib/utils";
import { buildSampleClientGameActivity } from "../_lib/masterData";

type SortBy = "created_desc" | "balance_desc" | "balance_asc" | "name_asc";

export default function ClientsPage() {
  const { data, current, setClientStatus, deleteClient } = useAccess();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState<SortBy>("created_desc");
  const [allocate, setAllocate] = useState<Account | null>(null);
  const [form, setForm] = useState<{ open: boolean; account: Account | null }>({ open: false, account: null });
  const [toggle, setToggle] = useState<Account | null>(null);
  const [remove, setRemove] = useState<Account | null>(null);

  const me = current?.role === "master" ? current : null;
  const all = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const sampleActivity = useMemo(() => buildSampleClientGameActivity(all), [all]);
  const activityByClient = useMemo(() => {
    const map = new Map<string, { sessions: number; spins: number }>();
    for (const s of sampleActivity) {
      const prev = map.get(s.clientId) ?? { sessions: 0, spins: 0 };
      map.set(s.clientId, { sessions: prev.sessions + 1, spins: prev.spins + s.spins });
    }
    return map;
  }, [sampleActivity]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = all.filter((c) => (status === "all" || c.status === status) && (!s || [c.name, c.username, c.email, c.id].join(" ").toLowerCase().includes(s)));
    return [...filtered].sort((a, b) => {
      if (sortBy === "balance_desc") return b.balance - a.balance;
      if (sortBy === "balance_asc") return a.balance - b.balance;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [all, q, status, sortBy]);

  if (!me) return null;

  const activeCount = all.filter((c) => c.status === "active").length;
  const totalHeld = all.reduce((s, c) => s + c.balance, 0);
  const filtersOn = !!q || status !== "all";
  const resetFilters = () => { setQ(""); setStatus("all"); };

  const confirmToggle = () => {
    if (!toggle) return;
    const next = toggle.status === "active" ? "inactive" : "active";
    const res = setClientStatus(toggle.id, next);
    toast(res.ok ? `${toggle.name} is now ${next}.` : res.error, res.ok ? "success" : "error");
  };
  const confirmDelete = () => {
    if (!remove) return;
    const res = deleteClient(remove.id);
    toast(res.ok ? (remove.balance > 0 ? `${remove.name} was deleted. ${coins(remove.balance)} coins returned to you.` : `${remove.name} was deleted.`) : res.error, res.ok ? "success" : "error");
  };

  return (
    <div>
      <PageHeader
        title="My Clients"
        description="Create and edit client logins, inspect profiles and game activity, toggle access, and allocate coins."
        actions={
          <>
            <span className="rounded-lg bg-white px-3 py-2 text-[13px] text-slate-600 shadow-panel ring-1 ring-slate-200">
              Available <b className="font-semibold tabular-nums text-slate-900">{coins(me.balance)}</b> coins
            </span>
            <AButton variant="primary" onClick={() => setForm({ open: true, account: null })}><Plus className="h-4 w-4" /> Add new client</AButton>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total clients" value={String(all.length)} icon={<Plus />} hint={`${activeCount} active · ${all.length - activeCount} inactive`} />
        <StatCard label="Coins held by clients" value={coins(totalHeld)} icon={<Power />} hint="across your clients" />
        <StatCard label="Sample game sessions" value={formatPoints(sampleActivity.length)} icon={<Eye />} hint="demo activity across clients" />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px_190px]">
          <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, @username, email or ID" aria-label="Search clients" />
          </div>
          <ASelect label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </ASelect>
          <ASelect label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="created_desc">Newest first</option>
            <option value="balance_desc">Balance (high to low)</option>
            <option value="balance_asc">Balance (low to high)</option>
            <option value="name_asc">Name (A–Z)</option>
          </ASelect>
        </div>

        {filtersOn && (
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[13px] text-slate-600">
            <span>{rows.length} matching {rows.length === 1 ? "client" : "clients"}</span>
            <AButton variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="h-3.5 w-3.5" /> Reset filters</AButton>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr><Th>Client</Th><Th>Status</Th><Th align="right">Coin balance</Th><Th align="right">Sample activity</Th><Th>Created</Th><Th align="right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => {
                const act = activityByClient.get(c.id) ?? { sessions: 0, spins: 0 };
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/master/clients/${c.id}`} className="flex items-center gap-3">
                        <Avatar name={c.name} tone="light" size={34} />
                        <span>
                          <b className="block font-medium text-slate-900 hover:text-gold-700">{c.name}</b>
                          <span className="ad-mono text-[11px] text-slate-400">@{c.username} · {c.id}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{coins(c.balance)}</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-600 tabular-nums">{act.sessions} sessions · {act.spins} spins</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <ALinkButton href={`/master/clients/${c.id}`} size="sm" variant="ghost"><Eye className="h-3.5 w-3.5" /> Profile</ALinkButton>
                        <AButton size="sm" variant="gold" onClick={() => setAllocate(c)} disabled={c.status !== "active" || me.balance <= 0} title={c.status !== "active" ? "Activate the client first" : me.balance <= 0 ? "You have no coins to allocate" : undefined}>Allocate</AButton>
                        <AButton size="sm" onClick={() => setForm({ open: true, account: c })} aria-label={`Edit ${c.name}`} title="Edit"><Pencil className="h-3.5 w-3.5" /></AButton>
                        <AButton size="sm" onClick={() => setToggle(c)} aria-label={`${c.status === "active" ? "Deactivate" : "Activate"} ${c.name}`} title={c.status === "active" ? "Deactivate" : "Activate"}><Power className="h-3.5 w-3.5" /></AButton>
                        <AButton size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setRemove(c)} aria-label={`Delete ${c.name}`} title="Delete"><Trash2 className="h-3.5 w-3.5" /></AButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!rows.length && (
            <EmptyState
              title={all.length ? "No clients match" : "No clients yet"}
              body={all.length ? "Adjust the search or status filter." : "Create your first client to give them a login and coins."}
              action={all.length ? <AButton onClick={resetFilters}>Reset filters</AButton> : <AButton variant="primary" onClick={() => setForm({ open: true, account: null })}>Add new client</AButton>}
            />
          )}
        </div>
      </Card>

      <AllocateCoinsModal target={allocate} onClose={() => setAllocate(null)} />
      <AccountFormModal open={form.open} role="client" account={form.account} onClose={() => setForm((f) => ({ ...f, open: false }))} />
      <ConfirmModal
        open={!!toggle}
        title={toggle?.status === "active" ? "Deactivate client?" : "Activate client?"}
        body={toggle?.status === "active" ? `${toggle.name} will be signed out and won't be able to log in or receive coins. Their balance is kept.` : `${toggle?.name} will be able to log in and receive coins again.`}
        confirmLabel={toggle?.status === "active" ? "Deactivate" : "Activate"}
        danger={toggle?.status === "active"}
        onConfirm={confirmToggle}
        onClose={() => setToggle(null)}
      />
      <ConfirmModal
        open={!!remove}
        title="Delete client?"
        body={remove ? `${remove.name}'s login will be removed.${remove.balance > 0 ? ` Their ${coins(remove.balance)} coins return to your balance.` : ""} This can't be undone.` : ""}
        confirmLabel="Delete client"
        danger
        onConfirm={confirmDelete}
        onClose={() => setRemove(null)}
      />
    </div>
  );
}
