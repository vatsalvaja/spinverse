"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Eye, Lock, PackageSearch, Save, Undo2 } from "lucide-react";
import { GAME_CATEGORIES } from "../../lib/constants";
import { isSemver } from "../../lib/semver";
import { gameManagementApi, type ConfigurationInput } from "../../services/gameManagementApi";
import { useGame, useHydrated } from "../../store/useGm";
import type { ManagedGame, Visibility } from "../../types";
import { GmBadge, GmButton, GmCard, GmCardHeader, GmConfirm, GmEmpty, GmField, GmInput, GmLinkButton, GmNotice, GmPageHeader, GmSegmented, GmSelect, GmSkeleton, GmTextarea, GmToggle } from "../../ui/primitives";
import { PublishingBadge } from "../../ui/StatusBadges";
import { GM_BASE } from "../components/GmSectionShell";
import { ThumbnailUploader } from "../components/UploadDropzone";
import { useRun } from "../components/useRun";

const VISIBILITY: { id: Visibility; label: string }[] = [
  { id: "public", label: "Public" },
  { id: "hidden", label: "Hidden" },
  { id: "private", label: "Private" },
];
const VISIBILITY_HINT: Record<Visibility, string> = {
  public: "Listed in the player catalogue once the game is published.",
  hidden: "Not listed in the catalogue. Reserved for direct links.",
  private: "Visible to admins only.",
};

const toInput = (g: ManagedGame): ConfigurationInput => ({
  ...g.config,
  category: g.category,
  description: g.description,
  thumbnail: g.thumbnail,
  maintenance: g.publishing.maintenance,
  maintenanceMessage: g.publishing.maintenanceMessage,
});

export function ConfigurationPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const game = useGame(gameId);
  const ready = useHydrated();
  if (!ready) return <div className="space-y-4"><GmSkeleton className="h-20" /><GmSkeleton className="h-96" /></div>;
  if (!game) {
    return (
      <GmCard>
        <GmEmpty icon={<PackageSearch />} title="Game not found" body={`There is no game with the ID “${gameId}”.`} action={<GmLinkButton href={`${GM_BASE}/configuration`} variant="gold">All games</GmLinkButton>} />
      </GmCard>
    );
  }
  // re-initialise the form whenever the stored game changes (after a save, or an edit elsewhere)
  return <ConfigForm key={game.updatedAt} game={game} />;
}

