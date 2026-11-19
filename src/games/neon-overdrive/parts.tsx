"use client";

import { forwardRef, memo, useEffect, useImperativeHandle, useLayoutEffect as useReactLayoutEffect, useRef, useState } from "react";
import { HOLD_TRIGGER, OVERDRIVE_AT, PAYLINES, ROWS, SYMBOL_META, TIERS, cellKey, randomFiller, tierOf, type SymId } from "./engine";
import { SymbolArt } from "./symbols";

const useLayoutEffect = typeof window !== "undefined" ? useReactLayoutEffect : useEffect;

export type CellState = "idle" | "land" | "landorb" | "win" | "front" | "dim" | "locked" | "lockin" | "collect" | "collected";

const HELD = new Set<CellState>(["locked", "lockin", "collect", "collected"]);

/* --------------------------------- one cell --------------------------------- */
export const Cell = memo(function Cell({ sym, value = 1, boost = 1, state = "idle", pop }: { sym: SymId; value?: number; boost?: number; state?: CellState; pop?: string }) {
  const color = sym === "orb" ? TIERS[tierOf(value)].main : SYMBOL_META[sym].color;
  const held = HELD.has(state);
  return (
    <div className={`no-cell no-st-${state}${held ? " no-locked" : ""}${state === "collected" ? " no-collected" : ""}`} style={{ ["--sc" as string]: color }}>
      <div className="no-tile" />
      <div className="no-under" />
      <div className="no-sym">
        <SymbolArt id={sym} value={value} boost={boost} hot={held} />
      </div>
      {held && (
        <>
          <div className="no-holo" />
          <svg className="no-zap" viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M6 22 L16 28 L12 36 L24 40" />
            <path d="M94 70 L84 66 L88 58 L76 54" />
          </svg>
          <svg className="no-zap z2" viewBox="0 0 100 100" fill="none" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M92 18 L82 26 L86 32 L74 38" />
            <path d="M8 78 L18 72 L14 66 L26 62" />
          </svg>
        </>
      )}
      {(state === "lockin" || state === "landorb") && (
        <>
          <i className="no-shockring" />
          <i className="no-flash" />
        </>
      )}
      {pop && <span className="no-pop no-num">{pop}</span>}
    </div>
  );
});

/* ----------------------------------- reel ----------------------------------- */
export interface ReelHandle {
  spin(target: SymId[], opts: { duration: number; fillers: number }): Promise<void>;
  setRows(rows: SymId[]): void;
}
interface Plan { target: SymId[]; fillers: SymId[]; duration: number }

export const Reel = forwardRef<ReelHandle, { index: number; initial: SymId[]; values: Record<string, number>; states: CellState[]; cs: number; anticipating: boolean }>(function Reel(
  { index, initial, values, states, cs, anticipating },
  ref,
) {
  const [rows, setRows] = useState<SymId[]>(initial);
  const [plan, setPlan] = useState<Plan | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const done = useRef<(() => void) | null>(null);
  const anim = useRef<Animation | null>(null);

  useImperativeHandle(ref, () => ({
    spin: (target, opts) =>
      new Promise<void>((resolve) => {
        done.current = resolve;
        const fillers = Array.from({ length: opts.fillers }, (_, i) => randomFiller(index * 7 + i * 3 + Math.random() * 5));
        setPlan({ target, fillers, duration: opts.duration });
      }),
    setRows: (r) => {
      setRows(r);
    },
  }));

  useLayoutEffect(() => {
    if (!plan || !strip.current) return;
    const n = plan.fillers.length;
    const start = `translateY(-${((n + ROWS) / (n + 2 * ROWS)) * 100}%)`;
    const a = strip.current.animate(
      [
        { transform: start, easing: "cubic-bezier(.42,.08,.72,.92)" },
        { transform: `translateY(${cs * 0.11}px)`, offset: 0.9, easing: "cubic-bezier(.3,0,.4,1)" },
        { transform: "translateY(0)" },
      ],
      { duration: plan.duration, fill: "forwards" },
    );
    anim.current = a;
    let live = true;
    a.finished
      .then(() => {
        if (!live) return;
        setRows(plan.target);
        setPlan(null);
        const d = done.current;
        done.current = null;
        d?.();
      })
      .catch(() => {});
    return () => {
      live = false;
      a.cancel();
    };
  }, [plan, cs]);

  // if the component unmounts mid-spin, release any waiter
  useEffect(() => () => { done.current?.(); }, []);

  const cells = plan ? [...plan.target, ...plan.fillers, ...rows] : rows;
  return (
    <div className={`no-col no-reel${plan ? " spin" : ""}${anticipating ? " antic" : ""}`} style={{ ["--i" as string]: index }}>
      <div ref={strip} className="no-strip">
        {cells.map((s, i) => {
          const row = plan ? (i < ROWS ? i : i >= cells.length - ROWS ? i - (cells.length - ROWS) : -1) : i;
          const v = row >= 0 ? values[cellKey(index, row)] : undefined;
          return <Cell key={i} sym={s} value={v ?? 1} state={plan ? "idle" : states[i] ?? "idle"} />;
        })}
      </div>
    </div>
  );
});

