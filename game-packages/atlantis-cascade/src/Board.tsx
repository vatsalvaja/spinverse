"use client";

import { forwardRef, memo, type CSSProperties } from "react";
import { motion } from "framer-motion";
import { COLS, ROWS, type Cell, type SymId } from "./engine";
import { SYMBOL_GLOW, SymbolArt } from "./SymbolArt";

export type TileState = "idle" | "front" | "dim" | "pop" | "scat";

export interface TileData {
  id: number;
  sym: SymId;
  col: number;
  /** Where the tile is going (in rows from the top of the board). */
  row: number;
  /** Where it starts from, in rows. Only used when the tile first appears. */
  from: number;
  dur: number;
  delay: number;
  ease: "fall" | "out";
  state: TileState;
  /** Bumped every time the tile lands so the squash plays again. */
  land: number;
  /** Seconds after the move starts at which the tile touches down. */
  ld: number;
}

const EASE = { fall: [0.42, 0, 0.72, 1.1], out: [0.6, 0, 1, 0.9] } as const;
const css = (o: Record<string, string>) => o as unknown as CSSProperties;

const Tile = memo(
  function Tile({ t }: { t: TileData }) {
    const z = t.state === "pop" ? 7 : t.state === "front" ? 6 : t.state === "scat" ? 5 : 1;
    return (
      <motion.div
        className="ac-tile"
        style={{ left: `${(t.col * 100) / COLS}%`, zIndex: z }}
        initial={{ y: `${t.from * 100}%` }}
        animate={{ y: `${t.row * 100}%` }}
        transition={{ duration: t.dur, delay: t.delay, ease: [...EASE[t.ease]] }}
      >
        <div className={`ac-in ac-s-${t.state}`} style={css({ "--g": SYMBOL_GLOW[t.sym] })}>
          <div key={t.land} className={t.land ? "ac-land ac-land-go" : "ac-land"} style={css({ "--ld": `${t.ld}s` })}>
            <SymbolArt id={t.sym} />
          </div>
        </div>
      </motion.div>
    );
  },
  (a, b) => {
    const x = a.t;
    const y = b.t;
    return x.id === y.id && x.row === y.row && x.state === y.state && x.land === y.land && x.dur === y.dur && x.delay === y.delay && x.ease === y.ease;
  },
);

export interface Highlight {
  key: number;
  cells: Cell[];
  sym: SymId;
  label: string;
  sub?: string;
}

/** A walk through every cell of a cluster so the light can travel along it (revisits cells when it has to backtrack). */
function chain(cells: Cell[]): Cell[] {
  if (!cells.length) return [];
  const has = new Set(cells.map(([c, r]) => `${c}:${r}`));
  const start = [...cells].sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
  const seen = new Set([`${start[0]}:${start[1]}`]);
  const out: Cell[] = [start];
  const walk = (c: number, r: number) => {
    for (const [dx, dy] of [[1, 0], [0, 1], [0, -1], [-1, 0]]) {
      const k = `${c + dx}:${r + dy}`;
      if (!has.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push([c + dx, r + dy]);
      walk(c + dx, r + dy);
      out.push([c, r]); // back to where we branched
    }
  };
  walk(start[0], start[1]);
  while (out.length > 1 && out[out.length - 1][0] === out[out.length - 2][0] && out[out.length - 1][1] === out[out.length - 2][1]) out.pop();
  return out;
}

function LineOverlay({ h }: { h: Highlight }) {
  const col = SYMBOL_GLOW[h.sym];
  const path = chain(h.cells);
  const d = path.map(([c, r], i) => `${i ? "L" : "M"}${c * 100 + 50} ${r * 100 + 50}`).join(" ");
  const single = path.length === 1;
  const dur = Math.max(1.1, path.length * 0.16);
  return (
    <svg key={h.key} className="absolute inset-0 h-full w-full" viewBox={`0 0 ${COLS * 100} ${ROWS * 100}`} preserveAspectRatio="none">
      {h.cells.map(([c, r], i) => (
        <rect key={`${c}:${r}`} className="ac-ring" x={c * 100 + 5} y={r * 100 + 5} width="90" height="90" rx="22" fill={col} fillOpacity=".13" stroke={col} strokeWidth="3.4" style={{ animationDelay: `${i * 0.045}s`, transformBox: "fill-box", transformOrigin: "center" }} />
      ))}
      {!single && (
        <>
          <path d={d} fill="none" stroke={col} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" className="ac-line-glow" />
          <path d={d} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" pathLength={100} className="ac-line-draw" />
          <path d={d} fill="none" stroke={col} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="ac-line-flow" />
          <circle r="20" fill={col} opacity=".35">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
          </circle>
          <circle r="9" fill="#fff">
            <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={d} />
          </circle>
        </>
      )}
    </svg>
  );
}

export const Board = forwardRef<HTMLDivElement, { tiles: TileData[]; hl: Highlight | null }>(function Board({ tiles, hl }, ref) {
  const cx = hl ? (hl.cells.reduce((s, [c]) => s + c, 0) / hl.cells.length + 0.5) / COLS : 0;
  const cy = hl ? (hl.cells.reduce((s, [, r]) => s + r, 0) / hl.cells.length + 0.5) / ROWS : 0;
  return (
    <div ref={ref} className="ac-glass">
      <div className="ac-glass-bg">
        <div className="ac-glass-caustic" />
        <div className="ac-glass-sheen" />
      </div>
      <div className="ac-tiles">
        {tiles.map((t) => (
          <Tile key={t.id} t={t} />
        ))}
      </div>
      <div className="ac-over" style={{ zIndex: 6 }}>
        {hl && <LineOverlay h={hl} />}
        {hl && (
          <div key={`t${hl.key}`} className="ac-wintag ac-num" style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}>
            {hl.label}
            {hl.sub && <b>{hl.sub}</b>}
          </div>
        )}
      </div>
    </div>
  );
});
