/**
 * Game Management – shared domain types.
 *
 * These mirror what the future backend will return. Only the frontend mock services in ../services use them
 * to read and write state today; swapping those services for API clients should not require changing a type.
 */

/* ------------------------------------------------------------------ */
/* Publishing & installation (admin side)                              */
/* ------------------------------------------------------------------ */

export type InstallationStatus = "not_installed" | "installing" | "installed" | "failed";
export type PublishingState = "draft" | "published" | "unpublished";
export type Orientation = "landscape" | "portrait" | "both";
export type Platform = "desktop" | "tablet" | "mobile";
export type Visibility = "public" | "hidden" | "private";

export interface GamePublishingStatus {
  status: PublishingState;
  /** Maintenance is an overlay on top of the publishing state: the game stays listed but cannot be launched. */
  maintenance: boolean;
  maintenanceMessage: string;
  publishedAt: string | null;
  /** The version players receive. Always the version that was installed when the game was published. */
  publishedVersion: string | null;
}

export interface GameInstallation {
  status: InstallationStatus;
  installedVersion: string | null;
  installedAt: string | null;
  failureReason: string | null;
}

/* ------------------------------------------------------------------ */
/* Package validation                                                  */
/* ------------------------------------------------------------------ */

export type CheckState = "pending" | "running" | "passed" | "failed" | "warning" | "skipped";
export type ValidationState = "idle" | "running" | "passed" | "failed";

export type ValidationCheckId =
  | "zip-format"
  | "package-size"
  | "manifest-present"
  | "manifest-fields"
  | "game-id"
  | "version"
  | "entry-html"
  | "assets"
  | "structure";

export interface ValidationCheck {
  id: ValidationCheckId;
  label: string;
  description: string;
  state: CheckState;
  detail: string | null;
  /** "client" checks inspect the real file name, size and header bytes. "simulated" checks never open the archive. */
  source: "client" | "simulated";
}

/**
 * Lets an admin exercise the failure paths of the simulated checks. This is a demo control, not a feature the
 * real validator will have.
 */
export type ValidationScenario = "pass" | "missing-manifest" | "id-mismatch" | "missing-entry" | "server-code";

export interface GameValidationResult {
  state: ValidationState;
  checks: ValidationCheck[];
  ranAt: string | null;
  scenario: ValidationScenario;
}

/* ------------------------------------------------------------------ */
/* Packages & versions                                                 */
/* ------------------------------------------------------------------ */

/** A pre-built frontend bundle (HTML, JS, CSS, assets) – never an npm package and never server-side game logic. */
export interface GamePackage {
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
}

/** Version records are append-only. Install, publish and rollback move pointers on the game, not the history. */
export interface GameVersion {
  id: string;
  version: string;
  releaseNotes: string;
  package: GamePackage;
  validation: GameValidationResult;
}

export type VersionEventType = "uploaded" | "validated" | "installed" | "published" | "unpublished" | "rolled_back" | "uninstalled";

export interface GameVersionEvent {
  id: string;
  at: string;
  type: VersionEventType;
  version: string;
  note?: string;
}

/* ------------------------------------------------------------------ */
/* Game record                                                         */
/* ------------------------------------------------------------------ */

export interface GameCompatibility {
  platforms: Platform[];
  minBrowser: string;
}

export interface GameConfiguration {
  visibility: Visibility;
  featured: boolean;
  enabled: boolean;
  displayOrder: number;
  minClientVersion: string;
}

export interface ManagedGame {
  /** The unique Game ID (slug). Also the key used by the player catalogue and installs. */
  id: string;
  name: string;
  category: string;
  description: string;
  developer: string;
  thumbnail: string | null;
  orientation: Orientation;
  compatibility: GameCompatibility;
  config: GameConfiguration;
  versions: GameVersion[];
  events: GameVersionEvent[];
  /** An uploaded version that has not been installed yet (an available update, or the first install). */
  pendingVersionId: string | null;
  installation: GameInstallation;
  publishing: GamePublishingStatus;
  /** True for the playable games that ship with SPINVERSE. Registry entries created in admin have no playable build. */
  builtIn: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Fields the admin enters on "Add New Game". */
export interface GameDraftInput {
  id: string;
  name: string;
  category: string;
  description: string;
  developer: string;
  orientation: Orientation;
  compatibility: GameCompatibility;
  thumbnail: string | null;
  version: string;
  releaseNotes: string;
  package: { fileName: string; sizeBytes: number };
  validation: GameValidationResult | null;
}

/* ------------------------------------------------------------------ */
/* Long-running admin operations (ephemeral, never persisted)          */
/* ------------------------------------------------------------------ */

export type JobStepState = "pending" | "running" | "done" | "failed";

export interface AdminJob {
  gameId: string;
  kind: "install" | "update" | "rollback";
  version: string;
  status: "running" | "done" | "failed";
  stepIndex: number;
  steps: { key: string; label: string; state: JobStepState }[];
  progress: number;
  message: string;
  error: string | null;
  startedAt: string;
}

/* ------------------------------------------------------------------ */
/* Player side                                                         */
/* ------------------------------------------------------------------ */

export type PlayerGameStatus = "not_installed" | "downloading" | "installed" | "update_available" | "maintenance";

/** A game a player has installed (cached in browser storage). */
export interface GameInstallationRecord {
  gameId: string;
  installedVersion: string;
  installedAt: string;
  sizeBytes: number;
}

export type DownloadPhase = "connecting" | "downloading" | "preparing" | "registering" | "completed" | "failed";

export interface GameDownload {
  gameId: string;
  kind: "install" | "update";
  version: string;
  fromVersion: string | null;
  phase: DownloadPhase;
  progress: number;
  bytesDone: number;
  bytesTotal: number;
  message: string;
  error: string | null;
}

/** What the player lobby needs to render one catalogue game. */
export interface CatalogueStatus {
  status: PlayerGameStatus;
  publishedVersion: string;
  installedVersion: string | null;
  sizeBytes: number;
  download: GameDownload | null;
  maintenanceMessage: string | null;
}

/* ------------------------------------------------------------------ */
/* Persisted + ephemeral state                                         */
/* ------------------------------------------------------------------ */

export interface GmData {
  schema: number;
  games: ManagedGame[];
  playerInstalls: GameInstallationRecord[];
}

export interface GmState {
  data: GmData;
  jobs: Record<string, AdminJob>;
  downloads: Record<string, GameDownload>;
}
