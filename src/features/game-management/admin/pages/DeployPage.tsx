"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, GitBranch, PackageSearch, SlidersHorizontal } from "lucide-react";
import { latestVersion, pendingVersion, installedVersion } from "../../lib/derive";
import { formatBytes, formatStamp } from "../../lib/format";
import { useGame, useHydrated } from "../../store/useGm";
import { GmBadge, GmCard, GmEmpty, GmLinkButton, GmPageHeader, GmSkeleton } from "../../ui/primitives";
import { InstallationBadge, PublishingBadge } from "../../ui/StatusBadges";
import { GM_BASE } from "../components/GmSectionShell";
import { VersionValidation } from "../components/VersionValidation";
import { DeploymentPanel } from "../installation/DeploymentPanel";

/** One game's deployment console: validate the package, install it, preview it, publish it. */
export function DeployPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = useGame(gameId);
  const ready = useHydrated();

  if (!ready) return <div className="space-y-4"><GmSkeleton className="h-20" /><GmSkeleton className="h-72" /></div>;
  if (!game) {
    return (
      <GmCard>
        <GmEmpty icon={<PackageSearch />} title="Game not found" body={`There is no game with the ID “${gameId}”. It may have been removed or the link is wrong.`} action={<GmLinkButton href={GM_BASE} variant="gold">Back to overview</GmLinkButton>} />
      </GmCard>
    );
  }

  const target = pendingVersion(game) ?? installedVersion(game) ?? latestVersion(game);
  return (
    <div>
      <Link href={GM_BASE} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/50 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All games</Link>
      <GmPageHeader
        eyebrow={game.id}
        title={game.name}
        description={game.description}
        actions={
          <>
            <GmLinkButton href={`${GM_BASE}/versions/${game.id}`} variant="outline"><GitBranch className="h-4 w-4" /> Versions</GmLinkButton>
            <GmLinkButton href={`${GM_BASE}/configuration/${game.id}`} variant="outline"><SlidersHorizontal className="h-4 w-4" /> Configuration</GmLinkButton>
          </>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-white/[0.07] bg-black/25 p-4">
        <span className="h-20 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/50">
          {game.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.thumbnail} alt={`${game.name} thumbnail`} className="h-full w-full object-cover" />
          )}
        </span>
        <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Category</dt><dd className="mt-1 font-semibold text-white">{game.category}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Developer</dt><dd className="mt-1 truncate font-semibold text-white">{game.developer || "—"}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Package</dt><dd className="mt-1 font-num font-semibold text-white">{target.version} · {formatBytes(target.package.sizeBytes)}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Last updated</dt><dd className="mt-1 font-semibold text-white">{formatStamp(game.updatedAt)}</dd></div>
        </dl>
        <div className="flex flex-wrap items-center gap-2">
          <InstallationBadge installation={game.installation} />
          <PublishingBadge publishing={game.publishing} />
          {game.builtIn && <GmBadge tone="cyan">Built-in game</GmBadge>}
        </div>
      </div>

      <div className="space-y-6">
        <VersionValidation game={game} version={target} />
        <DeploymentPanel game={game} />
      </div>
    </div>
  );
}
