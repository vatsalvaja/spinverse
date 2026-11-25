"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Award, Clock3, Compass, Gift, HardDriveDownload, Heart, Home, LogOut, Menu, Search, Settings, Target, Trophy, User, Wallet, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { useSession } from "@/lib/session";
import { formatPoints } from "@/lib/utils";
import { AccountMenu } from "./AccountMenu";
import { APP_CSS } from "./appStyles";
import { LAUNCHER_CSS } from "./launcherStyles";

/** Search lives in the toolbar but filters the game library, so the two share it here. */
const SearchContext = createContext<{ query: string; setQuery: (q: string) => void }>({ query: "", setQuery: () => {} });
export const useLauncherSearch = () => useContext(SearchContext);

const LIBRARY_ROUTES = ["/dashboard", "/favorites", "/recent"];
const starts = (path: string, base: string) => path === base || path.startsWith(base + "/");

type Icon = ComponentType<{ className?: string }>;
interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

const MAIN: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/games", label: "Explore Games", icon: Compass },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/recent", label: "Recently Played", icon: Clock3 },
  { href: "/installed", label: "Installed Games", icon: HardDriveDownload },
  { href: "/wallet", label: "Vault", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];
const COMMUNITY: NavItem[] = [
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/missions", label: "Missions", icon: Target },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/achievements", label: "Achievements", icon: Award },
];
/** The phone dock holds the essentials; "More" opens the full list. */
const DOCK: NavItem[] = ["/dashboard", "/games", "/favorites", "/wallet", "/profile"].map((href) => MAIN.find((i) => i.href === href)!);

/**
 * The one frame every player-facing page lives in, like an installed launcher: sidebar, toolbar, workspace and
 * status bar. Navigation swaps only the workspace; the frame stays put.
 */
