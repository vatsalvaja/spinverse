"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Database, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { formatBytes } from "../../lib/format";
import { playerInstallApi } from "../../services/playerInstallApi";
import { useGmState } from "../../store/useGm";
import { GmButton, GmCard, GmCardHeader, GmConfirm, GmNotice, GmProgress } from "../../ui/primitives";
import { MOCK_STORAGE } from "../mock-data/storage";

/** Browser storage and caching information. All figures are mock data; see mock-data/storage.ts. */
export function StoragePanel() {
  const toast = useToast();
  const { data } = useGmState();
  const [confirm, setConfirm] = useState(false);

  const rows = useMemo(
    () =>
      data.playerInstalls
        .map((r) => ({ id: r.gameId, name: data.games.find((g) => g.id === r.gameId)?.name ?? r.gameId, size: r.sizeBytes }))
        .sort((a, b) => b.size - a.size),
    [data],
  );
  const gameBytes = rows.reduce((n, r) => n + r.size, 0);
  const used = MOCK_STORAGE.otherSiteBytes + gameBytes;
  const pct = Math.min(100, (used / MOCK_STORAGE.quotaBytes) * 100);

  return (
    <GmCard>
      <GmCardHeader icon={<Database />} title="Browser storage & caching" description="Installed games are cached in your browser storage so they load faster next time." />
      <div className="space-y-5 p-5">
        <div>
          <div className="mb-2 flex items-end justify-between gap-3">
            <p className="font-num text-2xl font-bold tabular-nums text-white">{formatBytes(used)}</p>
            <p className="pb-0.5 text-[12px] text-white/45">of {formatBytes(MOCK_STORAGE.quotaBytes)} available</p>
          </div>
          <GmProgress value={pct} tone={pct > 80 ? "gold" : "cyan"} label="Browser storage used" />
          <p className="mt-2 text-xs text-white/40">Games {formatBytes(gameBytes)} · Other site data {formatBytes(MOCK_STORAGE.otherSiteBytes)} · Illustrative figures</p>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Cached games</p>
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-center text-[13px] text-white/40">No games are cached.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06] rounded-xl border border-white/[0.07] bg-black/20">
              {rows.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                  <span className="min-w-0 truncate text-white/80">{r.name}</span>
                  <span className="shrink-0 font-num tabular-nums text-white/55">{formatBytes(r.size)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <GmNotice tone="gold" title="Cached data is not permanent" icon={<AlertTriangle />}>
          Browsers can clear cached data automatically, for example when storage runs low or site data is cleared. If that happens, a game may need to be downloaded again. This is not permanent offline storage.
        </GmNotice>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-white/40">Clearing the cache removes game packages only. Your profile, game history and favorites are not affected.</p>
          <GmButton variant="danger" size="sm" disabled={rows.length === 0} onClick={() => setConfirm(true)} className="shrink-0">
            <Trash2 className="h-3.5 w-3.5" /> Clear cached games
          </GmButton>
        </div>
      </div>

      <GmConfirm
        open={confirm}
        onClose={() => setConfirm(false)}
        tone="danger"
        title="Clear all cached games?"
        confirmLabel="Clear cache"
        body={
          <>
            <p>This removes {rows.length} cached game{rows.length === 1 ? "" : "s"} ({formatBytes(gameBytes)}) from this browser. You will need to install them again before playing.</p>
            <p>Games stay in the catalogue. Your profile, game history and favorites are kept.</p>
          </>
        }
        onConfirm={async () => {
          const n = await playerInstallApi.clearAll();
          toast(`Cleared ${n} cached game${n === 1 ? "" : "s"}.`, "success");
        }}
      />
    </GmCard>
  );
}
