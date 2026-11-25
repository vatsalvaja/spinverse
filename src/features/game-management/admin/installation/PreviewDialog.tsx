"use client";

import { useCallback, useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { installedVersion } from "../../lib/derive";
import { GmBadge, GmButton, GmDialog, GmNotice } from "../../ui/primitives";
import type { ManagedGame } from "../../types";

/**
 * "Open Game Preview". The six built-in games open their real play screen in a new tab. A game registered through
 * admin has no playable build in this demo, so it gets a simulated stage instead of pretending to run.
 */
export function useGamePreview(game: ManagedGame | undefined) {
  const [open, setOpen] = useState(false);
  const launch = useCallback(() => {
    if (!game) return;
    if (game.builtIn) window.open(`/play/${game.id}`, "_blank", "noopener");
    else setOpen(true);
  }, [game]);
  const dialog = game && !game.builtIn ? <PreviewDialog game={game} open={open} onClose={() => setOpen(false)} /> : null;
  return { launch, dialog };
}

function PreviewDialog({ game, open, onClose }: { game: ManagedGame; open: boolean; onClose: () => void }) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const v = installedVersion(game);
  return (
    <GmDialog open={open} onClose={onClose} size="lg" title={`Preview · ${game.name}`} description={v ? `Installed version ${v.version}` : "Not installed"} footer={<GmButton variant="gold" onClick={onClose}>Close preview</GmButton>}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <GmBadge tone="gold">Simulated preview</GmBadge>
        <div className="inline-flex rounded-lg border border-white/10 bg-black/40 p-0.5" role="group" aria-label="Preview device">
          {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([id, Icon]) => (
            <button key={id} type="button" aria-pressed={device === id} aria-label={id} onClick={() => setDevice(id)} className={cn("flex h-7 w-9 items-center justify-center rounded-md transition", device === id ? "bg-gold-400/20 text-gold-200" : "text-white/45 hover:text-white")}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
      <div className="flex justify-center rounded-xl border border-white/[0.07] bg-black/50 p-4">
        <div className={cn("relative overflow-hidden rounded-xl border border-white/15 bg-[#0a0a10]", device === "desktop" ? "aspect-video w-full" : "aspect-[9/17] w-[220px]")}>
          {game.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={game.thumbnail} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-md" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-white sm:text-base">{game.name}</p>
            <p className="font-num text-[11px] uppercase tracking-[0.24em] text-gold-300">Preview stage</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <GmNotice tone="cyan" title="No playable build in this demo">
          Once the backend serves installed packages, this package&apos;s entry file would load here in a sandboxed frame. Nothing from the uploaded ZIP is executed by this frontend, and game logic stays server-side.
        </GmNotice>
      </div>
    </GmDialog>
  );
}
