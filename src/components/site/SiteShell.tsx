"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Award, Compass, Gift, Home, Settings, Target, Trophy, User, Wallet } from "lucide-react";
import { ConsoleProvider } from "@/components/console/ConsoleContext";
import { HudNav } from "@/components/console/HudNav";
import { PlayProvider } from "@/components/site/PlayModal";
import { UniverseMenu } from "@/components/site/UniverseMenu";
import type { GameId } from "@/data/types";
import { useSession } from "@/lib/session";

const UNIVERSE: { href: string; label: string; note: string; world: GameId; icon: typeof Home }[] = [
  { href: "/dashboard", label: "Home", note: "Your console", world: "pharaohs-fortune", icon: Home },
  { href: "/games", label: "Explore Games", note: "Choose a world", world: "neon-overdrive", icon: Compass },
  { href: "/wallet", label: "Points Vault", note: "Balance and ledger", world: "pharaohs-fortune", icon: Wallet },
  { href: "/leaderboard", label: "Leaderboard", note: "Season rankings", world: "neon-overdrive", icon: Trophy },
  { href: "/missions", label: "Missions", note: "Daily and weekly quests", world: "atlantis-cascade", icon: Target },
  { href: "/rewards", label: "Rewards", note: "Claim and unlock", world: "pharaohs-fortune", icon: Gift },
  { href: "/achievements", label: "Achievements", note: "Your collection", world: "atlantis-cascade", icon: Award },
  { href: "/profile", label: "Profile", note: "Player identity", world: "neon-overdrive", icon: User },
  { href: "/settings", label: "Settings", note: "Sound, motion, privacy", world: "atlantis-cascade", icon: Settings },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { player, mode, signOut } = useSession();
  const [open, setOpen] = useState(false);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isHome = pathname === "/dashboard";
  // the game screen is full-bleed: no site bar, guest banner or footer around the machine
  const inGame = pathname.startsWith("/play/");

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const handleOpenUniverse = () => setOpen(true);
    window.addEventListener("sv-open-universe-menu", handleOpenUniverse);
    return () => window.removeEventListener("sv-open-universe-menu", handleOpenUniverse);
  }, []);

  const logout = () => {
    signOut();
    setOpen(false);
    router.push("/login");
  };

  return (
    <ConsoleProvider>
      <div className="sv-stage relative min-h-screen">
        <div className="sv-grain" aria-hidden />
        <div key={pathname} className="sv-route-bar fixed inset-x-0 top-0 z-[70] h-[2px] bg-gradient-to-r from-transparent via-gold-300 to-white" aria-hidden />

        {!isHome && !inGame && <HudNav onOpenMenu={() => setOpen(true)} menuOpen={open} onLogout={logout} />}

        {mode === "guest" && !isHome && !inGame && (
          <div className="pointer-events-none fixed inset-x-0 top-[50px] z-40 flex justify-center px-4 sm:top-[58px]">
            <p className="sv-glass pointer-events-auto rounded-full px-3.5 py-1 text-center text-[11px] text-gold-100 sm:text-xs">
              Guest session.{" "}
              <Link href="/register" className="font-semibold underline underline-offset-2">Create an account</Link> to keep your points.
            </p>
          </div>
        )}

        <main className="relative z-10">
          <PlayProvider>{children}</PlayProvider>
        </main>

        {!isHome && !inGame && (
          <footer className="relative z-10 mx-auto max-w-[1320px] px-5 pb-6 pt-10 sm:px-8">
            <p className="text-[11px] leading-relaxed text-obsidian-300">
              SPINVERSE is entertainment only and uses virtual points. Points have no cash value, can’t be purchased with real money, and can’t be withdrawn or exchanged. 18+.
            </p>
          </footer>
        )}

        <UniverseMenu open={open} onClose={() => setOpen(false)} links={UNIVERSE} isActive={active} player={player} guest={mode === "guest"} onLogout={logout} />
      </div>
    </ConsoleProvider>
  );
}
