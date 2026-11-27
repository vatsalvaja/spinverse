"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Download, MoreHorizontal, RotateCcw } from "lucide-react";
import { AccountBadge, StatusBadge } from "@/components/admin/badges";
import { AButton, Card, EmptyState, PageHeader, Pagination, SearchInput, SortHeader, Th, ASelect } from "@/components/admin/ui";
import { useUserActions } from "@/components/admin/useUserActions";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { useDemoData } from "@/data/provider";
import type { UserRecord } from "@/data/types";
import { formatDate, formatPoints, timeAgo } from "@/lib/utils";

type SortKey = "id" | "name" | "username" | "email" | "accountType" | "registeredAt" | "balance" | "gamesPlayed" | "lastActive" | "status";

function UsersTable({ basePath }: { basePath: string }) {
  const { users } = useDemoData();
  const toast = useToast();
  const params = useSearchParams();
  const { itemsFor, dialogs } = useUserActions(basePath);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "registeredAt", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => { setQ(params.get("q") ?? ""); setPage(1); }, [params]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = users.filter(
      (u) =>
        (type === "all" || u.accountType === type) &&
        (status === "all" || u.status === status) &&
        (!s || [u.id, u.name, u.username, u.email].join(" ").toLowerCase().includes(s)),
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return filtered.sort((a, b) => {
      const av = a[sort.key as keyof UserRecord] as string | number;
      const bv = b[sort.key as keyof UserRecord] as string | number;
      return (typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv))) * dir;
    });
  }, [users, q, type, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);
  const filtersOn = q || type !== "all" || status !== "all";

  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const head = (key: SortKey, label: string, align: "left" | "right" = "left") => (
    <SortHeader label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggle(key)} align={align} />
  );

  return (
    <>
      <PageHeader
        title="User Management"
        description={`${users.length} accounts · ${users.filter((u) => u.accountType === "Registered").length} registered, ${users.filter((u) => u.accountType === "Guest").length} guest (demo player ledger)`}
        actions={<AButton onClick={() => toast("Exported users.csv (demo: no file is created).", "info")}><Download className="h-4 w-4" /> Export CSV</AButton>}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end">
          <div className="flex flex-1 flex-col gap-1 text-xs font-medium text-slate-500">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Name, username, email or user ID" aria-label="Search users" />
          </div>
          <ASelect label="Account type" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="lg:w-40">
            <option value="all">All types</option><option value="Registered">Registered</option><option value="Guest">Guest</option>
          </ASelect>
          <ASelect label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="lg:w-40">
            <option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option>
          </ASelect>
          {filtersOn && <AButton variant="ghost" onClick={() => { setQ(""); setType("all"); setStatus("all"); setPage(1); }}><RotateCcw className="h-4 w-4" /> Reset</AButton>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                {head("id", "User ID")}
                {head("name", "User")}
                {head("username", "Username")}
                {head("email", "Email")}
                {head("accountType", "Account type")}
                {head("registeredAt", "Registered")}
                {head("balance", "Points balance", "right")}
                {head("gamesPlayed", "Games played", "right")}
                {head("lastActive", "Last active")}
                {head("status", "Status")}
                <Th align="right"><span className="sr-only">Actions</span></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((u) => (
                <tr key={u.id} className="group hover:bg-slate-50/70">
                  <td className="px-4 py-3"><Link href={`${basePath}/users/${u.id}`} className="ad-mono text-[13px] text-slate-700 hover:text-gold-700">{u.id}</Link></td>
                  <td className="px-4 py-3">
                    <Link href={`${basePath}/users/${u.id}`} className="flex items-center gap-3">
                      <Avatar name={u.name} tone="light" size={32} />
                      <span className="font-medium text-slate-900 group-hover:text-gold-700">{u.name}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">@{u.username}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email || <span className="text-slate-400">—</span>}</td>
                  <td className="px-4 py-3"><AccountBadge type={u.accountType} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(u.registeredAt)}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-900">{formatPoints(u.balance)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-700">{u.gamesPlayed}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{timeAgo(u.lastActive)}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <Menu
                      label={`Actions for ${u.name}`}
                      triggerClassName="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      trigger={<MoreHorizontal className="h-4 w-4" />}
                      items={itemsFor(u)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!visible.length && (
            <EmptyState title="No users match these filters" body="Try a different search term or reset the filters." action={<AButton onClick={() => { setQ(""); setType("all"); setStatus("all"); }}>Reset filters</AButton>} />
          )}
        </div>
        <Pagination page={current} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </Card>
      {dialogs}
    </>
  );
}

export function AdminUsersView({ basePath = "/super-admin" }: { basePath?: string }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading users…</p>}>
      <UsersTable basePath={basePath} />
    </Suspense>
  );
}
