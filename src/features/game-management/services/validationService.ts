import { MAX_PACKAGE_BYTES, WARN_PACKAGE_BYTES } from "../lib/constants";
import { formatBytes } from "../lib/format";
import { isSemver } from "../lib/semver";
import type { CheckState, GameValidationResult, ValidationCheck, ValidationCheckId, ValidationScenario } from "../types";

/**
 * Package validation – FRONTEND SIMULATION.
 *
 * What is real: the file extension, the file size and the first four bytes of the archive (the ZIP signature),
 * plus the Game ID / version format the admin typed.
 *
 * What is simulated: everything that needs the archive contents (manifest, entry file, assets, structure). The
 * ZIP is never extracted or scanned here. Real extraction, malware scanning, signature verification and
 * server-side validation belong to the future backend; replace `runValidation` with an API call then.
 */
export interface ValidationContext {
  fileName: string;
  sizeBytes: number;
  /** Result of the real signature check, or null when the original file is no longer available (seed data). */
  headerOk: boolean | null;
  gameId: string;
  version: string;
  scenario: ValidationScenario;
}

const DEFS: { id: ValidationCheckId; label: string; description: string; source: ValidationCheck["source"] }[] = [
  { id: "zip-format", label: "ZIP file format", description: "File is a .zip archive with a valid ZIP signature.", source: "client" },
  { id: "package-size", label: "Package size", description: `Package is within the ${formatBytes(MAX_PACKAGE_BYTES)} limit.`, source: "client" },
  { id: "manifest-present", label: "Manifest availability", description: "manifest.json exists at the package root.", source: "simulated" },
  { id: "manifest-fields", label: "Required manifest fields", description: "gameId, name, version, entryPoint, description, assets and compatibility are present.", source: "simulated" },
  { id: "game-id", label: "Game ID consistency", description: "manifest gameId matches the Game ID entered for this game.", source: "simulated" },
  { id: "version", label: "Version information", description: "A valid MAJOR.MINOR.PATCH version that matches the form.", source: "client" },
  { id: "entry-html", label: "Entry HTML file", description: "The manifest entryPoint resolves to an HTML file inside the bundle.", source: "simulated" },
  { id: "assets", label: "Required assets", description: "Thumbnail and every asset path listed in the manifest exist.", source: "simulated" },
  { id: "structure", label: "Package structure", description: "Static frontend bundle only: no server-side game logic, no node_modules.", source: "simulated" },
];

type Outcome = { state: CheckState; detail: string };

function outcomes(ctx: ValidationContext): Record<ValidationCheckId, Outcome> {
  const s = ctx.scenario;
  const noManifest = s === "missing-manifest";
  const blocked: Outcome = { state: "skipped", detail: "Skipped: manifest.json was not found." };

  const zipOk = /\.zip$/i.test(ctx.fileName) && ctx.headerOk !== false;
  const sizeFail = ctx.sizeBytes <= 0 || ctx.sizeBytes > MAX_PACKAGE_BYTES;

  return {
    "zip-format": zipOk
      ? { state: "passed", detail: ctx.headerOk === null ? "File name ends in .zip." : "ZIP signature (PK) found in the first bytes." }
      : { state: "failed", detail: !/\.zip$/i.test(ctx.fileName) ? "File name does not end in .zip." : "The file does not start with a ZIP signature, so it is not a ZIP archive." },
    "package-size": sizeFail
      ? { state: "failed", detail: ctx.sizeBytes <= 0 ? "The package is empty." : `${formatBytes(ctx.sizeBytes)} exceeds the ${formatBytes(MAX_PACKAGE_BYTES)} limit.` }
      : ctx.sizeBytes > WARN_PACKAGE_BYTES
        ? { state: "warning", detail: `${formatBytes(ctx.sizeBytes)} is large. Players download this on first install.` }
        : { state: "passed", detail: `${formatBytes(ctx.sizeBytes)} is within the limit.` },
    "manifest-present": noManifest ? { state: "failed", detail: "No manifest.json at the package root (simulated)." } : { state: "passed", detail: "manifest.json found (simulated)." },
    "manifest-fields": noManifest ? blocked : { state: "passed", detail: "All 7 required fields present (simulated)." },
    "game-id": noManifest
      ? blocked
      : s === "id-mismatch"
        ? { state: "failed", detail: `manifest gameId is "${ctx.gameId || "game"}-legacy" but this game is "${ctx.gameId || "—"}" (simulated).` }
        : { state: "passed", detail: `manifest gameId "${ctx.gameId || "—"}" matches (simulated).` },
    version: isSemver(ctx.version)
      ? { state: "passed", detail: `Version ${ctx.version.trim()} is valid.` }
      : { state: "failed", detail: "Version must look like 1.0.0 (MAJOR.MINOR.PATCH)." },
    "entry-html": noManifest
      ? blocked
      : s === "missing-entry"
        ? { state: "failed", detail: "entryPoint \"index.html\" was not found in the bundle (simulated)." }
        : { state: "passed", detail: "index.html found (simulated)." },
    assets: noManifest ? blocked : s === "missing-entry" ? { state: "skipped", detail: "Skipped: entry file is missing." } : { state: "passed", detail: "Thumbnail and 14 listed assets found (simulated)." },
    structure:
      s === "server-code"
        ? { state: "failed", detail: "Server-side files detected: server/engine.js, package.json scripts (simulated). Game logic must stay on the server." }
        : { state: "passed", detail: "Static frontend bundle only (simulated)." },
  };
}

/** The final, instantly computed result. Used by seed data and as the target of `runValidation`. */
export function evaluateValidation(ctx: ValidationContext, ranAt: string | null): GameValidationResult {
  const o = outcomes(ctx);
  const checks: ValidationCheck[] = DEFS.map((d) => ({ ...d, state: o[d.id].state, detail: o[d.id].detail }));
  const failed = checks.some((c) => c.state === "failed");
  return { state: failed ? "failed" : "passed", checks, ranAt, scenario: ctx.scenario };
}

export function idleValidation(scenario: ValidationScenario = "pass"): GameValidationResult {
  return { state: "idle", checks: DEFS.map((d) => ({ ...d, state: "pending", detail: null })), ranAt: null, scenario };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Runs the checks one by one so the UI can show them resolving. API-shaped: swap for a real endpoint later. */
export async function runValidation(ctx: ValidationContext, onUpdate: (r: GameValidationResult) => void): Promise<GameValidationResult> {
  const final = evaluateValidation(ctx, null);
  const live: GameValidationResult = { ...idleValidation(ctx.scenario), state: "running" };
  onUpdate(live);
  for (let i = 0; i < final.checks.length; i++) {
    live.checks = live.checks.map((c, j) => (j === i ? { ...c, state: "running" } : c));
    onUpdate({ ...live });
    await sleep(260 + (i % 3) * 90);
    live.checks = live.checks.map((c, j) => (j === i ? final.checks[i] : c));
    onUpdate({ ...live });
  }
  const done: GameValidationResult = { ...final, ranAt: new Date().toISOString() };
  onUpdate(done);
  return done;
}
