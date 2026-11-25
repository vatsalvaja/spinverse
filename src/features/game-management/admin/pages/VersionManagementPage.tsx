"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, History, PackageSearch, Rocket, Undo2, UploadCloud } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { installedVersion, labelsFor, pendingVersion, publishBlocker, publishedVersion, rollbackTargets } from "../../lib/derive";
import { formatBytes, formatDay, formatStamp } from "../../lib/format";
import { compareSemver, isSemver } from "../../lib/semver";
import { gameManagementApi, GmApiError } from "../../services/gameManagementApi";
import { useGame, useGmState, useHydrated } from "../../store/useGm";
import type { GameVersion, ManagedGame } from "../../types";
import { GmBadge, GmButton, GmCard, GmCardHeader, GmConfirm, GmEmpty, GmField, GmInput, GmLinkButton, GmNotice, GmPageHeader, GmSkeleton, GmTextarea, GmTh } from "../../ui/primitives";
import { VersionLabelBadge } from "../../ui/StatusBadges";
import { GM_BASE } from "../components/GmSectionShell";
import { PackageDropzone, type PackageFile } from "../components/UploadDropzone";
import { useRun } from "../components/useRun";
import { VersionValidation } from "../components/VersionValidation";
import { InstallationProgress } from "../installation/InstallationProgress";

const nextMinor = (v: string) => {
  const [a, b] = v.split(".").map(Number);
  return `${a}.${(b || 0) + 1}.0`;
};

function Summary({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "gold" | "violet" | "green" }) {
  const c = tone === "gold" ? "text-gold-300" : tone === "violet" ? "text-violet-300" : tone === "green" ? "text-emerald-300" : "text-white";
  return (
    <GmCard glow={tone === "gold" ? "gold" : tone === "violet" ? "violet" : undefined} className="p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={`mt-2 font-num text-3xl font-bold tabular-nums ${c}`}>{value}</p>
      <p className="mt-1.5 text-[13px] text-white/45">{sub}</p>
    </GmCard>
  );
}

function ValidationBadge({ v }: { v: GameVersion }) {
  return v.validation.state === "passed" ? <GmBadge tone="green">Validated</GmBadge> : v.validation.state === "failed" ? <GmBadge tone="red">Failed</GmBadge> : <GmBadge tone="slate">Not validated</GmBadge>;
}

type Confirming = { kind: "install" | "publish" } | { kind: "rollback"; version: GameVersion } | null;

export function VersionManagementPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = useGame(gameId);
  const ready = useHydrated();
  if (!ready) return <div className="space-y-4"><GmSkeleton className="h-20" /><GmSkeleton className="h-40" /><GmSkeleton className="h-72" /></div>;
  if (!game) {
    return (
      <GmCard>
        <GmEmpty icon={<PackageSearch />} title="Game not found" body={`There is no game with the ID “${gameId}”.`} action={<GmLinkButton href={`${GM_BASE}/versions`} variant="gold">All games</GmLinkButton>} />
      </GmCard>
    );
  }
  return <Inner game={game} />;
}

