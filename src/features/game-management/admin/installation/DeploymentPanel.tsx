"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, FileClock, Rocket, Trash2, Wrench } from "lucide-react";
import { installedVersion, pendingVersion, publishBlocker, publishedVersion } from "../../lib/derive";
import { formatStamp } from "../../lib/format";
import { gameManagementApi } from "../../services/gameManagementApi";
import { useGmState } from "../../store/useGm";
import type { ManagedGame } from "../../types";
import { GmButton, GmCard, GmCardHeader, GmConfirm, GmDialog, GmField, GmNotice, GmTextarea } from "../../ui/primitives";
import { InstallationBadge, PublishingBadge } from "../../ui/StatusBadges";
import { GM_BASE } from "../components/GmSectionShell";
import { useRun } from "../components/useRun";
import { InstallationProgress } from "./InstallationProgress";
import { useGamePreview } from "./PreviewDialog";

type Confirming = "publish" | "unpublish" | "draft" | "uninstall" | "maintenance-off" | null;

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/38">{label}</dt>
      <dd className="mt-1.5 truncate text-sm font-semibold text-white">{children}</dd>
    </div>
  );
}

/**
 * Install, preview, publish, maintenance and uninstall for one game. Every control changes the stored game state
 * through the mock service; nothing here only pretends to succeed.
 */
