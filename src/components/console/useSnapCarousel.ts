"use client";

import { useCallback, useEffect, useRef, type RefObject } from "react";

/**
 * Keeps a scroll-snap strip and the selected item in step.
 * - `centre(i)` scrolls item i into the middle (no-op when the strip does not overflow).
 * - When the player swipes or drags the strip, the item nearest the centre becomes selected
 *   once the scroll settles, so a touch gesture and a tap end up in the same place.
 */
export function useSnapCarousel(ref: RefObject<HTMLElement>, selectedIndex: number, onPick: (index: number, el: HTMLElement | null) => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const selected = useRef(selectedIndex);
  selected.current = selectedIndex;

  const centre = useCallback(
    (i: number) => {
      const el = ref.current;
      const k = el?.children[i] as HTMLElement | undefined;
      if (!el || !k || el.scrollWidth <= el.clientWidth + 2) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: k.offsetLeft - (el.clientWidth - k.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    },
    [ref],
  );

  useEffect(() => centre(selectedIndex), [selectedIndex, centre]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const settle = () => {
      if (el.scrollWidth <= el.clientWidth + 2) return;
      const kids = Array.from(el.children) as HTMLElement[];
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bd = Infinity;
      kids.forEach((k, i) => {
        const d = Math.abs(k.offsetLeft + k.offsetWidth / 2 - mid);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== selected.current) onPick(best, kids[best]);
    };
    const onScroll = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(settle, 140);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(timer.current);
    };
  }, [ref, onPick]);

  return { centre };
}

/** Left/right arrow keys step through worlds, unless the player is typing or a dialog is open. */
export function useArrowKeys(onStep: (delta: 1 | -1) => void) {
  const cb = useRef(onStep);
  cb.current = onStep;
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      cb.current(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);
}
