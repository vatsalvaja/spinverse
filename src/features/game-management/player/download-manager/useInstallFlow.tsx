"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { usePlay } from "@/components/site/PlayModal";
import { useToast } from "@/components/ui/toast";
import type { GameId } from "@/data/types";
import { useCatalogue, type CatalogueEntry } from "../catalogue";
import { InstallGameDialog } from "../components/InstallGameDialog";

export interface InstallFlow {
  /** Render this once in the page that uses the hook. */
  dialogs: ReactNode;
  requestInstall: (entry: CatalogueEntry) => void;
  requestUpdate: (entry: CatalogueEntry) => void;
  /** Gate a Play click: installs first when needed, explains maintenance, and only launches installed games. */
  handlePlay: (entry: CatalogueEntry, play?: (id: GameId) => void) => void;
}

/**
 * Install / update / play-gating flow for the player lobby. Local state only (no provider, no layout change):
 * every page that uses it renders `dialogs` itself. Download progress lives in the shared store, so it keeps
 * running if the dialog is closed or another page opens.
 */
export function useInstallFlow(): InstallFlow {
  const toast = useToast();
  const sitePlay = usePlay();
  const { byId } = useCatalogue();
  const [targetId, setTargetId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openFor = useCallback((entry: CatalogueEntry) => {
    setTargetId(entry.game.id as string);
    setOpen(true);
  }, []);

  const handlePlay = useCallback<InstallFlow["handlePlay"]>(
    (entry, play = sitePlay) => {
      const { status, maintenanceMessage } = entry.info;
      if (status === "maintenance") {
        toast(maintenanceMessage ?? `${entry.game.name} is under maintenance.`, "info");
        return;
      }
      if (status === "not_installed" || status === "downloading") {
        openFor(entry);
        return;
      }
      if (entry.managed.builtIn) {
        play(entry.game.id);
        return;
      }
      toast(`${entry.game.name} is registered, but this demo has no playable build for admin-created games.`, "info");
    },
    [openFor, sitePlay, toast],
  );

  const entry = targetId ? byId[targetId] ?? null : null;

  const dialogs = (
    <InstallGameDialog entry={entry} open={open && !!entry} onClose={() => setOpen(false)} onPlay={(e) => handlePlay(e)} />
  );

  return useMemo(() => ({ dialogs, requestInstall: openFor, requestUpdate: openFor, handlePlay }), [dialogs, openFor, handlePlay]);
}
