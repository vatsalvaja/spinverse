"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Award, Compass, Gift, Home, Settings, Target, Trophy, User, Wallet } from "lucide-react";
import { LauncherShell } from "@/components/launcher/LauncherShell";
import { PlayProvider } from "@/components/site/PlayModal";
import { UniverseMenu } from "@/components/site/UniverseMenu";
import type { GameId } from "@/data/types";
import { useSession } from "@/lib/session";

const UNIVERSE: { href: string; label: string; note: string; world: GameId; icon: typeof Home }[] = [
  { href: "/dashboard", label: "Home", note: "Your games", world: "pharaohs-fortune", icon: Home },
  { href: "/games", label: "Explore Games", note: "Browse and filter", world: "neon-overdrive", icon: Compass },
  { href: "/wallet", label: "Points Vault", note: "Balance and ledger", world: "pharaohs-fortune", icon: Wallet },
  { href: "/leaderboard", label: "Leaderboard", note: "Season rankings", world: "neon-overdrive", icon: Trophy },
  { href: "/missions", label: "Missions", note: "Daily and weekly quests", world: "atlantis-cascade", icon: Target },
  { href: "/rewards", label: "Rewards", note: "Claim and unlock", world: "pharaohs-fortune", icon: Gift },
  { href: "/achievements", label: "Achievements", note: "Your collection", world: "atlantis-cascade", icon: Award },
  { href: "/profile", label: "Profile", note: "Player identity", world: "neon-overdrive", icon: User },
  { href: "/settings", label: "Settings", note: "Sound, motion, privacy", world: "atlantis-cascade", icon: Settings },
];

/**
 * Every player-facing page renders inside the launcher frame (sidebar, top bar, ambient backdrop);
 * only the content area changes. The game screens under /play/ are the one exception: they are full-bleed.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { player, mode, signOut } = useSession();
  const [open, setOpen] = useState(false);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
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
    <>
      <div className="sv-stage relative min-h-screen">
        <div className="sv-grain" aria-hidden />
        <div key={pathname} className="sv-route-bar fixed inset-x-0 top-0 z-[70] h-[2px] bg-gradient-to-r from-transparent via-gold-300 to-white" aria-hidden />

        <PlayProvider>
          {inGame ? (
            <main className="relative z-10">{children}</main>
          ) : (
            <LauncherShell onLogout={logout} onOpenMenu={() => setOpen(true)} menuOpen={open}>
              {children}
            </LauncherShell>
          )}
        </PlayProvider>

        <UniverseMenu open={open} onClose={() => setOpen(false)} links={UNIVERSE} isActive={active} player={player} guest={mode === "guest"} onLogout={logout} />
      </div>
    </>
  );
}
