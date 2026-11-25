"use client";

import { ArrowRight, CheckCircle2, Circle, Download, HardDrive, Loader2, Play, RefreshCw } from "lucide-react";
import { coverFor } from "@/components/launcher/GameTile";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { formatBytes } from "../../lib/format";
import { versionOf } from "../../lib/derive";
import { PlayerInstallError, playerInstallApi } from "../../services/playerInstallApi";
import { useGmState } from "../../store/useGm";
import type { DownloadPhase } from "../../types";
import { GmButton, GmDialog, GmNotice, GmProgress } from "../../ui/primitives";
import type { CatalogueEntry } from "../catalogue";

const PHASES: { id: DownloadPhase; label: string }[] = [
  { id: "connecting", label: "Connecting" },
  { id: "downloading", label: "Downloading package" },
  { id: "preparing", label: "Preparing assets" },
  { id: "registering", label: "Registering in your library" },
  { id: "completed", label: "Completed" },
];

interface Props {
  entry: CatalogueEntry | null;
  open: boolean;
  onClose: () => void;
  onPlay: (entry: CatalogueEntry) => void;
}

/** Confirm → simulated download → done. Progress lives in the store, so closing the dialog never cancels it. */
export function InstallGameDialog({ entry, open, onClose, onPlay }: Props) {
  const toast = useToast();
  const { downloads } = useGmState();
  const id = entry?.game.id as string | undefined;
  const download = id ? downloads[id] : undefined;
  const running = !!download && download.phase !== "completed" && download.phase !== "failed";
  const done = download?.phase === "completed";

  if (!entry) return null;
  const { game, managed, info } = entry;
  const isUpdate = info.status === "update_available" || download?.kind === "update";
  const target = versionOf(managed, managed.publishing.publishedVersion);
  const size = target?.package.sizeBytes ?? info.sizeBytes;

  const start = () => {
    playerInstallApi.startInstall(game.id as string).catch((e) => toast(e instanceof PlayerInstallError ? e.message : "The download could not start.", "error"));
  };

  const close = () => {
    if (running) toast(`${game.name} keeps downloading in the background.`, "info");
    if (done) playerInstallApi.dismiss(game.id as string);
    onClose();
  };

  const header = (
    <div className="mb-5 flex items-center gap-4">
      <span className="relative h-[76px] w-[60px] shrink-0 overflow-hidden rounded-xl ring-1 ring-white/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverFor(game)} alt="" draggable={false} className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0">
        <p className="truncate font-display text-base font-semibold text-white">{game.name}</p>
        <p className="mt-0.5 text-[13px] text-white/50">{game.category}</p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 font-num text-[12px] text-white/70">
          <HardDrive className="h-3.5 w-3.5 text-gold-300" /> {formatBytes(size)}
          {target && <span className="text-white/35">· v{target.version}</span>}
        </p>
      </div>
    </div>
  );

  if (done) {
    return (
      <GmDialog open={open} onClose={close} title={isUpdate ? "Update complete" : "Installation complete"} size="sm" footer={
        <>
          <GmButton variant="ghost" onClick={close}>Done</GmButton>
          <GmButton variant="gold" onClick={() => { playerInstallApi.dismiss(game.id as string); onClose(); onPlay(entry); }}><Play className="h-4 w-4 fill-current" /> Play now</GmButton>
        </>
      }>
        {header}
        <div className="flex flex-col items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.05] px-4 py-7 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 shadow-[0_0_30px_-6px_rgba(52,211,153,.7)]"><CheckCircle2 className="h-6 w-6" /></span>
          <p className="mt-3 text-sm font-semibold text-white">{download?.message}</p>
          <p className="mt-1 text-[13px] text-white/50">{game.name} is cached in this browser and shows in Installed Games.</p>
        </div>
      </GmDialog>
    );
  }

  if (running && download) {
    const at = PHASES.findIndex((p) => p.id === download.phase);
    return (
      <GmDialog open={open} onClose={close} title={isUpdate ? "Updating game" : "Installing game"} size="sm" footer={
        <GmButton variant="outline" onClick={() => { playerInstallApi.cancel(game.id as string); onClose(); }}>Cancel download</GmButton>
      }>
        {header}
        <div className="mb-1 flex items-end justify-between">
          <p className="font-num text-4xl font-bold tabular-nums text-white">{Math.round(download.progress)}<span className="text-xl text-white/45">%</span></p>
          <p className="pb-1 font-num text-[12px] tabular-nums text-white/55">{formatBytes(download.bytesDone)} / {formatBytes(download.bytesTotal)}</p>
        </div>
        <GmProgress value={download.progress} tone={isUpdate ? "gold" : "cyan"} size="lg" label="Download progress" />
        <p className="mt-3 flex items-center gap-2 text-[13px] text-white/65" aria-live="polite"><Loader2 className="h-3.5 w-3.5 animate-spin text-neon-cyan" /> {download.message}</p>
        <ol className="mt-5 space-y-2">
          {PHASES.map((p, i) => {
            const state = i < at ? "done" : i === at ? "active" : "pending";
            return (
              <li key={p.id} className={cn("flex items-center gap-2.5 text-[13px]", state === "pending" ? "text-white/30" : state === "active" ? "text-white" : "text-white/60")}>
                {state === "done" ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : state === "active" ? <Loader2 className="h-4 w-4 animate-spin text-neon-cyan" /> : <Circle className="h-4 w-4" />}
                {p.label}
              </li>
            );
          })}
        </ol>
      </GmDialog>
    );
  }

  const notes = target?.releaseNotes;
  return (
    <GmDialog open={open} onClose={close} title={isUpdate ? "Update game" : "Install game"} description={isUpdate ? "A newer version is available." : "Download this game to play it from your library."} size="sm" footer={
      <>
        <GmButton variant="ghost" onClick={close}>Cancel</GmButton>
        <GmButton variant="gold" onClick={start}>{isUpdate ? <><RefreshCw className="h-4 w-4" /> Update now</> : <><Download className="h-4 w-4" /> Install · {formatBytes(size)}</>}</GmButton>
      </>
    }>
      {header}
      {isUpdate && (
        <div className="mb-4 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-num text-sm">
          <span className="text-white/55">v{info.installedVersion}</span>
          <ArrowRight className="h-4 w-4 text-gold-300" />
          <span className="font-bold text-gold-200">v{info.publishedVersion}</span>
        </div>
      )}
      {isUpdate && notes && (
        <div className="mb-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">What&apos;s new</p>
          <p className="text-[13px] leading-relaxed text-white/65">{notes}</p>
        </div>
      )}
      <GmNotice tone="cyan" icon={<HardDrive />}>
        The game package ({formatBytes(size)}) is cached in your browser storage for faster loading next time. Nothing else is downloaded or installed on your device.
      </GmNotice>
    </GmDialog>
  );
}
