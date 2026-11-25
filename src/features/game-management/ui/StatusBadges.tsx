import { CheckCircle2, CircleDashed, Download, Loader2, RefreshCw, Wrench, XCircle } from "lucide-react";
import type { GameInstallation, GamePublishingStatus, PlayerGameStatus } from "../types";
import type { VersionLabel } from "../lib/derive";
import { GmBadge, type GmTone } from "./primitives";

export function InstallationBadge({ installation }: { installation: GameInstallation }) {
  switch (installation.status) {
    case "installed":
      return <GmBadge tone="green" dot>Installed</GmBadge>;
    case "installing":
      return <GmBadge tone="cyan"><Loader2 className="h-3 w-3 animate-spin" /> Installing</GmBadge>;
    case "failed":
      return <GmBadge tone="red" dot>Failed</GmBadge>;
    default:
      return <GmBadge tone="slate">Not installed</GmBadge>;
  }
}

export function PublishingBadge({ publishing }: { publishing: GamePublishingStatus }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {publishing.status === "published" ? <GmBadge tone="gold" dot>Published</GmBadge> : publishing.status === "unpublished" ? <GmBadge tone="amber" dot>Unpublished</GmBadge> : <GmBadge tone="slate" dot>Draft</GmBadge>}
      {publishing.maintenance && <GmBadge tone="amber"><Wrench className="h-3 w-3" /> Maintenance</GmBadge>}
    </span>
  );
}

const LABELS: Record<VersionLabel, { tone: GmTone; text: string }> = {
  published: { tone: "gold", text: "Published" },
  installed: { tone: "green", text: "Installed" },
  available: { tone: "violet", text: "Available" },
  failed: { tone: "red", text: "Validation failed" },
  previous: { tone: "slate", text: "Previous" },
};

export function VersionLabelBadge({ label }: { label: VersionLabel }) {
  const l = LABELS[label];
  return <GmBadge tone={l.tone}>{l.text}</GmBadge>;
}

/** Player-facing status chip shown on catalogue cards and installed games. */
export function PlayerStatusChip({ status }: { status: PlayerGameStatus }) {
  switch (status) {
    case "installed":
      return <GmBadge tone="green"><CheckCircle2 className="h-3 w-3" /> Installed</GmBadge>;
    case "downloading":
      return <GmBadge tone="cyan"><Loader2 className="h-3 w-3 animate-spin" /> Downloading</GmBadge>;
    case "update_available":
      return <GmBadge tone="gold"><RefreshCw className="h-3 w-3" /> Update available</GmBadge>;
    case "maintenance":
      return <GmBadge tone="amber"><Wrench className="h-3 w-3" /> Maintenance</GmBadge>;
    default:
      return <GmBadge tone="slate"><Download className="h-3 w-3" /> Not installed</GmBadge>;
  }
}

export const CheckIcon = {
  passed: CheckCircle2,
  failed: XCircle,
  pending: CircleDashed,
};
