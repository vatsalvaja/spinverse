"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GitBranch, LayoutGrid, PackagePlus, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { GM_BG } from "../../ui/primitives";

export const GM_BASE = "/admin/game-management";

const TABS = [
  { href: GM_BASE, label: "Games overview", icon: LayoutGrid, exact: true },
  { href: `${GM_BASE}/new`, label: "Add new game", icon: PackagePlus },
  { href: `${GM_BASE}/versions`, label: "Versions", icon: GitBranch },
  { href: `${GM_BASE}/configuration`, label: "Configuration", icon: SlidersHorizontal },
];

/**
 * The dark frame for every Game Management page. It sits inside the existing admin shell but is visually
 * independent from the light console: its own surface, type and navigation.
 */
export function GmSectionShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = (t: (typeof TABS)[number]) => (t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + "/"));
  return (
    <div className="gm-root -mx-1 overflow-hidden rounded-2xl border border-white/10 font-sans text-white shadow-[0_30px_80px_-40px_rgba(0,0,0,.8)] sm:mx-0" style={{ background: GM_BG, minHeight: "calc(100vh - 8rem)" }}>
      <nav aria-label="Game management" className="flex gap-1 overflow-x-auto border-b border-white/[0.07] bg-black/30 px-3 pt-3 sm:px-5">
        {TABS.map((t) => {
          const on = active(t);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-t-lg px-3.5 py-3 text-[13px] font-semibold transition",
                on ? "text-gold-200" : "text-white/50 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {on && <span className="absolute inset-x-2 -bottom-px h-[2px] rounded-full bg-gradient-to-r from-transparent via-gold-300 to-transparent shadow-[0_0_12px_rgba(226,196,122,.8)]" />}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}
