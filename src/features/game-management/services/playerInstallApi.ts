import { nowIso } from "../lib/format";
import { versionOf } from "../lib/derive";
import { gmStore } from "../store/gmStore";
import type { GameDownload, GameInstallationRecord, ManagedGame } from "../types";

/**
 * Player installation service – MOCK IMPLEMENTATION.
 *
 * Nothing is downloaded. A package install is simulated with timed phases and the result is recorded as a
 * "cached game" in localStorage. Future API equivalents:
 *   startInstall   GET    /catalogue/:id/package   (+ Cache Storage / IndexedDB writes in the browser)
 *   uninstall      DELETE local cache entry
 *   clearAll       DELETE all local game cache entries
 * Player profile, game history and favorites are never touched by anything in this file.
 */

export class PlayerInstallError extends Error {}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const cancelled = new Set<string>();

/** Why a player cannot install or update this game right now, or null. */
export function installBlocker(g: ManagedGame): string | null {
  if (g.publishing.status !== "published" || !g.config.enabled || g.config.visibility !== "public") return "This game is not available.";
  if (g.publishing.maintenance) return g.publishing.maintenanceMessage || "This game is under maintenance.";
  return null;
}

function upsert(record: GameInstallationRecord) {
  gmStore.setData((d) => ({ ...d, playerInstalls: [...d.playerInstalls.filter((r) => r.gameId !== record.gameId), record] }));
}

async function startInstall(gameId: string): Promise<void> {
  const g = gmStore.getGame(gameId);
  if (!g) throw new PlayerInstallError("This game is no longer in the catalogue.");
  const blocker = installBlocker(g);
  if (blocker) throw new PlayerInstallError(blocker);
  const running = gmStore.getSnapshot().downloads[gameId];
  if (running && running.phase !== "completed" && running.phase !== "failed") throw new PlayerInstallError("This game is already downloading.");
  const version = versionOf(g, g.publishing.publishedVersion);
  if (!version) throw new PlayerInstallError("No published package is available for this game.");

  const existing = gmStore.getData().playerInstalls.find((r) => r.gameId === gameId);
  cancelled.delete(gameId);

  let d: GameDownload = {
    gameId,
    kind: existing ? "update" : "install",
    version: version.version,
    fromVersion: existing?.installedVersion ?? null,
    phase: "connecting",
    progress: 0,
    bytesDone: 0,
    bytesTotal: version.package.sizeBytes,
    message: "Contacting the SPINVERSE game server…",
    error: null,
  };
  const push = (patch: Partial<GameDownload>) => {
    d = { ...d, ...patch };
    gmStore.setDownload(d, gameId);
  };
  const aborted = () => {
    if (!cancelled.has(gameId)) return false;
    cancelled.delete(gameId);
    gmStore.setDownload(null, gameId);
    return true;
  };

  push({});
  await sleep(650);
  if (aborted()) return;

  // download: 0 → 80% of the bar, bytes counting up
  const mb = version.package.sizeBytes / (1024 * 1024);
  const dlMs = Math.min(5200, Math.max(2400, mb * 75));
  const ticks = Math.round(dlMs / 80);
  for (let t = 1; t <= ticks; t++) {
    await sleep(dlMs / ticks);
    if (aborted()) return;
    const f = t / ticks;
    push({
      phase: "downloading",
      progress: Math.round(f * 80),
      bytesDone: Math.round(d.bytesTotal * f),
      message: d.kind === "update" ? "Downloading update package…" : "Downloading game package…",
    });
  }

  const prep = ["Unpacking textures and sprites…", "Preparing audio assets…", "Verifying cached files…"];
  for (let i = 0; i < prep.length; i++) {
    push({ phase: "preparing", progress: 80 + Math.round(((i + 1) / prep.length) * 15), bytesDone: d.bytesTotal, message: prep[i] });
    await sleep(380);
    if (aborted()) return;
  }

  push({ phase: "registering", progress: 98, message: "Adding the game to your library…" });
  await sleep(450);
  if (aborted()) return;

  upsert({ gameId, installedVersion: version.version, installedAt: nowIso(), sizeBytes: version.package.sizeBytes });
  push({ phase: "completed", progress: 100, message: d.kind === "update" ? `Updated to version ${version.version}.` : "Installed. Ready to play." });
}

function cancel(gameId: string) {
  const dl = gmStore.getSnapshot().downloads[gameId];
  if (dl && dl.phase !== "completed" && dl.phase !== "failed") cancelled.add(gameId);
  else gmStore.setDownload(null, gameId);
}

function dismiss(gameId: string) {
  const dl = gmStore.getSnapshot().downloads[gameId];
  if (dl && (dl.phase === "completed" || dl.phase === "failed")) gmStore.setDownload(null, gameId);
}

async function uninstall(gameId: string): Promise<void> {
  await sleep(450);
  gmStore.setData((d) => ({ ...d, playerInstalls: d.playerInstalls.filter((r) => r.gameId !== gameId) }));
}

async function clearAll(): Promise<number> {
  await sleep(600);
  const count = gmStore.getData().playerInstalls.length;
  gmStore.setData((d) => ({ ...d, playerInstalls: [] }));
  return count;
}

export const playerInstallApi = { startInstall, cancel, dismiss, uninstall, clearAll };
