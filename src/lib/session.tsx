"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDemoData } from "@/data/provider";
import { DEMO_USER_ID } from "@/data/mock";
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
  const [mode, setMode] = useState<Mode>("member");
  const [override, setOverride] = useState<Override>({});
  const [favorites, setFavorites] = useState<string[]>(["neon-overdrive"]);
  const [recent, setRecent] = useState<string[]>(["atlantis-cascade", "pharaohs-fortune"]);
  const [adminSignedIn, setAdminState] = useState(false);
  const [adminReady, setAdminReady] = useState(false);

  useEffect(() => {
    try {
      setAdminState(sessionStorage.getItem("sv-admin") === "1");
    } catch {}
    setAdminReady(true);
  }, []);
  const setAdminSignedIn = useCallback((v: boolean) => {
    setAdminState(v);
    try {
      if (v) sessionStorage.setItem("sv-admin", "1");
      else sessionStorage.removeItem("sv-admin");
    } catch {}
  }, []);

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
  }, []);
  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }, []);
  const markPlayed = useCallback((id: string) => {
    setRecent((prev) => [id, ...prev.filter((g) => g !== id)].slice(0, 6));
  }, []);

  const base = getUser(mode === "guest" ? GUEST_ID : DEMO_USER_ID);
  const player = useMemo(() => (base ? { ...base, ...stripEmpty(override) } : undefined), [base, override]);

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
