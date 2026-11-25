import type { GameVersion, ManagedGame } from "../types";
import { compareSemver } from "./semver";

export const versionOf = (g: ManagedGame, version: string | null | undefined): GameVersion | undefined =>
  version ? g.versions.find((v) => v.version === version) : undefined;

export const latestVersion = (g: ManagedGame): GameVersion =>
  [...g.versions].sort((a, b) => compareSemver(b.version, a.version))[0];

export const pendingVersion = (g: ManagedGame): GameVersion | undefined => g.versions.find((v) => v.id === g.pendingVersionId);

export const installedVersion = (g: ManagedGame): GameVersion | undefined => versionOf(g, g.installation.installedVersion);

export const publishedVersion = (g: ManagedGame): GameVersion | undefined => versionOf(g, g.publishing.publishedVersion);

/** The version shown as "current" in tables: what is installed, otherwise the newest upload. */
export const currentVersion = (g: ManagedGame): GameVersion => installedVersion(g) ?? latestVersion(g);

/** An installed game that has a newer uploaded build waiting. A game with no install yet is not an "update". */
export const hasPendingUpdate = (g: ManagedGame): boolean => g.installation.status === "installed" && !!pendingVersion(g);

/** Why this game cannot be published right now, or null when it can. */
export function publishBlocker(g: ManagedGame): string | null {
  if (g.installation.status !== "installed" || !g.installation.installedVersion) return "Install the game before publishing it.";
  const v = installedVersion(g);
  if (!v || v.validation.state !== "passed") return "The installed package has not passed validation.";
  return null;
}

/** Versions that were installed at some point and are older than what is installed now: valid rollback targets. */
export function rollbackTargets(g: ManagedGame): GameVersion[] {
  const installedNow = g.installation.installedVersion;
  const everInstalled = new Set(g.events.filter((e) => e.type === "installed" || e.type === "rolled_back").map((e) => e.version));
  return g.versions
    .filter((v) => everInstalled.has(v.version) && v.version !== installedNow && v.validation.state === "passed")
    .sort((a, b) => compareSemver(b.version, a.version));
}

export type VersionLabel = "published" | "installed" | "available" | "previous" | "failed";

export function labelsFor(g: ManagedGame, v: GameVersion): VersionLabel[] {
  const out: VersionLabel[] = [];
  if (g.publishing.publishedVersion === v.version && g.publishing.status === "published") out.push("published");
  if (g.installation.installedVersion === v.version) out.push("installed");
  if (g.pendingVersionId === v.id) out.push("available");
  if (v.validation.state === "failed") out.push("failed");
  if (!out.length) out.push("previous");
  return out;
}
