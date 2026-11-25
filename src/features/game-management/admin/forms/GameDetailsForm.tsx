"use client";

import { cn } from "@/lib/utils";
import { BROWSERS, GAME_CATEGORIES, ORIENTATIONS, PLATFORMS } from "../../lib/constants";
import { isSemver } from "../../lib/semver";
import type { Orientation, Platform } from "../../types";
import { GmField, GmInput, GmSegmented, GmSelect, GmTextarea } from "../../ui/primitives";

export interface DetailsState {
  name: string;
  id: string;
  /** once the admin edits the ID by hand we stop deriving it from the name */
  idTouched: boolean;
  category: string;
  version: string;
  description: string;
  developer: string;
  orientation: Orientation;
  platforms: Platform[];
  minBrowser: string;
  releaseNotes: string;
}

export const emptyDetails = (): DetailsState => ({
  name: "",
  id: "",
  idTouched: false,
  category: GAME_CATEGORIES[0],
  version: "1.0.0",
  description: "",
  developer: "",
  orientation: "landscape",
  platforms: ["desktop", "tablet", "mobile"],
  minBrowser: BROWSERS[0],
  releaseNotes: "",
});

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

export type DetailsErrors = Partial<Record<keyof DetailsState, string>>;

export function validateDetails(d: DetailsState, takenIds: string[], idLocked: boolean): DetailsErrors {
  const e: DetailsErrors = {};
  if (!d.name.trim()) e.name = "Enter the game name.";
  if (!d.id) e.id = "Enter a unique Game ID.";
  else if (d.id.length < 3 || d.id.length > 40 || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(d.id)) e.id = "3–40 characters: lowercase letters, numbers and single hyphens.";
  else if (!idLocked && takenIds.includes(d.id)) e.id = `“${d.id}” is already used by another game.`;
  if (!isSemver(d.version)) e.version = "Use MAJOR.MINOR.PATCH, for example 1.0.0.";
  if (!d.description.trim()) e.description = "Add a short description.";
  if (!d.developer.trim()) e.developer = "Enter the developer or publisher.";
  if (d.platforms.length === 0) e.platforms = "Select at least one platform.";
  return e;
}

interface Props {
  value: DetailsState;
  onChange: (next: DetailsState) => void;
  errors: DetailsErrors;
  /** Game ID cannot change once a draft exists */
  idLocked?: boolean;
  /** versions are managed in Version management after the first draft */
  versionLocked?: boolean;
  disabled?: boolean;
}

export function GameDetailsForm({ value: v, onChange, errors, idLocked, versionLocked, disabled }: Props) {
  const set = <K extends keyof DetailsState>(k: K, val: DetailsState[K]) => onChange({ ...v, [k]: val });
  return (
    <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
      <GmField label="Game name" required error={errors.name} htmlFor="gm-name">
        <GmInput
          id="gm-name"
          value={v.name}
          invalid={!!errors.name}
          disabled={disabled}
          maxLength={60}
          placeholder="Dragon Vault"
          onChange={(e) => onChange({ ...v, name: e.target.value, id: v.idTouched || idLocked ? v.id : slugify(e.target.value) })}
        />
      </GmField>
      <GmField label="Game ID" required error={errors.id} hint={idLocked ? "The Game ID cannot change after the draft is saved." : "Unique and permanent. Must equal the gameId in manifest.json."} htmlFor="gm-id">
        <GmInput id="gm-id" className="font-mono" value={v.id} invalid={!!errors.id} disabled={disabled || idLocked} maxLength={40} placeholder="dragon-vault" onChange={(e) => onChange({ ...v, id: e.target.value.toLowerCase().replace(/\s+/g, "-"), idTouched: true })} />
      </GmField>

      <GmField label="Category" required htmlFor="gm-category">
        <GmSelect id="gm-category" value={v.category} disabled={disabled} onChange={(e) => set("category", e.target.value)}>
          {GAME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </GmSelect>
      </GmField>
      <GmField label="Version" required error={errors.version} hint={versionLocked ? "Add newer builds under Versions." : undefined} htmlFor="gm-version">
        <GmInput id="gm-version" className="font-num" value={v.version} invalid={!!errors.version} disabled={disabled || versionLocked} placeholder="1.0.0" onChange={(e) => set("version", e.target.value)} />
      </GmField>

      <GmField label="Short description" required error={errors.description} className="sm:col-span-2" hint={`${v.description.length}/160`} htmlFor="gm-desc">
        <GmTextarea id="gm-desc" rows={2} maxLength={160} value={v.description} invalid={!!errors.description} disabled={disabled} placeholder="One or two sentences shown in the catalogue." onChange={(e) => set("description", e.target.value)} />
      </GmField>

      <GmField label="Developer / publisher" required error={errors.developer} htmlFor="gm-dev">
        <GmInput id="gm-dev" value={v.developer} invalid={!!errors.developer} disabled={disabled} maxLength={60} placeholder="Studio name" onChange={(e) => set("developer", e.target.value)} />
      </GmField>
      <GmField label="Supported orientation">
        <GmSegmented<Orientation> label="Supported orientation" value={v.orientation} onChange={(o) => !disabled && set("orientation", o)} options={ORIENTATIONS} />
      </GmField>

      <GmField label="Supported platforms" required error={errors.platforms}>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const on = v.platforms.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                disabled={disabled}
                onClick={() => set("platforms", on ? v.platforms.filter((x) => x !== p.id) : [...v.platforms, p.id])}
                className={cn("h-10 rounded-xl border px-4 text-[13px] font-semibold transition disabled:opacity-50", on ? "border-gold-400/50 bg-gold-400/15 text-gold-200" : "border-white/10 bg-black/40 text-white/55 hover:text-white")}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </GmField>
      <GmField label="Minimum browser" htmlFor="gm-browser">
        <GmSelect id="gm-browser" value={v.minBrowser} disabled={disabled} onChange={(e) => set("minBrowser", e.target.value)}>
          {BROWSERS.map((b) => <option key={b} value={b}>{b}</option>)}
        </GmSelect>
      </GmField>

      <GmField label="Release notes" className="sm:col-span-2" hint="Shown to admins in version history and to players on updates." htmlFor="gm-notes">
        <GmTextarea id="gm-notes" rows={3} value={v.releaseNotes} disabled={disabled} placeholder="What is in this package?" onChange={(e) => set("releaseNotes", e.target.value)} />
      </GmField>
    </div>
  );
}