function Inner({ game }: { game: ManagedGame }) {
  const { run, busy } = useRun();
  const toast = useToast();
  const { jobs } = useGmState();
  const job = jobs[game.id];
  const [confirm, setConfirm] = useState<Confirming>(null);

  const published = publishedVersion(game);
  const installed = installedVersion(game);
  const pending = pendingVersion(game);
  const targets = rollbackTargets(game);
  const history = useMemo(() => [...game.versions].sort((a, b) => compareSemver(b.version, a.version)), [game.versions]);
  const events = useMemo(() => [...game.events].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8), [game.events]);
  const installing = game.installation.status === "installing" || job?.status === "running";
  const unpublishedInstall = !!installed && game.publishing.publishedVersion !== installed.version;
  const blocker = publishBlocker(game);
  const topVersion = history[0]?.version ?? "1.0.0";

  /* ---- upload new version ---- */
  const [pkg, setPkg] = useState<PackageFile | null>(null);
  const [version, setVersion] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const suggested = nextMinor(topVersion);
  const versionError = version && !isSemver(version) ? "Use MAJOR.MINOR.PATCH, for example " + suggested : version && compareSemver(version, topVersion) <= 0 ? `Must be higher than ${topVersion}.` : null;

  const upload = async () => {
    if (!pkg) return setUploadErr("Upload the new version's ZIP package first.");
    if (!version.trim() || versionError) return setUploadErr(versionError ?? "Enter the new version number.");
    setUploadErr(null);
    const ok = await run("upload", () => gameManagementApi.uploadVersion(game.id, { version, releaseNotes: notes, fileName: pkg.name, sizeBytes: pkg.size }), `Version ${version.trim()} uploaded. Validate it, then install it.`);
    if (ok) {
      setPkg(null);
      setVersion("");
      setNotes("");
    } else {
      setUploadErr("The upload was rejected. See the message above.");
    }
  };

  return (
    <div>
      <Link href={`${GM_BASE}/versions`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/50 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All games</Link>
      <GmPageHeader
        eyebrow={`${game.name} · ${game.id}`}
        title="Version management"
        description="Upload new builds, install and publish updates, and roll back safely. Earlier versions are never overwritten."
        actions={<GmLinkButton href={`${GM_BASE}/${game.id}`} variant="outline">Deployment page</GmLinkButton>}
      />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <Summary label="Published version" tone="gold" value={published && game.publishing.status === "published" ? published.version : "—"} sub={game.publishing.status === "published" ? "Live to players" : "Not published"} />
        <Summary label="Installed version" tone="green" value={installed?.version ?? "—"} sub={game.installation.installedAt ? `Installed ${formatDay(game.installation.installedAt)}` : "Not installed"} />
        <Summary label="Available new version" tone={pending ? "violet" : undefined} value={pending?.version ?? "—"} sub={pending ? `${formatBytes(pending.package.sizeBytes)} · uploaded ${formatDay(pending.package.uploadedAt)}` : "Up to date"} />
      </div>

      <div className="space-y-6">
        {/* ---- available update ---- */}
        {pending && (
          <>
            <GmCard glow="violet">
              <GmCardHeader
                icon={<Rocket />}
                title={`${installed ? "Update" : "First install"} · version ${pending.version}`}
                description={installed ? `Replaces ${installed.version} once installed. Players keep receiving ${published?.version ?? installed.version} until you publish the update.` : "Install this package to deploy it."}
                action={<ValidationBadge v={pending} />}
              />
              <div className="space-y-4 p-5">
                <div className="rounded-xl border border-white/[0.07] bg-black/25 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">Release notes</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-white/70">{pending.releaseNotes || "No release notes were added."}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <GmButton variant="gold" onClick={() => setConfirm({ kind: "install" })} loading={busy === "install" || installing} disabled={pending.validation.state !== "passed" || installing}>
                    <Rocket className="h-4 w-4" /> {installed ? "Install update" : "Install"}
                  </GmButton>
                </div>
                {pending.validation.state !== "passed" && <p className="text-[13px] text-amber-300/90">{pending.validation.state === "failed" ? "This version failed validation. Upload a corrected build." : "Validate this version below before installing."}</p>}
              </div>
            </GmCard>
            <VersionValidation game={game} version={pending} />
          </>
        )}

        {(job || installing) && <InstallationProgress job={job} />}

        {/* ---- publish update ---- */}
        {installed && unpublishedInstall && (
          <GmCard glow="gold">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-white">Version {installed.version} is installed, not live</p>
                <p className="mt-1 text-[13px] leading-relaxed text-white/50">{game.publishing.status === "published" ? `Players are still on ${published?.version}. Publish the update to roll it out.` : "Publish it to make it visible in the player catalogue."}</p>
              </div>
              <GmButton variant="gold" onClick={() => setConfirm({ kind: "publish" })} disabled={!!blocker} loading={busy === "publish"}>{game.publishing.status === "published" ? "Publish update" : "Publish"}</GmButton>
            </div>
          </GmCard>
        )}

        {/* ---- upload new version ---- */}
        <GmCard>
          <GmCardHeader icon={<UploadCloud />} title="Upload new version" description="Adds a new entry to the version history. Validate and install it afterwards." />
          <div className="grid gap-5 p-5 lg:grid-cols-2">
            <PackageDropzone title="New version package (.zip)" value={pkg} onChange={setPkg} disabled={installing} />
            <div className="space-y-4">
              <GmField label="Version number" required error={versionError} hint={`Current highest is ${topVersion}. Try ${suggested}.`} htmlFor="gm-newver">
                <GmInput id="gm-newver" className="font-num" placeholder={suggested} value={version} invalid={!!versionError} onChange={(e) => setVersion(e.target.value)} />
              </GmField>
              <GmField label="Release notes" htmlFor="gm-newnotes">
                <GmTextarea id="gm-newnotes" rows={3} placeholder="What changed in this version?" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </GmField>
              {uploadErr && <p role="alert" className="text-xs text-rose-300">{uploadErr}</p>}
              <GmButton variant="neon" onClick={upload} loading={busy === "upload"} disabled={installing}><UploadCloud className="h-4 w-4" /> Upload version</GmButton>
            </div>
          </div>
        </GmCard>

        {/* ---- history ---- */}
        <GmCard>
          <GmCardHeader icon={<History />} title="Version history" description="Append-only. Rollback re-deploys an earlier installed version." />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-white/[0.06] bg-black/25">
                <tr><GmTh>Version</GmTh><GmTh>Status</GmTh><GmTh>Package</GmTh><GmTh>Uploaded</GmTh><GmTh>Release notes</GmTh><GmTh align="right">Actions</GmTh></tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {history.map((v) => {
                  const canRollback = targets.some((t) => t.id === v.id);
                  return (
                    <tr key={v.id} className="align-top">
                      <td className="px-4 py-3 font-num text-base font-semibold text-white">{v.version}</td>
                      <td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{labelsFor(game, v).map((l) => <VersionLabelBadge key={l} label={l} />)}<ValidationBadge v={v} /></div></td>
                      <td className="px-4 py-3"><p className="max-w-[200px] truncate font-mono text-[12px] text-white/55">{v.package.fileName}</p><p className="font-num text-xs text-white/38">{formatBytes(v.package.sizeBytes)}</p></td>
                      <td className="whitespace-nowrap px-4 py-3 text-white/55">{formatStamp(v.package.uploadedAt)}</td>
                      <td className="max-w-[320px] px-4 py-3 text-[13px] leading-relaxed text-white/55">{v.releaseNotes || <span className="text-white/30">No notes</span>}</td>
                      <td className="px-4 py-3 text-right">
                        {canRollback && <GmButton size="sm" variant="outline" disabled={installing} onClick={() => setConfirm({ kind: "rollback", version: v })}><Undo2 className="h-3.5 w-3.5" /> Roll back</GmButton>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {events.length > 0 && (
            <div className="border-t border-white/[0.06] p-5">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/38">Recent activity</p>
              <ul className="space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-white/55">
                    <span className="font-num text-xs text-white/35">{formatStamp(e.at)}</span>
                    <span className="capitalize text-white/80">{e.type.replace("_", " ")}</span>
                    {e.version && <GmBadge tone="slate" className="font-num">{e.version}</GmBadge>}
                    {e.note && <span className="text-white/40">{e.note}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </GmCard>

        <GmNotice tone="cyan" title="Mock version history">
          Versions, notes and sizes are demo data saved in this browser. Real package storage and rollback artifacts will come from the backend.
        </GmNotice>
      </div>

      <GmConfirm
        open={confirm?.kind === "install"}
        onClose={() => setConfirm(null)}
        title={installed ? "Install this update?" : "Install this version?"}
        confirmLabel={installed ? "Install update" : "Install"}
        onConfirm={() => run("install", () => gameManagementApi.installVersion(game.id, pending?.id), `Version ${pending?.version} installed.`)}
        body={<p>Version <b className="font-num text-white">{pending?.version}</b> will be deployed{installed ? <> in place of <b className="font-num text-white">{installed.version}</b></> : ""}. {game.publishing.status === "published" ? "Players are not affected until you publish the update." : ""}</p>}
      />
      <GmConfirm
        open={confirm?.kind === "publish"}
        onClose={() => setConfirm(null)}
        title={game.publishing.status === "published" ? "Publish this update?" : "Publish this game?"}
        confirmLabel="Publish"
        onConfirm={() => run("publish", () => gameManagementApi.publish(game.id), `Version ${installed?.version} is now live.`)}
        body={<p>Players will receive version <b className="font-num text-white">{installed?.version}</b>. Players on an earlier version will see <b className="text-white">Update available</b>.</p>}
      />
      <GmConfirm
        open={confirm?.kind === "rollback"}
        onClose={() => setConfirm(null)}
        tone="danger"
        title="Roll back to this version?"
        confirmLabel="Roll back"
        onConfirm={async () => {
          if (confirm?.kind !== "rollback") return;
          const v = confirm.version;
          try {
            await gameManagementApi.rollback(game.id, v.id);
            toast(`Rolled back to ${v.version}.`, "success");
          } catch (e) {
            toast(e instanceof GmApiError ? e.message : "Rollback failed.", "error");
          }
        }}
        body={
          confirm?.kind === "rollback" ? (
            <>
              <p>Version <b className="font-num text-white">{confirm.version.version}</b> will be re-deployed and become the installed version{game.publishing.status === "published" ? " and the published version" : ""}.</p>
              <p>Version {installed?.version} stays in the history.</p>
            </>
          ) : null
        }
      />
    </div>
  );
}
