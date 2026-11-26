"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Pencil, Plus, Power } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, Card, EmptyState, PageHeader, SearchInput, Th } from "@/components/admin/ui";
import { ConfirmModal } from "@/components/admin/UserDialogs";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { masterStats, masters } from "@/features/access/selectors";
import type { Account } from "@/features/access/types";
import { AccountFormModal, AllocateCoinsModal } from "@/features/access/ui/CoinDialogs";
import { StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate } from "@/lib/utils";

export default function MastersPage() {
  const { data, setMasterStatus } = useAccess();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [allocate, setAllocate] = useState<Account | null>(null);
  const [form, setForm] = useState<{ open: boolean; account: Account | null }>({ open: false, account: null });
  const [toggle, setToggle] = useState<Account | null>(null);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return masters(data)
      .filter((m) => !s || [m.name, m.username, m.email, m.id].join(" ").toLowerCase().includes(s))
      .map((m) => masterStats(data, m));
  }, [data, q]);

  const confirmToggle = () => {
    if (!toggle) return;
    const next = toggle.status === "active" ? "inactive" : "active";
    const res = setMasterStatus(toggle.id, next);
    toast(res.ok ? `${toggle.name} is now ${next}.` : res.error, res.ok ? "success" : "error");
  };

  return (
    <div>
      <PageHeader
        title="Master management"
        description="Every master, their coin balances and the clients they run. Allocate coins here; masters pass them on to their own clients."
        actions={<AButton variant="primary" onClick={() => setForm({ open: true, account: null })}><Plus className="h-4 w-4" /> Create master</AButton>}
      />

      <Card>
        <div className="border-b border-slate-100 p-4">
          <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search masters by name, username or ID" aria-label="Search masters" className="max-w-sm" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr><Th>Master</Th><Th>Status</Th><Th align="right">Clients</Th><Th align="right">Coins issued</Th><Th align="right">Available</Th><Th align="right">Distributed</Th><Th>Created</Th><Th align="right">Actions</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.master.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/super-admin/masters/${r.master.id}`} className="flex items-center gap-3">
                      <Avatar name={r.master.name} tone="light" size={34} />
                      <span><b className="block font-medium text-slate-900 hover:text-gold-700">{r.master.name}</b><span className="ad-mono text-[11px] text-slate-400">@{r.master.username} · {r.master.id}</span></span>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={r.master.status} /></td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{r.clients}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{coins(r.received)}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{coins(r.available)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{coins(r.distributed)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(r.master.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1.5">
                      <AButton size="sm" variant="gold" onClick={() => setAllocate(r.master)} disabled={r.master.status !== "active"}>Allocate</AButton>
                      <AButton size="sm" onClick={() => setForm({ open: true, account: r.master })} aria-label={`Edit ${r.master.name}`}><Pencil className="h-3.5 w-3.5" /></AButton>
                      <AButton size="sm" onClick={() => setToggle(r.master)} aria-label={`${r.master.status === "active" ? "Deactivate" : "Activate"} ${r.master.name}`} title={r.master.status === "active" ? "Deactivate" : "Activate"}><Power className="h-3.5 w-3.5" /></AButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState title="No masters found" body={q ? "Try a different search." : "Create a master to get started."} />}
        </div>
      </Card>

      <AllocateCoinsModal target={allocate} onClose={() => setAllocate(null)} />
      <AccountFormModal open={form.open} role="master" account={form.account} onClose={() => setForm((f) => ({ ...f, open: false }))} />
      <ConfirmModal
        open={!!toggle}
        title={toggle?.status === "active" ? "Deactivate master?" : "Activate master?"}
        body={toggle?.status === "active" ? `${toggle.name} will no longer be able to log in or receive coins. Their clients and balances are kept.` : `${toggle?.name} will be able to log in and receive coins again.`}
        confirmLabel={toggle?.status === "active" ? "Deactivate" : "Activate"}
        danger={toggle?.status === "active"}
        onConfirm={confirmToggle}
        onClose={() => setToggle(null)}
      />
    </div>
  );
}
