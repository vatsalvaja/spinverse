"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Clock3, Gamepad2, Gift, Heart, LayoutGrid, LogOut, Search, Settings, Trophy, User, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import { useSession } from "@/lib/session";
import { formatPoints } from "@/lib/utils";
import { LAUNCHER_CSS } from "./launcherStyles";

/** Search lives in the top bar but filters the game library, so the two share it here. */
const SearchContext = createContext<{ query: string; setQuery: (q: string) => void }>({ query: "", setQuery: () => {} });
export const useLauncherSearch = () => useContext(SearchContext);

const LIBRARY_ROUTES = ["/dashboard", "/favorites", "/recent"];

const starts = (path: string, base: string) => path === base || path.startsWith(base + "/");

/** The one frame every player-facing page lives in: ambient backdrop, sidebar, top bar, and a scrolling content area. */
export function LauncherShell({ children, onLogout, onOpenMenu, menuOpen }: { children: ReactNode; onLogout: () => void; onOpenMenu: () => void; menuOpen: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { player, mode } = useSession();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLElement>(null);
  const search = useMemo(() => ({ query, setQuery }), [query]);

  // each page starts at the top: the content area scrolls, not the window
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  // "/" jumps to search
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key === "/" && !(t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable))) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, []);

  // searching from any other page takes you to the games
  const onSearch = (v: string) => {
    setQuery(v);
    if (v && !LIBRARY_ROUTES.includes(pathname) && !starts(pathname, "/games")) router.push("/dashboard");
  };

  const nav = {
    games: pathname === "/dashboard" || starts(pathname, "/games"),
    favorites: pathname === "/favorites",
    recent: pathname === "/recent",
    profile: starts(pathname, "/profile"),
    settings: starts(pathname, "/settings"),
    wallet: starts(pathname, "/wallet"),
    leaderboard: starts(pathname, "/leaderboard"),
    rewards: starts(pathname, "/rewards"),
    other: starts(pathname, "/missions") || starts(pathname, "/achievements"),
  };
  const name = player?.name ?? "Player";

  return (
    <div className="lx-root fixed inset-0 z-30 flex overflow-hidden text-white">
      <style dangerouslySetInnerHTML={{ __html: LAUNCHER_CSS }} />
      <div className="lx-orb lx-orb-a" aria-hidden />
      <div className="lx-orb lx-orb-b" aria-hidden />
      <div className="lx-grid-bg" aria-hidden />

      {/* ---------------- left rail (desktop and tablet) ---------------- */}
      <nav aria-label="Launcher" className="lx-rail relative z-10 hidden w-[88px] shrink-0 flex-col items-center px-2.5 py-5 md:flex">
        <Link href="/dashboard" aria-label="SPINVERSE home" className="mb-6 block transition-transform duration-700 hover:rotate-[24deg]">
          <LogoMark className="h-11 w-11" />
        </Link>
        <div className="flex w-full flex-col gap-1.5">
          <RailLink href="/dashboard" active={nav.games} icon={<Gamepad2 className="h-[22px] w-[22px]" />} label="Games" />
          <RailLink href="/favorites" active={nav.favorites} icon={<Heart className="h-[22px] w-[22px]" />} label="Favorites" />
          <RailLink href="/recent" active={nav.recent} icon={<Clock3 className="h-[22px] w-[22px]" />} label="Recent" />
        </div>
        <div className="mx-auto my-4 h-px w-8 bg-white/10" />
        <div className="flex w-full flex-col gap-1.5">
          <RailLink href="/profile" active={nav.profile} icon={<User className="h-[22px] w-[22px]" />} label="Profile" />
        </div>
        <div className="mt-auto flex w-full flex-col gap-1.5">
          <RailLink href="/settings" active={nav.settings} icon={<Settings className="h-[22px] w-[22px]" />} label="Settings" />
          <RailButton onClick={onLogout} icon={<LogOut className="h-[22px] w-[22px]" />} label="Log out" />
        </div>
      </nav>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* ------------------------------ top bar ------------------------------ */}
        <header className="flex items-center gap-2.5 px-3 pb-2 pt-3 sm:gap-3 sm:px-6 sm:pt-5">
          <Link href="/dashboard" aria-label="SPINVERSE home" className="shrink-0 md:hidden">
            <LogoMark className="h-9 w-9" />
          </Link>

          <label className="lx-search group flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-3.5 md:max-w-[460px]">
            <Search className="h-[18px] w-[18px] shrink-0 text-white/45 transition-colors group-focus-within:text-[var(--lx-gold)]" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && (setQuery(""), e.currentTarget.blur())}
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              aria-label="Search games"
              placeholder="Search games"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/35 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-full p-1 text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hidden rounded-md border border-white/12 px-1.5 py-0.5 font-num text-[11px] text-white/40 md:block">/</kbd>
            )}
          </label>

          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <Link href="/wallet" data-active={nav.wallet} aria-label={`${formatPoints(player?.balance ?? 0)} demo points. Open your points vault`} className="lx-points flex h-11 items-center gap-2 rounded-2xl pl-2.5 pr-3.5 transition-transform hover:-translate-y-px">
              <span className="lx-coin h-5 w-5 rounded-full" aria-hidden />
              <span className="font-num text-[15px] font-bold tabular-nums text-[#f6e3ae]">{formatPoints(player?.balance ?? 0)}</span>
            </Link>
            <Link href="/leaderboard" data-active={nav.leaderboard} aria-label="Leaderboard" className="lx-chip hidden h-11 w-11 md:inline-flex"><Trophy className="h-[18px] w-[18px]" /></Link>
            <Link href="/rewards" data-active={nav.rewards} aria-label="Rewards" className="lx-chip hidden h-11 w-11 md:inline-flex"><Gift className="h-[18px] w-[18px]" /></Link>
            <button type="button" onClick={onOpenMenu} data-active={menuOpen || nav.other} aria-haspopup="dialog" aria-label="All sections" className="lx-chip h-11 w-11 md:inline-flex"><LayoutGrid className="h-[18px] w-[18px]" /></button>
            <Link href="/profile" aria-label={`${name}, open profile`} className="group relative ml-0.5 rounded-full p-[2px] [background:conic-gradient(from_200deg,#fff0bd,#e6c170,#7a5cff,#fff0bd)]">
              <Avatar name={name} size={40} className="ring-2 ring-[#07080f] transition-transform group-hover:scale-[1.04]" />
              {mode === "guest" && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[#07080f] px-1.5 text-[9px] font-semibold text-[#f6e3ae] ring-1 ring-white/15">Guest</span>}
            </Link>
          </div>
        </header>

        {/* ------------------------- the page itself ------------------------- */}
        <main ref={scroller} className="lx-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-24 md:pb-6">
          <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
          <footer className="mx-auto max-w-[1320px] px-5 pb-6 pt-10 sm:px-8">
            <p className="text-[11px] leading-relaxed text-white/35">
              SPINVERSE is entertainment only and uses free demo points. Points have no cash value, can’t be purchased, withdrawn or exchanged. 18+.
              {mode === "guest" && (
                <>
                  {" "}
                  <Link href="/register" className="font-semibold text-[var(--lx-gold)] hover:underline">Create an account</Link> to keep your points.
                </>
              )}
            </p>
          </footer>
        </main>
      </div>

      {/* ---------------- bottom dock (phones) ---------------- */}
      <nav aria-label="Launcher" className="lx-dock fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 px-1 pt-1 md:hidden">
        <RailLink compact href="/dashboard" active={nav.games} icon={<Gamepad2 className="h-5 w-5" />} label="Games" />
        <RailLink compact href="/favorites" active={nav.favorites} icon={<Heart className="h-5 w-5" />} label="Favorites" />
        <RailLink compact href="/recent" active={nav.recent} icon={<Clock3 className="h-5 w-5" />} label="Recent" />
        <RailLink compact href="/profile" active={nav.profile} icon={<User className="h-5 w-5" />} label="Profile" />
        <RailLink compact href="/settings" active={nav.settings} icon={<Settings className="h-5 w-5" />} label="Settings" />
        <RailButton compact onClick={onLogout} icon={<LogOut className="h-5 w-5" />} label="Log out" />
      </nav>
    </div>
  );
}

