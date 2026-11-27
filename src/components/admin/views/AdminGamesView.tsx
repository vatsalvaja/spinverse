"use client";

import { useMemo, useState } from "react";
import { PackageOpen, PackagePlus, Pause, Play } from "lucide-react";
import { Badge, AButton, ALinkButton, Card, CardHeader, PageHeader, Th } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { gameStats } from "@/data/derive";
import { GAMES } from "@/data/games";
import { useDemoData } from "@/data/provider";
import { formatPoints } from "@/lib/utils";

export function AdminGamesView({ gmBase = "/super-admin/game-management" }: { gmBase?: string }) {
  const { transactions } = useDemoData();
  const toast = useToast();
  const [live, setLive] = useState<Record<string, boolean>>(Object.fromEntries(GAMES.map((g) => [g.id, true])));
  const stats = useMemo(() => gameStats(transactions), [transactions]);

  return (
    <div>
      <PageHeader
        title="Game Operations"
        description="Launch titles, engagement stats and live status toggles (demo ledger). Use Game Packages & Versions for ZIP uploads, installs, publishing and rollbacks."
        actions={
          <>
            <ALinkButton href={gmBase}><PackageOpen className="h-4 w-4" /> Package registry</ALinkButton>
            <ALinkButton href={`${gmBase}/new`} variant="gold"><PackagePlus className="h-4 w-4" /> Add new game</ALinkButton>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {GAMES.map((g) => {
          const s = stats[g.id];
          return (
            <Card key={g.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="mb-2 block h-1 w-10 rounded-full" style={{ background: g.accent }} />
                  <h2 className="text-base font-semibold text-slate-900">{g.name}</h2>
                  <p className="text-[13px] text-slate-500">{g.theme} · {g.concept}</p>
                </div>
                <Badge tone={live[g.id] ? "green" : "amber"} dot>{live[g.id] ? "Live" : "Paused"}</Badge>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div><dt className="text-xs text-slate-500">Sessions</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{formatPoints(s.sessions)}</dd></div>
                <div><dt className="text-xs text-slate-500">Players</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{s.players.size}</dd></div>
                <div><dt className="text-xs text-slate-500">Spins</dt><dd className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{formatPoints(s.spins)}</dd></div>
              </dl>
              <AButton className="mt-5 w-full" onClick={() => { setLive((p) => ({ ...p, [g.id]: !p[g.id] })); toast(`${g.name} ${live[g.id] ? "paused" : "set live"} (local state).`, "info"); }}>
                {live[g.id] ? <><Pause className="h-4 w-4" /> Pause game</> : <><Play className="h-4 w-4" /> Set live</>}
              </AButton>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader title="Performance by game" description="Derived from the shared demo transaction ledger" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50/70"><tr><Th>Game</Th><Th>Category</Th><Th align="right">Sessions</Th><Th align="right">Unique players</Th><Th align="right">Points spent</Th><Th align="right">Points returned</Th><Th align="right">Return ratio</Th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {GAMES.map((g) => {
                const s = stats[g.id];
                return (
                  <tr key={g.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{g.name}</td>
                    <td className="px-4 py-3 text-slate-600">{g.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPoints(s.sessions)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.players.size}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPoints(s.spent)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPoints(s.returned)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">{s.spent ? `${Math.round((s.returned / s.spent) * 100)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
