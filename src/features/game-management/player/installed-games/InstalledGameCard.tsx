"use client";

import { type CSSProperties } from "react";
import { Play, RefreshCw, Trash2, Wrench } from "lucide-react";
import { coverFor } from "@/components/launcher/GameTile";
import { formatBytes, formatDay } from "../../lib/format";
import type { GameInstallationRecord } from "../../types";
import { GmBadge, GmButton, GmCard } from "../../ui/primitives";
import { PlayerStatusChip } from "../../ui/StatusBadges";
import type { CatalogueEntry } from "../catalogue";

interface Props {
  entry: CatalogueEntry;
  record: GameInstallationRecord;
  inCatalogue: boolean;
  onPlay: () => void;
  onUpdate: () => void;
  onUninstall: () => void;
}

export function InstalledGameCard({ entry, record, inCatalogue, onPlay, onUpdate, onUninstall }: Props) {
  const { game, info } = entry;
  const update = info.status === "update_available";
  const maintenance = info.status === "maintenance";
  const downloading = info.status === "downloading";
  return (
    <GmCard className="group flex flex-col overflow-hidden" glow={update ? "gold" : undefined}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl" style={{ "--ac": game.accent } as CSSProperties}>
        <div className="absolute inset-0" style={{ background: `radial-gradient(90% 70% at 50% 30%, ${game.accentSoft}, #090a14 78%)` }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverFor(game)} alt={`${game.name} poster`} draggable={false} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-[50%_35%] transition duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b10] via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {!inCatalogue ? <GmBadge tone="slate">No longer in catalogue</GmBadge> : update || maintenance || downloading ? <PlayerStatusChip status={info.status} /> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[15px] font-semibold text-white">{game.name}</h3>
          <p className="mt-0.5 text-[12.5px] text-white/45">{game.category}</p>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-[12px]">
          <div>
            <dt className="text-white/35">Version</dt>
            <dd className="mt-0.5 font-num font-semibold tabular-nums text-white/90">v{record.installedVersion}</dd>
          </div>
          <div>
            <dt className="text-white/35">Size</dt>
            <dd className="mt-0.5 font-num font-semibold tabular-nums text-white/90">{formatBytes(record.sizeBytes)}</dd>
          </div>
          <div>
            <dt className="text-white/35">Installed</dt>
            <dd className="mt-0.5 font-num font-semibold text-white/90">{formatDay(record.installedAt)}</dd>
          </div>
        </dl>

        {update && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-gold-400/25 bg-gold-400/[0.07] px-3 py-2 text-[12.5px]">
            <span className="text-white/70">
              Update available <b className="font-num text-gold-200">v{info.installedVersion} → v{info.publishedVersion}</b>
            </span>
            <GmButton size="sm" variant="gold" onClick={onUpdate}><RefreshCw className="h-3.5 w-3.5" /> Update now</GmButton>
          </div>
        )}

        <div className="mt-auto flex items-center gap-2">
          <GmButton variant="gold" className="flex-1" disabled={!inCatalogue || downloading} onClick={onPlay}>
            {maintenance ? <><Wrench className="h-4 w-4" /> Maintenance</> : <><Play className="h-4 w-4 fill-current" /> Play</>}
          </GmButton>
          <GmButton variant="outline" aria-label={`Uninstall ${game.name}`} onClick={onUninstall} disabled={downloading}>
            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Uninstall</span>
          </GmButton>
        </div>
      </div>
    </GmCard>
  );
}
