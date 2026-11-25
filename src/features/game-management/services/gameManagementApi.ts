import { compareSemver, isSemver } from "../lib/semver";
import { formatBytes, nowIso, uid } from "../lib/format";
import { installedVersion, publishBlocker, rollbackTargets } from "../lib/derive";
import { placeholderThumbnail } from "../mock-data/seed";
import { gmStore } from "../store/gmStore";
import type {
  AdminJob,
  GameConfiguration,
  GameDraftInput,
  GameValidationResult,
  GameVersion,
  GameVersionEvent,
  ManagedGame,
  VersionEventType,
} from "../types";
import { idleValidation } from "./validationService";

/**
 * Admin Game Management service – MOCK IMPLEMENTATION.
 *
 * Every method is async and returns the updated entity, shaped like the REST calls that will replace them:
 *   createDraft        POST   /admin/games
 *   updateDetails      PATCH  /admin/games/:id
 *   uploadVersion      POST   /admin/games/:id/versions
 *   saveValidation     POST   /admin/games/:id/versions/:v/validate
 *   installVersion     POST   /admin/games/:id/deployments
 *   publish/unpublish  POST   /admin/games/:id/publish | /unpublish
 *   ...
 * State lives in the local store and localStorage. Business rules (cannot publish an uninstalled game, versions are
 * append-only, ...) are enforced here, not in components, so the backend can own them later.
 */

export class GmApiError extends Error {}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const need = (id: string): ManagedGame => {
  const g = gmStore.getGame(id);
  if (!g) throw new GmApiError("That game no longer exists.");
  return g;
};
const event = (type: VersionEventType, version: string, note?: string): GameVersionEvent => ({ id: uid("evt"), at: nowIso(), type, version, note });
const touch = (g: ManagedGame, events: GameVersionEvent[] = []): ManagedGame => ({ ...g, events: [...g.events, ...events], updatedAt: nowIso() });

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const hueFor = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

/* ------------------------------------------------------------------ */
/* Create & edit                                                       */
/* ------------------------------------------------------------------ */

async function createDraft(input: GameDraftInput): Promise<ManagedGame> {
  await sleep(250);
  const id = input.id.trim();
  if (!ID_RE.test(id) || id.length < 3 || id.length > 40) throw new GmApiError("Game ID must be 3–40 characters: lowercase letters, numbers and hyphens.");
  if (gmStore.getGame(id)) throw new GmApiError(`Game ID “${id}” is already in use.`);
  if (!input.name.trim()) throw new GmApiError("Game name is required.");
  if (!isSemver(input.version)) throw new GmApiError("Version must look like 1.0.0.");

  const at = nowIso();
  const version: GameVersion = {
    id: `${id}@${input.version.trim()}`,
    version: input.version.trim(),
    releaseNotes: input.releaseNotes.trim(),
    package: { fileName: input.package.fileName, sizeBytes: input.package.sizeBytes, uploadedAt: at },
    validation: input.validation ?? idleValidation(),
  };
  const events = [event("uploaded", version.version, input.package.fileName)];
  if (version.validation.state === "passed") events.push(event("validated", version.version));

  const orders = gmStore.getData().games.map((g) => g.config.displayOrder);
  const game: ManagedGame = {
    id,
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    developer: input.developer.trim(),
    thumbnail: input.thumbnail ?? placeholderThumbnail(input.name, hueFor(id)),
    orientation: input.orientation,
    compatibility: input.compatibility,
    config: { visibility: "public", featured: false, enabled: true, displayOrder: (orders.length ? Math.max(...orders) : 0) + 1, minClientVersion: "1.0.0" },
    versions: [version],
    events,
    pendingVersionId: version.id,
    installation: { status: "not_installed", installedVersion: null, installedAt: null, failureReason: null },
    publishing: { status: "draft", maintenance: false, maintenanceMessage: "", publishedAt: null, publishedVersion: null },
    builtIn: false,
    createdAt: at,
    updatedAt: at,
  };
  gmStore.setData((d) => ({ ...d, games: [...d.games, game] }));
  return game;
}

