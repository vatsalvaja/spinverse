"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, ShieldCheck } from "lucide-react";
import { AButton, AInput, ASelect, Badge, Card, EmptyState, PageHeader, StatCard, Th } from "@/components/admin/ui";
import { BackendModeBanner } from "@/components/admin/views/BackendModeBanner";
import { Modal } from "@/components/ui/modal";
import { useAccess } from "@/features/access/AccessProvider";
import { useGames } from "@/features/game-management/store/useGm";
import { adminAuditLogsApi, BackendApiError, isBackendConfigured, type BackendAuditLog } from "@/lib/adminBackendApi";
import { formatDateTime } from "@/lib/utils";

const ACTIONS = [
  "USER_UPDATED", "USER_ACTIVATED", "USER_DEACTIVATED",
  "GAME_CREATED", "GAME_UPDATED", "GAME_ENABLED", "GAME_DISABLED", "GAME_CONFIG_UPDATED",
  "CATEGORY_CREATED", "CATEGORY_UPDATED", "CATEGORY_ACTIVATED", "CATEGORY_DEACTIVATED",
  "PACKAGE_UPLOADED", "PACKAGE_INSTALLED", "PACKAGE_UNINSTALLED", "PACKAGE_PUBLISHED", "PACKAGE_UNPUBLISHED", "PACKAGE_ROLLED_BACK",
  "WALLET_CREDITED", "WALLET_DEBITED",
  "MASTER_CREATED", "MASTER_UPDATED", "MASTER_ACTIVATED", "MASTER_DEACTIVATED", "COINS_ALLOCATED_TO_MASTER",
  "CLIENT_CREATED", "CLIENT_UPDATED", "CLIENT_ACTIVATED", "CLIENT_DEACTIVATED", "CLIENT_DELETED", "COINS_ALLOCATED_TO_CLIENT",
];

const RESOURCES = ["USER", "GAME", "GAME_CATEGORY", "GAME_PACKAGE", "WALLET"];

