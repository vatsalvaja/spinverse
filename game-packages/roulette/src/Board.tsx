"use client";

import { memo, useMemo, useState } from "react";
import { betDef, type Placement, type SettledLine } from "./engine";
import { Chip, compact, tierFor } from "./Chip";
import { centre, tableLayout, type Orient } from "./layout";

interface Props {
  orient: Orient;
  bets: Placement[];
  disabled: boolean;
  onPlace: (id: string) => void;
  /** after the ball has landed */
  winning: number | null;
  lines: SettledLine[] | null;
}

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * The betting table. Every number, outside bet and line between numbers is a real button that places the selected
 * chip. Hovering or focusing a position lights the numbers it covers; after a spin the winning number and the
 * winning bets are picked out and losing chips fade.
 */
export const Board = memo(function Board({ orient, bets, disabled, onPlace, winning, lines }: Props) {
  const layout = useMemo(() => tableLayout(orient), [orient]);
  const [hover, setHover] = useState<string | null>(null);
  const placed = useMemo(() => new Map(bets.map((b) => [b.id, b.amount])), [bets]);
  const outcome = useMemo(() => (lines ? new Map(lines.map((l) => [l.id, l.won])) : null), [lines]);
  const hot = useMemo(() => (hover ? new Set(betDef(hover)?.numbers ?? []) : null), [hover]);

  const stack = (id: string, box: { x: number; y: number; w: number; h: number }) => {
    const amount = placed.get(id);
    if (!amount) return null;
    const c = centre(box, layout);
    const state = outcome ? (outcome.get(id) ? "won" : "lost") : "idle";
    return (
      <span key={`chip-${id}`} className={`rl-onboard rl-${state}`} style={{ left: `${c.x}%`, top: `${c.y}%` }}>
        <Chip value={tierFor(amount)} label={compact(amount)} />
      </span>
    );
  };

  return (
    <div className="rl-table" data-orient={orient} style={{ aspectRatio: `${layout.w * layout.cellAspect} / ${layout.h}` }}>
      <div className="rl-felt" aria-hidden />
      {layout.cells.map((c) => {
        const amount = placed.get(c.id);
        const isHot = c.n !== undefined && !!hot?.has(c.n);
        const isWin = winning !== null && c.n === winning;
        const label = `${c.kind === "number" || c.kind === "zero" ? `Straight ${c.label}` : c.label}${amount ? `, ${amount} on it` : ""}`;
        return (
          <button
            key={c.id}
            type="button"
            className={`rl-cell rl-${c.kind} rl-t-${c.tone} ${isHot ? "is-hot" : ""} ${isWin ? "is-win" : ""} ${outcome?.get(c.id) ? "is-won" : ""}`}
            style={{ left: pct(c.box.x, layout.w), top: pct(c.box.y, layout.h), width: pct(c.box.w, layout.w), height: pct(c.box.h, layout.h) }}
            disabled={disabled}
            aria-label={label}
            onClick={() => onPlace(c.id)}
            onPointerEnter={() => setHover(c.id)}
            onPointerLeave={() => setHover((h) => (h === c.id ? null : h))}
            onFocus={() => setHover(c.id)}
            onBlur={() => setHover((h) => (h === c.id ? null : h))}
          >
            {c.diamond ? <span className={`rl-diamond rl-d-${c.diamond}`} /> : <span className={`rl-lab ${c.kind === "dozen" || c.kind === "even" || c.kind === "column" ? "rl-lab-out" : ""}`}>{c.label}</span>}
          </button>
        );
      })}

      {/* the lines between numbers: splits, streets, corners and six lines */}
      {layout.spots.map((s) => (
        <button
          key={s.id}
          type="button"
          tabIndex={-1}
          className={`rl-spot rl-spot-${s.kind}`}
          style={{ left: pct(s.box.x, layout.w), top: pct(s.box.y, layout.h), width: pct(s.box.w, layout.w), height: pct(s.box.h, layout.h) }}
          disabled={disabled}
          aria-label={`${s.label}${placed.get(s.id) ? `, ${placed.get(s.id)} on it` : ""}`}
          onClick={() => onPlace(s.id)}
          onPointerEnter={() => setHover(s.id)}
          onPointerLeave={() => setHover((h) => (h === s.id ? null : h))}
        />
      ))}

      {layout.cells.map((c) => stack(c.id, c.box))}
      {layout.spots.map((s) => stack(s.id, s.box))}
    </div>
  );
});
