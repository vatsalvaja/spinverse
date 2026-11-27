"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, History, RefreshCw, ShieldCheck, Trophy, Wallet } from "lucide-react";
import { AButton, AInput, ASelect, Badge, Card, EmptyState, PageHeader, StatCard, Th } from "@/components/admin/ui";
import { BackendModeBanner } from "@/components/admin/views/BackendModeBanner";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { GAMES } from "@/data/games";
import { useDemoData } from "@/data/provider";
import {
  adminGameHistoryApi,
  BackendApiError,
  isBackendConfigured,
  type BackendHistoryStats,
  type BackendRoundAudit,
  type BackendRoundHistoryDetail,
  type BackendRoundHistoryItem,
} from "@/lib/adminBackendApi";
import { formatDateTime, formatPoints } from "@/lib/utils";

export default function SuperAdminGameHistoryPage() {
  const toast = useToast();
  const { transactions } = useDemoData();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [items, setItems] = useState<BackendRoundHistoryItem[]>([]);
  const [stats, setStats] = useState<BackendHistoryStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [gameId, setGameId] = useState("");
  const [status, setStatus] = useState("");
  const [outcome, setOutcome] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [inspectOpen, setInspectOpen] = useState(false);
  const [inspectBusy, setInspectBusy] = useState(false);
  const [detail, setDetail] = useState<BackendRoundHistoryDetail | null>(null);
  const [audit, setAudit] = useState<BackendRoundAudit | null>(null);

  const load = useCallback(async () => {
    const hasBackend = isBackendConfigured();
    setConnected(hasBackend);
    if (!hasBackend) {
      setItems([]);
      setStats(null);
      setApiError(null);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        adminGameHistoryApi.list({
          gameId: gameId || undefined,
          status: status || undefined,
          outcome: outcome || undefined,
          from: from ? `${from}T00:00:00.000Z` : undefined,
          to: to ? `${to}T23:59:59.999Z` : undefined,
          page,
          limit: 15,
        }),
        adminGameHistoryApi.stats({
          gameId: gameId || undefined,
          from: from ? `${from}T00:00:00.000Z` : undefined,
          to: to ? `${to}T23:59:59.999Z` : undefined,
        }),
      ]);
      setItems(listRes.items);
      setTotalPages(Math.max(1, listRes.meta.totalPages));
      setStats(statsRes);
    } catch (e) {
      setApiError(e instanceof BackendApiError ? e.message : "Failed to load game history.");
    } finally {
      setLoading(false);
    }
  }, [gameId, status, outcome, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const inspectRound = async (roundId: string) => {
    setInspectOpen(true);
    setInspectBusy(true);
    setDetail(null);
    setAudit(null);
    try {
      const [d, r] = await Promise.all([
        adminGameHistoryApi.detail(roundId),
        adminGameHistoryApi.roundAudit(roundId),
      ]);
      setDetail(d);
      setAudit(r.audit);
    } catch (e) {
      toast(e instanceof BackendApiError ? e.message : "Could not load round audit.", "error");
    } finally {
      setInspectBusy(false);
    }
  };

  // Read-only mock session preview from DemoDataProvider when backend is disconnected (no fake RNG seeds).
  const demoSessions = useMemo(() => {
    return transactions
      .filter((t) => (t.type === "spent" || t.type === "earned") && (!gameId || t.game === gameId))
      .slice(0, 20);
  }, [transactions, gameId]);

  return (
    <div>
      <PageHeader
        title="Game History & RNG Audit"
        description="Inspect settled and in-progress rounds, bets, payouts, wallet ledger links and server-side RNG seeds/commitments."
        actions={<AButton onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</AButton>}
      />

      <BackendModeBanner
        connected={connected}
        error={apiError}
        endpoints={["GET /admin/game-history", "GET /admin/game-history/stats", "GET /admin/game-history/:roundId", "GET /admin/game-rounds/:id"]}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Settled rounds" value={connected && stats ? formatPoints(stats.totalGames) : "—"} icon={<History />} hint={connected ? `${stats?.inProgress ?? 0} in progress` : "requires live backend"} />
        <StatCard label="Total wagered" value={connected && stats ? formatPoints(stats.wagered) : "—"} icon={<Wallet />} hint={connected && stats ? `Avg stake ${stats.averageStake}` : "requires live backend"} />
        <StatCard label="Total winnings" value={connected && stats ? formatPoints(stats.winnings) : "—"} icon={<Trophy />} hint={connected && stats ? `Win rate ${(stats.winRate * 100).toFixed(1)}%` : "requires live backend"} />
        <StatCard label="Biggest payout" value={connected && stats ? formatPoints(stats.biggestPayout) : "—"} icon={<ShieldCheck />} hint="verifiable via RNG seed" />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <ASelect label="Game" value={gameId} onChange={(e) => { setGameId(e.target.value); setPage(1); }}>
            <option value="">All games</option>
            {GAMES.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </ASelect>
          <ASelect label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} disabled={!connected}>
            <option value="">All statuses</option>
            <option value="SETTLED">Settled</option>
            <option value="IN_PROGRESS">In progress</option>
          </ASelect>
          <ASelect label="Outcome" value={outcome} onChange={(e) => { setOutcome(e.target.value); setPage(1); }} disabled={!connected}>
            <option value="">All outcomes</option>
            <option value="WIN">Win</option>
            <option value="LOSS">Loss</option>
            <option value="EVEN">Even</option>
          </ASelect>
          <AInput label="From" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} disabled={!connected} />
          <AInput label="To" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} disabled={!connected} />
        </div>

        <div className="overflow-x-auto">
          {connected ? (
            <>
              <table className="w-full min-w-[1040px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr>
                    <Th>Round ID</Th><Th>Player</Th><Th>Game</Th><Th>Status</Th><Th>Outcome</Th>
                    <Th align="right">Stake</Th><Th align="right">Payout</Th><Th>Engine / Pkg</Th><Th>Started</Th><Th align="right">RNG Audit</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60">
                      <td className="ad-mono px-4 py-3 text-xs text-slate-700">{r.id.slice(0, 8)}… (#{r.roundNumber})</td>
                      <td className="px-4 py-3 text-slate-800">{r.user?.name ?? r.userId}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{r.gameName}</td>
                      <td className="px-4 py-3"><Badge tone={r.status === "SETTLED" ? "green" : "amber"} dot>{r.status}</Badge></td>
                      <td className="px-4 py-3">{r.outcome ? <Badge tone={r.outcome === "WIN" ? "green" : r.outcome === "LOSS" ? "red" : "slate"}>{r.outcome}</Badge> : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatPoints(r.stake)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{formatPoints(r.payout)}</td>
                      <td className="ad-mono px-4 py-3 text-xs text-slate-500">v{r.engineVersion}{r.packageVersion ? ` / ${r.packageVersion}` : ""}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(r.startedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <AButton size="sm" onClick={() => void inspectRound(r.id)}><Eye className="h-3.5 w-3.5" /> Inspect</AButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!items.length && <EmptyState title="No rounds found" body={loading ? "Loading rounds…" : "No game rounds match these filters."} />}
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
                  <AButton size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</AButton>
                  <span>Page {page} of {totalPages}</span>
                  <AButton size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</AButton>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500">
                Demo preview from mock ledger transactions (authoritative RNG seeds, commitments and round states require a connected NestJS backend).
              </div>
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr><Th>Entry ID</Th><Th>Player</Th><Th>Game</Th><Th>Type</Th><Th align="right">Credit</Th><Th align="right">Debit</Th><Th>Timestamp</Th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {demoSessions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/60">
                      <td className="ad-mono px-4 py-3 text-xs text-slate-700">{t.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{t.userName}</td>
                      <td className="px-4 py-3 text-slate-700">{t.game ?? "—"}</td>
                      <td className="px-4 py-3"><Badge tone={t.type === "earned" ? "green" : "slate"}>{t.type}</Badge></td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-700">{t.credit ? `+${formatPoints(t.credit)}` : "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{t.debit ? `−${formatPoints(t.debit)}` : "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(t.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Card>

      <Modal theme="light" size="lg" open={inspectOpen} onClose={() => setInspectOpen(false)} title="Round & RNG Audit Trail" description={detail ? `${detail.gameName} · Round #${detail.roundNumber} · ${detail.id}` : undefined}>
        {inspectBusy ? (
          <p className="text-sm text-slate-500">Loading round audit data…</p>
        ) : detail ? (
          <div className="space-y-4 text-xs">
            {audit && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-sm font-semibold text-slate-900">Cryptographic Fairness &amp; RNG State</p>
                <p><span className="text-slate-500">Seed Commitment (SHA-256):</span> <span className="ad-mono break-all text-slate-800">{audit.seedCommitment}</span></p>
                <p><span className="text-slate-500">Revealed Seed:</span> <span className="ad-mono break-all text-slate-800">{audit.seed || "(hidden until settled)"}</span></p>
                <p><span className="text-slate-500">RNG Draws:</span> <b className="tabular-nums text-slate-900">{audit.rngDraws}</b> · <span className="text-slate-500">Engine:</span> <span className="ad-mono">{audit.engineVersion}</span></p>
                <p><span className="text-slate-500">Session State Hash:</span> <span className="ad-mono break-all text-slate-700">{audit.sessionStateBeforeHash}</span></p>
                <p className="text-slate-600">{audit.howToVerify}</p>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1.5 font-semibold text-slate-800">Submitted Bet</p>
                <pre className="max-h-48 overflow-auto rounded bg-slate-900 p-2.5 text-[11px] text-slate-100">{JSON.stringify(detail.bet, null, 2)}</pre>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1.5 font-semibold text-slate-800">Authoritative Result</p>
                <pre className="max-h-48 overflow-auto rounded bg-slate-900 p-2.5 text-[11px] text-slate-100">{JSON.stringify(detail.result, null, 2)}</pre>
              </div>
            </div>
            {audit?.sessionStateBefore && (
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="mb-1.5 font-semibold text-slate-800">Pre-Round Session State (Admin Audit)</p>
                <pre className="max-h-40 overflow-auto rounded bg-slate-900 p-2.5 text-[11px] text-slate-100">{JSON.stringify(audit.sessionStateBefore, null, 2)}</pre>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No round details available.</p>
        )}
      </Modal>
    </div>
  );
}
