"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Coins, Gamepad2, MoreHorizontal, Pencil, PlusCircle, RotateCw } from "lucide-react";
import { AccountBadge, StatusBadge, TxStatusBadge, TxTypeBadge } from "@/components/admin/badges";
import { AdjustPointsModal } from "@/components/admin/UserDialogs";
import { AButton, ALinkButton, Card, CardHeader, EmptyState, Pagination, Th } from "@/components/admin/ui";
import { useUserActions } from "@/components/admin/useUserActions";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { activityFeed, recentGamesFor } from "@/data/derive";
import { GAME_BY_ID } from "@/data/games";
import { useDemoData } from "@/data/provider";
import type { TxType } from "@/data/types";
import { cn, formatDate, formatDateTime, formatPoints, timeAgo } from "@/lib/utils";

const FILTERS: { value: "all" | TxType; label: string }[] = [
  { value: "all", label: "All transactions" },
  { value: "earned", label: "Points earned" },
  { value: "spent", label: "Points spent" },
  { value: "reward", label: "Rewards" },
  { value: "bonus", label: "Bonus points" },
  { value: "adjustment", label: "Admin adjustments" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { getUser, transactionsFor, users } = useDemoData();
  const { itemsFor, dialogs, edit } = useUserActions();
  const [filter, setFilter] = useState<"all" | TxType>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [adjusting, setAdjusting] = useState(false);

  const user = getUser(id);
  const all = useMemo(() => (user ? transactionsFor(user.id) : []), [user, transactionsFor]);
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: all.length };
    for (const t of all) c[t.type] = (c[t.type] ?? 0) + 1;
    return c;
  }, [all]);

  if (!user) {
    return (
      <Card>
        <EmptyState title="User not found" body={`No account exists with ID ${id}.`} action={<ALinkButton href="/admin/users" variant="primary">Back to users</ALinkButton>} />
      </Card>
    );
  }

  const filtered = all.filter((t) => filter === "all" || t.type === filter);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * pageSize, current * pageSize);
  const games = recentGamesFor(all, 5);
  const activity = activityFeed([user], all.filter((t) => t.userId === user.id), 6);
  const rank = [...users].sort((a, b) => b.balance - a.balance).findIndex((u) => u.id === user.id) + 1;

  return (
    <div>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-3.5 w-3.5" /> All users
      </Link>

      <Card className="mb-6">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <Avatar name={user.name} tone="light" size={60} />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-slate-900">{user.name}</h1>
              <p className="mt-0.5 text-sm text-slate-500">@{user.username} · <span className="ad-mono">{user.id}</span></p>
              <div className="mt-2 flex flex-wrap gap-2"><AccountBadge type={user.accountType} /><StatusBadge status={user.status} /></div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AButton onClick={() => edit(user)}><Pencil className="h-4 w-4" /> Edit profile</AButton>
            <AButton variant="primary" onClick={() => setAdjusting(true)} disabled={user.status === "blocked"}><PlusCircle className="h-4 w-4" /> Adjust points</AButton>
            <Menu label="More actions" triggerClassName="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50" trigger={<MoreHorizontal className="h-4 w-4" />} items={itemsFor(user, { includeView: false })} />
          </div>
        </div>
        {user.status === "blocked" && <div className="border-t border-rose-100 bg-rose-50 px-6 py-2.5 text-[13px] text-rose-700">This account is blocked. Unblock it from the actions menu to adjust points.</div>}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Current balance", value: formatPoints(user.balance), icon: Coins, note: `#${rank} by balance` },
          { label: "Total points earned", value: formatPoints(user.totalEarned), icon: ArrowDownLeft, note: "all credits" },
          { label: "Total points spent", value: formatPoints(user.totalSpent), icon: ArrowUpRight, note: "all debits" },
          { label: "Total games played", value: formatPoints(user.gamesPlayed), icon: Gamepad2, note: `${formatPoints(user.totalSpins)} spins` },
        ].map(({ label, value, icon: Icon, note }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between"><p className="text-[13px] font-medium text-slate-500">{label}</p><Icon className="h-4 w-4 text-slate-400" /></div>
            <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-500">{note}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Personal information" />
          <dl className="divide-y divide-slate-100 px-5 py-1">
            <Field label="Full name">{user.name}</Field>
            <Field label="Email">{user.email || <span className="text-slate-400">Not provided</span>}</Field>
            <Field label="Date of birth">{user.accountType === "Guest" ? <span className="text-slate-400">Unknown</span> : formatDate(user.dob)}</Field>
            <Field label="Country">{user.country}</Field>
          </dl>
        </Card>
        <Card>
          <CardHeader title="Account information" />
          <dl className="divide-y divide-slate-100 px-5 py-1">
            <Field label="Username">@{user.username}</Field>
            <Field label="Membership">{user.membership}</Field>
            <Field label="Registered">{formatDate(user.registeredAt)}</Field>
            <Field label="Last login">{formatDateTime(user.lastLogin)}</Field>
            <Field label="Last active">{timeAgo(user.lastActive)}</Field>
            <Field label="Favorite game">{GAME_BY_ID[user.favoriteGame].name}</Field>
          </dl>
        </Card>
        <Card>
          <CardHeader title="Recent activity" />
          <ul className="divide-y divide-slate-100">
            {activity.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-slate-600">{a.text.charAt(0).toUpperCase() + a.text.slice(1)}</span>
                <span className="shrink-0 text-xs text-slate-400">{timeAgo(a.timestamp)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent games" description="Latest sessions with points spent and returned" />
        {games.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50/70"><tr><Th>Game</Th><Th>Played</Th><Th align="right">Spins</Th><Th align="right">Points spent</Th><Th align="right">Points returned</Th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {games.map((g) => (
                  <tr key={g.sessionId}>
                    <td className="px-4 py-3"><span className="flex items-center gap-2 font-medium text-slate-900"><span className="h-2.5 w-2.5 rounded-full" style={{ background: GAME_BY_ID[g.game].accent }} />{GAME_BY_ID[g.game].name}</span></td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(g.timestamp)}</td>
                    <td className="px-4 py-3 text-right tabular-nums"><RotateCw className="mr-1 inline h-3 w-3 text-slate-400" />{g.spins}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(g.spent)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{formatPoints(g.returned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState title="No games yet" body="This player hasn’t started a session." />}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Virtual points transaction history" description={`${all.length} entries · complete ledger for ${user.name}`} />
        <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-4 py-3" role="tablist" aria-label="Transaction filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              className={cn("flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium transition", filter === f.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {f.label}
              <span className={cn("rounded px-1.5 text-[11px] tabular-nums", filter === f.value ? "bg-white/20" : "bg-slate-100 text-slate-500")}>{counts[f.value] ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50/70">
              <tr><Th>Transaction ID</Th><Th>Date and time</Th><Th>Type</Th><Th>Description</Th><Th align="right">Credited</Th><Th align="right">Debited</Th><Th align="right">Balance after</Th><Th>Status</Th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 ad-mono text-[13px] text-slate-800">{t.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(t.timestamp)}</td>
                  <td className="px-4 py-3"><TxTypeBadge type={t.type} /></td>
                  <td className="max-w-[280px] truncate px-4 py-3 text-slate-700" title={t.description}>{t.description}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-700">{t.credit ? `+${formatPoints(t.credit)}` : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-700">{t.debit ? `−${formatPoints(t.debit)}` : <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-900">{formatPoints(t.balanceAfter)}</td>
                  <td className="px-4 py-3"><TxStatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState title="No transactions in this category" body="Choose another filter to see the rest of the ledger." action={<AButton onClick={() => setFilter("all")}>Show all transactions</AButton>} />}
        </div>
        <Pagination page={current} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </Card>

      <AdjustPointsModal user={user} open={adjusting} onClose={() => setAdjusting(false)} />
      {dialogs}
    </div>
  );
}
