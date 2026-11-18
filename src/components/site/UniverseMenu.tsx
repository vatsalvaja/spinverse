"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Coins, Crown, LogOut, X } from "lucide-react";
import { WORLD } from "@/components/art/worlds";
import { WorldArt } from "@/components/art/WorldArt";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import type { GameId, UserRecord } from "@/data/types";
import { cn, formatPoints } from "@/lib/utils";

export interface MenuLink {
  href: string;
  label: string;
  note: string;
  world: GameId;
  icon: ComponentType<{ className?: string }>;
}

const WORLDS: GameId[] = ["pharaohs-fortune", "atlantis-cascade", "neon-overdrive"];

/** Full-screen command centre. Portalled to <body> so no ancestor can affect its stacking or clipping. */
export function UniverseMenu({ open, onClose, links, isActive, player, guest, onLogout }: { open: boolean; onClose: () => void; links: MenuLink[]; isActive: (href: string) => boolean; player?: UserRecord; guest: boolean; onLogout: () => void }) {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [world, setWorld] = useState<GameId>("neon-overdrive");
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
  const origin = "calc(100% - 96px) 24px";

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          className="fixed inset-0 z-[80] overflow-y-auto overscroll-contain bg-[#05050a]"
          initial={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${origin})` }}
          animate={reduce ? { opacity: 1 } : { clipPath: `circle(150% at ${origin})` }}
          exit={reduce ? { opacity: 0 } : { clipPath: `circle(0px at ${origin})` }}
          transition={{ duration: reduce ? 0.2 : 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="pointer-events-none fixed inset-0" aria-hidden>
            {WORLDS.map((g) => (
              <div key={g} className={cn("absolute inset-0 transition-opacity duration-700", world === g ? "opacity-60" : "opacity-0")}>
                <WorldArt gameId={g} lite />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#05050a] via-[#05050a]/88 to-[#05050a]/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05050a] via-transparent to-[#05050a]/70" />
            <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:64px_64px]" />
            <div className="absolute -left-40 bottom-0 h-[520px] w-[520px] rounded-full blur-3xl transition-colors duration-700" style={{ background: WORLD[world].glow }} />
          </div>

          <div className="relative mx-auto flex min-h-full max-w-[1320px] flex-col px-5 pb-10 pt-4 sm:px-8 sm:pt-5">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" onClick={onClose} className="inline-flex items-center gap-3" aria-label="SPINVERSE home">
                <LogoMark className="h-10 w-10" />
                <span className="sv-display hidden text-[13px] font-semibold tracking-[0.38em] text-white sm:block">SPINVERSE</span>
              </Link>
              <button ref={closeBtn} onClick={onClose} aria-label="Close menu" className="flex h-12 items-center gap-2.5 rounded-full border border-white/20 bg-white/[0.08] px-5 text-sm font-medium text-white transition hover:bg-white/[0.18]">
                <X className="h-4 w-4" /> Close
              </button>
            </div>

            <div className="mt-8 grid flex-1 gap-10 lg:mt-12 lg:grid-cols-[1.45fr_1fr] lg:gap-16">
              <nav aria-label="All pages" className="order-2 lg:order-1">
                <p className="sv-serif mb-4 text-2xl text-gold-300">Where to?</p>
                <ol>
                  {links.map((item, i) => {
                    const on = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <motion.li key={item.href} initial={reduce ? false : { opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.045, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}>
                        <Link
                          href={item.href}
                          onMouseEnter={() => setWorld(item.world)}
                          onFocus={() => setWorld(item.world)}
                          onClick={onClose}
                          aria-current={on ? "page" : undefined}
                          className={cn("group relative flex items-center gap-4 border-b py-3.5 pl-5 pr-2 transition-colors sm:gap-6", on ? "border-gold-300/40 bg-gradient-to-r from-gold-300/[0.1] to-transparent" : "border-white/[0.08] hover:bg-white/[0.03]")}
                        >
                          <span className={cn("absolute inset-y-2 left-0 w-1 rounded-full transition-all", on ? "bg-gradient-to-b from-[#fff3c4] to-[#b98524]" : "bg-transparent group-hover:bg-white/30")} />
                          <span className="sv-num w-7 text-sm text-gold-300">{String(i + 1).padStart(2, "0")}</span>
                          <Icon className={cn("hidden h-5 w-5 sm:block", on ? "text-gold-200" : "text-obsidian-300 group-hover:text-white")} />
                          <span className={cn("sv-display text-[clamp(1.5rem,4.2vw,2.9rem)] font-semibold leading-none transition duration-300 group-hover:translate-x-1.5", on ? "sv-gold-text" : "text-white group-hover:text-gold-100")}>{item.label}</span>
                          {on && <span className="ml-1 rounded-full bg-gold-300/15 px-2.5 py-1 text-xs font-semibold text-gold-100 ring-1 ring-gold-300/40">You are here</span>}
                          <span className="sv-serif ml-auto hidden text-xl text-obsidian-200 md:block">{item.note}</span>
                          <ArrowUpRight className="ml-auto h-5 w-5 shrink-0 text-obsidian-300 transition group-hover:text-gold-200 md:ml-2" />
                        </Link>
                      </motion.li>
                    );
                  })}
                </ol>
              </nav>

              <motion.aside className="order-1 self-start lg:order-2 lg:sticky lg:top-8" initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }}>
                <div className="sv-glass overflow-hidden rounded-[2rem]">
                  <div className="flex items-center gap-4 p-6 pb-5">
                    <Avatar name={player?.name ?? "Player"} size={64} className="ring-2 ring-gold-300/50" />
                    <div className="min-w-0">
                      <p className="truncate text-xl font-semibold text-white">{player?.name ?? "Player"}</p>
                      <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-gold-300/12 px-2.5 py-1 text-xs font-semibold text-gold-100 ring-1 ring-gold-300/35">
                        <Crown className="h-3.5 w-3.5" /> {guest ? "Guest" : `${player?.membership} member`}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-white/10 bg-black/25 p-6">
                    <p className="flex items-center gap-2 text-sm text-obsidian-200"><Coins className="h-4 w-4 text-gold-300" /> Virtual points</p>
                    <p className="sv-num sv-gold-text mt-1 text-[3.4rem] font-extrabold leading-none">{formatPoints(player?.balance ?? 0)}</p>
                    <div className="mt-6 grid grid-cols-2 gap-2.5">
                      <Link href="/wallet" onClick={onClose} className="rounded-full bg-gradient-to-b from-[#f9e6a8] via-[#e3b951] to-[#b98524] py-3 text-center text-sm font-semibold text-[#2a1805]">Open vault</Link>
                      <button onClick={onLogout} className="flex items-center justify-center gap-2 rounded-full border border-white/20 py-3 text-sm font-medium text-white hover:bg-white/10"><LogOut className="h-4 w-4" /> Sign out</button>
                    </div>
                  </div>
                </div>
                <Link href="/admin/login" onClick={onClose} className="mt-4 flex items-center justify-center gap-2 text-sm text-obsidian-300 hover:text-white">
                  <Crown className="h-4 w-4" /> Staff? Open the admin console
                </Link>
              </motion.aside>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
