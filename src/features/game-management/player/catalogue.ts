"use client";

import { useMemo } from "react";
import { GAMES, type Game } from "@/data/games";
import type { GameId } from "@/data/types";
import { publishedVersion } from "../lib/derive";
import { placeholderThumbnail } from "../mock-data/seed";
import { useGmState } from "../store/useGm";
import type { CatalogueStatus, GmState, ManagedGame } from "../types";

/**
 * The player-facing catalogue is a view over the Game Management registry: only games that are Published, enabled
 * and public appear. Games that ship with SPINVERSE keep their original `Game` record (so every lobby component
 * keeps working); games registered in admin are adapted into the same shape.
 */

const hue = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);

export function adapt(m: ManagedGame): Game {
  const original = GAMES.find((g) => g.id === m.id);
  const cover = m.thumbnail ?? placeholderThumbnail(m.name, hue(m.id));
  if (original) {
    return { ...original, category: m.category as Game["category"], description: m.description || original.description, featured: m.config.featured, cover } as Game;
  }
  const h = hue(m.id);
  return {
    // registry games are not part of the closed GameId union; the lobby only uses `id` as an opaque key
    id: m.id as unknown as GameId,
    name: m.name,
    tagline: m.description.split(".")[0] || m.category,
    description: m.description,
    theme: m.category,
    concept: m.category,
    category: m.category as Game["category"],
    tags: [m.orientation === "both" ? "Landscape + portrait" : m.orientation],
    grid: "Web",
    volatility: "Medium",
    rating: 4.5,
    playersNow: 0,
    releasedAt: m.publishing.publishedAt ?? m.createdAt,
    featured: m.config.featured,
    isNew: true,
    accent: `hsl(${h} 70% 62%)`,
    accentSoft: `hsl(${h} 70% 62% / .25)`,
    cover,
  } as Game;
}

export function isCatalogued(m: ManagedGame): boolean {
  return m.publishing.status === "published" && m.config.enabled && m.config.visibility === "public";
}

export function statusFor(m: ManagedGame, state: GmState): CatalogueStatus {
  const version = publishedVersion(m);
  const install = state.data.playerInstalls.find((r) => r.gameId === m.id) ?? null;
  const download = state.downloads[m.id] ?? null;
  const publishedV = m.publishing.publishedVersion ?? install?.installedVersion ?? "";
  const base = {
    publishedVersion: publishedV,
    installedVersion: install?.installedVersion ?? null,
    sizeBytes: install?.sizeBytes ?? version?.package.sizeBytes ?? 0,
    download,
    maintenanceMessage: m.publishing.maintenance ? m.publishing.maintenanceMessage || "Under maintenance. Back soon." : null,
  };
  if (m.publishing.maintenance) return { ...base, status: "maintenance" };
  if (download && download.phase !== "completed" && download.phase !== "failed") return { ...base, status: "downloading" };
  if (!install) return { ...base, status: "not_installed", sizeBytes: version?.package.sizeBytes ?? 0 };
  if (install.installedVersion !== publishedV) return { ...base, status: "update_available", sizeBytes: version?.package.sizeBytes ?? install.sizeBytes };
  return { ...base, status: "installed" };
}

export interface CatalogueEntry {
  game: Game;
  managed: ManagedGame;
  info: CatalogueStatus;
}

export function useCatalogue() {
  const state = useGmState();
  return useMemo(() => {
    const entries: CatalogueEntry[] = state.data.games
      .filter(isCatalogued)
      .sort((a, b) => a.config.displayOrder - b.config.displayOrder)
      .map((m) => ({ game: adapt(m), managed: m, info: statusFor(m, state) }));
    const byId: Record<string, CatalogueEntry> = Object.fromEntries(entries.map((e) => [e.game.id as string, e]));
    return { entries, games: entries.map((e) => e.game), byId };
  }, [state]);
}