export default function SuperAdminAuditLogsPage() {
  const { data: accessData } = useAccess();
  const games = useGames();

  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BackendAuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [success, setSuccess] = useState<"" | "true" | "false">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<BackendAuditLog | null>(null);

  const load = useCallback(async () => {
    const hasBackend = isBackendConfigured();
    setConnected(hasBackend);
    if (!hasBackend) {
      setItems([]);
      setApiError(null);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const res = await adminAuditLogsApi.list({
        action: action || undefined,
        resourceType: resourceType || undefined,
        success: success === "" ? undefined : success === "true",
        from: from ? `${from}T00:00:00.000Z` : undefined,
        to: to ? `${to}T23:59:59.999Z` : undefined,
        page,
        limit: 20,
      });
      setItems(res.items);
      setTotalPages(Math.max(1, res.meta.totalPages));
    } catch (e) {
      setApiError(e instanceof BackendApiError ? e.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [action, resourceType, success, from, to, page]);

  useEffect(() => {
    void load();
  }, [load]);

  // Read-only local preview when backend is not connected
  const localEvents = useMemo(() => {
    const pkg = games.flatMap((g) =>
      g.events.map((e) => ({
        id: e.id,
        at: e.at,
        action: `PACKAGE_${e.type.toUpperCase()}`,
        resourceType: "GAME_PACKAGE",
        resourceId: `${g.id}@${e.version}`,
        actor: "Demo Admin (localStorage)",
        note: e.note ?? "",
      })),
    );
    const coins = accessData.txs.map((t) => ({
      id: t.id,
      at: t.timestamp,
      action: t.kind === "master_allocation" ? "COINS_ALLOCATED_TO_MASTER" : t.kind === "client_allocation" ? "COINS_ALLOCATED_TO_CLIENT" : "CLIENT_RECLAIM",
      resourceType: "WALLET",
      resourceId: t.toId,
      actor: t.fromName,
      note: `${t.amount} coins${t.note ? ` · ${t.note}` : ""}`,
    }));
    return [...pkg, ...coins]
      .filter((e) => (!action || e.action === action) && (!resourceType || e.resourceType === resourceType))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 30);
  }, [games, accessData.txs, action, resourceType]);

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        description="Immutable administrator activity log for user, hierarchy, wallet, category and package lifecycle actions."
        actions={<AButton onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</AButton>}
      />

      <BackendModeBanner connected={connected} error={apiError} endpoints={["GET /admin/audit-logs", "GET /admin/audit-logs/:id"]} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Shown entries" value={String(connected ? items.length : localEvents.length)} icon={<ShieldCheck />} hint={connected ? "from audit_logs table" : "local demo events"} />
        <StatCard label="Succeeded" value={String(connected ? items.filter((i) => i.success).length : localEvents.length)} icon={<ShieldCheck />} hint="completed actions" />
        <StatCard label="Refused / failed" value={String(connected ? items.filter((i) => !i.success).length : 0)} icon={<ShieldCheck />} hint="403 / 409 / errors" />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <ASelect label="Action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">All actions</option>
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </ASelect>
          <ASelect label="Resource type" value={resourceType} onChange={(e) => { setResourceType(e.target.value); setPage(1); }}>
            <option value="">All resources</option>
            {RESOURCES.map((r) => <option key={r} value={r}>{r}</option>)}
          </ASelect>
          <ASelect label="Outcome" value={success} onChange={(e) => { setSuccess(e.target.value as "" | "true" | "false"); setPage(1); }} disabled={!connected}>
            <option value="">All</option>
            <option value="true">Succeeded</option>
            <option value="false">Failed / refused</option>
          </ASelect>
          <AInput label="From" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} disabled={!connected} />
          <AInput label="To" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} disabled={!connected} />
        </div>

        <div className="overflow-x-auto">
          {connected ? (
            <>
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr><Th>Timestamp</Th><Th>Actor</Th><Th>Action</Th><Th>Resource</Th><Th>Status</Th><Th>IP</Th><Th align="right">Details</Th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(l.createdAt)}</td>
                      <td className="px-4 py-3"><p className="font-medium text-slate-900">{l.actor.name}</p><p className="text-xs text-slate-400">{l.actor.email}</p></td>
                      <td className="ad-mono px-4 py-3 text-xs text-slate-800">{l.action}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{l.resourceType}{l.resourceId ? ` · ${l.resourceId}` : ""}</td>
                      <td className="px-4 py-3"><Badge tone={l.success ? "green" : "red"} dot>{l.success ? "Success" : "Failed"}</Badge></td>
                      <td className="ad-mono px-4 py-3 text-xs text-slate-500">{l.ipAddress ?? "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <AButton size="sm" onClick={() => setSelected(l)}><Eye className="h-3.5 w-3.5" /> View</AButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!items.length && <EmptyState title="No audit entries found" body={loading ? "Loading audit logs…" : "No entries match your filters."} />}
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
                Local demo event preview (package events &amp; coin movements from localStorage). Connect the NestJS backend for immutable PostgreSQL <span className="ad-mono">audit_logs</span>.
              </div>
              <table className="w-full min-w-[820px] text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/70">
                  <tr><Th>Timestamp</Th><Th>Actor</Th><Th>Action</Th><Th>Resource</Th><Th>Summary</Th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {localEvents.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(e.at)}</td>
                      <td className="px-4 py-3 text-slate-800">{e.actor}</td>
                      <td className="ad-mono px-4 py-3 text-xs text-slate-800">{e.action}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{e.resourceType} · {e.resourceId}</td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-slate-500">{e.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </Card>

      <Modal theme="light" open={!!selected} onClose={() => setSelected(null)} title="Audit Entry Details" description={selected ? `${selected.action} · ${selected.id}` : undefined}>
        {selected && (
          <div className="space-y-3 text-xs">
            <p><span className="text-slate-500">Actor:</span> <b className="text-slate-900">{selected.actor.name}</b> ({selected.actor.email})</p>
            <p><span className="text-slate-500">Resource:</span> <span className="ad-mono">{selected.resourceType}</span> {selected.resourceId && `(${selected.resourceId})`}</p>
            <p><span className="text-slate-500">Timestamp:</span> {formatDateTime(selected.createdAt)}</p>
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] text-slate-100">{JSON.stringify(selected.details, null, 2)}</pre>
          </div>
        )}
      </Modal>
    </div>
  );
}
