"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Coins, ExternalLink, LogOut, Menu as MenuIcon, X, type LucideIcon } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { svDiag } from "@/lib/diag"; // [sv-diag]
import { cn, formatPoints } from "@/lib/utils";
import { useAccess } from "../AccessProvider";
import { ROLE_HOME, ROLE_LABEL, type Role } from "../types";

export interface PortalNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface PortalConfig {
  role: Role;
  title: string;
  nav: PortalNavItem[];
  /** Optional link to another area this role may open (e.g. the super admin's operations console). */
  extra?: { href: string; label: string };
  crumbs: Record<string, string>;
}

function Sidebar({ cfg, onNavigate }: { cfg: PortalConfig; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col bg-[#13151a] text-slate-300">
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <LogoMark className="h-8 w-8" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-wide text-white">SPINVERSE</p>
          <p className="text-[11px] text-slate-400">{cfg.title}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label={cfg.title}>
        {cfg.nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn("relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition", active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100")}
            >
              {active && <span className="absolute -left-3 bottom-2 top-2 w-[3px] rounded-r bg-gold-400" />}
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/[0.06] p-4">
        {cfg.extra && (
          <Link href={cfg.extra.href} onClick={onNavigate} className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-slate-400 hover:bg-white/[0.04] hover:text-white">
            {cfg.extra.label} <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
        <p className="px-3 text-[11px] text-slate-500">Demo environment · frontend only</p>
      </div>
    </div>
  );
}

/** The light operations frame shared by the Super Admin and Master areas. It also enforces who may be inside. */
export function PortalShell({ cfg, children }: { cfg: PortalConfig; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, current, logout } = useAccess();
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!current) router.replace("/login");
    else if (current.role !== cfg.role) router.replace(ROLE_HOME[current.role]);
  }, [ready, current, cfg.role, router]);

  useEffect(() => setDrawer(false), [pathname]);

  // [sv-diag] which branch the guard takes: still checking, redirecting, or rendering the page
  const diagDecision = !ready ? "checking:not-ready" : !current ? "redirect:no-session" : current.role !== cfg.role ? "redirect:wrong-role" : "render";
  useEffect(() => {
    svDiag("shell", { expects: cfg.role, ready, role: current?.role ?? null, decision: diagDecision, path: pathname });
  }, [cfg.role, ready, current, diagDecision, pathname]);

  if (!ready || !current || current.role !== cfg.role) {
    return <div className="sv-admin-root flex min-h-screen items-center justify-center text-sm text-slate-500">Checking session…</div>;
  }

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => ({ label: cfg.crumbs[p] ?? p.toUpperCase(), href: "/" + parts.slice(0, i + 1).join("/") }));
  const signOut = () => {
    logout();
    router.push("/login");
  };

  return (
      <div className="sv-admin-root min-h-screen">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block"><Sidebar cfg={cfg} /></aside>

        <AnimatePresence>
          {drawer && (
            <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button className="absolute inset-0 bg-slate-900/60" aria-label="Close menu" onClick={() => setDrawer(false)} />
              <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.2 }} className="absolute inset-y-0 left-0 w-[260px]">
                <Sidebar cfg={cfg} onNavigate={() => setDrawer(false)} />
                <button onClick={() => setDrawer(false)} aria-label="Close" className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="lg:pl-[248px]">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
            <button className="rounded-lg p-2 text-slate-600 ring-1 ring-slate-200 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open navigation"><MenuIcon className="h-5 w-5" /></button>
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm text-slate-500 md:flex">
              {crumbs.map((c, i) => (
                <span key={c.href} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                  {i === crumbs.length - 1 ? <span className="font-medium text-slate-900">{c.label}</span> : <Link href={c.href} className="hover:text-slate-900">{c.label}</Link>}
                </span>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              {current.role === "master" && (
                <span className="flex items-center gap-2 rounded-lg bg-gold-50 px-3 py-1.5 text-[13px] font-semibold tabular-nums text-gold-700 ring-1 ring-gold-500/30" title="Your available coins">
                  <Coins className="h-4 w-4" /> {formatPoints(current.balance)}
                  <span className="hidden font-medium sm:inline">available</span>
                </span>
              )}
              <Menu
                label="Account menu"
                triggerClassName="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-50"
                trigger={<><Avatar name={current.name} tone="light" size={30} /><span className="hidden text-left text-[13px] leading-tight sm:block"><b className="block font-semibold text-slate-900">{current.name}</b><span className="text-slate-500">{ROLE_LABEL[current.role]}</span></span></>}
                items={[{ label: "Sign out", icon: <LogOut />, tone: "danger", onSelect: signOut }]}
              />
            </div>
          </header>
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
      );
}
