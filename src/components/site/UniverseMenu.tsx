"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Coins, Crown, LogOut, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import type { GameId, UserRecord } from "@/data/types";
import { LAUNCHER_CSS } from "@/components/launcher/launcherStyles";
import { formatPoints } from "@/lib/utils";

export interface MenuLink {
  href: string;
  label: string;
  note: string;
  world: GameId;
  icon: ComponentType<{ className?: string }>;
}

/** The "all sections" drawer: every page in one list, in the launcher's own style. Portalled to <body> so no ancestor can affect its stacking or clipping. */
export function UniverseMenu({ open, onClose, links, isActive, player, guest, onLogout }: { open: boolean; onClose: () => void; links: MenuLink[]; isActive: (href: string) => boolean; player?: UserRecord; guest: boolean; onLogout: () => void }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeBtn.current?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const slide = reduce ? { opacity: 0 } : { x: "100%" };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="lx-menu" className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }} role="presentation">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="All sections"
            className="lx-drawer absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col overflow-y-auto overscroll-contain text-white"
            initial={slide}
            animate={reduce ? { opacity: 1 } : { x: 0 }}
            exit={slide}
            transition={{ duration: reduce ? 0.15 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <style dangerouslySetInnerHTML={{ __html: LAUNCHER_CSS }} />
            <div className="flex items-center justify-between px-5 pb-3 pt-5">
              <Link href="/dashboard" onClick={onClose} className="inline-flex items-center gap-3" aria-label="SPINVERSE home">
                <LogoMark className="h-9 w-9" />
                <span className="sv-display text-[12px] font-semibold tracking-[0.34em] text-white">SPINVERSE</span>
              </Link>
              <button ref={closeBtn} onClick={onClose} aria-label="Close menu" className="lx-chip h-10 w-10">
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>

            <div className="mx-4 rounded-2xl p-4 [background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.02))] [box-shadow:inset_0_0_0_1px_rgba(255,255,255,.08)]">
              <div className="flex items-center gap-3.5">
                <Avatar name={player?.name ?? "Player"} size={48} className="ring-2 ring-[#e6c170]/60" />
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-white">{player?.name ?? "Player"}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#e6c170]">
                    <Crown className="h-3.5 w-3.5" /> {guest ? "Guest" : `${player?.membership} member`}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-black/30 px-3.5 py-2.5">
                <span className="flex items-center gap-2 text-xs text-white/60"><Coins className="h-4 w-4 text-[#e6c170]" /> Demo points</span>
                <span className="font-num text-lg font-bold tabular-nums text-[#f6e3ae]">{formatPoints(player?.balance ?? 0)}</span>
              </div>
            </div>

            <nav aria-label="All pages" className="mt-4 flex-1 px-4">
              <ul className="space-y-1">
                {links.map((item, i) => {
                  const on = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <motion.li key={item.href} initial={reduce ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.03, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
                      <Link href={item.href} onClick={onClose} data-active={on} aria-current={on ? "page" : undefined} className="lx-drawer-link">
                        <Icon className="h-5 w-5 shrink-0" />
                        <span className="min-w-0">
                          <span className="block text-[14.5px] font-semibold leading-tight">{item.label}</span>
                          <span className="block truncate text-xs text-white/45">{item.note}</span>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-4 space-y-3 border-t border-white/[0.07] p-4">
              <button onClick={onLogout} className="lx-drawer-link w-full"><LogOut className="h-5 w-5" /><span className="text-[14.5px] font-semibold">Log out</span></button>
              <Link href="/admin/login" onClick={onClose} className="block text-center text-xs text-white/35 hover:text-white/70">Staff sign in</Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
