"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, GitBranch, PackageSearch, Rocket, SlidersHorizontal } from "lucide-react";
import { GAME_CATEGORIES } from "../../lib/constants";
import { currentVersion, hasPendingUpdate, publishBlocker } from "../../lib/derive";
import { formatBytes, formatDay } from "../../lib/format";
import { compareSemver } from "../../lib/semver";
import { gameManagementApi } from "../../services/gameManagementApi";
import type { ManagedGame } from "../../types";
import { GmBadge, GmButton, GmCard, GmConfirm, GmEmpty, GmMenu, GmPagination, GmSearch, GmSelect, GmSortTh, GmTh } from "../../ui/primitives";
import { InstallationBadge, PublishingBadge } from "../../ui/StatusBadges";
import { GM_BASE } from "../components/GmSectionShell";
import { useRun } from "../components/useRun";
import { useGamePreview } from "../installation/PreviewDialog";

type SortKey = "name" | "category" | "version" | "size" | "updated";
type StatusFilter = "all" | "installed" | "not_installed" | "published" | "draft" | "unpublished" | "maintenance" | "update";

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All statuses" },
  { id: "installed", label: "Installed" },
  { id: "not_installed", label: "Not installed" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "unpublished", label: "Unpublished" },
  { id: "maintenance", label: "In maintenance" },
  { id: "update", label: "Update pending" },
];

function matches(g: ManagedGame, f: StatusFilter): boolean {
  switch (f) {
    case "installed": return g.installation.status === "installed";
    case "not_installed": return g.installation.status !== "installed";
    case "published": return g.publishing.status === "published";
    case "draft": return g.publishing.status === "draft";
    case "unpublished": return g.publishing.status === "unpublished";
    case "maintenance": return g.publishing.maintenance;
    case "update": return hasPendingUpdate(g);
    default: return true;
  }
}

function Thumb({ game }: { game: ManagedGame }) {
  return (
    <span className="flex h-12 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/50">
      {game.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={game.thumbnail} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <PackageSearch className="h-4 w-4 text-white/30" />
      )}
    </span>
  );
}

function RowActions({ game }: { game: ManagedGame }) {
  const { run } = useRun();
  const preview = useGamePreview(game);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const installed = game.installation.status === "installed";
  const published = game.publishing.status === "published";
  return (
    <>
      <div className="flex items-center justify-end gap-1.5">
        <Link href={`${GM_BASE}/${game.id}`} className="inline-flex h-8 items-center rounded-lg bg-gold-400/12 px-3 text-[12.5px] font-semibold text-gold-200 ring-1 ring-gold-400/30 transition hover:bg-gold-400/20">Manage</Link>
        <GmMenu
          label={`Actions for ${game.name}`}
          items={[
            { label: "Version management", icon: <GitBranch />, href: `${GM_BASE}/versions/${game.id}` },
            { label: "Configuration", icon: <SlidersHorizontal />, href: `${GM_BASE}/configuration/${game.id}` },
            { label: "Open preview", icon: <Eye />, onSelect: preview.launch, disabled: !installed, divider: true },
            published
              ? { label: "Unpublish", icon: <EyeOff />, onSelect: () => setConfirm("unpublish"), tone: "danger" }
              : { label: "Publish", icon: <Rocket />, onSelect: () => setConfirm("publish"), disabled: !!publishBlocker(game) },
          ]}
        />
      </div>
      {preview.dialog}
      <GmConfirm open={confirm === "publish"} onClose={() => setConfirm(null)} title="Publish this game?" confirmLabel="Publish game" onConfirm={() => run("pub", () => gameManagementApi.publish(game.id), `${game.name} is now published.`)} body={<p><b className="text-white">{game.name}</b> will appear in the player catalogue.</p>} />
      <GmConfirm open={confirm === "unpublish"} onClose={() => setConfirm(null)} tone="danger" title="Unpublish this game?" confirmLabel="Unpublish" onConfirm={() => run("unpub", () => gameManagementApi.unpublish(game.id), `${game.name} was unpublished.`)} body={<p><b className="text-white">{game.name}</b> will be removed from the player catalogue.</p>} />
    </>
  );
}

