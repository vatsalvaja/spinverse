"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { GmState, ManagedGame } from "../types";
import { gmStore } from "./gmStore";

export function useGmState(): GmState {
  return useSyncExternalStore(gmStore.subscribe, gmStore.getSnapshot, gmStore.getServerSnapshot);
}

export function useGames(): ManagedGame[] {
  return useGmState().data.games;
}

export function useGame(id: string | undefined): ManagedGame | undefined {
  const games = useGames();
  return useMemo(() => games.find((g) => g.id === id), [games, id]);
}

/** False on the server and the first client render, so pages can show a skeleton instead of flashing seed data. */
export function useHydrated(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
