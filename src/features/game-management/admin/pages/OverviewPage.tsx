"use client";

import { useState } from "react";
import { Boxes, DownloadCloud, EyeOff, FileClock, PackagePlus, RotateCcw, Rocket, Wrench } from "lucide-react";
import { hasPendingUpdate } from "../../lib/derive";
import { gameManagementApi } from "../../services/gameManagementApi";
import { useGames, useHydrated } from "../../store/useGm";
import { GmButton, GmCard, GmConfirm, GmLinkButton, GmPageHeader, GmSkeleton, GmStat } from "../../ui/primitives";
import { GM_BASE } from "../components/GmSectionShell";
import { useRun } from "../components/useRun";
import { GamesTable } from "../tables/GamesTable";

export function OverviewPage() {
  const games = useGames();
  const ready = useHydrated();
  const { run } = useRun();
  const [resetOpen, setResetOpen] = useState(false);

  const stats = [
    { label: "Total games", value: games.length, icon: <Boxes />, tone: "gold" as const, hint: "Registered in the catalogue service" },
    { label: "Installed games", value: games.filter((g) => g.installation.status === "installed").length, icon: <DownloadCloud />, tone: "green" as const, hint: "Deployed and ready" },
    { label: "Published games", value: games.filter((g) => g.publishing.status === "published").length, icon: <Rocket />, tone: "cyan" as const, hint: "Visible to players" },
    { label: "Draft games", value: games.filter((g) => g.publishing.status === "draft").length, icon: <FileClock />, tone: "violet" as const, hint: "Not yet published" },
    { label: "In maintenance", value: games.filter((g) => g.publishing.maintenance).length, icon: <Wrench />, tone: "amber" as const, hint: "Listed but not launchable" },
    { label: "Pending updates", value: games.filter(hasPendingUpdate).length, icon: <EyeOff />, tone: "red" as const, hint: "New version waiting to install" },
  ];

  return (
    <div>
      <GmPageHeader
        eyebrow="Game management"
        title="Games overview"
        description="Every game package in the platform: what is installed, what players can see, and what needs attention."
        actions={
          <>
            <GmButton variant="ghost" onClick={() => setResetOpen(true)}><RotateCcw className="h-4 w-4" /> Reset demo data</GmButton>
            <GmLinkButton href={`${GM_BASE}/new`} variant="gold"><PackagePlus className="h-4 w-4" /> Add new game</GmLinkButton>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (ready ? <GmStat key={s.label} {...s} /> : <GmSkeleton key={s.label} className="h-[124px]" />))}
      </div>

      {ready ? (
        <GamesTable games={games} />
      ) : (
        <GmCard className="space-y-3 p-4">
          <GmSkeleton className="h-10" />
          {Array.from({ length: 5 }, (_, i) => <GmSkeleton key={i} className="h-14" />)}
        </GmCard>
      )}

      <GmConfirm
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        tone="danger"
        title="Reset demo data?"
        confirmLabel="Reset"
        onConfirm={() => run("reset", () => gameManagementApi.resetDemoData(), "Demo data restored.")}
        body={<p>This restores the original mock games, versions and player installs and discards every change made in this browser. It does not affect any real data.</p>}
      />
    </div>
  );
}
