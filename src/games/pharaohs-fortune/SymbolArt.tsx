"use client";

import { memo } from "react";
import { SYMBOL_DEFS, SYMBOL_SVG } from "./symbolSvg";
import type { SymbolId } from "./symbols";

/** Shared gradients for every symbol. Render once, anywhere in the page (it must not be display:none). */
export function SymbolDefs() {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden focusable="false">
      <defs dangerouslySetInnerHTML={{ __html: SYMBOL_DEFS }} />
    </svg>
  );
}

export const SymbolArt = memo(function SymbolArt({ id, className }: { id: SymbolId; className?: string }) {
  return <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" dangerouslySetInnerHTML={{ __html: SYMBOL_SVG[id] }} />;
});
