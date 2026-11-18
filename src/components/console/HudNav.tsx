"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bell, Coins, Gift, LayoutGrid, LogOut, Settings, Sparkles, Target, User, Wallet, type LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { MISSIONS, RECENT_REWARDS } from "@/data/engagement";
import { GAME_BY_ID } from "@/data/games";
import { useSession } from "@/lib/session";
import { cn, formatPoints, timeAgo } from "@/lib/utils";

const TABS = [
  { href: "/dashboard", label: "Home" },
  { href: "/games", label: "Explore Games" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rewards", label: "Rewards" },
];

interface Note {
  id: string;
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
  when: string;
}

function useNotes(): Note[] {
  return useMemo(() => {
    const ready = MISSIONS.filter((m) => m.kind === "daily" && m.progress >= m.target);
    const reward = RECENT_REWARDS[0];
    const fresh = Object.values(GAME_BY_ID).find((g) => g.isNew);
    const list: Note[] = [];
    ready.forEach((m) => list.push({ id: `m-${m.id}`, icon: Target, title: "Mission ready to claim", text: `${m.title} · +${m.reward} points`, href: "/missions", when: "Today" }));
    if (reward) list.push({ id: `r-${reward.id}`, icon: Gift, title: reward.title, text: `+${formatPoints(reward.points)} points · ${reward.detail}`, href: "/rewards", when: reward.claimedAt ? timeAgo(reward.claimedAt) : "Today" });
    if (fresh) list.push({ id: `g-${fresh.id}`, icon: Sparkles, title: `New world: ${fresh.name}`, text: fresh.tagline, href: `/games/${fresh.id}`, when: "New" });
    return list;
  }, []);
}

function Notifications() {
  const notes = useNotes();
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const wrap = useRef<HTMLDivElement>(null);
  const unread = notes.filter((n) => !read.includes(n.id)).length;

  useEffect(() => {
    if (!open) return;
    const out = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", out);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", out);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setRead(notes.map((n) => n.id));
        }}
        aria-label={unread ? `Notifications, ${unread} new` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-obsidian-100 transition hover:bg-white/10 hover:text-white"
      >
        <Bell className="h-[17px] w-[17px]" />
        {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-gold-300 shadow-[0_0_8px_rgba(240,200,100,.9)]" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="sv-glass fixed right-3 top-[52px] z-[95] w-[min(92vw,340px)] origin-top-right overflow-hidden rounded-2xl sm:absolute sm:right-0 sm:top-[calc(100%+10px)]"
            role="dialog"
            aria-label="Notifications"
          >
            <p className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">Notifications</p>
            {notes.length ? (
              <ul className="max-h-[60vh] overflow-y-auto p-1.5">
                {notes.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setOpen(false);
                        router.push(n.href);
                      }}
                      className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.07]"
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-300/12 ring-1 ring-gold-300/30"><n.icon className="h-4 w-4 text-gold-200" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-white">{n.title}</span>
                        <span className="block truncate text-xs text-obsidian-200">{n.text}</span>
                      </span>
                      <span className="shrink-0 pt-0.5 text-[11px] text-obsidian-300">{n.when}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-sm text-obsidian-200">You’re all caught up.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Compact console-style top bar. Dark, translucent and short so the artwork stays the focus. */
export function HudNav({ onOpenMenu, menuOpen, onLogout }: { onOpenMenu: () => void; menuOpen: boolean; onLogout: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { player } = useSession();
  const name = player?.name ?? "Player";
  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-gradient-to-b from-[#05050a]/90 to-[#05050a]/45 backdrop-blur-md">
      <div className="mx-auto flex h-11 max-w-[1480px] items-center gap-3 px-3 sm:h-12 sm:px-8">
        <Link href="/dashboard" className="group flex shrink-0 items-center gap-2.5" aria-label="SPINVERSE home">
          <LogoMark className="h-7 w-7 transition-transform duration-700 group-hover:rotate-[28deg]" />
          <span className="sv-display hidden text-[12px] font-semibold tracking-[0.34em] text-white sm:block">SPINVERSE</span>
        </Link>

        <nav className="mx-auto hidden h-full items-stretch gap-1 md:flex" aria-label="Primary">
          {TABS.map(({ href, label }) => {
            const on = active(href);
            return (
              <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cn("relative flex items-center px-4 text-[13px] font-medium transition-colors", on ? "text-white" : "text-obsidian-200 hover:text-white")}>
                {label}
                {on && <motion.span layoutId="hud-tab" className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-gradient-to-r from-gold-200 via-gold-300 to-gold-200 shadow-[0_0_14px_rgba(240,200,100,.9)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <Link href="/wallet" aria-label={`Open points vault. Balance ${formatPoints(player?.balance ?? 0)} virtual points`} className="group flex h-8 items-center gap-1.5 rounded-full border border-gold-300/30 bg-gold-300/[0.08] pl-1 pr-3 transition hover:border-gold-200/70 hover:bg-gold-300/[0.15]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-b from-[#f9e6a8] to-[#b98524] text-[#2a1805]"><Coins className="h-3 w-3" /></span>
            <span className="sv-num text-[14px] font-bold leading-none text-gold-100">{formatPoints(player?.balance ?? 0)}</span>
          </Link>
          <Notifications />
          <button onClick={onOpenMenu} aria-label="Open all pages" aria-expanded={menuOpen} className="flex h-8 w-8 items-center justify-center rounded-full text-obsidian-100 transition hover:bg-white/10 hover:text-white">
            <LayoutGrid className="h-[17px] w-[17px]" />
          </button>
          <Menu
            theme="dark"
            label="Account menu"
            triggerClassName="hidden rounded-full ring-1 ring-white/15 transition hover:ring-gold-200/70 sm:block"
            trigger={<Avatar name={name} size={30} />}
            items={[
              { label: "My Profile", icon: <User />, onSelect: () => router.push("/profile") },
              { label: "Points Vault", icon: <Wallet />, onSelect: () => router.push("/wallet") },
              { label: "Settings", icon: <Settings />, onSelect: () => router.push("/settings") },
              { label: "Sign out", icon: <LogOut />, onSelect: onLogout, divider: true },
            ]}
          />
        </div>
      </div>
    </header>
  );
}
