"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Coins, Download, FileBarChart, Gamepad2, HandCoins, RotateCcw, UsersRound, Wallet } from "lucide-react";
import { AButton, AInput, Badge, Card, CardHeader, EmptyState, PageHeader, StatCard, Th } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { GAMES } from "@/data/games";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf, masterStats, txsOfMaster } from "@/features/access/selectors";
import { StatusPill, coins } from "@/features/access/ui/shared";
import { cn, formatDate, formatDateTime, formatPoints } from "@/lib/utils";
import { buildSampleClientGameActivity, downloadCsv, receivedByClient } from "../_lib/masterData";

type ReportTab = "distribution" | "daily" | "clients" | "games";

export default function MasterReportsPage() {
  const { data, current } = useAccess();
  const toast = useToast();

  const me = current?.role === "master" ? current : null;
  const [tab, setTab] = useState<ReportTab>("distribution");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const clients = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);
  const masterTxs = useMemo(() => (me ? txsOfMaster(data, me.id) : []), [data, me]);
  const sampleGames = useMemo(() => buildSampleClientGameActivity(clients), [clients]);

  const fromMs = from ? new Date(`${from}T00:00:00Z`).getTime() : -Infinity;
  const toMs = to ? new Date(`${to}T23:59:59Z`).getTime() : Infinity;

  const filteredTxs = useMemo(() => {
    return masterTxs.filter((t) => {
      const ms = new Date(t.timestamp).getTime();
      return ms >= fromMs && ms <= toMs;
    });
  }, [masterTxs, fromMs, toMs]);

  const filteredSessions = useMemo(() => {
    return sampleGames.filter((s) => {
      const ms = new Date(s.playedAt).getTime();
      return ms >= fromMs && ms <= toMs;
    });
  }, [sampleGames, fromMs, toMs]);

  // 1. Client-wise coin distribution & balances
  const clientDistributionRows = useMemo(() => {
    if (!me) return [];
    const totalBalances = Math.max(1, clients.reduce((s, c) => s + c.balance, 0));
    return clients.map((c) => {
      const allocatedInRange = filteredTxs
        .filter((t) => t.kind === "client_allocation" && t.toId === c.id)
        .reduce((s, t) => s + t.amount, 0);
      const totalReceived = receivedByClient(data, me.id, c.id);
      return {
        client: c,
        allocatedInRange,
        totalReceived,
        balance: c.balance,
        sharePct: Math.round((c.balance / totalBalances) * 100),
      };
    });
  }, [clients, filteredTxs, data, me]);

  // 2. Date-wise transactions
  const dateWiseRows = useMemo(() => {
    const byDay = new Map<string, { date: string; received: number; distributed: number; reclaimed: number; count: number }>();
    for (const t of filteredTxs) {
      const day = t.timestamp.slice(0, 10);
      const row = byDay.get(day) ?? { date: day, received: 0, distributed: 0, reclaimed: 0, count: 0 };
      row.count += 1;
      if (t.kind === "master_allocation") row.received += t.amount;
      else if (t.kind === "client_allocation") row.distributed += t.amount;
      else if (t.kind === "client_reclaim") row.reclaimed += t.amount;
      byDay.set(day, row);
    }
    return Array.from(byDay.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredTxs]);

  // 3. Client activity (allocations + sample gameplay)
  const clientActivityRows = useMemo(() => {
    return clients.map((c) => {
      const sessions = filteredSessions.filter((s) => s.clientId === c.id);
      const txs = filteredTxs.filter((t) => t.toId === c.id || t.fromId === c.id);
      const lastTx = txs[0]?.timestamp ?? null;
      const lastPlay = sessions[0]?.playedAt ?? null;
      return {
        client: c,
        allocations: txs.filter((t) => t.kind === "client_allocation").reduce((s, t) => s + t.amount, 0),
        sessions: sessions.length,
        spins: sessions.reduce((s, x) => s + x.spins, 0),
        wagered: sessions.reduce((s, x) => s + x.wagered, 0),
        won: sessions.reduce((s, x) => s + x.won, 0),
        lastActivity: [lastTx, lastPlay].filter(Boolean).sort().pop() ?? c.createdAt,
      };
    });
  }, [clients, filteredSessions, filteredTxs]);

  // 4. Game-wise activity
  const gameWiseRows = useMemo(() => {
    return GAMES.map((g) => {
      const rows = filteredSessions.filter((s) => s.gameId === g.id);
      const uniqueClients = new Set(rows.map((r) => r.clientId)).size;
      const wagered = rows.reduce((s, r) => s + r.wagered, 0);
      const won = rows.reduce((s, r) => s + r.won, 0);
      return {
        game: g,
        sessions: rows.length,
        clients: uniqueClients,
        spins: rows.reduce((s, r) => s + r.spins, 0),
        wagered,
        won,
        rtpPct: wagered > 0 ? Math.round((won / wagered) * 100) : null,
      };
    });
  }, [filteredSessions]);

  if (!me || !stats) return null;

  const receivedInRange = filteredTxs.filter((t) => t.kind === "master_allocation").reduce((s, t) => s + t.amount, 0);
  const distributedInRange =
    filteredTxs.filter((t) => t.kind === "client_allocation").reduce((s, t) => s + t.amount, 0) -
    filteredTxs.filter((t) => t.kind === "client_reclaim").reduce((s, t) => s + t.amount, 0);

  const applyPreset = (days: number | null) => {
    if (days === null) {
      setFrom("");
      setTo("");
      return;
    }
    const end = new Date();
    const start = new Date(end.getTime() - days * 86_400_000);
    setFrom(start.toISOString().slice(0, 10));
    setTo(end.toISOString().slice(0, 10));
  };

  const exportCurrentCsv = () => {
    const suffix = from || to ? `_${from || "start"}_to_${to || "now"}` : "_all";
    if (tab === "distribution") {
      downloadCsv(
        `master_client_distribution${suffix}.csv`,
        ["Client ID", "Name", "Username", "Status", "Allocated (Range)", "Total Received", "Current Balance", "Balance Share %"],
        clientDistributionRows.map((r) => [r.client.id, r.client.name, r.client.username, r.client.status, r.allocatedInRange, r.totalReceived, r.balance, r.sharePct]),
      );
    } else if (tab === "daily") {
      downloadCsv(
        `master_daily_transactions${suffix}.csv`,
        ["Date (UTC)", "Transactions", "Received from Super Admin", "Distributed to Clients", "Reclaimed"],
        dateWiseRows.map((r) => [r.date, r.count, r.received, r.distributed, r.reclaimed]),
      );
    } else if (tab === "clients") {
      downloadCsv(
        `master_client_activity${suffix}.csv`,
        ["Client ID", "Name", "Allocations (Range)", "Sample Sessions", "Sample Spins", "Sample Wagered", "Sample Won", "Last Activity"],
        clientActivityRows.map((r) => [r.client.id, r.client.name, r.allocations, r.sessions, r.spins, r.wagered, r.won, r.lastActivity]),
      );
    } else {
      downloadCsv(
        `master_game_activity${suffix}.csv`,
        ["Game ID", "Game Name", "Category", "Sessions", "Active Clients", "Spins", "Wagered", "Won", "Return %"],
        gameWiseRows.map((r) => [r.game.id, r.game.name, r.game.category, r.sessions, r.clients, r.spins, r.wagered, r.won, r.rtpPct ?? ""]),
      );
    }
    toast("CSV report downloaded.", "success");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Coin distribution, client balances, date-wise transactions, and client/game activity reports."
        actions={<AButton variant="primary" onClick={exportCurrentCsv}><Download className="h-4 w-4" /> Export CSV</AButton>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Received (filtered)" value={coins(receivedInRange)} icon={<Coins />} hint={`All time: ${coins(stats.received)}`} />
        <StatCard label="Distributed (filtered)" value={coins(distributedInRange)} icon={<HandCoins />} hint={`All time: ${coins(stats.distributed)}`} />
        <StatCard label="Available balance" value={coins(stats.available)} icon={<Wallet />} hint="current spendable coins" />
        <StatCard label="Held by clients" value={coins(stats.heldByClients)} icon={<UsersRound />} hint={`${clients.length} clients`} />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <AInput label="From" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="w-40" />
          <AInput label="To" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="w-40" />
          <div className="flex flex-wrap gap-1.5">
            <AButton size="sm" onClick={() => applyPreset(7)}>Last 7d</AButton>
            <AButton size="sm" onClick={() => applyPreset(30)}>Last 30d</AButton>
            <AButton size="sm" onClick={() => applyPreset(90)}>Last 90d</AButton>
            {(from || to) && <AButton size="sm" variant="ghost" onClick={() => applyPreset(null)}><RotateCcw className="h-3.5 w-3.5" /> All time</AButton>}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Report categories">
        {[
          { id: "distribution", label: "Client Distribution & Balances", icon: Coins },
          { id: "daily", label: "Date-wise Transactions", icon: FileBarChart },
          { id: "clients", label: "Client Activity", icon: UsersRound },
          { id: "games", label: "Game-wise Activity", icon: Gamepad2 },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id as ReportTab)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition",
              tab === id ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "distribution" && (
        <Card>
          <CardHeader title="Client-wise coin distribution & balances" description="Current balances alongside allocations within the selected date range." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr><Th>Client</Th><Th>Status</Th><Th align="right">Allocated (range)</Th><Th align="right">Total received</Th><Th align="right">Current balance</Th><Th align="right">Balance share</Th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientDistributionRows.map((r) => (
                  <tr key={r.client.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link href={`/master/clients/${r.client.id}`} className="font-medium text-slate-900 hover:text-gold-700">{r.client.name}</Link>
                      <p className="ad-mono text-[11px] text-slate-400">@{r.client.username} · {r.client.id}</p>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={r.client.status} /></td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{coins(r.allocatedInRange)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{coins(r.totalReceived)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{coins(r.balance)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600">{r.sharePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!clientDistributionRows.length && <EmptyState title="No clients yet" body="Add clients to view coin distribution and balance reports." />}
          </div>
        </Card>
      )}

      {tab === "daily" && (
        <Card>
          <CardHeader title="Date-wise transactions" description="Daily totals of coins received from Super Admin, distributed to clients, and reclaimed." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr><Th>Date</Th><Th align="right">Transactions</Th><Th align="right">Received</Th><Th align="right">Distributed</Th><Th align="right">Reclaimed</Th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dateWiseRows.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{formatDate(`${r.date}T00:00:00Z`)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{r.count}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-emerald-700">+{coins(r.received)}</td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums text-sky-700">{coins(r.distributed)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-700">{coins(r.reclaimed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!dateWiseRows.length && <EmptyState title="No transactions in selected range" body="Adjust the date range or allocate coins to generate daily transaction totals." />}
          </div>
        </Card>
      )}

      {tab === "clients" && (
        <Card>
          <CardHeader title="Client activity report" description="Allocations plus sample gameplay metrics per client." action={<Badge tone="slate">Includes sample gameplay</Badge>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr><Th>Client</Th><Th align="right">Allocations (range)</Th><Th align="right">Sessions</Th><Th align="right">Spins</Th><Th align="right">Wagered</Th><Th align="right">Won</Th><Th>Last activity</Th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientActivityRows.map((r) => (
                  <tr key={r.client.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><Link href={`/master/clients/${r.client.id}`} className="font-medium text-slate-900 hover:text-gold-700">{r.client.name}</Link></td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{coins(r.allocations)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{r.sessions}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(r.spins)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(r.wagered)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{formatPoints(r.won)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(r.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!clientActivityRows.length && <EmptyState title="No client activity" body="Create clients to track their coin and game activity." />}
          </div>
        </Card>
      )}

      {tab === "games" && (
        <Card>
          <CardHeader title="Game-wise activity" description="Sample gameplay performance across your clients by game title." action={<Badge tone="slate">Demo sample</Badge>} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr><Th>Game</Th><Th>Category</Th><Th align="right">Sessions</Th><Th align="right">Clients</Th><Th align="right">Spins</Th><Th align="right">Wagered</Th><Th align="right">Won</Th><Th align="right">Return %</Th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gameWiseRows.map((r) => (
                  <tr key={r.game.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-900">{r.game.name}</td>
                    <td className="px-4 py-3 text-slate-600">{r.game.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{r.sessions}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{r.clients}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(r.spins)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(r.wagered)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{formatPoints(r.won)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{r.rtpPct === null ? "—" : `${r.rtpPct}%`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
