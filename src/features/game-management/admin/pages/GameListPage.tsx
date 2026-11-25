"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import { installedVersion, pendingVersion, publishedVersion } from "../../lib/derive";
import { useGames, useHydrated } from "../../store/useGm";
import type { ManagedGame } from "../../types";
import { GmBadge, GmCard, GmEmpty, GmPageHeader, GmSearch, GmSkeleton } from "../../ui/primitives";
import { PublishingBadge } from "../../ui/StatusBadges";
import { GM_BASE } from "../components/GmSectionShell";

const COPY = {
  versions: { eyebrow: "Version management", title: "Versions", description: "Pick a game to upload builds, install and publish updates, or roll back.", cta: "Manage versions" },
  configuration: { eyebrow: "Game configuration", title: "Configuration", description: "Pick a game to change visibility, ordering, maintenance and catalogue details.", cta: "Configure" },
} as const;

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/35">{label}</dt><dd className="mt-1 text-sm font-semibold text-white">{children}</dd></div>;
}

function Card({ game, mode }: { game: ManagedGame; mode: "versions" | "configuration" }) {
  const pub = publishedVersion(game);
  const inst = installedVersion(game);
  const pend = pendingVersion(game);
  const dash = <span className="text-white/30">—</span>;
  return (
    <Link href={`${GM_BASE}/${mode}/${game.id}`} className="group block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70">
      <GmCard className="h-full p-4 transition group-hover:border-gold-400/35 group-hover:shadow-[0_0_40px_-18px_rgba(212,175,79,.5)]">
        <div className="flex items-start gap-3">
          <span className="h-16 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/50">
            {game.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-white">{game.name}</p>
            <p className="truncate font-mono text-[11.5px] text-white/38">{game.id}</p>
            <div className="mt-2"><PublishingBadge publishing={game.publishing} /></div>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-white/[0.06] pt-4">
          {mode === "versions" ? (
            <>
              <Cell label="Published">{pub && game.publishing.status === "published" ? <span className="font-num text-gold-300">{pub.version}</span> : dash}</Cell>
              <Cell label="Installed">{inst ? <span className="font-num">{inst.version}</span> : dash}</Cell>
              <Cell label="Available">{pend ? <span className="font-num text-violet-300">{pend.version}</span> : dash}</Cell>
            </>
          ) : (
            <>
              <Cell label="Visibility"><span className="capitalize">{game.config.visibility}</span></Cell>
              <Cell label="Order"><span className="font-num">#{game.config.displayOrder}</span></Cell>
              <Cell label="Featured">{game.config.featured ? <GmBadge tone="gold">Yes</GmBadge> : <span className="text-white/45">No</span>}</Cell>
            </>
          )}
        </dl>
        <p className="mt-4 flex items-center gap-1.5 text-[13px] font-semibold text-gold-300">{COPY[mode].cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></p>
      </GmCard>
    </Link>
  );
}

/** Game picker that leads into per-game version management or configuration. */
export function GameListPage({ mode }: { mode: "versions" | "configuration" }) {
  const games = useGames();
  const ready = useHydrated();
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const n = q.trim().toLowerCase();
    return [...games].filter((g) => !n || `${g.name} ${g.id}`.toLowerCase().includes(n)).sort((a, b) => a.config.displayOrder - b.config.displayOrder);
  }, [games, q]);
  const c = COPY[mode];
  return (
    <div>
      <GmPageHeader eyebrow={c.eyebrow} title={c.title} description={c.description} actions={<GmSearch className="w-64" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" aria-label="Search games" />} />
      {!ready ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <GmSkeleton key={i} className="h-44" />)}</div>
      ) : list.length === 0 ? (
        <GmCard><GmEmpty icon={<PackageSearch />} title="No games found" body={q ? "Try a different search." : "Add a game to get started."} /></GmCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((g) => <Card key={g.id} game={g} mode={mode} />)}</div>
      )}
    </div>
  );
}