/* -------------------------------- hold & respin -------------------------------- */
export const HoldCell = memo(function HoldCell({ value, boost, state, spinning, pop }: { value?: number; boost: number; state: CellState; spinning: boolean; pop?: string }) {
  if (value !== undefined && !spinning) return <Cell sym="orb" value={value} boost={boost} state={state} pop={pop} />;
  return (
    <div className="no-cell">
      <div className="no-tile" />
      {spinning ? <div className="no-rs" /> : <div className="no-socket" />}
    </div>
  );
});

/* ------------------------------- energy meter ------------------------------- */
export function EnergyMeter({ count, total, od, hold, label }: { count: number; total: number; od: boolean; hold: boolean; label: string }) {
  const lastRef = useRef(count);
  const [popIdx, setPopIdx] = useState(-1);
  useEffect(() => {
    if (count > lastRef.current) setPopIdx(count - 1);
    lastRef.current = count;
    const t = setTimeout(() => setPopIdx(-1), 600);
    return () => clearTimeout(t);
  }, [count]);
  const marks = [
    { at: HOLD_TRIGGER, text: "HOLD & RESPIN" },
    { at: OVERDRIVE_AT, text: "OVERDRIVE" },
    { at: total, text: "GRAND" },
  ];
  return (
    <div className="relative w-full" style={{ paddingBottom: "calc(var(--cs)*.2)" }}>
      <div className="mb-[calc(var(--cs)*.05)] flex items-center justify-between" style={{ fontSize: "max(8px,calc(var(--cs)*.13))", lineHeight: 1 }}>
        <span className="no-disp" style={{ color: od ? "var(--c2)" : "var(--c1)", textShadow: "0 0 10px currentColor" }}>{label}</span>
        <span className="no-num font-bold text-white/80">{count}<span className="text-white/40"> / {total}</span></span>
      </div>
      <div className="relative">
        <div className="no-meter">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`no-seg${i < count ? ` on${i >= OVERDRIVE_AT && hold ? " s3" : i >= HOLD_TRIGGER ? " s2" : ""}` : ""}${popIdx === i ? " pop" : ""}`} />
          ))}
        </div>
        <div className="no-meterflow" />
        {marks.map((m) => (
          <div key={m.text} className="absolute whitespace-nowrap no-disp" style={{ left: `${(m.at / total) * 100}%`, top: "calc(100% + var(--cs)*.03)", transform: "translateX(-100%)", fontSize: "max(7px,calc(var(--cs)*.095))", letterSpacing: ".1em", color: count >= m.at ? "#fff" : "rgba(170,185,255,.55)", textShadow: count >= m.at ? "0 0 8px var(--c1)" : "none", transition: "color .3s" }}>
            ▲ {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- win beams --------------------------------- */
export function LineBeam({ line, count, color, beamKey }: { line: number; count: number; color: string; beamKey: number }) {
  const rows = PAYLINES[line];
  const pts: [number, number][] = [];
  pts.push([0, rows[0] + 0.5]);
  for (let r = 0; r < count; r++) pts.push([r + 0.5, rows[r] + 0.5]);
  if (count === 5) pts.push([5, rows[4] + 0.5]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const w = (n: number) => ({ strokeWidth: `calc(var(--cs)*${n})` });
  return (
    <svg key={beamKey} className="pointer-events-none absolute inset-0 z-[8] h-full w-full" viewBox="0 0 5 4" preserveAspectRatio="none" overflow="visible" style={{ filter: `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 18px ${color})` }} aria-hidden>
      <g fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke">
        <path d={d} pathLength={100} stroke={color} strokeOpacity=".4" className="no-draw" style={w(0.17)} vectorEffect="non-scaling-stroke" />
        <path d={d} pathLength={100} stroke={color} className="no-draw" style={w(0.07)} vectorEffect="non-scaling-stroke" />
        <path d={d} pathLength={100} stroke="#fff" className="no-draw" style={w(0.025)} vectorEffect="non-scaling-stroke" />
        <path d={d} pathLength={100} stroke="#fff" className="no-comet" style={w(0.11)} vectorEffect="non-scaling-stroke" />
      </g>
      {pts.slice(1, count + 1).map(([x, y], i) => (
        <circle key={i} className="no-node" cx={x} cy={y} r="0.07" fill="#fff" style={{ animationDelay: `${i * 0.09}s` }} />
      ))}
    </svg>
  );
}
