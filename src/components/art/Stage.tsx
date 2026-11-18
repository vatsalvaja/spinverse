"use client";

import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { cn, createRng } from "@/lib/utils";

/**
 * Pointer-driven parallax. Layers read --px/--py (−1…1) as CSS variables, so React never
 * re-renders while the pointer moves. Skipped for touch input and reduced-motion users.
 */
export function ParallaxStage({ children, className, strength = 1, enabled = true }: { children: ReactNode; className?: string; strength?: number; enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const root = (el.closest("[data-parallax-root]") as HTMLElement | null) ?? el.parentElement ?? el;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const tick = () => {
      cx += (tx - cx) * 0.085;
      cy += (ty - cy) * 0.085;
      el.style.setProperty("--px", cx.toFixed(3));
      el.style.setProperty("--py", cy.toFixed(3));
      raf = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (e: PointerEvent) => {
      const r = root.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * strength;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2 * strength;
      kick();
    };
    const leave = () => { tx = 0; ty = 0; kick(); };
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerleave", leave);
    return () => {
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [enabled, strength]);

  return (
    <div ref={ref} className={cn("absolute inset-0 overflow-hidden", className)}>
      {children}
    </div>
  );
}

/** A depth layer. depth 0 = backdrop (barely moves), 2 = foreground (moves most). */
export function Layer({ depth = 1, children, className, style }: { depth?: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={cn("absolute inset-[-3%] will-change-transform", className)}
      style={{ transform: `translate3d(calc(var(--px, 0) * ${depth * -16}px), calc(var(--py, 0) * ${depth * -9}px), 0)`, ...style }}
    >
      {children}
    </div>
  );
}

export function SceneSvg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden focusable="false">
      {children}
    </svg>
  );
}

type MoteKind = "drift" | "rise" | "rain";

/** Seeded CSS particles: deterministic across SSR and hydration. */
export function Motes({ count = 18, color = "#f2d48a", kind = "drift", seed = 7, className, size = [2, 4] }: { count?: number; color?: string; kind?: MoteKind; seed?: number; className?: string; size?: [number, number] }) {
  const items = useMemo(() => {
    const rng = createRng(seed * 1013 + count);
    return Array.from({ length: count }, () => {
      const s = size[0] + rng() * (size[1] - size[0]);
      return {
        left: rng() * 100,
        top: rng() * 100,
        s,
        d: kind === "rain" ? 1.1 + rng() * 1.3 : 9 + rng() * 14,
        delay: -rng() * 20,
        o: 0.25 + rng() * 0.55,
        dx: (kind === "rise" ? (rng() - 0.5) * 8 : 6 + rng() * 22) + "cqw",
        dy: -(4 + rng() * 16) + "cqh",
        len: 40 + rng() * 70,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, seed, kind, size[0], size[1]]);

  return (
    <div className={cn("motes", className)} aria-hidden>
      {items.map((m, i) => (
        <span
          key={i}
          className={cn("mote", kind === "rise" && "mote-rise", kind === "rain" && "mote-rain")}
          style={
            {
              left: `${m.left}%`,
              top: kind === "drift" ? `${m.top}%` : undefined,
              width: kind === "rain" ? undefined : m.s,
              height: kind === "rain" ? undefined : m.s,
              "--c": color,
              "--d": `${m.d}s`,
              "--delay": `${m.delay}s`,
              "--o": m.o,
              "--dx": m.dx,
              "--dy": m.dy,
              "--len": `${m.len}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
