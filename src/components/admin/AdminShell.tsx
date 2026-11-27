"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ChevronRight, ExternalLink, FileBarChart, Gamepad2, LayoutDashboard, LineChart, LogOut, Menu as MenuIcon, PackageOpen, ReceiptText, Settings, Users, X } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";
import { Avatar } from "@/components/ui/avatar";
import { Menu } from "@/components/ui/menu";
import { SearchInput } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { useDemoData } from "@/data/provider";
import { useSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  {
    href: "/admin/game-management",
    label: "Game Management",
    icon: PackageOpen,
    children: [
      { href: "/admin/game-management", label: "Games overview", exact: true },
      { href: "/admin/game-management/new", label: "Add new game" },
      { href: "/admin/game-management/versions", label: "Versions" },
      { href: "/admin/game-management/configuration", label: "Configuration" },
    ],
  },
  { href: "/admin/analytics", label: "Analytics", icon: LineChart },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { users } = useDemoData();
  const blocked = users.filter((u) => u.status === "blocked").length;
  return (
    <div className="flex h-full flex-col bg-[#13151a] text-slate-300">
      <div className="flex h-16 items-center gap-3 border-b border-white/[0.06] px-5">
        <LogoMark className="h-8 w-8" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-wide text-white">SPINVERSE</p>
          <p className="text-[11px] text-slate-400">Operations console</p>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4" aria-label="Admin">
        {NAV.map(({ href, label, icon: Icon, exact, children }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
          return (
            <div key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                active ? "bg-white/[0.08] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              )}
            >
              {active && <span className="absolute -left-3 top-2 bottom-2 w-[3px] rounded-r bg-gold-400" />}
              <Icon className="h-[18px] w-[18px]" />
              {label}
              {label === "Users" && blocked > 0 && <span className="ml-auto rounded-md bg-rose-500/20 px-1.5 py-0.5 text-[11px] font-semibold text-rose-300">{blocked}</span>}
            </Link>
            {children && active && (
              <ul className="mb-1 ml-[26px] mt-0.5 space-y-0.5 border-l border-white/[0.08] pl-3">
                {children.map((c) => {
                  const on = c.exact ? pathname === c.href : pathname === c.href || pathname.startsWith(c.href + "/");
                  return (
                    <li key={c.href}>
                      <Link href={c.href} onClick={onNavigate} aria-current={on ? "page" : undefined} className={cn("block rounded-md px-2.5 py-1.5 text-[13px] transition", on ? "text-gold-300" : "text-slate-500 hover:text-slate-200")}>
                        {c.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            </div>
          );
        })}
      </nav>
      <div className="space-y-2 border-t border-white/[0.06] p-4">
        <Link href="/super-admin" className="flex items-center justify-between rounded-lg px-3 py-2 text-[13px] text-slate-400 hover:bg-white/[0.04] hover:text-white">
          Back to Super Admin <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <p className="px-3 text-[11px] text-slate-500">Demo environment · v0.1 · mock data</p>
      </div>
    </div>
  );
}

const CRUMB: Record<string, string> = { admin: "Admin", users: "Users", transactions: "Transactions", games: "Games", "game-management": "Game Management", new: "Add new game", versions: "Versions", configuration: "Configuration", analytics: "Analytics", reports: "Reports", settings: "Settings" };

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const { adminSignedIn, adminReady, setAdminSignedIn } = useSession();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (adminReady && !adminSignedIn) router.replace("/login");
  }, [adminReady, adminSignedIn, router]);

  if (!adminReady || !adminSignedIn) {
    return <div className="sv-admin-root flex min-h-screen items-center justify-center text-sm text-slate-500">Checking session…</div>;
  }

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = parts.map((p, i) => ({ label: CRUMB[p] ?? p.toUpperCase(), href: "/" + parts.slice(0, i + 1).join("/") }));

  const logout = () => {
    setAdminSignedIn(false);
    router.push("/login");
  };

  return (
    <div className="sv-admin-root min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] lg:block"><Sidebar /></aside>

      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-slate-900/60" aria-label="Close menu" onClick={() => setDrawer(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ duration: 0.2 }} className="absolute inset-y-0 left-0 w-[260px]">
              <Sidebar onNavigate={() => setDrawer(false)} />
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
          <form
            className="ml-auto w-full max-w-xs md:ml-8"
            onSubmit={(e) => {
              e.preventDefault();
              router.push(`/admin/users${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
            }}
          >
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users by name, email or ID" aria-label="Search users" />
          </form>
          <Menu
            label="Notifications"
            triggerClassName="relative rounded-lg p-2 text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
            trigger={<><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" /></>}
            items={[
              { label: "Review blocked accounts", onSelect: () => router.push("/admin/users?q=") },
              { label: "Review failed transactions", onSelect: () => router.push("/admin/transactions") },
              { label: "Mark all as read", onSelect: () => toast("Notifications cleared.", "info"), divider: true },
            ]}
          />
          <Menu
            label="Admin menu"
            triggerClassName="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-50"
            trigger={<><Avatar name="Dina Okoye" tone="light" size={30} /><span className="hidden text-left text-[13px] leading-tight sm:block"><b className="block font-semibold text-slate-900">Dina Okoye</b><span className="text-slate-500">Super admin</span></span></>}
            items={[
              { label: "Console settings", icon: <Settings />, onSelect: () => router.push("/admin/settings") },
              { label: "Sign out", icon: <LogOut />, tone: "danger", onSelect: logout, divider: true },
            ]}
          />
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
