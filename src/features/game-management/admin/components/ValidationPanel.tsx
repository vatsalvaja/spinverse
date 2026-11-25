"use client";

import { useState } from "react";
import { CheckCircle2, CircleDashed, Copy, FileJson, Info, Loader2, MinusCircle, ShieldAlert, TriangleAlert, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { MANIFEST_EXAMPLE, SCENARIOS } from "../../lib/constants";
import { formatStamp } from "../../lib/format";
import type { CheckState, GameValidationResult, ValidationScenario } from "../../types";
import { GmBadge, GmButton, GmCard, GmCardHeader, GmField, GmNotice, GmSelect } from "../../ui/primitives";

const ICON: Record<CheckState, { Icon: typeof CheckCircle2; cls: string }> = {
  passed: { Icon: CheckCircle2, cls: "text-emerald-300" },
  failed: { Icon: XCircle, cls: "text-rose-300" },
  warning: { Icon: TriangleAlert, cls: "text-amber-300" },
  skipped: { Icon: MinusCircle, cls: "text-white/30" },
  pending: { Icon: CircleDashed, cls: "text-white/25" },
  running: { Icon: Loader2, cls: "animate-spin text-neon-cyan" },
};

interface Props {
  result: GameValidationResult;
  scenario: ValidationScenario;
  onScenario: (s: ValidationScenario) => void;
  onRun: () => void;
  running: boolean;
  /** why validation cannot run yet, shown instead of enabling the button */
  blockedReason?: string | null;
  title?: string;
}

export function ValidationPanel({ result, scenario, onScenario, onRun, running, blockedReason, title = "Package validation" }: Props) {
  const done = result.state === "passed" || result.state === "failed";
  const scenarioHint = SCENARIOS.find((s) => s.id === scenario)?.hint;
  return (
    <GmCard>
      <GmCardHeader
        icon={<ShieldAlert />}
        title={title}
        description="Checks the package before it can be installed."
        action={
          <GmButton variant="neon" size="sm" onClick={onRun} loading={running} disabled={!!blockedReason}>
            {done ? "Run again" : "Validate package"}
          </GmButton>
        }
      />
      <div className="space-y-4 p-5">
        <GmNotice tone="gold" icon={<Info />} title="Frontend simulation only">
          The file name, size and ZIP signature are checked for real. The archive is <b className="font-semibold text-white/85">never extracted</b>, so manifest, entry file, assets and structure results are simulated.
          Malware scanning, signature verification and real package validation will run on the future backend.
        </GmNotice>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-end">
          <GmField label="Simulation scenario" htmlFor="gm-scenario">
            <GmSelect id="gm-scenario" value={scenario} disabled={running} onChange={(e) => onScenario(e.target.value as ValidationScenario)}>
              {SCENARIOS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </GmSelect>
          </GmField>
          <p className="text-[13px] leading-relaxed text-white/40">{scenarioHint} Demo control for testing the failure paths; the real validator has no such switch.</p>
        </div>

        {blockedReason && !running && <p className="text-[13px] text-amber-300/90">{blockedReason}</p>}

        <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-xl border border-white/[0.07] bg-black/25" aria-live="polite">
          {result.checks.map((c) => {
            const { Icon, cls } = ICON[c.state];
            return (
              <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0", cls)} aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={cn("text-sm font-semibold", c.state === "skipped" || c.state === "pending" ? "text-white/45" : "text-white/90")}>{c.label}</p>
                    <span className={cn("rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider", c.source === "client" ? "bg-sky-400/10 text-sky-300" : "bg-white/[0.06] text-white/40")}>{c.source === "client" ? "Browser check" : "Simulated"}</span>
                  </div>
                  <p className={cn("mt-0.5 text-[13px] leading-relaxed", c.state === "failed" ? "text-rose-300/90" : c.state === "warning" ? "text-amber-300/90" : "text-white/45")}>{c.detail ?? c.description}</p>
                </div>
                <span className="sr-only">{c.state}</span>
              </li>
            );
          })}
        </ul>

        {done ? (
          result.state === "passed" ? (
            <GmNotice tone="green" icon={<CheckCircle2 />} title="Validation passed">
              Every check passed in the simulation. The package can be installed. {result.ranAt && <span className="text-white/40">Ran {formatStamp(result.ranAt)}.</span>}
            </GmNotice>
          ) : (
            <GmNotice tone="red" icon={<XCircle />} title="Validation failed">
              {result.checks.filter((c) => c.state === "failed").length} check(s) failed. This package cannot be installed or published. Fix the package or details, then validate again.
            </GmNotice>
          )
        ) : running ? (
          <p className="flex items-center gap-2 text-[13px] text-neon-cyan"><Loader2 className="h-4 w-4 animate-spin" /> Running checks…</p>
        ) : null}

        <ManifestExample />
      </div>
    </GmCard>
  );
}

export function ManifestExample() {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(MANIFEST_EXAMPLE);
      toast("manifest.json example copied.", "success");
    } catch {
      toast("Copy is not available in this browser.", "error");
    }
  };
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/25">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm font-semibold text-white/80">
        <FileJson className="h-4 w-4 text-gold-300" /> Expected manifest.json
        <GmBadge tone="slate" className="ml-auto">{open ? "Hide" : "Show example"}</GmBadge>
      </button>
      {open && (
        <div className="border-t border-white/[0.06] p-4">
          <p className="mb-3 text-[13px] leading-relaxed text-white/45">Every package must include this file at its root. <code className="rounded bg-white/[0.07] px-1 py-px text-[12px] text-gold-200">gameId</code> must equal the Game ID you entered. Packages must contain only a built frontend: never game algorithms or server code.</p>
          <pre className="max-h-72 overflow-auto rounded-lg border border-white/[0.06] bg-black/50 p-3.5 font-mono text-[12px] leading-relaxed text-cyan-100/90">{MANIFEST_EXAMPLE}</pre>
          <GmButton size="sm" variant="outline" className="mt-3" onClick={copy}><Copy className="h-3.5 w-3.5" /> Copy example</GmButton>
        </div>
      )}
    </div>
  );
}