export function LauncherShell({ children, onLogout, onOpenMenu }: { children: ReactNode; onLogout: () => void; onOpenMenu: () => void; menuOpen?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { player, mode } = useSession();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLElement>(null);
  const search = useMemo(() => ({ query, setQuery }), [query]);
  const css = useMemo(() => LAUNCHER_CSS + APP_CSS, []);

  // each page starts at the top: the workspace scrolls, not the window
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

  // searching from a page that has no games on it takes you to Explore
  const onSearch = (v: string) => {
    setQuery(v);
    if (v && !LIBRARY_ROUTES.includes(pathname) && !starts(pathname, "/games")) router.push("/games");
  };

  const isActive = (item: NavItem) => (item.href === "/dashboard" ? pathname === "/dashboard" : starts(pathname, item.href));

  return (
    <div className="lx-root fixed inset-0 z-30 flex overflow-hidden text-white">
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* ---------------- sidebar ---------------- */}
      <aside className="lx-side relative z-10 hidden w-[72px] shrink-0 flex-col md:flex lg:w-[220px]">
        <Link href="/dashboard" aria-label="SPINVERSE home" className="lx-brand justify-center lg:justify-start">
          <LogoMark className="h-8 w-8 shrink-0" />
          <span className="sv-display hidden text-[13px] font-semibold tracking-[0.3em] text-white lg:inline">SPINVERSE</span>
        </Link>
        <nav aria-label="Main" className="lx-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-3">
          <ul className="space-y-0.5">
            {MAIN.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(item)} />
              </li>
            ))}
          </ul>
          <p className="lx-gl hidden lg:block">Community</p>
          <div className="mx-auto my-3 h-px w-7 bg-white/10 lg:hidden" />
          <ul className="space-y-0.5">
            {COMMUNITY.map((item) => (
              <li key={item.href}>
                <NavLink item={item} active={isActive(item)} />
              </li>
            ))}
          </ul>
          <div className="mt-auto pt-3">
            <button type="button" onClick={onLogout} aria-label="Log out" title="Log out" className="lx-nav">
              <LogOut className="h-[18px] w-[18px]" />
              <span className="hidden lg:inline">Log out</span>
            </button>
          </div>
        </nav>
      </aside>

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* ---------------- toolbar ---------------- */}
        <header className="lx-toolbar">
          <Link href="/dashboard" aria-label="SPINVERSE home" className="shrink-0 md:hidden">
            <LogoMark className="h-8 w-8" />
          </Link>

          <label className="lx-search group flex h-9 min-w-0 flex-1 items-center gap-2.5 px-3 md:max-w-[420px]">
            <Search className="h-4 w-4 shrink-0 text-white/40 transition-colors group-focus-within:text-[var(--lx-gold)]" />
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
              className="min-w-0 flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-full p-0.5 text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <kbd className="hidden rounded border border-white/12 px-1.5 font-num text-[11px] leading-[18px] text-white/40 md:block">/</kbd>
            )}
          </label>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/wallet"
              aria-label={`${formatPoints(player?.balance ?? 0)} demo points. Open the vault`}
              data-active={starts(pathname, "/wallet")}
              className="lx-points flex h-9 items-center gap-2 pl-2 pr-3 transition-colors hover:bg-[rgba(230,193,112,.2)] data-[active=true]:bg-[rgba(230,193,112,.2)]"
            >
              <span className="lx-coin h-[18px] w-[18px] rounded-full" aria-hidden />
              <span className="font-num text-[14px] font-bold tabular-nums text-[#f6e3ae]">{formatPoints(player?.balance ?? 0)}</span>
            </Link>
            <AccountMenu onLogout={onLogout} />
          </div>
        </header>

        {/* ---------------- workspace ---------------- */}
        <main ref={scroller} className="lx-work lx-scroll relative min-h-0 flex-1 overflow-y-auto overscroll-contain pb-20 md:pb-0">
          <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
          <footer className="px-5 pb-5 pt-8 md:hidden">
            <p className="text-[11px] leading-relaxed text-white/35">
              SPINVERSE is entertainment only and uses free demo points. Points have no cash value and can’t be purchased, withdrawn or exchanged. 18+.
              {mode === "guest" && (
                <>
                  {" "}
                  <Link href="/register" className="font-semibold text-[var(--lx-gold)] hover:underline">Create an account</Link> to keep your points.
                </>
              )}
            </p>
          </footer>
        </main>

        {/* ---------------- status bar ---------------- */}
        <div className="lx-status hidden md:flex">
          <span className="truncate">Demo mode · free points with no cash value · 18+</span>
          <span className="flex shrink-0 items-center gap-2">
            {mode === "guest" && (
              <Link href="/register" className="font-semibold text-[var(--lx-gold)] hover:underline">Create an account to keep your points</Link>
            )}
            <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" /> Online</span>
          </span>
        </div>
      </div>

      {/* ---------------- dock (phones) ---------------- */}
      <nav aria-label="Main" className="lx-dock fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 px-1 pt-1 md:hidden">
        {DOCK.map((item) => (
          <DockLink key={item.href} item={item} active={isActive(item)} />
        ))}
        <button type="button" onClick={onOpenMenu} aria-haspopup="dialog" className="lx-navbtn">
          <span className="relative"><Menu className="h-5 w-5" /></span>
          <span className="relative text-[10px] font-medium leading-none">More</span>
        </button>
      </nav>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link href={item.href} data-active={active} aria-current={active ? "page" : undefined} aria-label={item.label} title={item.label} className="lx-nav">
      <Icon className="h-[18px] w-[18px]" />
      <span className="hidden truncate lg:inline">{item.label}</span>
    </Link>
  );
}

function DockLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  const short = item.label === "Explore Games" ? "Explore" : item.label;
  return (
    <Link href={item.href} data-active={active} aria-current={active ? "page" : undefined} className="lx-navbtn">
      <span className="relative"><Icon className="h-5 w-5" /></span>
      <span className="relative text-[10px] font-medium leading-none">{short}</span>
    </Link>
  );
}

