"use client";

import { forwardRef, memo, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Burst } from "./Burst";
import { SymbolArt } from "./SymbolArt";
import { FILLER_POOL, SYMBOLS, type SymbolId } from "./symbols";

/** How a resting cell should look. "front" is a winning cell being presented (it rises above the grid); "win" is the calmer glow afterwards; "land" is the one-off flash when a scatter drops in. */
export type CellState = "idle" | "win" | "front" | "scatter" | "land" | "dim";

export interface SpinOptions {
  /** Milliseconds from start until this reel has settled. */
  duration: number;
  /** How many filler symbols fly past before the result. */
  fillers: number;
}

export interface ReelHandle {
  spin: (final: SymbolId[], options: SpinOptions) => Promise<void>;
}

interface Job {
  strip: SymbolId[];
  final: SymbolId[];
  duration: number;
  resolve: () => void;
}

const CELL_H = "33.3333cqh";

const Cell = memo(function Cell({ id, state, rest }: { id: SymbolId; state: CellState; rest: boolean }) {
  const meta = SYMBOLS[id];
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        state === "dim" && "pf-dim",
        state === "win" && "pf-win",
        state === "front" && "pf-front",
        state === "scatter" && "pf-scatter",
        state === "land" && "pf-land",
        rest && state === "idle" && meta.role === "scatter" && "pf-scatter-idle",
      )}
      style={{ height: CELL_H, background: `radial-gradient(62% 62% at 50% 50%, ${meta.tint}, transparent 78%)` }}
    >
      <SymbolArt id={id} className="h-[86%] w-[86%]" />
      {state === "land" && <Burst count={14} radius={46} seed={meta.role === "scatter" ? 5 : 2} />}
    </div>
  );
});

/**
 * One vertical reel. It spins by scrolling a tall strip (result on top, filler below, the previous
 * symbols at the bottom) downward with the Web Animations API, so the browser can run it on the GPU.
 */
export const Reel = forwardRef<ReelHandle, { initial: SymbolId[]; states: CellState[]; anticipating?: boolean }>(function Reel({ initial, states, anticipating }, ref) {
  const [strip, setStrip] = useState<SymbolId[]>(initial);
  const [job, setJob] = useState<Job | null>(null);
  const settled = useRef<SymbolId[]>(initial);
  const node = useRef<HTMLDivElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      spin: (final, o) =>
        new Promise<void>((resolve) => {
          const filler = Array.from({ length: o.fillers }, () => FILLER_POOL[Math.floor(Math.random() * FILLER_POOL.length)]);
          setJob({ strip: [...final, ...filler, ...settled.current], final, duration: o.duration, resolve });
        }),
    }),
    [],
  );

  useLayoutEffect(() => {
    const el = node.current;
    if (!job || !el) return;
    const n = job.strip.length;
    const from = -((n - 3) / n) * 100;
    const move = el.animate([{ transform: `translateY(${from}%)` }, { transform: "translateY(0%)" }], { duration: job.duration, easing: "cubic-bezier(.22,.62,.2,1.07)", fill: "both" });
    const blur = el.animate([{ filter: "blur(3px)" }, { filter: "blur(3px)", offset: 0.6 }, { filter: "blur(0px)" }], { duration: job.duration, fill: "both" });
    let cancelled = false;
    move.finished
      .then(() => {
        if (cancelled) return;
        move.cancel();
        blur.cancel();
        settled.current = job.final;
        setStrip(job.final);
        setJob(null);
        job.resolve();
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      move.cancel();
      blur.cancel();
    };
  }, [job]);

  const list = job ? job.strip : strip;
  return (
    <div className={cn("relative h-full overflow-hidden border-r border-[#d4af4f]/20 last:border-r-0", anticipating && "pf-anticipate")}>
      <div ref={node} className="will-change-transform">
        {list.map((id, i) => (
          <Cell key={i} id={id} state={job ? "idle" : states[i] ?? "idle"} rest={!job} />
        ))}
      </div>
    </div>
  );
});
