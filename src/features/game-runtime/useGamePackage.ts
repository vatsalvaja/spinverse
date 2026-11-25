"use client";

import { useEffect, useState } from "react";
import { gamePackageSource, type PackageLookup } from "./packageSource";

export type GamePackageState = { status: "loading" } | { status: "error"; message: string } | PackageLookup;

/** Resolves the package to launch for a game from the configured package source. */
export function useGamePackage(gameId: string, attempt = 0): GamePackageState {
  const [state, setState] = useState<GamePackageState>({ status: "loading" });
  useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    gamePackageSource.resolve(gameId).then(
      (r) => live && setState(r),
      (e: unknown) => live && setState({ status: "error", message: e instanceof Error ? e.message : "The game package could not be loaded." }),
    );
    return () => {
      live = false;
    };
  }, [gameId, attempt]);
  return state;
}
