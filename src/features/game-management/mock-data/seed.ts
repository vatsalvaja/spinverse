import { ART } from "@/components/art/art";
import { GAMES } from "@/data/games";
import { DATA_SCHEMA } from "../lib/constants";
import { MB } from "../lib/format";
import { evaluateValidation } from "../services/validationService";
import type { GameInstallationRecord, GameVersion, GameVersionEvent, GmData, ManagedGame, ValidationScenario } from "../types";

/**
 * Mock catalogue for the Game Management module.
 *
 * The six playable SPINVERSE games are registered as installed and published at their current version, so the
 * player lobby looks and plays exactly as it did before this module existed. A few extra registry entries
 * (drafts and unpublished games with no playable build) exist so every admin state has something to show.
 */

interface Release {
  v: string;
  date: string;
  mb: number;
  notes: string;
}

const hours = (iso: string, h: number) => new Date(new Date(iso).getTime() + h * 3600_000).toISOString();

function version(gameId: string, r: Release, scenario: ValidationScenario = "pass"): GameVersion {
  const fileName = `${gameId}-${r.v}.zip`;
  const sizeBytes = Math.round(r.mb * MB);
  return {
    id: `${gameId}@${r.v}`,
    version: r.v,
    releaseNotes: r.notes,
    package: { fileName, sizeBytes, uploadedAt: r.date },
    validation: evaluateValidation({ fileName, sizeBytes, headerOk: null, gameId, version: r.v, scenario }, hours(r.date, 0.1)),
  };
}

function ev(gameId: string, type: GameVersionEvent["type"], at: string, v: string, note?: string): GameVersionEvent {
  return { id: `${gameId}-${type}-${v}`, at, type, version: v, note };
}

interface BuiltInPlan {
  id: string;
  releases: Release[];
  /** an uploaded version waiting to be installed */
  pending?: Release;
  /** version the demo player has cached; defaults to the latest release */
  playerVersion?: string;
}

const BUILT_IN: BuiltInPlan[] = [
  {
    id: "pharaohs-fortune",
    releases: [
      { v: "1.0.0", date: "2026-09-12T09:00:00Z", mb: 34.2, notes: "Launch release: 5×3 reels, expanding wilds and the hidden chamber bonus." },
      { v: "1.1.0", date: "2026-09-30T10:30:00Z", mb: 36.8, notes: "Smoother reel stops, refreshed scarab symbols and a quieter win fanfare." },
      { v: "1.2.0", date: "2026-10-20T08:15:00Z", mb: 38.4, notes: "Improved mobile layout and faster first load." },
    ],
  },
  {
    id: "atlantis-cascade",
    releases: [
      { v: "1.0.0", date: "2026-10-03T09:00:00Z", mb: 49.0, notes: "Launch release: 6×5 cascading grid with a rising tide multiplier." },
      { v: "1.1.0", date: "2026-10-24T11:00:00Z", mb: 52.1, notes: "Tumble animation polish and reduced-motion support." },
    ],
  },
  {
    id: "neon-overdrive",
    releases: [
      { v: "1.0.0", date: "2026-11-05T09:00:00Z", mb: 44.5, notes: "Launch release: hold & respin orbs with turbo mode." },
      { v: "1.1.0", date: "2026-11-12T14:20:00Z", mb: 46.8, notes: "Orb lock effects and a fix for the turbo toggle on touch screens." },
    ],
    pending: { v: "1.2.0", date: "2026-11-16T16:45:00Z", mb: 47.9, notes: "New ambient skyline layer and refreshed jackpot tier banners." },
  },
  {
    id: "skyfall",
    releases: [
      { v: "1.0.0", date: "2026-11-18T09:00:00Z", mb: 29.6, notes: "Launch release: crash multiplier with two bet panels and auto cash-out." },
      { v: "1.1.0", date: "2026-11-21T12:00:00Z", mb: 31.2, notes: "Improved aircraft animation and live player feed." },
    ],
    // the demo player still has the first release cached, so "Update available" shows out of the box
    playerVersion: "1.0.0",
  },
  {
    id: "tiger-clash",
    releases: [{ v: "1.0.0", date: "2026-11-19T09:00:00Z", mb: 44.7, notes: "Launch release: Tiger vs Dragon card duel with three selections." }],
  },
  {
    id: "roulette",
    releases: [{ v: "1.0.0", date: "2026-11-20T09:00:00Z", mb: 36.9, notes: "Launch release: European single-zero roulette with the full betting table." }],
  },
];

