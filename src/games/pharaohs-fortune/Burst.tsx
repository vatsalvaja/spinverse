"use client";

import { useMemo, type CSSProperties } from "react";
import { createRng } from "@/lib/utils";

/** A one-shot radial spray of golden sparks, centred in its (relative) parent. Hidden for reduced motion. */
export function Burst({ count = 28, radius = 90, color = "#ffd978", seed = 3, size = [2, 5], className }: { count?: number; radius?: number; color?: string; seed?: number; size?: [number, number]; className?: string }) {
  const items = useMemo(() => {
    const rng = createRng(seed * 7919 + count);
    return Array.from({ length: count }, () => {
      const a = rng() * Math.PI * 2;
      const d = radius * (0.35 + rng() * 0.65);
      return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, s: size[0] + rng() * (size[1] - size[0]), dur: 0.7 + rng() * 0.8, delay: rng() * 0.18 };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, radius, seed]);

  return (
    <span className={className} aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {items.map((p, i) => (
        <span key={i} className="pf-burst-p" style={{ width: p.s, height: p.s, ["--c" as string]: color, ["--dx" as string]: `${p.dx}px`, ["--dy" as string]: `${p.dy}px`, ["--d" as string]: `${p.dur}s`, ["--delay" as string]: `${p.delay}s` } as CSSProperties} />
      ))}
    </span>
  );
}
