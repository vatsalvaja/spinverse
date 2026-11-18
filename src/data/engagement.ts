import type { GameId, UserRecord } from "./types";

export interface Mission {
  id: string;
  title: string;
  detail: string;
  progress: number;
  target: number;
  reward: number;
  kind: "daily" | "weekly";
  game?: GameId;
}

export const MISSIONS: Mission[] = [
  { id: "m1", title: "Warm up the reels", detail: "Play 25 spins on any game", progress: 18, target: 25, reward: 300, kind: "daily" },
  { id: "m2", title: "Explore the tide", detail: "Trigger 3 cascades in Atlantis Cascade", progress: 3, target: 3, reward: 450, kind: "daily", game: "atlantis-cascade" },
  { id: "m3", title: "Lock the glow", detail: "Land 6 orbs in Neon Overdrive", progress: 2, target: 6, reward: 500, kind: "daily", game: "neon-overdrive" },
  { id: "m4", title: "Sun chaser", detail: "Reveal 2 expanding wilds in Pharaoh's Fortune", progress: 0, target: 2, reward: 400, kind: "daily", game: "pharaohs-fortune" },
  { id: "m5", title: "Three-game tour", detail: "Play all three launch games this week", progress: 2, target: 3, reward: 1500, kind: "weekly" },
  { id: "m6", title: "Steady hands", detail: "Log in 5 days in a row", progress: 4, target: 5, reward: 1200, kind: "weekly" },
];

export interface RewardItem {
  id: string;
  title: string;
  detail: string;
  points: number;
  claimedAt?: string;
  tier: "Daily" | "Mission" | "Streak" | "Achievement";
}

export const RECENT_REWARDS: RewardItem[] = [
  { id: "r1", title: "Daily login reward", detail: "Day 4 of your streak", points: 500, claimedAt: "2026-11-17T08:12:00Z", tier: "Daily" },
  { id: "r2", title: "Explore the tide", detail: "Mission complete", points: 450, claimedAt: "2026-11-17T10:40:00Z", tier: "Mission" },
  { id: "r3", title: "Weekly streak reward", detail: "7-day login streak", points: 1500, claimedAt: "2026-11-14T09:00:00Z", tier: "Streak" },
  { id: "r4", title: "Pharaoh Initiate", detail: "Achievement unlocked", points: 750, claimedAt: "2026-11-12T17:25:00Z", tier: "Achievement" },
];

export const REWARD_CATALOG: (RewardItem & { cost?: number })[] = [
  { id: "c1", title: "Daily login reward", detail: "Resets every day at 00:00 UTC", points: 500, tier: "Daily" },
  { id: "c2", title: "Streak chest", detail: "Unlocks at a 10-day streak", points: 2500, tier: "Streak" },
  { id: "c3", title: "Three-game tour", detail: "Play all launch games this week", points: 1500, tier: "Mission" },
  { id: "c4", title: "Gold Frame profile border", detail: "Cosmetic · shown on your profile", points: 0, cost: 3000, tier: "Achievement" },
  { id: "c5", title: "Neon avatar pack", detail: "Cosmetic · 6 avatar styles", points: 0, cost: 4500, tier: "Achievement" },
  { id: "c6", title: "Pharaoh title badge", detail: "Cosmetic · leaderboard title", points: 0, cost: 2000, tier: "Achievement" },
];

export interface Achievement {
  id: string;
  title: string;
  detail: string;
  progress: number;
  target: number;
  tier: "Bronze" | "Silver" | "Gold";
  reward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "a1", title: "First Spin", detail: "Play your first spin", progress: 1, target: 1, tier: "Bronze", reward: 100 },
  { id: "a2", title: "Pharaoh Initiate", detail: "Play 100 spins in Pharaoh's Fortune", progress: 100, target: 100, tier: "Silver", reward: 750 },
  { id: "a3", title: "Deep Diver", detail: "Trigger 50 cascades in Atlantis Cascade", progress: 37, target: 50, tier: "Silver", reward: 900 },
  { id: "a4", title: "Night Circuit", detail: "Lock 100 orbs in Neon Overdrive", progress: 64, target: 100, tier: "Silver", reward: 900 },
  { id: "a5", title: "Weekly Regular", detail: "Reach a 7-day login streak", progress: 7, target: 7, tier: "Bronze", reward: 500 },
  { id: "a6", title: "Gold Standard", detail: "Reach 25,000 total points earned", progress: 18400, target: 25000, tier: "Gold", reward: 3000 },
  { id: "a7", title: "Grand Tour", detail: "Complete 20 missions", progress: 14, target: 20, tier: "Gold", reward: 2500 },
  { id: "a8", title: "Collector", detail: "Favorite all three launch games", progress: 2, target: 3, tier: "Bronze", reward: 300 },
];

export function buildLeaderboard(users: UserRecord[]) {
  return users
    .filter((u) => u.accountType === "Registered" && u.status !== "blocked")
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .map((u, i) => ({ rank: i + 1, user: u }));
}