type Details = Partial<Pick<ManagedGame, "name" | "category" | "description" | "developer" | "orientation" | "compatibility" | "thumbnail">>;

async function updateDetails(id: string, patch: Details): Promise<ManagedGame> {
  await sleep(200);
  need(id);
  if (patch.name !== undefined && !patch.name.trim()) throw new GmApiError("Game name is required.");
  gmStore.updateGame(id, (g) => touch({ ...g, ...patch }));
  return need(id);
}

async function saveValidation(gameId: string, versionId: string, result: GameValidationResult): Promise<void> {
  need(gameId);
  gmStore.updateGame(gameId, (g) => {
    const v = g.versions.find((x) => x.id === versionId);
    if (!v) return g;
    const changed = v.validation.state !== result.state;
    return touch(
      { ...g, versions: g.versions.map((x) => (x.id === versionId ? { ...x, validation: result } : x)) },
      changed && result.state === "passed" ? [event("validated", v.version)] : [],
    );
  });
}

/* ------------------------------------------------------------------ */
/* Versions                                                            */
/* ------------------------------------------------------------------ */

async function uploadVersion(gameId: string, input: { version: string; releaseNotes: string; fileName: string; sizeBytes: number }): Promise<GameVersion> {
  await sleep(250);
  const g = need(gameId);
  const v = input.version.trim();
  if (!isSemver(v)) throw new GmApiError("Version must look like 1.2.0.");
  if (g.versions.some((x) => x.version === v)) throw new GmApiError(`Version ${v} already exists. Existing versions are never overwritten.`);
  const top = g.versions.map((x) => x.version).sort(compareSemver).pop()!;
  if (compareSemver(v, top) <= 0) throw new GmApiError(`The new version must be higher than ${top}.`);
  const version: GameVersion = {
    id: `${g.id}@${v}`,
    version: v,
    releaseNotes: input.releaseNotes.trim(),
    package: { fileName: input.fileName, sizeBytes: input.sizeBytes, uploadedAt: nowIso() },
    validation: idleValidation(),
  };
  gmStore.updateGame(gameId, (x) => touch({ ...x, versions: [...x.versions, version], pendingVersionId: version.id }, [event("uploaded", v, input.fileName)]));
  return version;
}

/* ------------------------------------------------------------------ */
/* Installation / deployment                                           */
/* ------------------------------------------------------------------ */

const INSTALL_STEPS: { key: string; label: string; ms: number; message: (v: GameVersion) => string }[] = [
  { key: "received", label: "Package received", ms: 700, message: (v) => `Received ${v.package.fileName} (${formatBytes(v.package.sizeBytes)}).` },
  { key: "validated", label: "Package validated", ms: 800, message: (v) => `Confirming validation result for version ${v.version}.` },
  { key: "prepare", label: "Preparing deployment", ms: 900, message: () => "Allocating a versioned deployment slot for the built frontend bundle." },
  { key: "files", label: "Installing game files", ms: 2000, message: (v) => `Copying static game files for version ${v.version}. No dependencies are installed.` },
  { key: "register", label: "Registering game", ms: 900, message: () => "Registering the game and its version in the catalogue service." },
  { key: "done", label: "Installation completed", ms: 500, message: () => "Game files are live and ready for preview." },
];

function newJob(g: ManagedGame, v: GameVersion, kind: AdminJob["kind"]): AdminJob {
  return {
    gameId: g.id,
    kind,
    version: v.version,
    status: "running",
    stepIndex: 0,
    steps: INSTALL_STEPS.map((s, i) => ({ key: s.key, label: s.label, state: i === 0 ? "running" : "pending" })),
    progress: 0,
    message: INSTALL_STEPS[0].message(v),
    error: null,
    startedAt: nowIso(),
  };
}

