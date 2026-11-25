"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { HardDriveDownload, Library, SearchX } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useGmState } from "../../store/useGm";
import { playerInstallApi } from "../../services/playerInstallApi";
import { GmConfirm, GmEmpty, GmLinkButton, GmButton, GmSearch, GmSelect } from "../../ui/primitives";
import { adapt, statusFor, useCatalogue, type CatalogueEntry } from "../catalogue";
import { StoragePanel } from "../components/StoragePanel";
import { useInstallFlow } from "../download-manager/useInstallFlow";
import { InstalledGameCard } from "../installed-games/InstalledGameCard";

/** "My Installed Games": everything this browser has cached, with play, update and uninstall. */
export default function InstalledGamesPage() {
  const toast = useToast();
  const state = useGmState();
  const { byId } = useCatalogue();
  const flow = useInstallFlow();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [removing, setRemoving] = useState<CatalogueEntry | null>(null);

  const rows = useMemo(() => {
    return state.data.playerInstalls
      .map((record) => {
        const managed = state.data.games.find((g) => g.id === record.gameId);
        if (!managed) return null;
        const catalogued = byId[record.gameId];
        const entry: CatalogueEntry = catalogued ?? { game: adapt(managed), managed, info: statusFor(managed, state) };
        return { record, entry, inCatalogue: !!catalogued };
      })
      .filter((r): r is NonNullable<typeof r> => !!r)
      .sort((a, b) => b.record.installedAt.localeCompare(a.record.installedAt));
  }, [state, byId]);

  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.entry.game.category))), [rows]);
  const visible = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    return (category === "all" || r.entry.game.category === category) && (!q || [r.entry.game.name, r.entry.game.category].join(" ").toLowerCase().includes(q));
  });
  const updates = rows.filter((r) => r.entry.info.status === "update_available").length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-6 pt-4 sm:px-6 sm:pt-5">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-num text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400">Your library</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-wide text-white sm:text-2xl">My Installed Games</h1>
          <p className="mt-1.5 text-sm text-white/50">
            {rows.length} installed{updates > 0 && <> · <span className="text-gold-300">{updates} update{updates === 1 ? "" : "s"} available</span></>}
          </p>
        </div>
        {rows.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <GmSearch value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search installed games" aria-label="Search installed games" className="sm:w-64" />
            <GmSelect value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category" className="sm:w-48">
              <option value="all">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </GmSelect>
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <GmEmpty
                icon={<HardDriveDownload />}
                title="No games installed yet"
                body="Install a game from the catalogue and it will be cached in this browser, ready to play."
                action={<GmLinkButton href="/games" variant="gold"><Library className="h-4 w-4" /> Browse games</GmLinkButton>}
              />
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
              <GmEmpty
                icon={<SearchX />}
                title="No installed games match"
                body="Try another name or category."
                action={<GmButton onClick={() => { setQuery(""); setCategory("all"); }}>Clear filters</GmButton>}
              />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
              {visible.map((r) => (
                <InstalledGameCard
                  key={r.record.gameId}
                  entry={r.entry}
                  record={r.record}
                  inCatalogue={r.inCatalogue}
                  onPlay={() => flow.handlePlay(r.entry)}
                  onUpdate={() => flow.requestUpdate(r.entry)}
                  onUninstall={() => setRemoving(r.entry)}
                />
              ))}
            </div>
          )}
          {rows.length > 0 && <p className="mt-4 text-xs text-white/35">Missing a game? <Link href="/games" className="text-gold-300 hover:underline">Browse the catalogue</Link>.</p>}
        </div>

        <StoragePanel />
      </div>

      <GmConfirm
        open={!!removing}
        onClose={() => setRemoving(null)}
        tone="danger"
        title={`Uninstall ${removing?.game.name ?? "game"}?`}
        confirmLabel="Uninstall"
        body={
          <>
            <p>This removes the cached game files from this browser. You can install it again at any time.</p>
            <p>Your profile, game history and favorites are kept{removing && byId[removing.game.id as string] ? ", and the game stays in the catalogue." : "."}</p>
          </>
        }
        onConfirm={async () => {
          if (!removing) return;
          await playerInstallApi.uninstall(removing.game.id as string);
          toast(`${removing.game.name} uninstalled.`, "success");
        }}
      />
      {flow.dialogs}
    </div>
  );
}
