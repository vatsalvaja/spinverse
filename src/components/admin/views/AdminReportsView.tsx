"use client";

import { useState } from "react";
import { BarChart3, Download, FileText, Loader2 } from "lucide-react";
import { AButton, ALinkButton, ASelect, Badge, Card, PageHeader } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";

const REPORTS = [
  { id: "r1", name: "User registrations", desc: "New accounts by day, split by registered and guest." },
  { id: "r2", name: "Virtual points ledger", desc: "Every credit and debit with balances before and after." },
  { id: "r3", name: "Active players", desc: "Daily and weekly active users with session counts." },
  { id: "r4", name: "Game performance", desc: "Sessions, spins and points flow for each game." },
  { id: "r5", name: "Account moderation", desc: "Blocked, deactivated and reactivated accounts." },
  { id: "r6", name: "Admin adjustments audit", desc: "Manual point changes with reason and operator." },
];

export function AdminReportsView({ basePath = "/super-admin" }: { basePath?: string }) {
  const toast = useToast();
  const [range, setRange] = useState("30");
  const [format, setFormat] = useState("CSV");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});

  const run = (id: string, name: string) => {
    setBusy(id);
    setTimeout(() => {
      setBusy(null);
      setDone((d) => ({ ...d, [id]: `${format} · last ${range} days` }));
      toast(`${name} report ready (demo: no file is created).`);
    }, 900);
  };

  return (
    <div>
      <PageHeader
        title="Reports & Exports"
        description="Generate summary exports for operations and compliance reviews (demo simulation — live JSON reports are available via backend GET /admin/reports/*)."
        actions={<ALinkButton href={`${basePath}/analytics`}><BarChart3 className="h-4 w-4" /> View Analytics</ALinkButton>}
      />
      <Card className="mb-6 p-4">
        <div className="flex flex-wrap items-end gap-4">
          <ASelect label="Date range" value={range} onChange={(e) => setRange(e.target.value)} className="w-44">
            <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option>
          </ASelect>
          <ASelect label="Format" value={format} onChange={(e) => setFormat(e.target.value)} className="w-32">
            <option>CSV</option><option>PDF</option><option>XLSX</option>
          </ASelect>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((r) => (
          <Card key={r.id} className="flex flex-col p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><FileText className="h-[18px] w-[18px]" /></span>
            <h2 className="mt-3 text-[15px] font-semibold text-slate-900">{r.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{r.desc}</p>
            <div className="mt-auto flex items-center justify-between gap-3 pt-5">
              {done[r.id] ? <Badge tone="green" dot>{done[r.id]}</Badge> : <span className="text-xs text-slate-400">Not generated yet</span>}
              <AButton size="sm" onClick={() => run(r.id, r.name)} disabled={busy === r.id}>
                {busy === r.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating</> : <><Download className="h-4 w-4" /> Generate</>}
              </AButton>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