/** Animates progress across the six deployment steps. Works with the module store, so it survives navigation. */
async function runDeployment(g: ManagedGame, v: GameVersion, kind: AdminJob["kind"]): Promise<void> {
  let job = newJob(g, v, kind);
  gmStore.setJob(job, g.id);
  const total = INSTALL_STEPS.length;
  for (let i = 0; i < total; i++) {
    const step = INSTALL_STEPS[i];
    job = {
      ...job,
      stepIndex: i,
      message: step.message(v),
      steps: job.steps.map((s, j) => ({ ...s, state: j < i ? "done" : j === i ? "running" : "pending" })),
    };
    gmStore.setJob(job, g.id);
    const ticks = Math.max(4, Math.round(step.ms / 90));
    for (let t = 1; t <= ticks; t++) {
      await sleep(step.ms / ticks);
      job = { ...job, progress: Math.round(((i + t / ticks) / total) * 100) };
      gmStore.setJob(job, g.id);
    }
  }
  gmStore.setJob({ ...job, status: "done", progress: 100, steps: job.steps.map((s) => ({ ...s, state: "done" })), message: "Installation completed." }, g.id);
}

async function installVersion(gameId: string, versionId?: string): Promise<ManagedGame> {
  const g = need(gameId);
  if (gmStore.getSnapshot().jobs[gameId]?.status === "running") throw new GmApiError("An installation is already running for this game.");
  const v = g.versions.find((x) => x.id === (versionId ?? g.pendingVersionId));
  if (!v) throw new GmApiError("There is no uploaded version to install.");
  if (v.validation.state !== "passed") throw new GmApiError("This package has not passed validation. Validate it before installing.");

  const kind: AdminJob["kind"] = g.installation.status === "installed" ? "update" : "install";
  gmStore.updateGame(gameId, (x) => ({ ...x, installation: { ...x.installation, status: "installing", failureReason: null } }));
  try {
    await runDeployment(g, v, kind);
  } catch (e) {
    gmStore.updateGame(gameId, (x) => ({ ...x, installation: { ...x.installation, status: "failed", failureReason: "Installation failed unexpectedly." } }));
    throw e;
  }
  gmStore.updateGame(gameId, (x) =>
    touch(
      {
        ...x,
        pendingVersionId: x.pendingVersionId === v.id ? null : x.pendingVersionId,
        installation: { status: "installed", installedVersion: v.version, installedAt: nowIso(), failureReason: null },
      },
      [event("installed", v.version)],
    ),
  );
  return need(gameId);
}

async function rollback(gameId: string, versionId: string): Promise<ManagedGame> {
  const g = need(gameId);
  const target = rollbackTargets(g).find((v) => v.id === versionId);
  if (!target) throw new GmApiError("That version is not available for rollback.");
  if (gmStore.getSnapshot().jobs[gameId]?.status === "running") throw new GmApiError("A deployment is already running for this game.");
  const wasPublished = g.publishing.status === "published";
  gmStore.updateGame(gameId, (x) => ({ ...x, installation: { ...x.installation, status: "installing", failureReason: null } }));
  await runDeployment(g, target, "rollback");
  gmStore.updateGame(gameId, (x) =>
    touch(
      {
        ...x,
        pendingVersionId: null,
        installation: { status: "installed", installedVersion: target.version, installedAt: nowIso(), failureReason: null },
        publishing: wasPublished ? { ...x.publishing, publishedVersion: target.version, publishedAt: nowIso() } : x.publishing,
      },
      [event("rolled_back", target.version, `Rolled back from ${g.installation.installedVersion}`)],
    ),
  );
  return need(gameId);
}

async function uninstall(gameId: string): Promise<ManagedGame> {
  await sleep(500);
  const g = need(gameId);
  if (g.installation.status === "installing") throw new GmApiError("Wait for the running installation to finish.");
  const installed = installedVersion(g);
  const wasPublished = g.publishing.status === "published";
  gmStore.updateGame(gameId, (x) =>
    touch(
      {
        ...x,
        pendingVersionId: installed ? installed.id : x.pendingVersionId,
        installation: { status: "not_installed", installedVersion: null, installedAt: null, failureReason: null },
        publishing: wasPublished ? { ...x.publishing, status: "unpublished", publishedVersion: null, maintenance: false } : x.publishing,
      },
      installed ? [event("uninstalled", installed.version), ...(wasPublished ? [event("unpublished", installed.version, "Unpublished because the game was uninstalled")] : [])] : [],
    ),
  );
  gmStore.setJob(null, gameId);
  return need(gameId);
}