function ConfigForm({ game }: { game: ManagedGame }) {
  const { run, busy } = useRun();
  const initial = toInput(game);
  const [form, setForm] = useState<ConfigurationInput>(initial);
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof ConfigurationInput>(k: K, v: ConfigurationInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const errors = {
    minClientVersion: isSemver(form.minClientVersion) ? null : "Use MAJOR.MINOR.PATCH, for example 1.0.0.",
    displayOrder: Number.isFinite(form.displayOrder) && form.displayOrder >= 1 ? null : "Enter 1 or higher.",
    description: form.description.trim() ? null : "Add a description.",
  };
  const valid = !Object.values(errors).some(Boolean);

  const live = game.publishing.status === "published";
  const warnings: string[] = [];
  if (live && game.config.enabled && !form.enabled) warnings.push("Disabling the game removes it from the player catalogue.");
  if (live && game.config.visibility === "public" && form.visibility !== "public") warnings.push(`Setting visibility to ${form.visibility} removes the game from the player catalogue.`);
  if (live && !game.publishing.maintenance && form.maintenance) warnings.push("Maintenance mode stops players from launching the game.");

  const save = () => (warnings.length ? setConfirm(true) : void commit());
  const commit = () => run("save", () => gameManagementApi.updateConfiguration(game.id, form), "Configuration saved.");

  return (
    <div>
      <Link href={`${GM_BASE}/configuration`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white/50 transition hover:text-white"><ArrowLeft className="h-4 w-4" /> All games</Link>
      <GmPageHeader
        eyebrow={`${game.name} · ${game.id}`}
        title="Game configuration"
        description="Catalogue presentation and availability for this game."
        actions={
          <>
            <PublishingBadge publishing={game.publishing} />
            <GmLinkButton href={`${GM_BASE}/${game.id}`} variant="outline" size="sm">Deployment page</GmLinkButton>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <GmCard>
            <GmCardHeader icon={<Eye />} title="Availability" description="Who can see and launch this game." />
            <div className="space-y-5 p-5">
              <GmField label="Game visibility" hint={VISIBILITY_HINT[form.visibility]}>
                <GmSegmented<Visibility> label="Game visibility" value={form.visibility} onChange={(v) => set("visibility", v)} options={VISIBILITY} />
              </GmField>
              <div className="space-y-5 border-t border-white/[0.06] pt-5">
                <GmToggle label="Game enabled" description="A disabled game is hidden from players even if it is published." checked={form.enabled} onChange={(v) => set("enabled", v)} />
                <GmToggle label="Featured" description="Highlight this game in featured placements." checked={form.featured} onChange={(v) => set("featured", v)} />
                <GmToggle label="Maintenance mode" description="Keep the game listed but stop players from launching it." checked={form.maintenance} onChange={(v) => set("maintenance", v)} />
                {form.maintenance && (
                  <GmField label="Maintenance message" hint="Shown to players on the game card." htmlFor="gm-maint">
                    <GmTextarea id="gm-maint" rows={2} maxLength={120} value={form.maintenanceMessage} onChange={(e) => set("maintenanceMessage", e.target.value)} placeholder="We are improving this game and will be back shortly." />
                  </GmField>
                )}
              </div>
            </div>
          </GmCard>

          <GmCard>
            <GmCardHeader icon={<Lock />} title="Catalogue details" description="How the game is listed and ordered." />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <GmField label="Category" htmlFor="gm-cfg-cat">
                <GmSelect id="gm-cfg-cat" value={form.category} onChange={(e) => set("category", e.target.value)}>
                  {Array.from(new Set([...GAME_CATEGORIES, game.category])).map((c) => <option key={c} value={c}>{c}</option>)}
                </GmSelect>
              </GmField>
              <GmField label="Display order" error={errors.displayOrder} hint="Lower numbers appear first." htmlFor="gm-cfg-order">
                <GmInput id="gm-cfg-order" type="number" min={1} className="font-num" value={Number.isFinite(form.displayOrder) ? form.displayOrder : ""} invalid={!!errors.displayOrder} onChange={(e) => set("displayOrder", e.target.value === "" ? NaN : Number(e.target.value))} />
              </GmField>
              <GmField label="Minimum supported client version" error={errors.minClientVersion} hint="Older clients are asked to refresh before launching." htmlFor="gm-cfg-min">
                <GmInput id="gm-cfg-min" className="font-num" value={form.minClientVersion} invalid={!!errors.minClientVersion} onChange={(e) => set("minClientVersion", e.target.value)} />
              </GmField>
              <div className="sm:col-span-2">
                <GmField label="Game description" error={errors.description} hint={`${form.description.length}/300`} htmlFor="gm-cfg-desc">
                  <GmTextarea id="gm-cfg-desc" rows={3} maxLength={300} value={form.description} invalid={!!errors.description} onChange={(e) => set("description", e.target.value)} />
                </GmField>
              </div>
              <div className="sm:col-span-2">
                <ThumbnailUploader value={form.thumbnail} onChange={(t) => set("thumbnail", t)} />
              </div>
            </div>
          </GmCard>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24 lg:self-start">
          <GmCard glow={dirty ? "gold" : undefined} className="p-5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-white">Save changes</p>
              {dirty ? <GmBadge tone="gold" dot>Unsaved</GmBadge> : <GmBadge tone="slate">Up to date</GmBadge>}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/45">Changes apply to the player catalogue as soon as you save.</p>
            <div className="mt-4 flex gap-2">
              <GmButton variant="gold" className="flex-1" onClick={save} disabled={!dirty || !valid} loading={busy === "save"}><Save className="h-4 w-4" /> Save</GmButton>
              <GmButton variant="outline" onClick={() => setForm(initial)} disabled={!dirty}><Undo2 className="h-4 w-4" /> Discard</GmButton>
            </div>
          </GmCard>
          <GmNotice tone="cyan" title="Game engine settings are not here">
            Game rules, algorithms and engine behaviour are authoritative server-side concerns. This page only controls how the game is presented and offered.
          </GmNotice>
        </aside>
      </div>

      <GmConfirm
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Apply these changes?"
        confirmLabel="Save changes"
        onConfirm={commit}
        body={<ul className="list-disc space-y-1.5 pl-4">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      />
    </div>
  );
}
