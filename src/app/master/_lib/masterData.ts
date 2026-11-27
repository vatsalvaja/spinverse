"use client";

import { useCallback, useEffect, useState } from "react";
import { GAMES, type Game } from "@/data/games";
import type { AccessData, Account, CoinTx } from "@/features/access/types";

const PROFILE_STORAGE_KEY = "sv-master-profile-v1";

export interface MasterProfileOverride {
  displayName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  passwordUpdatedAt?: string;
}

type ProfileMap = Record<string, MasterProfileOverride>;

function readProfileMap(): ProfileMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProfileMap) : {};
  } catch {
    return {};
  }
}

export function useMasterProfile(me: Account | null) {
  const [map, setMap] = useState<ProfileMap>({});

  useEffect(() => {
    setMap(readProfileMap());
  }, []);

  const currentOverride = me ? map[me.id] ?? {} : {};
  const saveOverride = useCallback(
    (patch: Partial<MasterProfileOverride>) => {
      if (!me) return;
      setMap((prev) => {
        const next: ProfileMap = {
          ...prev,
          [me.id]: { ...(prev[me.id] ?? {}), ...patch },
        };
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [me],
  );

  return {
    displayName: currentOverride.displayName?.trim() || me?.name || "",
    email: currentOverride.email !== undefined ? currentOverride.email : me?.email || "",
    phone: currentOverride.phone ?? "",
    notes: currentOverride.notes ?? "",
    passwordUpdatedAt: currentOverride.passwordUpdatedAt ?? null,
    saveOverride,
  };
}

export interface ClientGameSessionSample {
  id: string;
  clientId: string;
  clientName: string;
  clientUsername: string;
  gameId: Game["id"];
  gameName: string;
  category: string;
  spins: number;
  wagered: number;
  won: number;
  net: number;
  playedAt: string;
}

export interface ClientActivityEntry {
  id: string;
  clientId: string;
  clientName: string;
  kind: "coin_in" | "coin_reclaim" | "game_play";
  summary: string;
  detail: string;
  timestamp: string;
}

function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Deterministic sample game activity for each client of the signed-in master.
 * Balances and coin transactions always come live from AccessProvider; game sessions provide
 * consistent sample gameplay activity across Dashboard, My Clients and Reports.
 */
export function buildSampleClientGameActivity(clients: Account[]): ClientGameSessionSample[] {
  const out: ClientGameSessionSample[] = [];
  const baseMs = Date.parse("2026-11-26T18:30:00.000Z");

  clients.forEach((client, cIdx) => {
    const seed = hashSeed(client.id + ":" + client.username);
    const sessionCount = client.status === "inactive" ? 2 : 3 + (seed % 3);
    for (let i = 0; i < sessionCount; i++) {
      const g = GAMES[(seed + i * 2) % GAMES.length];
      const sub = hashSeed(`${client.id}:${g.id}:${i}`);
      const spins = 12 + (sub % 48);
      const wagered = spins * (20 + ((sub >> 4) % 4) * 15);
      const returnPct = 0.65 + ((sub >> 8) % 65) / 100;
      const won = Math.round((wagered * returnPct) / 10) * 10;
      const hoursAgo = cIdx * 7 + i * 11 + (sub % 6);
      out.push({
        id: `GS-${client.id}-${i + 1}`,
        clientId: client.id,
        clientName: client.name,
        clientUsername: client.username,
        gameId: g.id,
        gameName: g.name,
        category: g.category,
        spins,
        wagered,
        won,
        net: won - wagered,
        playedAt: new Date(baseMs - hoursAgo * 3600_000).toISOString(),
      });
    }
  });

  return out.sort((a, b) => b.playedAt.localeCompare(a.playedAt));
}

export function buildClientActivityFeed(clients: Account[], txs: CoinTx[], sessions: ClientGameSessionSample[]): ClientActivityEntry[] {
  const clientMap = new Map(clients.map((c) => [c.id, c]));
  const items: ClientActivityEntry[] = [];

  for (const t of txs) {
    if (t.kind === "client_allocation" && clientMap.has(t.toId)) {
      items.push({
        id: `tx-${t.id}`,
        clientId: t.toId,
        clientName: t.toName,
        kind: "coin_in",
        summary: `Received ${t.amount.toLocaleString("en-US")} coins`,
        detail: t.note ? `Note: ${t.note}` : "Allocated from your balance",
        timestamp: t.timestamp,
      });
    } else if (t.kind === "client_reclaim") {
      items.push({
        id: `tx-${t.id}`,
        clientId: t.fromId,
        clientName: t.fromName,
        kind: "coin_reclaim",
        summary: `Returned ${t.amount.toLocaleString("en-US")} coins`,
        detail: t.note || "Client reclaim",
        timestamp: t.timestamp,
      });
    }
  }

  for (const s of sessions) {
    items.push({
      id: `gp-${s.id}`,
      clientId: s.clientId,
      clientName: s.clientName,
      kind: "game_play",
      summary: `Played ${s.gameName} (${s.spins} spins)`,
      detail: `Wagered ${s.wagered.toLocaleString("en-US")} · Won ${s.won.toLocaleString("en-US")} pts`,
      timestamp: s.playedAt,
    });
  }

  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export function receivedByClient(data: AccessData, masterId: string, clientId: string): number {
  return data.txs
    .filter((t) => t.masterId === masterId && t.kind === "client_allocation" && t.toId === clientId)
    .reduce((s, t) => s + t.amount, 0);
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