export function GamesTable({ games }: { games: ManagedGame[] }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "updated", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const categories = useMemo(() => Array.from(new Set([...GAME_CATEGORIES, ...games.map((g) => g.category)])), [games]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = games.filter((g) => matches(g, status) && (category === "all" || g.category === category) && (!needle || `${g.name} ${g.id} ${g.developer}`.toLowerCase().includes(needle)));
    const dir = sort.dir === "asc" ? 1 : -1;
    return list.sort((a, b) => {
      switch (sort.key) {
        case "name": return a.name.localeCompare(b.name) * dir;
        case "category": return a.category.localeCompare(b.category) * dir;
        case "version": return compareSemver(currentVersion(a).version, currentVersion(b).version) * dir;
        case "size": return (currentVersion(a).package.sizeBytes - currentVersion(b).package.sizeBytes) * dir;
        default: return a.updatedAt.localeCompare(b.updatedAt) * dir;
      }
    });
  }, [games, q, category, status, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const toggle = (key: SortKey) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "updated" || key === "size" ? "desc" : "asc" }));
  const filtered = q || category !== "all" || status !== "all";
  const sortTh = (key: SortKey, label: string) => <GmSortTh label={label} active={sort.key === key} dir={sort.dir} onClick={() => toggle(key)} />;

  return (
    <GmCard>
      <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 lg:flex-row lg:items-center">
        <GmSearch className="lg:max-w-sm lg:flex-1" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search by name, Game ID or developer" aria-label="Search games" />
        <div className="grid grid-cols-2 gap-2 lg:ml-auto lg:flex">
          <GmSelect aria-label="Filter by category" className="lg:w-44" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </GmSelect>
          <GmSelect aria-label="Filter by status" className="lg:w-44" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(1); }}>
            {STATUS_OPTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </GmSelect>
        </div>
      </div>

      {visible.length === 0 ? (
        <GmEmpty
          icon={<PackageSearch />}
          title={filtered ? "No games match these filters" : "No games yet"}
          body={filtered ? "Try a different search, category or status." : "Upload a game package to register your first game."}
          action={filtered ? <GmButton variant="outline" onClick={() => { setQ(""); setCategory("all"); setStatus("all"); }}>Clear filters</GmButton> : undefined}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead className="border-b border-white/[0.06] bg-black/25">
              <tr>
                <GmTh>Game</GmTh>
                {sortTh("category", "Category")}
                {sortTh("version", "Version")}
                {sortTh("size", "Package size")}
                <GmTh>Installation</GmTh>
                <GmTh>Publishing</GmTh>
                {sortTh("updated", "Last updated")}
                <GmTh align="right">Actions</GmTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {visible.map((g) => {
                const v = currentVersion(g);
                return (
                  <tr key={g.id} className="transition hover:bg-white/[0.025]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb game={g} />
                        <div className="min-w-0">
                          <Link href={`${GM_BASE}/${g.id}`} className="block truncate font-semibold text-white hover:text-gold-200">{g.name}</Link>
                          <p className="truncate font-mono text-[11.5px] text-white/38">{g.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/65">{g.category}</td>
                    <td className="px-4 py-3">
                      <span className="font-num font-semibold text-white">{v.version}</span>
                      {hasPendingUpdate(g) && <GmBadge tone="violet" className="ml-2">Update pending</GmBadge>}
                    </td>
                    <td className="px-4 py-3 font-num text-white/65">{formatBytes(v.package.sizeBytes)}</td>
                    <td className="px-4 py-3"><InstallationBadge installation={g.installation} /></td>
                    <td className="px-4 py-3"><PublishingBadge publishing={g.publishing} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-white/55">{formatDay(g.updatedAt)}</td>
                    <td className="px-4 py-3"><RowActions game={g} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <GmPagination page={safePage} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
    </GmCard>
  );
}