function RailInner({ icon, label, active, compact }: { icon: ReactNode; label: string; active?: boolean; compact?: boolean }) {
  return (
    <>
      {active && <motion.span layoutId={compact ? "lx-active-dock" : "lx-active-rail"} className="absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,rgba(230,193,112,.16),rgba(230,193,112,.04))] shadow-[inset_0_0_0_1px_rgba(230,193,112,.35)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
      {active && !compact && <motion.span layoutId="lx-active-bar" className="absolute -left-2.5 top-3 bottom-3 w-[3px] rounded-r-full bg-[var(--lx-gold)] shadow-[0_0_12px_var(--lx-gold)]" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
      <span className="relative">{icon}</span>
      <span className={compact ? "relative text-[10px] font-medium leading-none" : "relative text-[11px] font-medium leading-none"}>{label}</span>
    </>
  );
}

function RailButton({ icon, label, onClick, compact }: { icon: ReactNode; label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="lx-navbtn">
      <RailInner icon={icon} label={label} compact={compact} />
    </button>
  );
}

function RailLink({ icon, label, href, active, compact }: { icon: ReactNode; label: string; href: string; active?: boolean; compact?: boolean }) {
  return (
    <Link href={href} data-active={!!active} aria-current={active ? "page" : undefined} className="lx-navbtn">
      <RailInner icon={icon} label={label} active={active} compact={compact} />
    </Link>
  );
}
