"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, FileCog, PackageCheck, PackagePlus, Save, Settings2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { GM_BASE } from "../components/GmSectionShell";
import { gameManagementApi, GmApiError } from "../../services/gameManagementApi";
import { idleValidation, runValidation } from "../../services/validationService";
import { useGame, useGames } from "../../store/useGm";
import type { GameValidationResult, ValidationScenario } from "../../types";
import { GmButton, GmCard, GmCardHeader, GmLinkButton, GmNotice, GmPageHeader } from "../../ui/primitives";
import { DeploymentPanel } from "../installation/DeploymentPanel";
import { emptyDetails, GameDetailsForm, validateDetails, type DetailsState } from "../forms/GameDetailsForm";
import { PackageDropzone, ThumbnailUploader, type PackageFile } from "../components/UploadDropzone";
import { ValidationPanel } from "../components/ValidationPanel";


/**
 * Add New Game: upload the ZIP, enter details, validate, then install/deploy and publish. The draft is created in
 * the registry the first time the admin saves or installs; everything after that reads from the stored game.
 */
export function AddGamePage() {
  const toast = useToast();
  const games = useGames();
  const takenIds = useMemo(() => games.map((g) => g.id), [games]);

  const [pkg, setPkg] = useState<PackageFile | null>(null);
  const [thumb, setThumb] = useState<string | null>(null);
  const [details, setDetails] = useState<DetailsState>(emptyDetails);
  const [showErrors, setShowErrors] = useState(false);
  const [scenario, setScenario] = useState<ValidationScenario>("pass");
  const [validation, setValidation] = useState<GameValidationResult>(() => idleValidation());
  const [validating, setValidating] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saved = useGame(savedId ?? undefined);

  const errors = showErrors ? validateDetails(details, takenIds, !!savedId) : {};
  const detailsOk = Object.keys(validateDetails(details, takenIds, !!savedId)).length === 0;

  // Changing what is validated (file, ID, version, scenario) makes an earlier result stale.
  const fingerprint = `${pkg?.name}|${pkg?.size}|${details.id}|${details.version}|${scenario}`;
  useEffect(() => {
    if (!savedId) setValidation(idleValidation(scenario));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fingerprint]);

  const blockedReason = !pkg ? "Upload a ZIP package first." : !details.id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(details.id) ? "Enter a valid Game ID first, because the package is checked against it." : null;

  const validate = async () => {
    if (!pkg) return;
    setShowErrors(true);
    setValidating(true);
    const result = await runValidation({ fileName: pkg.name, sizeBytes: pkg.size, headerOk: pkg.headerOk, gameId: details.id, version: details.version, scenario }, setValidation);
    setValidating(false);
    if (savedId) await gameManagementApi.saveValidation(savedId, `${savedId}@${details.version.trim()}`, result);
    toast(result.state === "passed" ? "Validation passed (simulated)." : "Validation failed. Review the checks.", result.state === "passed" ? "success" : "error");
  };

  /** Creates the draft the first time, otherwise updates its details. Returns the Game ID or null on failure. */
  const saveDraft = useCallback(async (): Promise<string | null> => {
    setShowErrors(true);
    if (!pkg) {
      toast("Upload the game package first.", "error");
      return null;
    }
    if (!detailsOk) {
      toast("Complete the highlighted fields first.", "error");
      return null;
    }
    setSaving(true);
    try {
      if (savedId) {
        await gameManagementApi.updateDetails(savedId, { name: details.name, category: details.category, description: details.description, developer: details.developer, orientation: details.orientation, compatibility: { platforms: details.platforms, minBrowser: details.minBrowser }, ...(thumb ? { thumbnail: thumb } : {}) });
        toast("Draft updated.", "success");
        return savedId;
      }
      const g = await gameManagementApi.createDraft({
        id: details.id,
        name: details.name,
        category: details.category,
        description: details.description,
        developer: details.developer,
        orientation: details.orientation,
        compatibility: { platforms: details.platforms, minBrowser: details.minBrowser },
        thumbnail: thumb,
        version: details.version,
        releaseNotes: details.releaseNotes,
        package: { fileName: pkg.name, sizeBytes: pkg.size },
        validation: validation.state === "passed" || validation.state === "failed" ? validation : null,
      });
      setSavedId(g.id);
      toast(`“${g.name}” saved as a draft.`, "success");
      return g.id;
    } catch (e) {
      toast(e instanceof GmApiError ? e.message : "Could not save the draft.", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }, [pkg, detailsOk, savedId, details, thumb, validation, toast]);

  const installNow = async () => {
    const id = await saveDraft();
    if (!id) return;
    try {
      // the deployment panel below reads the running job from the store, so progress shows immediately
      void gameManagementApi.installVersion(id).then(
        () => toast("Installation completed.", "success"),
        (e) => toast(e instanceof GmApiError ? e.message : "Installation failed.", "error"),
      );
    } catch {
      /* handled above */
    }
  };

  const reset = () => {
    setPkg(null);
    setThumb(null);
    setDetails(emptyDetails());
    setShowErrors(false);
    setScenario("pass");
    setValidation(idleValidation());
    setSavedId(null);
  };

  const installed = saved?.installation.status === "installed";
  const published = saved?.publishing.status === "published";
  const steps = [
    { label: "Package uploaded", done: !!pkg },
    { label: "Details complete", done: detailsOk },
    { label: "Package validated", done: validation.state === "passed" },
    { label: "Installed", done: !!installed },
    { label: "Published", done: !!published },
  ];

  return (
    <div>
      <GmPageHeader
        eyebrow="Game management"
        title="Add new game"
        description="Upload a pre-built frontend package, describe the game, validate it, then install it and publish it to players."
        actions={
          <>
            {savedId && <GmButton variant="ghost" onClick={reset}>Add another game</GmButton>}
            <GmButton variant="outline" onClick={saveDraft} loading={saving}><Save className="h-4 w-4" /> {savedId ? "Update draft" : "Save as draft"}</GmButton>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <GmCard>
            <GmCardHeader icon={<UploadCloud />} title="1 · Game package" description="The ZIP is a built frontend bundle, not an npm package, and must not contain server-side game logic." />
            <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_280px]">
              <PackageDropzone value={pkg} onChange={setPkg} disabled={!!savedId} />
              <ThumbnailUploader value={thumb ?? saved?.thumbnail ?? null} onChange={setThumb} />
            </div>
            {savedId && <p className="border-t border-white/[0.06] px-5 py-3 text-[13px] text-white/40">The package is locked once the draft exists. Upload newer builds from Versions.</p>}
          </GmCard>

          <GmCard>
            <GmCardHeader icon={<FileCog />} title="2 · Game details" description="This information appears in the catalogue and in the package manifest check." />
            <div className="p-5">
              <GameDetailsForm value={details} onChange={setDetails} errors={errors} idLocked={!!savedId} versionLocked={!!savedId} />
            </div>
          </GmCard>

          <ValidationPanel
            title="3 · Package validation"
            result={validation}
            scenario={scenario}
            onScenario={setScenario}
            onRun={validate}
            running={validating}
            blockedReason={blockedReason}
          />

          {!savedId ? (
            <GmCard glow={validation.state === "passed" ? "gold" : undefined}>
              <GmCardHeader icon={<PackageCheck />} title="4 · Install & publish" description="Installation registers and deploys the built package. It never installs npm dependencies." />
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] leading-relaxed text-white/50">
                  {validation.state === "passed" ? "Validation passed. Installing saves the game as a draft first, then deploys it. You can preview and publish it once it is installed." : validation.state === "failed" ? "This package failed validation, so it cannot be installed. Fix it and validate again." : "Validate the package to unlock installation."}
                </p>
                <GmButton variant="gold" size="lg" disabled={validation.state !== "passed" || !pkg} loading={saving} onClick={installNow}><PackagePlus className="h-4 w-4" /> Install / Deploy</GmButton>
              </div>
            </GmCard>
          ) : saved ? (
            <DeploymentPanel game={saved} />
          ) : null}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <GmCard>
            <GmCardHeader icon={<Settings2 />} title="Launch checklist" />
            <ol className="space-y-1 p-3">
              {steps.map((s, i) => (
                <li key={s.label} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold", s.done ? "border-gold-400/50 bg-gold-400/20 text-gold-200" : "border-white/12 text-white/30")}>
                    {s.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className={cn("text-sm", s.done ? "font-semibold text-white" : "text-white/45")}>{s.label}</span>
                </li>
              ))}
            </ol>
            {savedId && (
              <div className="space-y-2 border-t border-white/[0.06] p-4">
                <GmLinkButton href={`${GM_BASE}/${savedId}`} variant="outline" size="sm" className="w-full">Open deployment page</GmLinkButton>
                <GmLinkButton href={`${GM_BASE}/versions/${savedId}`} variant="ghost" size="sm" className="w-full">Version management</GmLinkButton>
              </div>
            )}
          </GmCard>
          <div className="mt-4">
            <GmNotice tone="cyan" title="Server-side logic stays server-side">
              Game algorithms and the authoritative game engine are never part of an uploaded package. A package is presentation only.
            </GmNotice>
          </div>
        </aside>
      </div>
    </div>
  );
}