export function DeploymentPanel({ game, onInstalled }: { game: ManagedGame; onInstalled?: () => void }) {
  const { run, busy } = useRun();
  const { jobs } = useGmState();
  const job = jobs[game.id];
  const [confirm, setConfirm] = useState<Confirming>(null);
  const [maintOpen, setMaintOpen] = useState(false);
  const [message, setMessage] = useState(game.publishing.maintenanceMessage);
  const preview = useGamePreview(game);

  const pending = pendingVersion(game);
  const installed = installedVersion(game);
  const live = publishedVersion(game);
  const isInstalled = game.installation.status === "installed";
  const installing = game.installation.status === "installing" || job?.status === "running";
  const blocker = publishBlocker(game);
  const isPublished = game.publishing.status === "published";

  const installBlocker = installing
    ? "An installation is running."
    : !pending
      ? "No uploaded package is waiting to be installed."
      : pending.validation.state !== "passed"
        ? "Validate the package first. Only a package that passed validation can be installed."
        : null;

  const install = async () => {
    const ok = await run("install", () => gameManagementApi.installVersion(game.id), `${game.name} ${pending?.version ?? ""} installed.`);
    if (ok) onInstalled?.();
  };

  return (
    <>
      <GmCard>
        <GmCardHeader icon={<Rocket />} title="Installation & publishing" description="Deploy the built frontend package, preview it, then publish it to the player catalogue." />
        <div className="space-y-5 p-5">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
            <Fact label="Installation"><InstallationBadge installation={game.installation} /></Fact>
            <Fact label="Installed version">{installed ? <span className="font-num">{installed.version}</span> : <span className="text-white/35">—</span>}</Fact>
            <Fact label="Installed on">{game.installation.installedAt ? formatStamp(game.installation.installedAt) : <span className="text-white/35">—</span>}</Fact>
            <Fact label="Publishing"><PublishingBadge publishing={game.publishing} /></Fact>
            <Fact label="Live to players">{live && isPublished ? <span className="font-num text-gold-300">{live.version}</span> : <span className="text-white/35">Not live</span>}</Fact>
          </dl>

          {game.installation.status === "failed" && (
            <GmNotice tone="red" title="Installation failed">{game.installation.failureReason ?? "The installation did not complete."} You can start it again below.</GmNotice>
          )}

          {(job || installing) && <InstallationProgress job={job} />}

          {/* primary actions */}
          <div className="flex flex-wrap items-center gap-2">
            {!isInstalled && (
              <GmButton variant="gold" size="lg" onClick={install} loading={busy === "install" || installing} disabled={!!installBlocker}>
                <Rocket className="h-4 w-4" /> {game.installation.status === "failed" ? "Retry install" : "Install / Deploy"}
              </GmButton>
            )}
            {isInstalled && (
              <>
                <GmButton variant="neon" onClick={preview.launch}><Eye className="h-4 w-4" /> Open game preview</GmButton>
                {!isPublished ? (
                  <GmButton variant="gold" onClick={() => setConfirm("publish")} disabled={!!blocker} loading={busy === "publish"}>Publish</GmButton>
                ) : (
                  <GmButton variant="outline" onClick={() => setConfirm("unpublish")} loading={busy === "unpublish"}><EyeOff className="h-4 w-4" /> Unpublish</GmButton>
                )}
              </>
            )}
            {game.publishing.status !== "draft" && (
              <GmButton variant="ghost" onClick={() => setConfirm("draft")}><FileClock className="h-4 w-4" /> Move to draft</GmButton>
            )}
            {isInstalled && (
              <GmButton variant="danger" className="sm:ml-auto" onClick={() => setConfirm("uninstall")} loading={busy === "uninstall"}><Trash2 className="h-4 w-4" /> Uninstall</GmButton>
            )}
          </div>

          {!isInstalled && installBlocker && !installing && <p className="text-[13px] text-amber-300/90">{installBlocker}</p>}
          {isInstalled && blocker && <p className="text-[13px] text-amber-300/90">{blocker}</p>}
          {isInstalled && pending && (
            <GmNotice tone="gold" title={`Version ${pending.version} is waiting`}>
              A newer package has been uploaded. Validate, install and publish it from <Link className="font-semibold text-gold-200 underline-offset-2 hover:underline" href={`${GM_BASE}/versions/${game.id}`}>Version management</Link>.
            </GmNotice>
          )}

          {/* maintenance */}
          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-300"><Wrench className="h-4 w-4" /></span>
              <div>
                <p className="text-sm font-semibold text-white">Maintenance mode</p>
                <p className="mt-0.5 text-[13px] leading-relaxed text-white/45">
                  {game.publishing.maintenance
                    ? `Players see this game as under maintenance and cannot launch it${game.publishing.maintenanceMessage ? `: “${game.publishing.maintenanceMessage}”` : "."}`
                    : "Keep the game listed but stop players launching it while you fix something."}
                </p>
              </div>
            </div>
            {game.publishing.maintenance ? (
              <GmButton variant="outline" onClick={() => setConfirm("maintenance-off")} loading={busy === "maint"}>Disable</GmButton>
            ) : (
              <GmButton variant="outline" onClick={() => { setMessage(game.publishing.maintenanceMessage); setMaintOpen(true); }}>Enable</GmButton>
            )}
          </div>
        </div>
      </GmCard>

      {preview.dialog}

      <GmConfirm
        open={confirm === "publish"}
        onClose={() => setConfirm(null)}
        title="Publish this game?"
        confirmLabel="Publish game"
        onConfirm={() => run("publish", () => gameManagementApi.publish(game.id), `${game.name} is now published.`)}
        body={<p><b className="text-white">{game.name}</b> version <b className="font-num text-white">{game.installation.installedVersion}</b> will appear in the player catalogue and players will be able to install it.</p>}
      />
      <GmConfirm
        open={confirm === "unpublish"}
        onClose={() => setConfirm(null)}
        tone="danger"
        title="Unpublish this game?"
        confirmLabel="Unpublish"
        onConfirm={() => run("unpublish", () => gameManagementApi.unpublish(game.id), `${game.name} was unpublished.`)}
        body={<p><b className="text-white">{game.name}</b> will disappear from the player catalogue. Players who already installed it keep their cached copy, but cannot install or update it again until it is republished.</p>}
      />
      <GmConfirm
        open={confirm === "draft"}
        onClose={() => setConfirm(null)}
        title="Move to draft?"
        confirmLabel="Save as draft"
        onConfirm={() => run("draft", () => gameManagementApi.saveAsDraft(game.id), `${game.name} saved as draft.`)}
        body={<p>The game is removed from the player catalogue and marked as a draft. Installed files and versions are kept.</p>}
      />
      <GmConfirm
        open={confirm === "uninstall"}
        onClose={() => setConfirm(null)}
        tone="danger"
        title="Uninstall this game?"
        confirmLabel="Uninstall"
        onConfirm={() => run("uninstall", () => gameManagementApi.uninstall(game.id), `${game.name} was uninstalled.`)}
        body={<><p>The deployed files for <b className="text-white">{game.name}</b> are removed. Version history is kept so you can install again.</p>{isPublished && <p className="text-rose-300">This game is published, so it will be unpublished too.</p>}</>}
      />
      <GmConfirm
        open={confirm === "maintenance-off"}
        onClose={() => setConfirm(null)}
        title="Disable maintenance mode?"
        confirmLabel="Disable"
        onConfirm={() => run("maint", () => gameManagementApi.setMaintenance(game.id, false), "Maintenance mode disabled.")}
        body={<p>Players will be able to launch <b className="text-white">{game.name}</b> again straight away.</p>}
      />

      <GmDialog
        open={maintOpen}
        onClose={() => setMaintOpen(false)}
        size="sm"
        title="Enable maintenance mode"
        description="The game stays in the catalogue but cannot be launched."
        footer={
          <>
            <GmButton variant="ghost" onClick={() => setMaintOpen(false)}>Cancel</GmButton>
            <GmButton variant="gold" loading={busy === "maint"} onClick={async () => { if (await run("maint", () => gameManagementApi.setMaintenance(game.id, true, message), "Maintenance mode enabled.")) setMaintOpen(false); }}>Enable maintenance</GmButton>
          </>
        }
      >
        <GmField label="Message for players" hint="Optional. Shown on the game card.">
          <GmTextarea maxLength={120} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="We are improving this game and will be back shortly." />
        </GmField>
      </GmDialog>
    </>
  );
}
