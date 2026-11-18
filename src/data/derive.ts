import { NOW } from "@/lib/utils";
import { GAME_BY_ID } from "./games";
import type { ActivityItem, GameId, RecentGame, Transaction, UserRecord } from "./types";

export function recentGamesFor(txs: Transaction[], limit = 6): RecentGame[] {
  const done = txs.filter((t) => t.status === "completed" && t.sessionId && t.game);
  const bySession = new Map<string, RecentGame>();
  for (const t of done) {
    const s =
      bySession.get(t.sessionId!) ??
      ({ sessionId: t.sessionId!, game: t.game as GameId, spins: 0, spent: 0, returned: 0, timestamp: t.timestamp } as RecentGame);
    if (t.type === "spent") {
      s.spent += t.debit;
      s.spins += t.spins ?? 0;
      s.timestamp = t.timestamp;
    } else {
      s.returned += t.credit;
    }
    bySession.set(t.sessionId!, s);
  }
  return Array.from(bySession.values())
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit);
}

export function activityFeed(users: UserRecord[], txs: Transaction[], limit = 12): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const t of txs) {
    if (t.status !== "completed") continue;
    if (t.type === "spent") {
      items.push({
        id: t.id,
        userId: t.userId,
        userName: t.userName,
        text: `played ${GAME_BY_ID[t.game as GameId].name} (${t.spins} spins)`,
        timestamp: t.timestamp,
        kind: "game",
      });
    } else if (t.type === "reward") {
      items.push({ id: t.id, userId: t.userId, userName: t.userName, text: `claimed “${t.description}” (+${t.credit} pts)`, timestamp: t.timestamp, kind: "reward" });
    } else if (t.type === "bonus" && !/Welcome|starter/.test(t.description)) {
      items.push({ id: t.id, userId: t.userId, userName: t.userName, text: `received ${t.description.toLowerCase()} (+${t.credit} pts)`, timestamp: t.timestamp, kind: "bonus" });
    } else if (t.type === "adjustment") {
      items.push({ id: t.id, userId: t.userId, userName: t.userName, text: `had a points adjustment applied (${t.credit ? "+" + t.credit : "−" + t.debit})`, timestamp: t.timestamp, kind: "adjustment" });
    }
  }
  for (const u of users) {
    items.push({
      id: `reg-${u.id}`,
      userId: u.id,
      userName: u.name,
      text: u.accountType === "Guest" ? "started a guest session" : "created an account",
      timestamp: u.registeredAt,
      kind: "register",
    });
  }
  return items.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
}

/** Cumulative registered / guest users at the end of each of the last `months` months. */
export function userGrowthSeries(users: UserRecord[], months = 11) {
  const out: { label: string; registered: number; guests: number; total: number }[] = [];
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const end = new Date(Date.UTC(NOW.getUTCFullYear(), NOW.getUTCMonth(), 1));
  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    const next = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const upto = users.filter((u) => new Date(u.registeredAt) < next);
    const registered = upto.filter((u) => u.accountType === "Registered").length;
    const guests = upto.length - registered;
    out.push({ label: names[start.getUTCMonth()], registered, guests, total: upto.length });
  }
  return out;
}

/** Weekly credited / debited points across the last `weeks` weeks. */
export function pointsActivitySeries(txs: Transaction[], weeks = 12) {
  const weekMs = 7 * 86_400_000;
  const out: { label: string; credited: number; debited: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const to = NOW.getTime() - w * weekMs;
    const from = to - weekMs;
    const inRange = txs.filter((t) => t.status === "completed" && new Date(t.timestamp).getTime() > from && new Date(t.timestamp).getTime() <= to);
    const d = new Date(from + weekMs);
    out.push({
      label: `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]} ${d.getUTCDate()}`,
      credited: inRange.reduce((s, t) => s + t.credit, 0),
      debited: inRange.reduce((s, t) => s + t.debit, 0),
    });
  }
  return out;
}

export function gameStats(txs: Transaction[]) {
  const stats: Record<GameId, { sessions: number; spins: number; players: Set<string>; spent: number; returned: number }> = {
    "pharaohs-fortune": { sessions: 0, spins: 0, players: new Set(), spent: 0, returned: 0 },
    "atlantis-cascade": { sessions: 0, spins: 0, players: new Set(), spent: 0, returned: 0 },
    "neon-overdrive": { sessions: 0, spins: 0, players: new Set(), spent: 0, returned: 0 },
  };
  for (const t of txs) {
    if (t.status !== "completed" || !t.game) continue;
    const s = stats[t.game];
    s.players.add(t.userId);
    if (t.type === "spent") {
      s.sessions += 1;
      s.spins += t.spins ?? 0;
      s.spent += t.debit;
    } else if (t.type === "earned") {
      s.returned += t.credit;
    }
  }
  return stats;
}