/* ------------------------------------------------------------------ */
/* Publishing                                                          */
/* ------------------------------------------------------------------ */

async function publish(gameId: string): Promise<ManagedGame> {
  await sleep(400);
  const g = need(gameId);
  const blocker = publishBlocker(g);
  if (blocker) throw new GmApiError(blocker);
  if (g.installation.status === "installing") throw new GmApiError("Wait for the running installation to finish.");
  const v = g.installation.installedVersion!;
  gmStore.updateGame(gameId, (x) =>
    touch({ ...x, publishing: { ...x.publishing, status: "published", publishedAt: nowIso(), publishedVersion: v } }, [event("published", v)]),
  );
  return need(gameId);
}

async function unpublish(gameId: string): Promise<ManagedGame> {
  await sleep(300);
  const g = need(gameId);
  if (g.publishing.status !== "published") throw new GmApiError("This game is not published.");
  gmStore.updateGame(gameId, (x) =>
    touch({ ...x, publishing: { ...x.publishing, status: "unpublished", publishedVersion: null, maintenance: false } }, [event("unpublished", x.publishing.publishedVersion ?? "")]),
  );
  return need(gameId);
}

async function saveAsDraft(gameId: string): Promise<ManagedGame> {
  await sleep(300);
  const g = need(gameId);
  const wasPublished = g.publishing.status === "published";
  gmStore.updateGame(gameId, (x) =>
    touch(
      { ...x, publishing: { ...x.publishing, status: "draft", publishedVersion: null, maintenance: false } },
      wasPublished ? [event("unpublished", g.publishing.publishedVersion ?? "", "Moved back to draft")] : [],
    ),
  );
  return need(gameId);
}

async function setMaintenance(gameId: string, on: boolean, message = ""): Promise<ManagedGame> {
  await sleep(250);
  need(gameId);
  gmStore.updateGame(gameId, (x) => touch({ ...x, publishing: { ...x.publishing, maintenance: on, maintenanceMessage: on ? message.trim() : "" } }));
  return need(gameId);
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

export interface ConfigurationInput extends GameConfiguration {
  category: string;
  description: string;
  thumbnail: string | null;
  maintenance: boolean;
  maintenanceMessage: string;
}

async function updateConfiguration(gameId: string, input: ConfigurationInput): Promise<ManagedGame> {
  await sleep(350);
  need(gameId);
  if (!isSemver(input.minClientVersion)) throw new GmApiError("Minimum client version must look like 1.0.0.");
  if (!Number.isFinite(input.displayOrder) || input.displayOrder < 1) throw new GmApiError("Display order must be 1 or higher.");
  gmStore.updateGame(gameId, (x) =>
    touch({
      ...x,
      category: input.category,
      description: input.description.trim(),
      thumbnail: input.thumbnail ?? x.thumbnail,
      config: { visibility: input.visibility, featured: input.featured, enabled: input.enabled, displayOrder: Math.round(input.displayOrder), minClientVersion: input.minClientVersion.trim() },
      publishing: { ...x.publishing, maintenance: input.maintenance, maintenanceMessage: input.maintenance ? input.maintenanceMessage.trim() : "" },
    }),
  );
  return need(gameId);
}

async function resetDemoData(): Promise<void> {
  await sleep(200);
  gmStore.reset();
}

export const gameManagementApi = {
  createDraft,
  updateDetails,
  saveValidation,
  uploadVersion,
  installVersion,
  rollback,
  uninstall,
  publish,
  unpublish,
  saveAsDraft,
  setMaintenance,
  updateConfiguration,
  resetDemoData,
};
