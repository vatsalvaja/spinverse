"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "default" | "danger";
  divider?: boolean;
}

/** Portal-based action menu so it is never clipped by scrolling table containers. */
export function Menu({
  trigger,
  items,
  theme = "light",
  align = "right",
  label = "Open menu",
  triggerClassName,
}: {
  trigger: ReactNode;
  items: MenuItem[];
  theme?: "light" | "dark";
  align?: "left" | "right";
  label?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; flip: boolean }>({ top: 0, left: 0, flip: false });
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const width = 208;
    const left = align === "right" ? Math.max(8, r.right - width) : Math.min(r.left, window.innerWidth - width - 8);
    const flip = r.bottom + items.length * 40 + 24 > window.innerHeight && r.top > items.length * 40;
    setPos({ top: flip ? r.top - 6 : r.bottom + 6, left, flip });
  }, [open, align, items.length]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof MouseEvent && (panel.current?.contains(e.target as Node) || btn.current?.contains(e.target as Node))) return;
      setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const dark = theme === "dark";
  return (
    <>
      <button ref={btn} type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={triggerClassName}>
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            role="menu"
            style={{ top: pos.top, left: pos.left, width: 208, transform: pos.flip ? "translateY(-100%)" : undefined }}
            className={cn(
              "fixed z-[95] overflow-hidden rounded-xl p-1 text-sm",
              dark ? "sv-glass !rounded-2xl !bg-obsidian-900/90 text-obsidian-100" : "ad-root !bg-white border border-slate-200 text-slate-700 shadow-pop",
            )}
          >
            {items.map((item, i) => (
              <div key={i}>
                {item.divider && <div className={cn("my-1 h-px", dark ? "bg-white/10" : "bg-slate-100")} />}
                <button
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    item.onSelect();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition",
                    item.tone === "danger"
                      ? dark ? "text-rose-300 hover:bg-rose-500/10" : "text-rose-600 hover:bg-rose-50"
                      : dark ? "hover:bg-white/[0.07]" : "hover:bg-slate-50",
                  )}
                >
                  {item.icon && <span className="h-4 w-4 shrink-0 opacity-70 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span>}
                  {item.label}
                </button>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
