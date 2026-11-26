"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useDemoData } from "@/data/provider";
import { DEMO_USER_ID } from "@/data/mock";
import { useAccess } from "@/features/access/AccessProvider";
import type { UserRecord } from "@/data/types";

type Mode = "member" | "guest";

interface Override {
  name?: string;
  username?: string;
  email?: string;
}

interface SessionValue {
  mode: Mode;
  player: UserRecord | undefined;
  favorites: string[];
  recent: string[];
  signIn: (override?: Override) => void;
  continueAsGuest: () => void;
  signOut: () => void;
  toggleFavorite: (gameId: string) => void;
  markPlayed: (gameId: string) => void;
  adminSignedIn: boolean;
  adminReady: boolean;
  setAdminSignedIn: (v: boolean) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

const GUEST_ID = "SV-1023";

/** Frontend-only demo session — no real authentication happens anywhere. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const { getUser } = useDemoData();
  const { current, ready, data, logout } = useAccess();
  const [mode, setMode] = useState<Mode>("member");
  const [override, setOverride] = useState<Override>({});
  const [favorites, setFavorites] = useState<string[]>(["neon-overdrive"]);
  const [recent, setRecent] = useState<string[]>(["atlantis-cascade", "pharaohs-fortune"]);
  // The operations console (/admin) belongs to the super admin, so it follows the role-based login.
  const adminSignedIn = current?.role === "super_admin";
  const adminReady = ready;
  const setAdminSignedIn = useCallback(
    (v: boolean) => {
      if (!v) logout();
    },
    [logout],
  );

  const signIn = useCallback((o: Override = {}) => {
    setMode("member");
    setOverride(o);
  }, []);
  const continueAsGuest = useCallback(() => {
    setMode("guest");
    setOverride({});
  }, []);
  const signOut = useCallback(() => {
    setMode("member");
    setOverride({});
    logout();
  }, [logout]);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);
  const markPlayed = useCallback((id: string) => {
    setRecent((prev) => [id, ...prev.filter((g) => g !== id)].slice(0, 6));
  }, []);

  const base = getUser(mode === "guest" ? GUEST_ID : DEMO_USER_ID);
  const player = useMemo<UserRecord | undefined>(() => {
    if (!base) return undefined;
    // A signed-in client IS the player: identity and coin balance come from the access store, so a coin
    // allocation shows up in the launcher, the vault and every game as soon as it is made.
    if (current?.role === "client") {
      const earned = data.txs.filter((t) => t.toId === current.id).reduce((s, t) => s + t.amount, 0);
      return {
        ...base,
        id: current.id,
        name: current.name,
        username: current.username,
        email: current.email,
        accountType: "Registered",
        status: "active",
        membership: "Bronze",
        country: "—",
        registeredAt: current.createdAt,
        balance: current.balance,
        totalEarned: earned,
        totalSpent: 0,
        gamesPlayed: 0,
        totalSpins: 0,
      };
    }
    return { ...base, ...stripEmpty(override) };
  }, [base, override, current, data.txs]);

  const value = useMemo<SessionValue>(
    () => ({ mode, player, favorites, recent, signIn, continueAsGuest, signOut, toggleFavorite, markPlayed, adminSignedIn, adminReady, setAdminSignedIn }),
    [mode, player, favorites, recent, signIn, continueAsGuest, signOut, toggleFavorite, markPlayed, adminSignedIn, adminReady, setAdminSignedIn],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

function stripEmpty(o: Override): Override {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => !!v)) as Override;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
