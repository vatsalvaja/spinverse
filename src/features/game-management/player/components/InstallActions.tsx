"use client";

import { Download, Loader2, RefreshCw, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlayerGameStatus } from "../../types";
import { GmProgress } from "../../ui/primitives";
import { PlayerStatusChip } from "../../ui/StatusBadges";

/** What the lobby needs to know about a game's installation. Built from `CatalogueEntry.info`. */
export interface InstallProps {
  status: PlayerGameStatus;
  progress?: number;
  onInstall: () => void;
  onUpdate: () => void;
  maintenanceMessage?: string | null;
}

const muted = { background: "rgba(255,255,255,.09)", color: "rgba(255,255,255,.78)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,.14)" } as const;

/**
 * Replaces the Play button on a tile when the game is not playable yet. Returns null when the caller should keep
 * its normal Play button (installed, update available).
 */
export function TileInstallAction({ install }: { install: InstallProps }) {
  switch (install.status) {
    case "not_installed":
      return (
        <button type="button" onClick={install.onInstall} className="lx-play pointer-events-auto text-[13px]">
          <Download className="h-3.5 w-3.5" /> Install
        </button>
      );
    case "downloading":
      return (
        <button type="button" onClick={install.onInstall} aria-label={`Downloading, ${Math.round(install.progress ?? 0)} percent. Show progress`} className="lx-play pointer-events-auto flex-col !gap-1 !px-2 text-[11px]" style={muted}>
          <span className="flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> <span className="font-num">{Math.round(install.progress ?? 0)}%</span></span>
          <GmProgress value={install.progress ?? 0} size="sm" tone="cyan" className="!w-[80%]" />
        </button>
      );
    case "maintenance":
      return (
        <button type="button" disabled title={install.maintenanceMessage ?? "Under maintenance"} className="lx-play pointer-events-auto cursor-not-allowed text-[12px]" style={muted}>
          <Wrench className="h-3.5 w-3.5" /> Maintenance
        </button>
      );
    default:
      return null;
  }
}

/** Compact "Update available" chip. Click to start the update. */
export function UpdateChip({ onUpdate, className }: { onUpdate: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onUpdate();
      }}
      className={cn("pointer-events-auto inline-flex items-center gap-1 rounded-full bg-gold-400/20 px-2 py-[2px] text-[10px] font-bold text-gold-200 ring-1 ring-gold-400/45 backdrop-blur transition hover:bg-gold-400/30", className)}
    >
      <RefreshCw className="h-2.5 w-2.5" /> Update
    </button>
  );
}

/** Status chip that can be dropped onto a tile corner. Nothing is shown for plain "installed". */
export function InstallStatusChip({ install, className }: { install: InstallProps; className?: string }) {
  if (install.status === "installed") return null;
  if (install.status === "update_available") return <UpdateChip onUpdate={install.onUpdate} className={className} />;
  return (
    <span className={cn("pointer-events-none inline-flex scale-90 origin-left", className)}>
      <PlayerStatusChip status={install.status} />
    </span>
  );
}

/** List-row equivalent of TileInstallAction. Returns null when the row keeps its normal Play button. */
export function RowInstallAction({ install }: { install: InstallProps }) {
  switch (install.status) {
    case "not_installed":
      return (
        <button type="button" onClick={(e) => { e.stopPropagation(); install.onInstall(); }} className="lx-mini">
          <Download className="h-3 w-3" /> Install
        </button>
      );
    case "downloading":
      return (
        <button type="button" onClick={(e) => { e.stopPropagation(); install.onInstall(); }} className="lx-mini min-w-[88px]" style={muted}>
          <Loader2 className="h-3 w-3 animate-spin" /> <span className="font-num">{Math.round(install.progress ?? 0)}%</span>
        </button>
      );
    case "maintenance":
      return (
        <button type="button" disabled title={install.maintenanceMessage ?? "Under maintenance"} className="lx-mini cursor-not-allowed" style={muted}>
          <Wrench className="h-3 w-3" /> Maintenance
        </button>
      );
    default:
      return null;
  }
}
