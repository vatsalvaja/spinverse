"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, ASelect, Card, EmptyState, PageHeader, SearchInput, Th } from "@/components/admin/ui";
import { ConfirmModal } from "@/components/admin/UserDialogs";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf } from "@/features/access/selectors";
import type { Account } from "@/features/access/types";
import { AccountFormModal, AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate } from "@/lib/utils";

export default function ClientsPage() {
  const { data, current, setClientStatus, deleteClient } = useAccess();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [allocate, setAllocate] = useState<Account | null>(null);
  const [form, setForm] = useState<{ open: boolean; account: Account | null }>({ open: false, account: null });
  const [toggle, setToggle] = useState<Account | null>(null);
  const [remove, setRemove] = useState<Account | null>(null);

  const me = current?.role === "master" ? current : null;
  const all = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return all.filter((c) => (status === "all" || c.status === status) && (!s || [c.name, c.username, c.email, c.id].join(" ").toLowerCase().includes(s)));
  }, [all, q, status]);
  if (!me) return null;

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
        title="Clients"
        description="Create client logins, switch them on or off and allocate coins from your balance."
        actions={<>
          <span className="rounded-lg bg-white px-3 py-2 text-[13px] text-slate-600 shadow-panel ring-1 ring-slate-200">Available <b className="font-semibold tabular-nums text-slate-900">{coins(me.balance)}</b> coins</span>
          <AButton variant="primary" onClick={() => setForm({ open: true, account: null })}><Plus className="h-4 w-4" /> Create client</AButton>
        </>}
      />

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, username or ID" aria-label="Search clients" />
          </div>
          <ASelect label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </ASelect>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr><Th>Client</Th><Th>Status</Th><Th align="right">Coin balance</Th><Th>Created</Th><Th align="right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/master/clients/${c.id}`} className="flex items-center gap-3">
                      <Avatar name={c.name} tone="light" size={34} />
                      <span><b className="block font-medium text-slate-900 hover:text-gold-700">{c.name}</b><span className="ad-mono text-[11px] text-slate-400">@{c.username} · {c.id}</span></span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{coins(c.balance)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <AButton size="sm" variant="gold" onClick={() => setAllocate(c)} disabled={c.status !== "active" || me.balance <= 0} title={c.status !== "active" ? "Activate the client first" : me.balance <= 0 ? "You have no coins to allocate" : undefined}>Allocate</AButton>
                      <AButton size="sm" onClick={() => setForm({ open: true, account: c })} aria-label={`Edit ${c.name}`} title="Edit"><Pencil className="h-3.5 w-3.5" /></AButton>
                      <AButton size="sm" onClick={() => setToggle(c)} aria-label={`${c.status === "active" ? "Deactivate" : "Activate"} ${c.name}`} title={c.status === "active" ? "Deactivate" : "Activate"}><Power className="h-3.5 w-3.5" /></AButton>
                      <AButton size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setRemove(c)} aria-label={`Delete ${c.name}`} title="Delete"><Trash2 className="h-3.5 w-3.5" /></AButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && (
            <EmptyState
              title={all.length ? "No clients match" : "No clients yet"}
              body={all.length ? "Adjust the search or status filter." : "Create your first client to give them a login and coins."}
              action={all.length ? undefined : <AButton variant="primary" onClick={() => setForm({ open: true, account: null })}>Create client</AButton>}
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