function builtIn(plan: BuiltInPlan, order: number): ManagedGame {
  const g = GAMES.find((x) => x.id === plan.id)!;
  const versions = plan.releases.map((r) => version(plan.id, r));
  const pending = plan.pending ? version(plan.id, plan.pending) : null;
  const latest = plan.releases[plan.releases.length - 1];
  const events: GameVersionEvent[] = [];
  for (const r of plan.releases) {
    events.push(ev(plan.id, "uploaded", r.date, r.v), ev(plan.id, "installed", hours(r.date, 1), r.v), ev(plan.id, "published", hours(r.date, 2), r.v));
  }
  if (plan.pending) events.push(ev(plan.id, "uploaded", plan.pending.date, plan.pending.v));
  return {
    id: plan.id,
    name: g.name,
    category: g.category,
    description: g.description,
    developer: "SPINVERSE Studios",
    thumbnail: ART[g.id].poster,
    orientation: "landscape",
    compatibility: { platforms: ["desktop", "tablet", "mobile"], minBrowser: "Chrome 110+" },
    config: { visibility: "public", featured: g.featured, enabled: true, displayOrder: order, minClientVersion: "1.0.0" },
    versions: pending ? [...versions, pending] : versions,
    events,
    pendingVersionId: pending ? pending.id : null,
    installation: { status: "installed", installedVersion: latest.v, installedAt: hours(latest.date, 1), failureReason: null },
    publishing: { status: "published", maintenance: false, maintenanceMessage: "", publishedAt: hours(latest.date, 2), publishedVersion: latest.v },
    builtIn: true,
    createdAt: plan.releases[0].date,
    updatedAt: plan.pending ? plan.pending.date : hours(latest.date, 2),
  };
}

/** A tasteful placeholder thumbnail for registry games that have no artwork yet. */
export function placeholderThumbnail(name: string, hue: number): string {
  const letter = (name.trim().charAt(0) || "?").toUpperCase().replace(/[<>&"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><radialGradient id="g" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="hsl(${hue} 65% 38%)"/><stop offset="1" stop-color="#0a0a10"/></radialGradient></defs><rect width="400" height="500" fill="url(#g)"/><circle cx="200" cy="210" r="96" fill="none" stroke="hsl(${hue} 80% 70%)" stroke-opacity=".35" stroke-width="3"/><text x="200" y="248" font-family="Georgia,serif" font-size="120" text-anchor="middle" fill="hsl(${hue} 80% 78%)" fill-opacity=".85">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function extra(opts: {
  id: string;
  name: string;
  category: string;
  description: string;
  developer: string;
  hue: number;
  release: Release;
  scenario?: ValidationScenario;
  installed?: boolean;
  publishing: "draft" | "unpublished";
  order: number;
}): ManagedGame {
  const v = version(opts.id, opts.release, opts.scenario ?? "pass");
  const events: GameVersionEvent[] = [ev(opts.id, "uploaded", opts.release.date, opts.release.v)];
  if (opts.installed) events.push(ev(opts.id, "installed", hours(opts.release.date, 1), opts.release.v));
  return {
    id: opts.id,
    name: opts.name,
    category: opts.category,
    description: opts.description,
    developer: opts.developer,
    thumbnail: placeholderThumbnail(opts.name, opts.hue),
    orientation: "both",
    compatibility: { platforms: ["desktop", "tablet", "mobile"], minBrowser: "Chrome 110+" },
    config: { visibility: "public", featured: false, enabled: true, displayOrder: opts.order, minClientVersion: "1.0.0" },
    versions: [v],
    events,
    pendingVersionId: opts.installed ? null : v.id,
    installation: opts.installed
      ? { status: "installed", installedVersion: opts.release.v, installedAt: hours(opts.release.date, 1), failureReason: null }
      : { status: "not_installed", installedVersion: null, installedAt: null, failureReason: null },
    publishing: { status: opts.publishing, maintenance: false, maintenanceMessage: "", publishedAt: null, publishedVersion: null },
    builtIn: false,
    createdAt: opts.release.date,
    updatedAt: hours(opts.release.date, opts.installed ? 1 : 0),
  };
}

export function buildSeed(): GmData {
  const games: ManagedGame[] = [
    ...BUILT_IN.map((p, i) => builtIn(p, i + 1)),
    extra({
      id: "dragon-vault",
      name: "Dragon Vault",
      category: "Instant Win",
      description: "Crack open the dragon hoard in a fast instant-win vault game.",
      developer: "Ember Forge Games",
      hue: 8,
      release: { v: "0.9.0", date: "2026-11-15T10:00:00Z", mb: 22.4, notes: "Release candidate: vault reveal animation and tiered prizes." },
      publishing: "draft",
      order: 7,
    }),
    extra({
      id: "lucky-lanterns",
      name: "Lucky Lanterns",
      category: "Arcade",
      description: "Launch glowing lanterns into the night sky and match their colours.",
      developer: "Paper Moon Studio",
      hue: 38,
      release: { v: "1.0.0", date: "2026-11-10T09:30:00Z", mb: 18.7, notes: "First production build." },
      installed: true,
      publishing: "unpublished",
      order: 8,
    }),
    extra({
      id: "midnight-poker",
      name: "Midnight Poker",
      category: "Card Duel",
      description: "A quiet-table poker duel against the house after dark.",
      developer: "Northlight Labs",
      hue: 265,
      release: { v: "0.4.2", date: "2026-11-13T15:10:00Z", mb: 27.9, notes: "Early build. Heads-up table and chip animations." },
      scenario: "missing-manifest",
      publishing: "draft",
      order: 9,
    }),
  ];

  const playerInstalls: GameInstallationRecord[] = BUILT_IN.map((p) => {
    const latest = p.releases[p.releases.length - 1];
    const v = p.playerVersion ?? latest.v;
    const r = p.releases.find((x) => x.v === v) ?? latest;
    return { gameId: p.id, installedVersion: v, installedAt: "2026-11-17T12:00:00Z", sizeBytes: Math.round(r.mb * MB) };
  });

  return { schema: DATA_SCHEMA, games, playerInstalls };
}
