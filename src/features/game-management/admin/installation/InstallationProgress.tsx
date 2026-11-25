"use client";

import { AlertTriangle, Check, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { GmBadge, GmCard, GmProgress } from "../../ui/primitives";
import type { AdminJob } from "../../types";

const KIND: Record<AdminJob["kind"], string> = { install: "Installing", update: "Installing update", rollback: "Rolling back" };

/** Gaming-style deployment tracker: big percentage, segmented bar and a step ladder. */
export function InstallationProgress({ job, failureReason }: { job: AdminJob | undefined; failureReason?: string | null }) {
  if (!job) {
    if (!failureReason) return null;
    return (
      <GmCard glow="red" className="p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-rose-300"><AlertTriangle className="h-4 w-4" /> Installation failed</p>
        <p className="mt-1 text-[13px] text-white/55">{failureReason}</p>
      </GmCard>
    );
  }
  const running = job.status === "running";
  const done = job.status === "done";
  return (
    <GmCard glow={done ? "gold" : "cyan"} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="font-num text-[11px] font-semibold uppercase tracking-[0.24em] text-white/40">{done ? "Deployment complete" : KIND[job.kind]}</p>
          <p className="mt-0.5 font-display text-sm font-semibold tracking-wide text-white">Version {job.version}</p>
        </div>
        {done ? <GmBadge tone="green" dot>Completed</GmBadge> : running ? <GmBadge tone="cyan"><Loader2 className="h-3 w-3 animate-spin" /> In progress</GmBadge> : <GmBadge tone="red" dot>Failed</GmBadge>}
      </div>
      <div className="grid gap-6 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className={cn("font-num text-5xl font-bold tabular-nums leading-none", done ? "text-gold-300" : "text-white")} aria-live="off">
            {job.progress}<span className="text-2xl text-white/40">%</span>
          </p>
          <GmProgress className="mt-4" size="lg" tone={done ? "gold" : "cyan"} value={job.progress} label="Installation progress" />
          <p className="mt-4 min-h-[2.5rem] text-[13px] leading-relaxed text-white/60" aria-live="polite">{job.message}</p>
          <p className="mt-2 text-xs text-white/35">Installation here registers and deploys the built frontend package. No npm dependencies are installed.</p>
        </div>
        <ol className="space-y-1">
          {job.steps.map((s, i) => (
            <li key={s.key} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition", s.state === "running" && "bg-neon-cyan/[0.06]")}>
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold",
                  s.state === "done" && "border-emerald-400/40 bg-emerald-400/15 text-emerald-300",
                  s.state === "running" && "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan",
                  s.state === "pending" && "border-white/12 text-white/30",
                  s.state === "failed" && "border-rose-400/40 bg-rose-400/15 text-rose-300",
                )}
              >
                {s.state === "done" ? <Check className="h-3.5 w-3.5" /> : s.state === "running" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
              </span>
              <span className={cn("text-sm", s.state === "pending" ? "text-white/35" : s.state === "running" ? "font-semibold text-white" : "text-white/80")}>{s.label}</span>
              {s.state === "done" && i === job.steps.length - 1 && <CheckCircle2 className="ml-auto h-4 w-4 text-gold-300" />}
            </li>
          ))}
        </ol>
      </div>
    </GmCard>
  );
}
