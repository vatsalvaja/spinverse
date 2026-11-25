"use client";

import { CHIPS } from "./engine";

/** Chip palette by denomination: body, edge stripes, inner ring, text. Muted, casino-real colours. */
const TONE: Record<number, { body: string; stripe: string; ink: string }> = {
  1: { body: "#1f4fa3", stripe: "#e9eef9", ink: "#ffffff" },
  5: { body: "#a8161d", stripe: "#f3dede", ink: "#ffffff" },
  10: { body: "#13703f", stripe: "#e0efe6", ink: "#ffffff" },
  25: { body: "#16161b", stripe: "#d9d9de", ink: "#ffffff" },
  100: { body: "#5b2a9a", stripe: "#e8dff5", ink: "#ffffff" },
};

/** the chip denomination that best represents a stack of this value */
export const tierFor = (amount: number) => [...CHIPS].reverse().find((c) => c <= amount) ?? CHIPS[0];

export const compact = (n: number) => (n >= 10000 ? `${Math.round(n / 1000)}k` : n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : Number.isInteger(n) ? String(n) : n.toFixed(1));

/**
 * A casino chip drawn in CSS: a coloured body with the white edge inlays, an inner ring and the value.
 * `value` picks the colour, `label` is the text (defaults to the value).
 */
export function Chip({ value, label, className = "", selected = false }: { value: number; label?: string; className?: string; selected?: boolean }) {
  const t = TONE[value] ?? TONE[CHIPS[0]];
  return (
    <span className={`rl-chip ${selected ? "is-selected" : ""} ${className}`} style={{ ["--cb" as string]: t.body, ["--cs" as string]: t.stripe, ["--ci" as string]: t.ink } as React.CSSProperties} aria-hidden>
      <span className="rl-chip-face">
        <b>{label ?? value}</b>
      </span>
    </span>
  );
}
